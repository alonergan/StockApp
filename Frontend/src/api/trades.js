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
 * Get list of latest trades for an account (filters by JWT in backend)
 * GET /api/trades/
 * Optional filters:
 * - stockId
 * - method (BUY/SELL)
 * - start/end ISO datetimes
 * - ordering (default "-timeStamp")
 */
export async function getTrades({ stockId, method, start, end, ordering = "-timeStamp" } = {}) {
    const params = cleanParams({ stock: stockId, method, start, end, ordering });
    const res = await api.get("/api/trades/", { params });
    return res.data;
}

/**
 * Get specific trade based on id
 * GET /api/trades/:id/
 */
export async function getTrade(id) {
    if (!id) {
        throw new Error("getTrade requires id");
    }
    const res = await api.get(`/api/trades/${id}/`);
    return res.data;
}

/**
 * Create a new trade (This also updates an accounts holding)
 * POST /api/trades/
 */
export async function createTrade({ stockId, timeStamp, price, method, quantity } = {}) {
    const payload = cleanParams({
        stock: stockId,
        timeStamp,
        price,
        method,
        quantity,
    });
    const res = await api.post("/api/trades/", payload);
    return res.data;
}

/**
 * DELETE /api/trades/:id/
 */
export async function deleteTrade(id) {
    if (!id) {
        throw new Error("deleteTrade requires id");
    }
    await api.delete(`/api/trades/${id}/`);
}
