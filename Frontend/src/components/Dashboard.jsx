import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";

const { Title, Text } = Typography;

export default function Dashboard() {
    const { me } = useAuth();
    return (
        <div>
            <Row>
                <Col span={16}>
                    <Card>
                        <h2>Dashboard Chart Here</h2>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card>
                        <h2>Holdings Here</h2>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}