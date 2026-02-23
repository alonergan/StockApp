import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginUser } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // States for auth context
    const [access, setAccess] = useState(localStorage.getItem("access") || "");
    const [refresh, setRefresh] = useState(localStorage.getItem("refresh") || "");
    const [me, setMe] = useState(null);

    // Get current user using token
    async function loadMe(token) {
        const user = await getMe(token);
        setMe(user);
    }

    // Log a user in and set JWT tokens
    async function login(username, password) {
        const tokens = await loginUser(username, password);
        setAccess(tokens.access);
        setRefresh(tokens.refresh);
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
        await loadMe(tokens.access);
    }


    // Log user out and remove local token storage
    function logout() {
        setAccess("");
        setRefresh("");
        setMe(null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
    }

    // useEffect to load user when access token is populated
    useEffect(() => {
        if (access && !me) {
            loadMe(access).catch(() => logout());
        }
    }, [access])

    return (
        <AuthContext.Provider value={{ access, refresh, me, login, logout }}>
            { children }
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext);
}