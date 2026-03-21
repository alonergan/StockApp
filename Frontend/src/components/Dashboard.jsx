import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import React, { useEffect, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from "../api/finnhub/stocks";
export default function Dashboard() {
    const [holdingData, setHoldingData] = useState([])
    const [tickers, setTickers] = useState([]);
    const [prices, setPrices] = useState([]);

    //The following will be for collecting our live data from our API
    useEffect(() => {
        async function load() {
            const data = await getCurrentHoldings();
            setHoldingData(data);

            const prices = [];

            for (let i = 0; i < data.length; i++)
            {
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
        <>
            { /* Rows are 24 units wide */ }
            <Row gutter={[16, 16]}>
                { /* Row 1 [Principle, Current Balance, Gains/Losses, Risk Level */ }
                <Col span={7}>
                    <Card style={{ width: "100%" }} title="Principle"/>
                </Col>
                <Col span={7}>
                    <Card style={{ width: "100%" }} title="Current Balance" />
                </Col>
                <Col span={7}>
                    <Card style={{ width: "100%" }} title="Total Gains/Losses" />
                </Col>
                <Col span={3}>
                    <Card style={{ width: "100%" }} title="Risk Level" />
                </Col>

                { /* Row 2 [Account Standings Chart, Holdings Diversity Pie Chart] */ }
                <Col span={16}>
                    <Card style={{ width: "100%", height: "100%" }} title="Account Standings Chart" />
                </Col>

                <Col span={8}>
                    <Card style={{ width: "100%" }} title="Holdings Diversity Pie Chart" />
                </Col>

                { /* Row 3 [Account Holdings Table, Recent Trades Table] */}
                <Col span={12}>
                    <Card style={{ width: "100%" }} title="Account Holdings Table" />
                </Col>
                <Col span={12}>
                    <Card style={{ width: "100%" }} title="Recent Trades Table" />
                </Col>
            </Row>
        </>
    );
}