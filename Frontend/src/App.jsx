import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import NavBar from "./components/NavBar";
import { useAuth } from "./context/AuthContext";
import { Layout } from "antd";
import React from "react";

// Bypass environment rule to allow us to not use login for development
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

const { Header, Content } = Layout;

function ProtectedLayout() {
    const { me } = useAuth();

    if (!BYPASS_AUTH && !me) return <Navigate to="/login" replace />;

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Header style={{ paddingInline: 16 }}>
                <NavBar />
            </Header>

            <Content style={{ padding: 16 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <Outlet />
                </div>
            </Content>
        </Layout>
    );
}


export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}