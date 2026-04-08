from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_DOWN

from django.db import transaction
from django.utils import timezone

from api.models import Account, AccountHolding, AccountStanding, Stock
from api.services.trading import execute_trade


MONEY_STEP = Decimal("0.01")
SHARE_STEP = Decimal("0.00000001")


@dataclass
class ProcessingStats:
    accounts_processed: int = 0
    sells_executed: int = 0
    buys_executed: int = 0
    skipped_missing_stock: int = 0
    skipped_missing_price: int = 0
    skipped_already_processed: int = 0


def q_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_STEP)


def q_shares(value: Decimal) -> Decimal:
    return value.quantize(SHARE_STEP, rounding=ROUND_DOWN)


def get_stock_map(tickers: set[str]) -> dict[str, Stock]:
    stocks = Stock.objects.filter(ticker__in=tickers)
    return {stock.ticker.upper(): stock for stock in stocks}


def get_current_holdings_map(account: Account) -> dict[str, AccountHolding]:
    holdings = (
        AccountHolding.objects
        .select_related("stock")
        .filter(account=account, currentlyHeld=True, quantity__gt=0)
    )
    return {holding.stock.ticker.upper(): holding for holding in holdings}


def create_account_standing(account: Account, as_of):
    AccountStanding.objects.create(
        account=account,
        balance=account.balance,
        timeStamp=as_of,
    )


@transaction.atomic
def process_one_account(
    *,
    account_id: int,
    buy_tickers: set[str],
    sell_tickers: set[str],
    stock_map: dict[str, Stock],
    price_map: dict[str, Decimal],
    as_of,
    stats: ProcessingStats,
):
    account = Account.objects.select_for_update().get(pk=account_id)
    holdings_map = get_current_holdings_map(account)

    # SELLS FIRST
    for ticker in sorted(sell_tickers):
        holding = holdings_map.get(ticker)
        if not holding:
            continue

        price = price_map.get(ticker)
        if price is None or price <= 0:
            stats.skipped_missing_price += 1
            continue

        execute_trade(
            account=account,
            stock=holding.stock,
            method="SELL",
            quantity=holding.quantity,
            price=price,
            time_stamp=as_of,
        )
        stats.sells_executed += 1

    account.refresh_from_db(fields=["cashBalance", "balance"])

    valid_buy_stocks: list[Stock] = []
    for ticker in sorted(buy_tickers):
        stock = stock_map.get(ticker)
        if not stock:
            stats.skipped_missing_stock += 1
            continue

        price = price_map.get(ticker)
        if price is None or price <= 0:
            stats.skipped_missing_price += 1
            continue

        valid_buy_stocks.append(stock)

    # BUYS SECOND, equal-dollar split
    if valid_buy_stocks and account.cashBalance > 0:
        allocation_per_stock = q_money(account.cashBalance / Decimal(len(valid_buy_stocks)))

        for stock in valid_buy_stocks:
            account.refresh_from_db(fields=["cashBalance"])
            if account.cashBalance <= 0:
                break

            price = price_map.get(stock.ticker.upper())
            if price is None or price <= 0:
                continue

            quantity = q_shares(allocation_per_stock / price)
            if quantity <= 0:
                continue

            trade_cost = q_money(quantity * price)

            if trade_cost > account.cashBalance:
                quantity = q_shares(account.cashBalance / price)
                if quantity <= 0:
                    continue
                trade_cost = q_money(quantity * price)

            if trade_cost <= 0 or trade_cost > account.cashBalance:
                continue

            execute_trade(
                account=account,
                stock=stock,
                method="BUY",
                quantity=quantity,
                price=price,
                time_stamp=as_of,
            )
            stats.buys_executed += 1

    account.refresh_from_db(fields=["balance"])
    create_account_standing(account, as_of)
    stats.accounts_processed += 1


def process_signal_run(
    *,
    signals: list[dict],
    price_map: dict[str, Decimal],
    as_of=None,
) -> ProcessingStats:
    if as_of is None:
        as_of = timezone.now()

    buy_tickers = {s["ticker"].upper() for s in signals if s["action"].upper() == "BUY"}
    sell_tickers = {s["ticker"].upper() for s in signals if s["action"].upper() == "SELL"}

    all_tickers = buy_tickers | sell_tickers
    stock_map = get_stock_map(all_tickers)

    normalized_price_map = {
        str(ticker).upper(): Decimal(str(price))
        for ticker, price in price_map.items()
    }

    stats = ProcessingStats()

    for account_id in Account.objects.values_list("id", flat=True):
        process_one_account(
            account_id=account_id,
            buy_tickers=buy_tickers,
            sell_tickers=sell_tickers,
            stock_map=stock_map,
            price_map=normalized_price_map,
            as_of=as_of,
            stats=stats,
        )

    return stats