import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import { getCurrentHoldings } from '../api/holdings';
import { useEffect, useState } from 'react';


const { Title, Text } = Typography;

export default function Dashboard() {

    const { me } = useAuth();

    const [holdingData, setHoldingData] = useState([])

    useEffect(() => {
        async function load() {
            const data = await getCurrentHoldings();
            setHoldingData(data);
        }
        load();
    }, []);

    return (
        <Row gutter={[16, 16]}>
            <Col lg={16}>
                <Card style={{ width: "100%" }} title="Example All Holdings">
                    {/* This example shows how to list all of the data from the holding array */}
                    {holdingData.map((h) => (
                        <div key={h.id}>
                            <Text>{h.ticker}: {h.quantity}</Text>
                        </div>
                    ))}
                </Card>
            </Col>

            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Holdings">
                    <div>
                    </div>
                </Card>
            </Col>
        </Row>
    );
}