import random
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from api.models import (
    Account,
    AccountHolding,
    AccountStanding,
    Stock,
    StockPrice,
    Trade,
)


def q2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def q8(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)


class Command(BaseCommand):
    help = (
        "Seed dummy market data: stocks, stock price history, trades, holdings, "
        "and account standing history."
    )

    STOCK_SEEDS = [
        ("AAPL", "Apple Inc."),
        ("MSFT", "Microsoft Corporation"),
        ("GOOGL", "Alphabet Inc."),
        ("AMZN", "Amazon.com Inc."),
        ("META", "Meta Platforms Inc."),
        ("TSLA", "Tesla Inc."),
        ("NVDA", "NVIDIA Corporation"),
        ("AMD", "Advanced Micro Devices Inc."),
        ("NFLX", "Netflix Inc."),
        ("DIS", "The Walt Disney Company"),
        ("JPM", "JPMorgan Chase & Co."),
        ("V", "Visa Inc."),
        ("MA", "Mastercard Incorporated"),
        ("KO", "Coca-Cola Company"),
        ("PEP", "PepsiCo Inc."),
        ("WMT", "Walmart Inc."),
        ("COST", "Costco Wholesale Corporation"),
        ("BAC", "Bank of America Corporation"),
        ("XOM", "Exxon Mobil Corporation"),
        ("INTC", "Intel Corporation"),
    ]

    BASE_PRICES = {
        "AAPL": Decimal("185.00"),
        "MSFT": Decimal("420.00"),
        "GOOGL": Decimal("155.00"),
        "AMZN": Decimal("180.00"),
        "META": Decimal("490.00"),
        "TSLA": Decimal("210.00"),
        "NVDA": Decimal("880.00"),
        "AMD": Decimal("175.00"),
        "NFLX": Decimal("610.00"),
        "DIS": Decimal("110.00"),
        "JPM": Decimal("195.00"),
        "V": Decimal("275.00"),
        "MA": Decimal("470.00"),
        "KO": Decimal("61.00"),
        "PEP": Decimal("169.00"),
        "WMT": Decimal("67.00"),
        "COST": Decimal("725.00"),
        "BAC": Decimal("38.00"),
        "XOM": Decimal("112.00"),
        "INTC": Decimal("42.00"),
    }

    def add_arguments(self, parser):
        parser.add_argument("account_id", type=int, help="Account ID to seed data for")
        parser.add_argument(
            "--days",
            type=int,
            default=60,
            help="Number of days of history to generate (default: 60)",
        )
        parser.add_argument(
            "--trades",
            type=int,
            default=45,
            help="Approximate number of dummy trades to generate (default: 45)",
        )
        parser.add_argument(
            "--starting-cash",
            type=float,
            default=25000.00,
            help="Starting cash used to simulate the account (default: 25000.00)",
        )
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Delete existing stocks/prices/trades/holdings/standings before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        account_id = options["account_id"]
        days = options["days"]
        trade_count = options["trades"]
        starting_cash = q2(Decimal(str(options["starting_cash"])))
        clear_existing = options["clear_existing"]

        try:
            account = Account.objects.get(pk=account_id)
        except Account.DoesNotExist:
            raise CommandError(f"Account with id={account_id} does not exist")

        if clear_existing:
            self._clear_existing_data(account)

        stocks = self._create_stocks()
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(stocks)} stocks exist"))

        start_dt = timezone.now() - timedelta(days=days)

        price_lookup, price_dates = self._create_price_history(stocks, start_dt, days)
        self.stdout.write(
            self.style.SUCCESS(
                f"Created stock price history for {len(stocks)} stocks across {len(price_dates)} days"
            )
        )

        trades = self._create_trades(
            account=account,
            stocks=stocks,
            price_lookup=price_lookup,
            price_dates=price_dates,
            trade_count=trade_count,
            starting_cash=starting_cash,
        )
        self.stdout.write(self.style.SUCCESS(f"Created {len(trades)} trades"))

        holdings = self._rebuild_holdings_from_trades(account)
        self.stdout.write(self.style.SUCCESS(f"Upserted {len(holdings)} account holdings"))

        standings = self._create_account_standings(
            account=account,
            price_lookup=price_lookup,
            price_dates=price_dates,
            starting_cash=starting_cash,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Created {len(standings)} account standing records")
        )

        self.stdout.write(self.style.SUCCESS("Market seed completed successfully"))

    def _clear_existing_data(self, account: Account) -> None:
        Trade.objects.filter(account=account).delete()
        AccountHolding.objects.filter(account=account).delete()
        AccountStanding.objects.filter(account=account).delete()

        # Only remove market-wide data if you want a fresh demo dataset
        StockPrice.objects.all().delete()
        Stock.objects.all().delete()

        self.stdout.write(self.style.WARNING("Cleared existing seeded data"))

    def _create_stocks(self):
        stocks = []

        for ticker, name in self.STOCK_SEEDS:
            stock, _ = Stock.objects.get_or_create(
                ticker=ticker,
                defaults={"name": name},
            )
            if stock.name != name:
                stock.name = name
                stock.save(update_fields=["name"])
            stocks.append(stock)

        return stocks

    def _create_price_history(self, stocks, start_dt, days):
        """
        Generates one price per stock per day.
        Returns:
          price_lookup[ticker][date_str] = Decimal(price)
          price_dates = [datetime, ...]
        """
        price_lookup = {}
        price_dates = []

        records = []

        for day_index in range(days):
            day_dt = start_dt + timedelta(days=day_index)
            price_dates.append(day_dt)

        for stock in stocks:
            current_price = self.BASE_PRICES.get(stock.ticker, Decimal("100.00"))
            series = {}

            for i, day_dt in enumerate(price_dates):
                # Gentle market drift + daily volatility + occasional larger moves
                drift = Decimal(str(random.uniform(-0.008, 0.01)))
                volatility = Decimal(str(random.uniform(-0.03, 0.03)))

                if random.random() < 0.08:
                    volatility += Decimal(str(random.uniform(-0.06, 0.06)))

                pct_change = drift + volatility
                multiplier = Decimal("1") + pct_change

                current_price = q2(max(Decimal("3.00"), current_price * multiplier))

                date_key = day_dt.date().isoformat()
                series[date_key] = current_price

                records.append(
                    StockPrice(
                        stock=stock,
                        price=current_price,
                        timeStamp=day_dt,
                    )
                )

            price_lookup[stock.ticker] = series

        StockPrice.objects.bulk_create(records, batch_size=1000)
        return price_lookup, price_dates

    def _create_trades(
        self,
        account,
        stocks,
        price_lookup,
        price_dates,
        trade_count,
        starting_cash,
    ):
        """
        Creates buy/sell trades in chronological order.
        Ensures sells do not exceed held quantity.
        """
        trades = []
        cash = starting_cash
        positions = {stock.id: Decimal("0") for stock in stocks}

        trade_records = []

        chosen_dates = sorted(random.sample(price_dates, k=min(trade_count, len(price_dates))))
        for trade_day in chosen_dates:
            stock = random.choice(stocks)
            ticker = stock.ticker
            date_key = trade_day.date().isoformat()
            market_price = price_lookup[ticker][date_key]

            current_qty = positions[stock.id]

            # More likely to buy when flat, otherwise mixed buy/sell behavior
            if current_qty <= Decimal("0"):
                method = "BUY"
            else:
                method = random.choices(["BUY", "SELL"], weights=[60, 40], k=1)[0]

            if method == "BUY":
                # spend up to 20% of current cash, with a minimum sanity check
                max_budget = cash * Decimal(str(random.uniform(0.05, 0.20)))
                if max_budget < market_price:
                    continue

                max_shares = (max_budget / market_price).quantize(
                    Decimal("0.00000001"), rounding=ROUND_HALF_UP
                )
                quantity = q8(Decimal(str(random.uniform(1, float(max_shares)))))

                if quantity <= 0:
                    continue

                trade_price = q2(
                    market_price * Decimal(str(random.uniform(0.995, 1.005)))
                )
                cost = q2(trade_price * quantity)

                if cost > cash:
                    quantity = q8(cash / trade_price)
                    cost = q2(trade_price * quantity)

                if quantity <= 0 or cost <= 0:
                    continue

                cash = q2(cash - cost)
                positions[stock.id] = q8(positions[stock.id] + quantity)

            else:  # SELL
                if current_qty <= 0:
                    continue

                quantity = q8(
                    current_qty * Decimal(str(random.uniform(0.15, 0.70)))
                )
                quantity = min(quantity, current_qty)

                if quantity <= 0:
                    continue

                trade_price = q2(
                    market_price * Decimal(str(random.uniform(0.995, 1.005)))
                )
                proceeds = q2(trade_price * quantity)

                cash = q2(cash + proceeds)
                positions[stock.id] = q8(positions[stock.id] - quantity)

            # random time during market-ish hours
            trade_ts = trade_day.replace(
                hour=random.randint(10, 15),
                minute=random.randint(0, 59),
                second=random.randint(0, 59),
                microsecond=0,
            )

            trade = Trade(
                account=account,
                stock=stock,
                timeStamp=trade_ts,
                price=trade_price,
                quantity=quantity,
                method=method,
            )
            trade_records.append(trade)

        trade_records.sort(key=lambda t: t.timeStamp)
        Trade.objects.bulk_create(trade_records, batch_size=500)
        trades.extend(trade_records)
        return trades

    def _rebuild_holdings_from_trades(self, account):
        """
        Recalculates holdings from trades.
        """
        trades = (
            Trade.objects.filter(account=account)
            .select_related("stock")
            .order_by("timeStamp", "id")
        )

        totals = {}

        for trade in trades:
            stock_id = trade.stock_id
            if stock_id not in totals:
                totals[stock_id] = {
                    "stock": trade.stock,
                    "quantity": Decimal("0"),
                }

            if trade.method.upper() == "BUY":
                totals[stock_id]["quantity"] += trade.quantity
            elif trade.method.upper() == "SELL":
                totals[stock_id]["quantity"] -= trade.quantity

        holdings = []

        for item in totals.values():
            quantity = q8(max(Decimal("0"), item["quantity"]))
            currently_held = quantity > 0

            holding, _ = AccountHolding.objects.update_or_create(
                account=account,
                stock=item["stock"],
                defaults={
                    "quantity": quantity,
                    "currentlyHeld": currently_held,
                },
            )
            holdings.append(holding)

        return holdings

    def _create_account_standings(
        self,
        account,
        price_lookup,
        price_dates,
        starting_cash,
    ):
        """
        Builds one daily account equity point:
          cash + market value of currently held shares as of that day
        using all trades up to each day.
        """
        trades = (
            Trade.objects.filter(account=account)
            .select_related("stock")
            .order_by("timeStamp", "id")
        )

        trade_index = 0
        trades_list = list(trades)

        cash = starting_cash
        positions = {}
        standing_records = []

        for day_dt in price_dates:
            day_end = day_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            while trade_index < len(trades_list) and trades_list[trade_index].timeStamp <= day_end:
                trade = trades_list[trade_index]
                stock_id = trade.stock_id

                if stock_id not in positions:
                    positions[stock_id] = Decimal("0")

                if trade.method.upper() == "BUY":
                    cash = q2(cash - q2(trade.price * trade.quantity))
                    positions[stock_id] = q8(positions[stock_id] + trade.quantity)
                elif trade.method.upper() == "SELL":
                    cash = q2(cash + q2(trade.price * trade.quantity))
                    positions[stock_id] = q8(positions[stock_id] - trade.quantity)

                trade_index += 1

            market_value = Decimal("0")
            for stock_id, qty in positions.items():
                if qty <= 0:
                    continue

                stock = Stock.objects.get(id=stock_id)
                date_key = day_dt.date().isoformat()
                price = price_lookup[stock.ticker][date_key]
                market_value += price * qty

            total_equity = q2(cash + market_value)

            standing_records.append(
                AccountStanding(
                    account=account,
                    balance=total_equity,
                    timeStamp=day_dt.replace(hour=16, minute=0, second=0, microsecond=0),
                )
            )

        AccountStanding.objects.bulk_create(standing_records, batch_size=500)
        return standing_records