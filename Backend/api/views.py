from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.contrib.auth import get_user_model
from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice
from .serializers import RegisterSerializer, AccountSerializer, StockSerializer, UserAccountSerializer, AccountStandingSerializer, AccountHoldingSerializer, TradeSerializer, StockPriceSerializer

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

class AccountStandingViewSet(viewsets.ModelViewSet):
    serializer_class = AccountStandingSerializer

    def get_queryset(self):
        account = get_request_account(self.request)
        return AccountStanding.objects.filter(account = account).order_by('-timeStamp')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(account = account)

class AccountHoldingViewSet(viewsets.ModelViewSet):
    serializer_class = AccountHoldingSerializer

    def get_queryset(self):
        account = get_request_account(self.request)
        return AccountHolding.objects.filter(account = account).order_by('id')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(account=account)

class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer
    filterset_fields = ['stock', 'method', 'timeStamp']
    ordering_fields = ['timeStamp', 'price']

    def get_queryset(self):
        account = get_request_account(self.request)
        return Trade.objects.filter(account = account).order_by('-timeStamp')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(account = account)

class StockPriceViewSet(viewsets.ModelViewSet):
    queryset = StockPrice.objects.all().order_by('-timeStamp')
    serializer_class = StockPriceSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get']

# Helpers
def get_request_account(request):
    try:
        return request.user.user_account.account
    except:
        raise NotFound("This user does not have any associated accounts.")