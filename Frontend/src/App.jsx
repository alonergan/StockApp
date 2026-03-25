import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Account from "./components/Account";
import NavBar from "./components/NavBar";
import { useAuth } from "./context/AuthContext";
import { Layout, theme } from "antd";
import React from "react";
import Market from "./components/Market";
import { MarketProvider } from "./context/MarketContext";
import Trades from "./components/Trades"

// Bypass environment rule to allow us to not use login for development
const BYPASS_AUTH = true; // import.meta.env.VITE_BYPASS_AUTH === "true";

const { Header, Content } = Layout;

function PublicLayout() {
    const { token } = theme.useToken();
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Content style={{ padding: 16, background: token.colorBgLayout }}>
                <Outlet />
            </Content>
        </Layout>
    );
}

function ProtectedLayout() {
    const { me } = useAuth();

    if (!BYPASS_AUTH && !me) return <Navigate to="/login" replace />;

    const { token } = theme.useToken();

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Header style={{ paddingInline: 16 }}>
                <NavBar />
            </Header>

            <Content style={{ padding: 16, background: token.colorBgLayout }}>
                <Outlet />
            </Content>
        </Layout>
    );
}

export default function App() {
    return (
        <MarketProvider>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                <Route element={<ProtectedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/trades" element={<Trades />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </MarketProvider>
    );
}