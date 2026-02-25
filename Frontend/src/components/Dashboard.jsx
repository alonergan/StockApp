import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";

const { Title, Text } = Typography;

export default function Dashboard() {
    const { me } = useAuth();
    return (
        <Row gutter={[16, 16]}>
            <Col lg={16}>
                <Card style={{ width: "100%"}} title="Chart">
                    <div style={{ height: 320 }}>
                        Dashboard Chart Here: Todo by Jay
                    </div>
                </Card>
            </Col>

            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Holdings">
                    <div style={{ height: 320 }}>
                        Holdings Here: Todo by Jay
                    </div>
                </Card>
            </Col>
        </Row>
    );
}