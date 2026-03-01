import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import React, { useEffect,useState } from "react";
import { createRoot } from "react-dom/client";
import { AgCharts } from "ag-charts-react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from '../api/stockPrices';

import { AllCommunityModule, ModuleRegistry, LegendModule, CategoryAxisModule,
        LineSeriesModule, NumberAxisModule} from "ag-charts-community";

ModuleRegistry.registerModules([AllCommunityModule, CategoryAxisModule, LegendModule,LineSeriesModule,NumberAxisModule]);
const { Title, Text} = Typography;

const LineChart = () => {
  const [options, setOptions] = useState({
    // Data: Data to be displayed in the chart
    data: [
      { month: "Jan", deposit:   0,   Total: 10000 },
      { month: "Feb", deposit:  63,   Total: 10600 },
      { month: "Mar", deposit:  200,  Total: 10830 },
      { month: "Apr", deposit:  100,  Total: 10200 },
      { month: "Jun", deposit:  150,  Total: 10500 },
      { month: "Jul", deposit:  150,  Total: 11540 },
      { month: "Aug", deposit:  300,  Total: 13540 },
      { month: "Sep", deposit: 1000,  Total:  9500 },
      { month: "Oct", deposit:  500,  Total:  9500 },
      { month: "Nov", deposit:  150,  Total: 10200 },
      { month: "Dec", deposit:  200,  Total: 11500 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: "line", xKey: "month", yKey: "Total" }],
  });
  return <AgCharts options={options} />;
};

const LineStock = () => {
  const [options, setOptions] = useState({
    // Data: Data to be displayed in the chart
    data: [
      { month: "Jan", Total: 100 },
      { month: "Feb", Total: 104 },
      { month: "Mar", Total: 120 },
      { month: "Apr", Total: 115 },
      { month: "Jun", Total: 120 },
      { month: "Jul", Total: 120 },
      { month: "Aug", Total: 125 },
      { month: "Sep", Total: 120 },
      { month: "Oct", Total: 116 },
      { month: "Nov", Total: 115 },
      { month: "Dec", Total: 110 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: "line", xKey: "month", yKey: "Total" }],
  });
  return <AgCharts options={options} />;
};

const BarChart = () => {
  const [options, setOptions] = useState({
    // Data: Data to be displayed in the chart
    data: [
      { month: "Jan", profit: -12 },
      { month: "Feb", profit: 537 },
      { month: "Mar", profit: -3 },
      { month: "Apr", profit: -20 },
      { month: "May", profit: -500 },
      { month: "Jun", profit: 120 },
      { month: "Jul", profit: -145 },
      { month: "Aug", profit: 45 },
      { month: "Sep", profit: 0 },
      { month: "Oct", profit: 400 },
      { month: "Nov", profit: 234 },
      { month: "Nov", profit: 40 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: "bar", xKey: "month", yKey: "profit" }],
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
                <Card style={{ width: "100%"}} title="Investing">
                    <div style={{ height: 320 }}>
                        <LineChart />
                    </div>
                </Card>
                </Col>
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Profits/Loss">
                    <div style={{ height: 320}}>
                        <BarChart />
                    </div>
                </Card>
            </Col>
            <Col lg={16}>
                <Card style={{ width: "100%"}} title="APPL">
                     <div style={{ height: 20}}>  
                        {holdingData.map((h) => (
                        <div key={h.id}>
                            <Text>{h.ticker}: {h.quantity}</Text>
                        </div>
                    ))}
                    </div>
                    <LineStock/>
                </Card> 
            </Col>
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Current Holdings">
                    <div style={{ height: 320}}>
                             {/* This example shows how to list all of the data from the holding array */}
                    {holdingData.map((h) => (
                        <div key={h.id}>
                            <Text>{h.ticker}: {h.quantity}</Text>
                        </div>
                    ))}
                    </div>
                </Card>
            </Col>
                <Col lg={8}>
                <Card style={{ width: "100%" }} title="NFLX">
                    <div style={{ height: 120}}>
                        <p>Quantity: 30</p>
                        <p>Current Price: $195</p>
                        <p>Total Value: ${30*195}</p>
                    </div>
                </Card>
            </Col>   
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="CVX">
                    <div style={{ height: 120}}>
                        <p>Quantity: 30</p>
                        <p>Current Price: $24.75</p>
                        <p>Total Value: ${30*24.75}</p>
                    </div>
                </Card>
            </Col>   
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="AMD">
                    <div style={{ height: 120}}>
                        <p>Quantity: 50</p>
                        <p>Current Price: $70</p>
                        <p>Total Value: ${70*50}</p>
                    </div>
                </Card>
            </Col>   
        
        </Row>
        
    );
}