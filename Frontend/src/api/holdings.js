import { api } from "./client";

export function getCurrentHoldings() {
    return api.get("/api/account-holdings/current/").then(r => r.data);
}

export function getHoldings({ currentlyHeld, stockId } = {}) {
    return api.get("/api/account-holdings/", {
        params: { currentlyHeld, stock: stockId },
    }).then(r => r.data);
}