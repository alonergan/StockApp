export default function AuthShell({ title, children, footer }) {
    return (
        <div style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 16 }}>
            <div className="card" style={{ width: "100%", maxWidth: 420, padding: 20 }}>
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h2>
                {children}
                {footer && <div style={{ marginTop: 12, color: "var(--muted)" }}>{footer}</div>}
            </div>
        </div>
    );
}