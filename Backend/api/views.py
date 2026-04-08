from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.http import JsonResponse
from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice
from .serializers import RegisterSerializer, AccountSerializer, StockSerializer, UserAccountSerializer, AccountStandingSerializer, AccountHoldingSerializer, TradeSerializer, StockPriceSerializer
from .filters import StockPriceFilter, TradeFilter, HoldingFilter, StandingFilter
from decimal import Decimal, InvalidOperation
from .services.trading import execute_trade
from .services.signal_processor import process_signal_run
import json

User = get_user_model()

# User account creation view
@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):
    serializer = RegisterSerializer(data = request.data)
    serializer.is_valid(raise_exception = True)
    data = serializer.validated_data

    user = User.objects.create_user(username=data['username'], password=data['password'])
    start_balance = data.get('startBalance', '10000.00')
    risk_level = data.get('riskLevel', '1')
    threshold = data.get('thresholdPercentage', '20.00')

    account = Account.objects.create(
        startBalance = start_balance,
        balance = start_balance,
        riskLevel = risk_level,
        thresholdPercentage = threshold
    )

    UserAccount.objects.create(user=user, account=account)

    return Response({"id": user.id, "username": user.username}, status=status.HTTP_201_CREATED)

# Login / Obtain Current User
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    account_id = None
    if hasattr(user, "user_account"):
        account_id = user.user_account.account.id

    return Response({
        "id": user.id,
        "username": user.username,
        "account": account_id
    }, status=status.HTTP_200_OK)


# Generic views for getting and setting data
class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user_account__user = self.request.user)

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'user_account'):
            raise ValidationError("User already has an account.")

        account = serializer.save()
        UserAccount.objects.create(user=self.request.user, account=account)

    def _parse_amount(self, request):
        amount = request.data.get("amount", None)
        if amount is None:
            raise ValidationError({"amount": "This field is required."})
        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            raise ValidationError({"amount": "Invalid number."})
        if amount <= 0:
            raise ValidationError({"amount": "Must be > 0."})
        return amount

    @action(detail=True, methods=["post"], url_path="deposit")
    @transaction.atomic
    def deposit(self, request, pk=None):
        amount = self._parse_amount(request)
        account = self.get_queryset().select_for_update().get(pk=pk)

        account.cashBalance = account.cashBalance + amount
        account.balance = account.balance + amount
        account.save(update_fields=["cashBalance", "balance"])

        return Response(self.get_serializer(account).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="withdraw")
    @transaction.atomic
    def withdraw(self, request, pk=None):
        amount = self._parse_amount(request)
        account = self.get_queryset().select_for_update().get(pk=pk)

        if account.cashBalance < amount:
            raise ValidationError({"amount": "Insufficient funds."})
        
        account.cashBalance = account.cashBalance - amount
        account.balance = account.balance - amount
        account.save(update_fields=["cashBalance", "balance"])

        return Response(self.get_serializer(account).data, status=status.HTTP_200_OK)

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all().order_by('ticker')
    serializer_class = StockSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get']

class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = UserAccount.objects.all().order_by('id')
    serializer_class = UserAccountSerializer
    permission_classes = [IsAdminUser]

class AccountStandingViewSet(viewsets.ModelViewSet):
    serializer_class = AccountStandingSerializer
    filterset_class = StandingFilter
    ordering_fields = ["timeStamp", "balance"]

    def get_queryset(self):
        account = get_request_account(self.request)
        return AccountStanding.objects.filter(account = account).order_by('-timeStamp')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(account = account)

class AccountHoldingViewSet(viewsets.ModelViewSet):
    serializer_class = AccountHoldingSerializer
    filterset_class = HoldingFilter
    ordering_fields = ["id"]

    def get_queryset(self):
        account = get_request_account(self.request)
        return (
            AccountHolding.objects
            .select_related("stock")
            .filter(account=account)
            .order_by("id")
        )

    @action(detail=False, methods=["get"])
    def current(self, request):
        account = get_request_account(request)
        qs = (
            AccountHolding.objects
            .select_related("stock")
            .filter(account=account, currentlyHeld=True)
            .order_by("id")
        )
        return Response(self.get_serializer(qs, many=True).data)

class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer
    filterset_class = TradeFilter
    ordering_fields = ["timeStamp", "price"]

    def get_queryset(self):
        account = get_request_account(self.request)
        return (
            Trade.objects
            .select_related("stock")
            .filter(account=account)
            .order_by("-timeStamp")
        )

    @transaction.atomic
    def perform_create(self, serializer):
        account = get_request_account(self.request)

        validated = serializer.validated_data

        execute_trade(
            account=account,
            stock=validated["stock"],
            method=validated["method"],
            quantity=validated["quantity"],
            price=validated["price"],
            time_stamp=validated["timeStamp"],
        )

class StockPriceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockPriceSerializer
    permission_classes = [AllowAny]
    filterset_class = StockPriceFilter
    ordering_fields = ["timeStamp", "price"]

    def get_queryset(self):
        return StockPrice.objects.select_related("stock").order_by("-timeStamp")

@csrf_exempt
@require_POST
def process_signals_system(request):
    provided = request.headers.get("X-Processor-Key")
    expected = getattr(settings, "PROCESSOR_SHARED_KEY", None)

    if not expected or provided != expected:
        return JsonResponse({"detail": "Unauthorized"}, status=401)

    body = json.loads(request.body.decode("utf-8"))
    run_key = body["runKey"]
    signals = body["signals"]
    prices = body["prices"]

    stats = process_signal_run(
        signals=signals,
        price_map=prices,
        run_key=run_key,
    )

    return JsonResponse({
        "accountsProcessed": stats.accounts_processed,
        "sellsExecuted": stats.sells_executed,
        "buysExecuted": stats.buys_executed,
        "skippedMissingStock": stats.skipped_missing_stock,
        "skippedMissingPrice": stats.skipped_missing_price,
        "skippedAlreadyProcessed": stats.skipped_already_processed,
    })

# Helpers
def get_request_account(request):
    try:
        return request.user.user_account.account
    except:
        raise NotFound("This user does not have any associated accounts.")