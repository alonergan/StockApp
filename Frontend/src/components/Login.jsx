import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./AuthShell"

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            nav("/dashboard");
        } catch {
            setError("Invalid username or password.");
        }
    }

    return (
        <AuthShell
            title="Login"
            footer={
                <div>
                    No account? <Link to="/register">Register</Link>
                </div>
            }
        >
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="btn" type="submit">Sign in</button>
                {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
            </form>
        </AuthShell>
    );
}