import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, Button, Typography, Space, Layout } from "antd"
import { DashboardOutlined, WalletOutlined, BankOutlined, LogoutOutlined, LoginOutlined } from "@ant-design/icons";

const { Header } = Layout
const { Text } = Typography;

export default function NavBar() {
    const { me, logout } = useAuth();
    const nav = useNavigate();
    const location = useLocation();

    function onLogout() {
        logout();
        nav("/login");
    }

    const navBarItems = [
        { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
        { key: "/market", icon: <BankOutlined />, label: "Market" },
        { key: "/accounts", icon: <WalletOutlined />, label: "Account" },
    ];

    const selectedKeys = navBarItems
        .map((i) => i.key)
        .filter((k) => location.pathname.startsWith(k));

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
            <div style={{ color: "white", fontWeight: 700, marginRight: 8 }}>StockApp</div>

            <Menu
                theme="dark"
                mode="horizontal"
                items={navBarItems}
                selectedKeys={selectedKeys.length ? selectedKeys : ["/dashboard"]}
                onClick={({ key }) => nav(key)}
                style={{ flex: 1, minWidth: 0 }}
            />

            <Space>
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>{me?.username ?? "Dev"}</Text>
                {me ? (
                    <Button icon={<LogoutOutlined />} onClick={onLogout}>
                        Logout
                    </Button>
                ) : (
                    <Button icon={<LoginOutlined />} onClick={() => nav("/login")}>
                        Login
                    </Button>
                )}
            </Space>
        </div>
    );
}