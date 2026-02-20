from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.shortcuts import get_object_or_404, render

from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice
from .serializers import AccountSerializer, StockSerializer, UserAccountSerializer, AccountStandingSerializer, AccountHoldingSerializer, TradeSerializer, StockPriceSerializer

# Generic views for getting and setting data
class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user_account__user = self.request.user)

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'user_account'):
            raise ValidationError("User already has an account.")

        account = serializer.save()
        UserAccount.objects.create(user=self.request.user, accountID=account)


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
        return AccountStanding.objects.filter(accountID = account).order_by('-timeStamp')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(accountID = account)

class AccountHoldingViewSet(viewsets.ModelViewSet):
    serializer_class = AccountHoldingSerializer

    def get_queryset(self):
        account = get_request_account(self.request)
        return AccountHolding.objects.filter(accountID = account).order_by('id')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(accountID=account)

class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer

    def get_queryset(self):
        account = get_request_account(self.request)
        return Trade.objects.filter(accountID = account).order_by('-timeStamp')

    def perform_create(self, serializer):
        account = get_request_account(self.request)
        serializer.save(accountID = account)

class StockPriceViewSet(viewsets.ModelViewSet):
    queryset = StockPrice.objects.all().order_by('-timeStamp')
    serializer_class = StockPriceSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get']

# Helpers
def get_request_account(request):
    try:
        return request.user.user_account.accountID
    except:
        raise NotFound("This user does not have any associated accounts.")