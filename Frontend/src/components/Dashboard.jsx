import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import React, { useEffect,useState } from "react";
import { createRoot } from "react-dom/client";
import { AgCharts } from "ag-charts-react";
import { getCurrentHoldings } from '../api/holdings';

import { AllCommunityModule, ModuleRegistry, LegendModule, CategoryAxisModule,
        LineSeriesModule, NumberAxisModule} from "ag-charts-community";

ModuleRegistry.registerModules([AllCommunityModule, CategoryAxisModule, LegendModule,LineSeriesModule,NumberAxisModule]);

const { Title, Text } = Typography;

const BarChart = () => {
  const [options, setOptions] = useState({
    // Data: Data to be displayed in the chart
    data: [
      { month: "Jan", avgTemp: 2.3, iceCreamSales: 162000 },
      { month: "Mar", avgTemp: 6.3, iceCreamSales: 302000 },
      { month: "May", avgTemp: 16.2, iceCreamSales: 800000 },
      { month: "Jul", avgTemp: 22.8, iceCreamSales: 1254000 },
      { month: "Sep", avgTemp: 14.5, iceCreamSales: 950000 },
      { month: "Nov", avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: "bar", xKey: "month", yKey: "iceCreamSales" }],
  });
  return <AgCharts options={options} />;
};

const LineChart = () => {
  const [options, setOptions] = useState({
    // Data: Data to be displayed in the chart
    data: [
      { month: "Jan", avgTemp: 2.3, iceCreamSales: 162000 },
      { month: "Mar", avgTemp: 6.3, iceCreamSales: 302000 },
      { month: "May", avgTemp: 16.2, iceCreamSales: 800000 },
      { month: "Jul", avgTemp: 22.8, iceCreamSales: 1254000 },
      { month: "Sep", avgTemp: 14.5, iceCreamSales: 950000 },
      { month: "Nov", avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: "line", xKey: "month", yKey: "iceCreamSales" }],
  });
  return <AgCharts options={options} />;
};

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
               <Col lg={8}>
                <Card style={{ width: "100%" }} title="APPL">
                    <div style={{ height: 120}}>
                        <p>Quantity: 13</p>
                        <p>Current Price: $24.75</p>
                        <p>Total Value: $1081</p>
                    </div>
                </Card>
            </Col>   <Col lg={8}>
                <Card style={{ width: "100%" }} title="AMZN">
                    <div style={{ height: 120}}>
                        <p>Quantity: 13</p>
                        <p>Current Price: $24.75</p>
                        <p>Total Value: $1081</p>
                    </div>
                </Card>
            </Col>   
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="TSLA">
                    <div style={{ height: 120}}>
                        <p>Quantity: 13</p>
                        <p>Current Price: $24.75</p>
                        <p>Total Value: $1081</p>
                    </div>
                </Card>
            </Col>
                <Col lg={16}>
                <Card style={{ width: "100%"}} title="Performance">
                    <div style={{ height: 320 }}>
                        <LineChart />
                    </div>
                </Card>
            </Col>

            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Dividends">
                    <div style={{ height: 320}}>
                        <BarChart />
                    </div>
                </Card>
            </Col>
        </Row>
        
    );
}