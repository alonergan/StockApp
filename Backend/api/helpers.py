from decimal import Decimal
from django.db.models import F
from .models import AccountHolding, StockPrice

def recalculate_account_balance(account):
    total_holdings_value = Decimal("0.00")

    holdings = (
        AccountHolding.objects
        .select_related("stock")
        .filter(account=account, currentlyHeld=True, quantity__gt=0)
    )

    for holding in holdings:
        latest_price = (
            StockPrice.objects
            .filter(stock=holding.stock)
            .order_by("-timeStamp")
            .first()
        )
        if latest_price:
            total_holdings_value += holding.quantity * latest_price.price

    account.balance = account.cashBalance + total_holdings_value
    account.save(update_fields=["balance"])