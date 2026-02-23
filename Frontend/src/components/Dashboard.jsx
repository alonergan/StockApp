import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { me } = useAuth();
    return (
        <div>
            <h2>Dashboard</h2>
            <p>Welcome, {me?.username}</p>
        </div>
    );
}