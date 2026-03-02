import { api } from "./client";

export async function getMyAccounts() {
    const res = await api.get("/api/accounts/");
    return res.data;
}

export async function getMyAccount() {
    const data = await getMyAccounts();
    return Array.isArray(data) ? data[0] ?? null : data;
}

export async function deposit(accountId, amount) {
    const res = await api.post(`/api/accounts/${accountId}/deposit/`, { amount });
    return res.data;
}

export async function withdraw(accountId, amount) {
    const res = await api.post(`/api/accounts/${accountId}/withdraw/`, { amount });
    return res.data;
}