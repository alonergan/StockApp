import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Account from "./components/Account";
import NavBar from "./components/NavBar";
import { useAuth } from "./context/AuthContext";

// Bypass environment rule to allow us to not use login for development
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

function ProtectedLayout() {
    const { me } = useAuth();

    if (!BYPASS_AUTH && !me) return <Navigate to="/login" replace />;

    return (
        <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
            <NavBar />
            <div style={{ padding: 16 }}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/accounts" element={<Account />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
}


export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
    );
}