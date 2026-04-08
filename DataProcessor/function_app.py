import os
import json
import hashlib
import logging
from datetime import datetime, timezone

import azure.functions as func
import requests
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp()

def build_filename(run_date: datetime) -> str:
    return f"Trade_Signals_{run_date.strftime('%m%d%Y')}.csv"

def load_csv_text() -> tuple[str, str]:
    container = os.environ["TRADE_SIGNAL_BLOB_CONTAINER"]
    prefix = os.getenv("TRADE_SIGNAL_BLOB_PREFIX", "").strip("/")
    conn = os.environ["AZURE_STORAGE_CONNECTION_STRING"]

    today = datetime.now(timezone.utc)
    filename = build_filename(today)
    blob_name = f"{prefix}/{filename}" if prefix else filename

    client = BlobServiceClient.from_connection_string(conn)
    blob = client.get_blob_client(container=container, blob=blob_name)
    text = blob.download_blob().readall().decode("utf-8")
    return text, blob_name

def parse_signals(csv_text: str) -> list[dict]:
    lines = [line.strip() for line in csv_text.splitlines() if line.strip()]
    headers = [h.strip().lower() for h in lines[0].split(",")]
    ticker_i = headers.index("ticker")
    action_i = headers.index("action")

    out = []
    seen = set()

    for line in lines[1:]:
        parts = [p.strip() for p in line.split(",")]
        ticker = parts[ticker_i].upper()
        action = parts[action_i].upper()
        if action not in {"BUY", "SELL"}:
            continue
        key = (ticker, action)
        if key in seen:
            continue
        seen.add(key)
        out.append({"ticker": ticker, "action": action})
    return out

def get_price(ticker: str) -> str | None:
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": ticker,
        "apikey": os.environ["ALPHAVANTAGE_API_KEY"],
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    raw = data.get("Global Quote", {}).get("05. price")
    return raw

def get_prices(signals: list[dict]) -> dict[str, str]:
    prices = {}
    tickers = sorted({s["ticker"] for s in signals})
    for ticker in tickers:
        price = get_price(ticker)
        if price:
            prices[ticker] = price
    return prices

@app.timer_trigger(schedule="0 5 11 * * *", arg_name="timer", run_on_startup=False, use_monitor=True)
def daily_trade_processor(timer: func.TimerRequest) -> None:
    csv_text, source_name = load_csv_text()
    signals = parse_signals(csv_text)
    prices = get_prices(signals)

    run_key = hashlib.sha256(f"{source_name}|{csv_text}".encode("utf-8")).hexdigest()[:24]

    payload = {
        "runKey": run_key,
        "signals": signals,
        "prices": prices,
    }

    res = requests.post(
        f"{os.environ['BACKEND_BASE_URL'].rstrip('/')}/api/system/process-signals/",
        json=payload,
        headers={"X-Processor-Key": os.environ["PROCESSOR_SHARED_KEY"]},
        timeout=300,
    )
    res.raise_for_status()
    logging.info("Processor result: %s", res.text)