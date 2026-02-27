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
from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice
from .serializers import RegisterSerializer, AccountSerializer, StockSerializer, UserAccountSerializer, AccountStandingSerializer, AccountHoldingSerializer, TradeSerializer, StockPriceSerializer
from .filters import StockPriceFilter, TradeFilter, HoldingFilter, StandingFilter
from decimal import Decimal

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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = getattr(request.user, "user_account", None)
    return Response({'id': request.user.id, 'username': request.user.username, 'accountId': user.account_id})


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
        trade = serializer.save(account=account)

        holding, _ = AccountHolding.objects.select_for_update().get_or_create(
            account=account,
            stock=trade.stock,
            defaults={"quantity": Decimal("0")}
        )

        if trade.method.upper() == "BUY":
            holding.quantity += trade.quantity
        elif trade.method.upper() == "SELL":
            if holding.quantity < trade.quantity:
                raise ValidationError("Insufficient shares to sell.")
            holding.quantity -= trade.quantity
        else:
            raise ValidationError("method must be BUY or SELL")

        holding.currentlyHeld = holding.quantity > 0
        holding.save()

class StockPriceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockPriceSerializer
    permission_classes = [AllowAny]
    filterset_class = StockPriceFilter
    ordering_fields = ["timeStamp", "price"]

    def get_queryset(self):
        return StockPrice.objects.select_related("stock").order_by("-timeStamp")

# Helpers
def get_request_account(request):
    try:
        return request.user.user_account.account
    except:
        raise NotFound("This user does not have any associated accounts.")