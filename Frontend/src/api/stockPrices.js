import { api } from "./client";

export function getStockPrices({ stockId, ticker, start, end, ordering = "timeStamp" }) {
    const params = { start, end, ordering };
    if (ticker) params.ticker = ticker;     // preferred by frontend
    else if (stockId) params.stock = stockId;

    return api.get("/api/stock-prices/", { params }).then((r) => r.data);
}