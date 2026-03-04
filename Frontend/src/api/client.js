import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Intercept requests and add JWT token
api.interceptors.request.use((config) => {
    const access = localStorage.getItem("access");
    if (access) {
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
        throw new Error("No refresh token");
    }

    const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/token/refresh/`,
        { refresh },
        { headers: { "Content-Type": "application/json" } }
    );

    localStorage.setItem("access", res.data.access);
    return res.data.access;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // If no response or not 401, just fail
        if (!error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        // Prevent infinite loops
        if (original._retry) {
            return Promise.reject(error);
        }

        // Do not try to refresh if the refresh endpoint itself failed
        if (original.url?.includes("/api/token/refresh/")) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            return Promise.reject(error);
        }

        original._retry = true;

        try {
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = refreshAccessToken().finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                });
            }

            const newAccess = await refreshPromise;

            // Retry original request with new token
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;

            return api(original);
        } catch (refreshErr) {
            // Refresh failed => log out locally
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            return Promise.reject(refreshErr);
        }
    }
);