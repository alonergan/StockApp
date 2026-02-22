import { useEffect, useState } from "react";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function App() {
    const [counterValue, setCounterValue] = useState(null);
    const [loading, setLoading] = useState(false);

    async function loadCounter() {
        const res = await fetch(`${baseUrl}/api/counter`);
        const data = await res.json();
        setCounterValue(data.value);
    }

    async function incrementCounter() {
        setLoading(true);

        try {
            const res = await fetch(`${baseUrl}/api/counter/increment/`, {
                method: "POST",
            });

            const data = await res.json();
            setCounterValue(data.value);
        }
        finally {
            setLoading(false);
        }
    }

    async function decrementCounter() {
        setLoading(true);

        try {
            const res = await fetch(`${baseUrl}/api/counter/decrement/`, {
                method: "POST",
            });

            const data = await res.json();
            setCounterValue(data.value);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCounter();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>Counter</h1>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
                {counterValue === null ? "Welcome to StockApp" : counterValue}
            </div>
            <button onClick={incrementCounter} disabled={loading}>
                {"Increment Counter"}
            </button>
            <button onClick={decrementCounter} disabled={loading} style={{ marginLeft: 8 }}>
                {"Decrement Counter"}
            </button>
        </div>
    )
}