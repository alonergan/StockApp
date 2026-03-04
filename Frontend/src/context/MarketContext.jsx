// src/context/MarketContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { getLatestStockPrice } from "../api/finnhub/stocks";

const MarketContext = createContext();

const tickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "JPM", "JNJ",
    "V", "PG", "XOM", "UNH", "MA", "HD", "LLY", "AVGO", "COST", "KO"
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export function MarketProvider({ children }) {
    const [stockPriceByTicker, setStockPriceByTicker] = useState({});
    const [loading, setLoading] = useState(false);

    const loadMarket = useCallback(async () => {
        setLoading(true);

        const cleaned = {};

        for (let i = 0; i < tickers.length; i++) {
            const ticker = tickers[i];

            try {
                const r = await getLatestStockPrice(ticker);

                cleaned[ticker] = {
                    price: Number(r?.c),
                    change: Number(r?.d),
                    percentChange: Number(r?.dp),
                    highPrice: Number(r?.h),
                    lowPrice: Number(r?.l),
                    openPrice: Number(r?.o),
                    previousClose: Number(r?.pc),
                };

            } catch { }

            if (i < tickers.length - 1) {
                await delay(100);
            }
        }

        setStockPriceByTicker(cleaned);
        setLoading(false);
    }, []);

    return (
        <MarketContext.Provider
            value={{
                tickers,
                stockPriceByTicker,
                loading,
                loadMarket,
            }}
        >
            {children}
        </MarketContext.Provider>
    );
}

export function useMarket() {
    return useContext(MarketContext);
}