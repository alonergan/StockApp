import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgCharts } from "ag-charts-react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from "../api/finnhub/stocks";

import {
    AllCommunityModule, ModuleRegistry, LegendModule, CategoryAxisModule,
    LineSeriesModule, NumberAxisModule
} from "ag-charts-community";

ModuleRegistry.registerModules([AllCommunityModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const { Title, Text } = Typography;

const LineChart = () => {
    const [options, setOptions] = useState({
        // Data: Data to be displayed in the chart
        data: [
            { month: "Jan", deposit: 0, Total: 10000 },
            { month: "Feb", deposit: 63, Total: 10600 },
            { month: "Mar", deposit: 200, Total: 10830 },
            { month: "Apr", deposit: 100, Total: 10200 },
            { month: "Jun", deposit: 150, Total: 10500 },
            { month: "Jul", deposit: 150, Total: 11540 },
            { month: "Aug", deposit: 300, Total: 13540 },
            { month: "Sep", deposit: 1000, Total: 9500 },
            { month: "Oct", deposit: 500, Total: 9500 },
            { month: "Nov", deposit: 150, Total: 10200 },
            { month: "Dec", deposit: 200, Total: 11500 },
        ],
        // Series: Defines which chart type and data to use
        series: [{ type: "line", xKey: "month", yKey: "Total" }],
    });
    return <AgCharts options={options} />;
};


export default function Dashboard() {
    const { me } = useAuth();
    const [holdingData, setHoldingData] = useState([])
    const [holdingTickerPrice, setTickerPrice] = useState([]);
    const [tickers, setTickers] = useState([]);
    const [prices, setPrices] = useState([]);

    useEffect(() => {
        async function load() {
            const data = await getCurrentHoldings();
            setHoldingData(data);

            const prices = [];

            for (let i = 0; i < data.length; i++)
            {
            //    console.log(data[i].ticker) ;
                tickers[i]= (data[i].ticker);
                const value = await getLatestStockPrice(data[i].ticker);
                const price = value.c;
                prices[i] = price;

            } 
            setPrices(prices);
            setTickers(tickers);
        }
        load();
    }, []);



  


            
    return (
        <Row gutter={[16, 16]}>
            <Col lg={16}>
                <Card style={{ width: "100%" }} title="Investing">
                    <div style={{ height: 320 }}>
                        <LineChart />
                    </div>
                </Card>
            </Col>
            
            <Col lg={8}>
                <Card style={{ width: "100%" }} title="Current Holdings">
                    <div style={{ height: 320 }}>
                        {/* This example shows how to list all of the data from the holding array */}
                        {holdingData.map((h) => (
                            <div key={h.id}>
                                <Text>{h.ticker} : </Text>
                                <Text>{h.quantity}</Text>
                            </div>
                        ))}
                    </div>
                </Card>
            </Col>
            <Col lg={8}>
                <Card style={{ width: "100%" }} title={tickers[0]}>
                    <div style={{ height: 120 }}>
                        <p>Quantity:{holdingData[0]?.quantity}</p>
                        <p>Current Price: ${prices[0] ? prices[0].toFixed(2) : "ERR"}</p>
                        <p>Total Value: ${prices[0] ? (holdingData[0]?.quantity * prices[0]).toFixed(2) : "ERR"}</p>
                    </div>
                </Card>
            </Col>
            <Col lg={8}>
                <Card style={{ width: "100%" }} title={tickers[1]}>
                    <div style={{ height: 120 }}>
                        <p>Quantity: 30</p>
                        <p>Current Price: ${prices[1] ? prices[1].toFixed(2) : "ERR"}</p>
                        <p>Total Value: ${prices[1] ? (30 * prices[1]).toFixed(2) : "ERR"}</p>
                    </div>
                </Card>
            </Col>
            <Col lg={8}>
                <Card style={{ width: "100%" }} title={tickers[2]}>
                    <div style={{ height: 120 }}>
                        <p>Quantity: 50</p>
                        <p>Current Price: ${prices[2] ? prices[2].toFixed(2) : "ERR"}</p>
                        <p>Total Value: ${prices[2] ? (50 * prices[2]).toFixed(2) : "ERR"}</p>
                    </div>
                </Card>
            </Col>
            
        </Row>

    );
}