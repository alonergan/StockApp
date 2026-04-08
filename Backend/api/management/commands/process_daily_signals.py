from __future__ import annotations

import os
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.services.pricing import AlphaVantagePricingClient
from api.services.signal_source import (
    build_run_key,
    load_signals_csv_text,
    parse_signals,
)
from api.services.signal_processor import process_signal_run


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise CommandError(f"Missing required environment variable: {name}")
    return value


class Command(BaseCommand):
    help = "Read daily trading signals, fetch prices, and process account trades"

    def add_arguments(self, parser):
        parser.add_argument("--date", type=str, help="Run date in YYYY-MM-DD format")
        parser.add_argument("--api-key", type=str, help="Alpha Vantage API key override")
        parser.add_argument("--source-type", type=str, choices=["local", "blob"], help="Signal source override")
        parser.add_argument("--local-directory", type=str, help="Local signal directory override")
        parser.add_argument("--blob-container", type=str, help="Blob container override")
        parser.add_argument("--blob-prefix", type=str, help="Blob prefix override")
        parser.add_argument("--storage-connection-string", type=str, help="Blob connection string override")
        parser.add_argument("--max-requests-per-minute", type=int, help="Rate limit override")

    def handle(self, *args, **options):
        run_date = (
            datetime.strptime(options["date"], "%Y-%m-%d").date()
            if options.get("date")
            else timezone.localdate()
        )

        api_key = options.get("api_key") or get_required_env("ALPHAVANTAGE_API_KEY")
        source_type = (options.get("source_type") or os.getenv("TRADE_SIGNAL_SOURCE_TYPE", "blob")).lower()
        max_rpm = options.get("max_requests_per_minute") or int(os.getenv("ALPHAVANTAGE_MAX_REQUESTS_PER_MINUTE", "75"))

        local_directory = options.get("local_directory") or os.getenv("TRADE_SIGNAL_LOCAL_DIRECTORY")
        blob_container = options.get("blob_container") or os.getenv("TRADE_SIGNAL_BLOB_CONTAINER")
        blob_prefix = options.get("blob_prefix") or os.getenv("TRADE_SIGNAL_BLOB_PREFIX", "")
        storage_connection_string = (
            options.get("storage_connection_string")
            or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        )

        csv_text, source_name = load_signals_csv_text(
            run_date=run_date,
            source_type=source_type,
            local_directory=local_directory,
            blob_connection_string=storage_connection_string,
            blob_container=blob_container,
            blob_prefix=blob_prefix,
        )

        signals = parse_signals(csv_text)
        if not signals:
            self.stdout.write(self.style.WARNING("No signals found. Nothing to process."))
            return

        tickers = {signal.ticker for signal in signals}
        run_key = build_run_key(source_name, csv_text)

        pricing_client = AlphaVantagePricingClient(
            api_key=api_key,
            max_requests_per_minute=max_rpm,
        )
        price_map = pricing_client.get_prices(tickers)

        stats = process_signal_run(
            signals=[{"ticker": s.ticker, "action": s.action} for s in signals],
            price_map=price_map,
            run_key=run_key,
        )

        self.stdout.write(self.style.SUCCESS("Signal processing complete"))
        self.stdout.write(f"Run date: {run_date.isoformat()}")
        self.stdout.write(f"Source: {source_name}")
        self.stdout.write(f"Run key: {run_key}")
        self.stdout.write(f"Accounts processed: {stats.accounts_processed}")
        self.stdout.write(f"Sells executed: {stats.sells_executed}")
        self.stdout.write(f"Buys executed: {stats.buys_executed}")
        self.stdout.write(f"Skipped missing stock: {stats.skipped_missing_stock}")
        self.stdout.write(f"Skipped missing price: {stats.skipped_missing_price}")
        self.stdout.write(f"Skipped already processed: {stats.skipped_already_processed}")