from __future__ import annotations

from decimal import Decimal
import time
import requests


class AlphaVantagePricingClient:
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: str, max_requests_per_minute: int = 75, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self.min_interval = 60.0 / max_requests_per_minute
        self._last_request_ts = 0.0

    def _throttle(self) -> None:
        now = time.monotonic()
        elapsed = now - self._last_request_ts
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_request_ts = time.monotonic()

    def _get(self, params: dict) -> dict:
        self._throttle()

        response = requests.get(self.BASE_URL, params=params, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()

        if "Note" in data:
            raise RuntimeError(f"Alpha Vantage throttled request: {data['Note']}")
        if "Error Message" in data:
            raise RuntimeError(f"Alpha Vantage error: {data['Error Message']}")

        return data

    def get_global_quote_price(self, ticker: str) -> Decimal | None:
        data = self._get({
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": self.api_key,
        })

        quote = data.get("Global Quote", {})
        raw_price = quote.get("05. price")
        if not raw_price:
            return None

        return Decimal(str(raw_price))

    def get_daily_series_price(self, ticker: str) -> Decimal | None:
        data = self._get({
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker,
            "apikey": self.api_key,
        })

        series = data.get("Time Series (Daily)", {})
        if not series:
            return None

        latest_date = max(series.keys())
        latest_bar = series.get(latest_date, {})
        raw_price = latest_bar.get("4. close")
        if not raw_price:
            return None

        return Decimal(str(raw_price))

    def get_price(self, ticker: str) -> Decimal | None:
        price = self.get_global_quote_price(ticker)
        if price is not None and price > 0:
            return price
        return self.get_daily_series_price(ticker)

    def get_prices(self, tickers: set[str]) -> dict[str, Decimal]:
        prices: dict[str, Decimal] = {}

        for ticker in sorted({t.strip().upper() for t in tickers if t and t.strip()}):
            price = self.get_price(ticker)
            if price is not None and price > 0:
                prices[ticker] = price

        return prices