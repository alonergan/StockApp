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
 * GET /api/account-holdings/current/
 * Returns holdings where currentlyHeld=true for the authenticated user's account.
 */
export async function getCurrentHoldings() {
    const res = await api.get("/api/account-holdings/current/");
    return res.data;
}

/**
 * GET /api/account-holdings/
 * Optional filters:
 * - currentlyHeld: boolean
 * - stockId: number (internal Stock PK)
 * - ordering: string (e.g. "id")
 */
export async function getHoldings({ currentlyHeld, stockId, ordering } = {}) {
    const params = cleanParams({ currentlyHeld, stock: stockId, ordering });
    const res = await api.get("/api/account-holdings/", { params });
    return res.data;
}

/**
 * POST /api/account-holdings/
 * Creates a holding for the authenticated user's account.
 * Backend will associate the account automatically.
 *
 * payload: { stockId: number, currentlyHeld: boolean, quantity?: string|number }
 */
export async function createHolding({ stockId, currentlyHeld, quantity } = {}) {
    const payload = cleanParams({
        stock: stockId,
        currentlyHeld,
        quantity,
    });
    const res = await api.post("/api/account-holdings/", payload);
    return res.data;
}

/**
 * PATCH /api/account-holdings/:id/
 * Partial update (e.g. toggle currentlyHeld, update quantity)
 */
export async function updateHolding(id, { currentlyHeld, quantity } = {}) {
    if (!id) {
        throw new Error("updateHolding requires id");
    }
    const payload = cleanParams({ currentlyHeld, quantity });
    const res = await api.patch(`/api/account-holdings/${id}/`, payload);
    return res.data;
}

/**
 * DELETE /api/account-holdings/:id/
 */
export async function deleteHolding(id) {
    if (!id) {
        throw new Error("deleteHolding requires id");
    }
    await api.delete(`/api/account-holdings/${id}/`);
}
