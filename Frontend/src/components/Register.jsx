import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "./AuthShell"
import { registerUser } from "../api/auth";

export default function Register() {
    const nav = useNavigate();
    const [form, setForm] = useState({
        username: "",
        password: "",
        startBalance: "1000.00",
        riskLevel: 1,
        thresholdPercentage: "100.00"
    });
    const [error, setError] = useState("");

    // Sets the registration form fields based on the key and value populated
    function setFormField(key, value) {
        setForm((prop) => ({ ...prop, [key]: value }));
    }

    async function onSubmitForm(e) {
        // TODO
        registerUser(form);
        e.preventDefault();
        nav("/login");
    }

    return (
        <AuthShell
            title="Register"
            footer={
                <div>
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            }
        >
            <form onSubmit={onSubmitForm} style={{ display: "grid", gap: 10 }}>
                <input className="input" placeholder="Username" value={form.username} onChange={(e) => setFormField("username", e.target.value)} />
                <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setFormField("password", e.target.value)} />
                <button className="btn" type="submit">Create account</button>
                {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
            </form>
        </AuthShell>
    );
}