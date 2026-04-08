from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from pathlib import Path
from datetime import date
import csv
import io
import hashlib

from azure.storage.blob import BlobServiceClient


TradeAction = Literal["BUY", "SELL"]


@dataclass(frozen=True)
class Signal:
    ticker: str
    action: TradeAction


def build_signal_filename(run_date: date) -> str:
    return f"Trade_Signals_{run_date.strftime('%m%d%Y')}.csv"


def download_blob_text(connection_string: str, container_name: str, blob_name: str) -> str:
    service = BlobServiceClient.from_connection_string(connection_string)
    blob_client = service.get_blob_client(container=container_name, blob=blob_name)
    data = blob_client.download_blob().readall()
    return data.decode("utf-8")


def load_local_text(file_path: str) -> str:
    return Path(file_path).read_text(encoding="utf-8")


def load_signals_csv_text(
    *,
    run_date: date,
    source_type: str,
    local_directory: str | None = None,
    blob_connection_string: str | None = None,
    blob_container: str | None = None,
    blob_prefix: str | None = None,
) -> tuple[str, str]:
    """
    Returns (csv_text, source_name)
    """
    file_name = build_signal_filename(run_date)

    if source_type == "local":
        if not local_directory:
            raise ValueError("local_directory is required when source_type='local'")
        full_path = Path(local_directory) / file_name
        return load_local_text(str(full_path)), str(full_path)

    if source_type == "blob":
        if not blob_connection_string or not blob_container:
            raise ValueError("blob_connection_string and blob_container are required when source_type='blob'")
        blob_name = f"{blob_prefix.strip('/')}/{file_name}" if blob_prefix else file_name
        return (
            download_blob_text(
                connection_string=blob_connection_string,
                container_name=blob_container,
                blob_name=blob_name,
            ),
            blob_name,
        )

    raise ValueError("source_type must be 'local' or 'blob'")


def parse_signals(csv_text: str) -> list[Signal]:
    reader = csv.DictReader(io.StringIO(csv_text))

    if not reader.fieldnames:
        raise ValueError("CSV is missing headers")

    normalized_fieldnames = [field.strip().lower() for field in reader.fieldnames]
    required = {"ticker", "action"}
    if not required.issubset(set(normalized_fieldnames)):
        raise ValueError("CSV must contain ticker,action columns")

    field_map = {field.strip().lower(): field for field in reader.fieldnames}

    signals: list[Signal] = []
    seen: set[tuple[str, str]] = set()

    for row in reader:
        ticker = str(row[field_map["ticker"]]).strip().upper()
        action = str(row[field_map["action"]]).strip().upper()

        if not ticker:
            continue
        if action not in {"BUY", "SELL"}:
            raise ValueError(f"Invalid action '{action}' for ticker '{ticker}'")

        key = (ticker, action)
        if key in seen:
            continue
        seen.add(key)

        signals.append(Signal(ticker=ticker, action=action))

    return signals


def split_signals(signals: list[Signal]) -> tuple[set[str], set[str]]:
    buy_tickers = {s.ticker for s in signals if s.action == "BUY"}
    sell_tickers = {s.ticker for s in signals if s.action == "SELL"}
    return buy_tickers, sell_tickers


def build_run_key(source_name: str, csv_text: str) -> str:
    digest = hashlib.sha256(csv_text.encode("utf-8")).hexdigest()[:16]
    safe_source = source_name.replace("/", "_").replace("\\", "_")
    return f"{safe_source}:{digest}"