import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Stock


class Command(BaseCommand):
    help = "Import distinct stock tickers from a headerless signals CSV into the Stock table"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            type=str,
            help="Path to the signals CSV file"
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])

        if not csv_path.exists():
            raise CommandError(f"File not found: {csv_path}")

        created_count = 0
        existing_count = 0
        bad_rows = 0

        tickers = set()

        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)

            for row_num, row in enumerate(reader, start=1):
                if len(row) < 3:
                    bad_rows += 1
                    self.stdout.write(
                        self.style.WARNING(f"Skipping row {row_num}: expected 3 columns, got {len(row)}")
                    )
                    continue

                ticker = str(row[1]).strip().upper()
                if not ticker:
                    bad_rows += 1
                    self.stdout.write(
                        self.style.WARNING(f"Skipping row {row_num}: blank ticker")
                    )
                    continue

                tickers.add(ticker)

        for ticker in sorted(tickers):
            stock, created = Stock.objects.get_or_create(
                ticker=ticker,
                defaults={"name": ticker},
            )

            if created:
                created_count += 1
            else:
                existing_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done. Unique tickers: {len(tickers)}, created: {created_count}, existing: {existing_count}, bad rows: {bad_rows}"
        ))