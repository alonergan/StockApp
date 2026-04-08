from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.core.exceptions import ValidationError

from api.models import AccountHolding, Trade, StockPrice, Account

MONEY = Decimal("0.01")


def q_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)


def get_latest_price(stock):
    return (
        StockPrice.objects
        .filter(stock=stock)
        .order_by("-timeStamp")
        .first()
    )


def recalculate_account_balance(account: Account):
    total_holdings_value = Decimal("0.00")

    holdings = (
        AccountHolding.objects
        .select_related("stock")
        .filter(account=account, currentlyHeld=True, quantity__gt=0)
    )

    for holding in holdings:
        latest_price = get_latest_price(holding.stock)
        if latest_price:
            total_holdings_value += holding.quantity * latest_price.price

    account.balance = q_money(account.cashBalance + total_holdings_value)
    account.save(update_fields=["balance"])


@transaction.atomic
def execute_trade(*, account, stock, method, quantity, price, time_stamp):
    method = method.upper()

    if quantity <= 0:
        raise ValidationError("quantity must be > 0")
    if price <= 0:
        raise ValidationError("price must be > 0")
    if method not in {"BUY", "SELL"}:
        raise ValidationError("method must be BUY or SELL")

    account = Account.objects.select_for_update().get(pk=account.pk)

    holding, _ = AccountHolding.objects.select_for_update().get_or_create(
        account=account,
        stock=stock,
        defaults={
            "quantity": Decimal("0"),
            "currentlyHeld": False,
        },
    )

    trade_value = q_money(quantity * price)

    if method == "BUY":
        if account.cashBalance < trade_value:
            raise ValidationError("Insufficient cash to buy.")
        account.cashBalance = q_money(account.cashBalance - trade_value)
        holding.quantity += quantity

    elif method == "SELL":
        if holding.quantity < quantity:
            raise ValidationError("Insufficient shares to sell.")
        holding.quantity -= quantity
        account.cashBalance = q_money(account.cashBalance + trade_value)

    holding.currentlyHeld = holding.quantity > 0
    holding.save(update_fields=["quantity", "currentlyHeld"])
    account.save(update_fields=["cashBalance"])

    trade = Trade.objects.create(
        account=account,
        stock=stock,
        timeStamp=time_stamp,
        price=price,
        quantity=quantity,
        method=method,
    )

    recalculate_account_balance(account)

    return trade