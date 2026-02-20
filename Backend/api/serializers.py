from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice

User = get_user_model()

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'startBalance', 'balance', 'riskLevel', 'thresholdPercentage']

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'ticker', 'name']

class UserAccountSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    accountID = AccountSerializer(read_only=True)

    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'accountID']

class AccountStandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountStanding
        fields = ['id', 'accountID', 'balance', 'timeStamp']

class AccountHoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountHolding
        fields = ['id', 'accountID', 'stockID', 'currentlyHeld']

class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = ['id', 'accountID', 'stockID', 'timeStamp', 'price', 'method']

class StockPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockPrice
        fields = ['id', 'stockID', 'price', 'timeStamp']
