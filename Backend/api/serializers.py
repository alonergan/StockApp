from decimal import Decimal

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
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    # These names match your frontend + Account fields (camelCase)
    startBalance = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    riskLevel = serializers.IntegerField(required=False)
    thresholdPercentage = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_riskLevel(self, value):
        # Optional, but helps avoid garbage values getting saved
        if value is None:
            return value
        if value < 1 or value > 5:
            raise serializers.ValidationError("riskLevel must be between 1 and 5.")
        return value

    def validate_thresholdPercentage(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("thresholdPercentage must be > 0.")
        return value

    def validate_startBalance(self, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError("startBalance must be >= 0.")
        return value

    def create(self, validated_data):
        """
        Create the User + related Account/UserAccount using the provided fields.
        """
        username = validated_data["username"]
        password = validated_data["password"]

        # Defaults if client didn't send them
        start_balance = validated_data.get("startBalance", Decimal("10000.00"))
        risk_level = validated_data.get("riskLevel", 1)
        threshold_pct = validated_data.get("thresholdPercentage", Decimal("20.00"))

        # 1) Create the Django user
        user = User.objects.create_user(username=username, password=password)

        # 2) Create the trading Account with provided settings
        account = Account.objects.create(
            startBalance=start_balance,
            balance=start_balance,  # keep current balance equal to starting balance at registration
            riskLevel=risk_level,
            thresholdPercentage=threshold_pct,
        )

        # 3) Create the UserAccount that ties user -> account
        # If your field is not named "account" or "user", adjust below.
        UserAccount.objects.create(user=user, account=account)

        return user
