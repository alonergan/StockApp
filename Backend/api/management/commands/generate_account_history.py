import random
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.models import Account, AccountStanding


class Command(BaseCommand):
    help = "Seed ~2 months of dummy AccountStanding history for an account"

    def add_arguments(self, parser):
        parser.add_argument("account_id", type=int, help="Account ID to seed history for")
        parser.add_argument(
            "--days",
            type=int,
            default=60,
            help="Number of days of history to generate (default: 60)",
        )
        parser.add_argument(
            "--start-balance",
            type=float,
            default=10000.00,
            help="Starting balance (default: 10000.00)",
        )
        parser.add_argument(
            "--points-per-day",
            type=int,
            default=1,
            help="How many balance records per day (default: 1)",
        )
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Delete existing standings for this account before seeding",
        )

    def handle(self, *args, **options):
        account_id = options["account_id"]
        days = options["days"]
        start_balance = Decimal(str(options["start_balance"]))
        points_per_day = options["points_per_day"]
        clear_existing = options["clear_existing"]

        try:
            account = Account.objects.get(pk=account_id)
        except Account.DoesNotExist:
            raise CommandError(f"Account with id={account_id} does not exist")

        if clear_existing:
            deleted_count, _ = AccountStanding.objects.filter(account=account).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted_count} existing records"))

        now = timezone.now()
        start_time = now - timedelta(days=days)

        balance = start_balance
        records = []

        total_points = days * points_per_day

        for i in range(total_points):
            progress = i / max(total_points - 1, 1)

            # Evenly spread timestamps
            timestamp = start_time + timedelta(
                seconds=(days * 24 * 60 * 60) * progress
            )

            # Simulate brokerage-like movement:
            # small drift + random volatility + occasional larger swing
            drift = Decimal(str(random.uniform(-15, 20)))
            volatility = Decimal(str(random.uniform(-120, 120)))

            # Occasional bigger move
            if random.random() < 0.08:
                volatility += Decimal(str(random.uniform(-300, 300)))

            change = drift + volatility
            balance += change

            # Prevent unrealistic negative values
            if balance < Decimal("100.00"):
                balance = Decimal("100.00") + Decimal(str(random.uniform(0, 200)))

            # Round to cents
            balance = balance.quantize(Decimal("0.01"))

            records.append(
                AccountStanding(
                    account=account,
                    balance=balance,
                    timeStamp=timestamp,
                )
            )

        AccountStanding.objects.bulk_create(records)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(records)} AccountStanding records for account {account_id}"
            )
        )