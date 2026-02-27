import { api } from "./client";

/**
 * Cleans empty strings so they dont cause issues with the backend api
 */
function cleanParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
}

/**
 * GET /api/stock-prices/
 * Query params:
 * - ticker (preferred) OR stockId (internal Stock PK)
 * - start/end ISO datetimes
 * - ordering (default "timeStamp")
 */
export async function getStockPrices({ stockId, ticker, start, end, ordering = "timeStamp" } = {}) {
    const params = cleanParams({
        ticker,
        stock: ticker ? undefined : stockId,
        start,
        end,
        ordering,
    });
    const res = await api.get("/api/stock-prices/", { params });
    return res.data;
}

/**
 * Gets the latest price for a stock
 */
export async function getLatestStockPrice({ stockId, ticker } = {}) {
    const data = await getStockPrices({ stockId, ticker, ordering: "-timeStamp" });
    return Array.isArray(data) ? data[0] ?? null : data;
}
