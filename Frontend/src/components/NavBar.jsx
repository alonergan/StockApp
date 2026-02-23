import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
    const { me, logout } = useAuth();
    const nav = useNavigate();

    function onLogout() {
        logout();
        nav("/login");
    }

    return (
        <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(17,26,46,0.7)", backdropFilter: "blur(10px)" }}>
            <div className="container" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
                <strong>StockApp</strong>
                <Link to="/dashboard" style={{ color: "var(--text)", textDecoration: "none" }}>Dashboard</Link>
                <Link to="/accounts" style={{ color: "var(--text)", textDecoration: "none" }}>Accounts</Link>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--muted)" }}>{me?.username ?? "Dev"}</span>
                    {me && <button className="btn secondary" onClick={onLogout}>Logout</button>}
                </div>
            </div>
        </header>
    );
}