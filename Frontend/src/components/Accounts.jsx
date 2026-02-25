import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Card, Col, Row, Typography, Button, Avatar } from "antd";
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Accounts() {
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
        <Row gutter={[16, 16]}>
            <Col lg={16}>
                <Card style={{ width: "100%" }} title="Account Information">
                    <Avatar shape="square" size={64} icon={<UserOutlined />} />
                    <div style={{ height: 320 }}>
                        Account Info Here: Todo by Aidan
                    </div>
                </Card>
            </Col>
        </Row>
    );
}