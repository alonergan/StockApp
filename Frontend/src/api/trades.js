import { api } from "./client";

export function getTrades({ stockId, method, start, end, ordering = "-timeStamp" } = {}) {
    return api.get("/api/trades/", {
        params: { stock: stockId, method, start, end, ordering },
    }).then(r => r.data);
}