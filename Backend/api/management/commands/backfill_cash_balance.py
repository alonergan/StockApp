from django.core.management.base import BaseCommand
from decimal import Decimal

from api.models import Account, AccountHolding, StockPrice


def get_latest_price(stock):
    return (
        StockPrice.objects
        .filter(stock=stock)
        .order_by("-timeStamp")
        .first()
    )


class Command(BaseCommand):
    help = "Backfill cashBalance = balance - holdings value"

    def handle(self, *args, **options):
        updated = 0

        for account in Account.objects.all():
            holdings = (
                AccountHolding.objects
                .select_related("stock")
                .filter(account=account, currentlyHeld=True, quantity__gt=0)
            )

            total_holdings_value = Decimal("0.00")

            for holding in holdings:
                latest_price = get_latest_price(holding.stock)
                if not latest_price:
                    self.stdout.write(
                        self.style.WARNING(
                            f"No price for {holding.stock.ticker}, skipping"
                        )
                    )
                    continue

                total_holdings_value += holding.quantity * latest_price.price

            cash = account.balance - total_holdings_value

            # guard against negative due to rounding or missing prices
            if cash < 0:
                self.stdout.write(
                    self.style.WARNING(
                        f"Negative cash for account {account.id}, clamping to 0"
                    )
                )
                cash = Decimal("0.00")

            account.cashBalance = cash
            account.save(update_fields=["cashBalance"])

            updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated} accounts"))