import { api } from "./client";

export async function registerUser(payload) {
    const res = await api.post("/api/auth/register", payload);
    return res.data;
}

export async function loginUser(username, password) {
    const res = await api.post("/api/token", { username, password })
    return res.data;
}

export async function getMe(access) {
    const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${access}` },
    });
    return res.data;
}