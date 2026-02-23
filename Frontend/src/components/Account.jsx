import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Account() {
    const { access } = useAuth();
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        async function load() {
            const res = await api.get("/api/accounts/", {
                headers: { Authorization: `Bearer ${access}` },
            });
            setAccounts(res.data);
        }
        load();
    }, [access]);

    return (
        <div>
            <h2 className="h2">Accounts</h2>
            <pre>{JSON.stringify(accounts, null, 2)}</pre>
        </div>
    );
}