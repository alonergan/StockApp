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