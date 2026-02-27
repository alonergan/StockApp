from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Account, Stock, UserAccount, AccountStanding, AccountHolding, Trade, StockPrice

User = get_user_model()

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'startBalance', 'balance', 'riskLevel', 'thresholdPercentage']

class UserAccountSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    account = AccountSerializer(read_only=True)

    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'account']

class AccountStandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountStanding
        fields = ['id', 'account', 'balance', 'timeStamp']

class AccountHoldingSerializer(serializers.ModelSerializer):
    ticker = serializers.CharField(source="stock.ticker", read_only=True)
    stockName = serializers.CharField(source="stock.name", read_only=True)

    class Meta:
        model = AccountHolding
        fields = ["id", "account", "stock", "ticker", "stockName", "quantity", "currentlyHeld"]

class TradeSerializer(serializers.ModelSerializer):
    ticker = serializers.CharField(source="stock.ticker", read_only=True)
    stockName = serializers.CharField(source="stock.name", read_only=True)

    class Meta:
        model = Trade
        fields = ["id", "account", "stock", "ticker", "stockName", "timeStamp", "price", "quantity", "method"]

class StockPriceSerializer(serializers.ModelSerializer):
    ticker = serializers.CharField(source="stock.ticker", read_only=True)

    class Meta:
        model = StockPrice
        fields = ["id", "stock", "ticker", "price", "timeStamp"]

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ["id", "ticker", "name"]

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150);
    password = serializers.CharField(write_only=True, min_length=8)
    startBalance = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    riskLevel = serializers.IntegerField(required=False)
    thresholdPercentage = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value