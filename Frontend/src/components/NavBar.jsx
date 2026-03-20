import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, Button, Typography, Space, Layout, Avatar, Dropdown } from "antd"
import { DashboardOutlined, WalletOutlined, BankOutlined, LogoutOutlined, LoginOutlined, DollarOutlined, UserOutlined } from "@ant-design/icons";

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
        { key: "/trades", icon: <DollarOutlined />, label: "Trades"},
        { key: "/market", icon: <BankOutlined />, label: "Market" },
    ];

    const accountMenuItems = [
        { key: "account-overview", icon: <UserOutlined />, label: "Account Overview" },
        { type: "divider", },
        { key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true, },
    ];

    const selectedKeys = navBarItems
        .filter((item) => location.pathname.startsWith(item.key))
        .map((item) => item.key);

    function handleAccountMenuClick({ key }) {
        if (key === "account-overview") nav("/account");
        if (key === "logout") onLogout();
    }


    return (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        color: "white",
                        fontWeight: 700,
                        fontSize: 18,
                        marginRight: 24,
                        whiteSpace: "nowrap",
                    }}
                >
                    Stock App
                </div>

                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={navBarItems}
                    selectedKeys={selectedKeys}
                    onClick={({ key }) => nav(key)}
                    style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
                />
            </div>

            <Space size="middle" style={{ marginLeft: 16 }}>
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                    {me?.username ?? "Dev"}
                </Text>

                {me ? (
                    <Dropdown
                        menu={{
                            items: accountMenuItems,
                            onClick: handleAccountMenuClick,
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Avatar
                            icon={<UserOutlined />}
                            style={{ cursor: "pointer" }}
                        />
                    </Dropdown>
                ) : (
                    <Avatar
                        icon={<LoginOutlined />}
                        style={{ cursor: "pointer" }}
                        onClick={() => nav("/login")}
                    />
                )}
            </Space>
        </Header>
    );
}