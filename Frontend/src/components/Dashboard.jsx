import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import React, { useEffect, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from "../api/finnhub/stocks";
import '../Table.css';

import {
    AllCommunityModule, ModuleRegistry, LegendModule, CategoryAxisModule,
    LineSeriesModule, NumberAxisModule
} from "ag-charts-community";

ModuleRegistry.registerModules([AllCommunityModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const { Title, Text } = Typography;

//Line Chart for Current Ammount investing, currently only static data
const LineChart = () => {
    const [options, setOptions] = useState({
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
        series: [{ type: "line", xKey: "month", yKey: "Total" }],
    });
    return <AgCharts options={options} />;
};

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

    const headers = [
        {
        id: 1,
        KEY: "TICKER",
        LABEL: "Ticker",
        },
        {
        id: 2,
        KEY: "QUANTITY",
        LABEL: "Quantity",
        },
        {id: 3,
        KEY: "CURRENT_PRICE",
        LABEL: "Current Price",
        },
        {id: 4,
        KEY: "TOTAL_VALUE",
        LABEL: "Total Value",
        },

    ];

    const data = [
        {
            ID: 1,
            TICKER: tickers[0],
            QUANTITY: holdingData[0]?.quantity? Number(holdingData[0].quantity).toFixed(0): null,
            CURRENT_PRICE: prices[0] != null? `$${prices[0].toFixed(2)}`: "ERR",
            TOTAL_VALUE: prices[0] != null && holdingData[0]?.quantity != null? `$${(holdingData[0].quantity * prices[1]).toFixed(2)}`: "ERR"
        },
             {
            ID: 2,
            TICKER: tickers[1],
            QUANTITY: holdingData[1]?.quantity? Number(holdingData[1].quantity).toFixed(0): null,
            CURRENT_PRICE: prices[1] != null? `$${prices[1].toFixed(2)}`: "ERR",
            TOTAL_VALUE: prices[1] != null && holdingData[1]?.quantity != null? `$${(holdingData[1].quantity * prices[1]).toFixed(2)}`: "ERR"
        },
             {
            ID: 3,
            TICKER: tickers[2],
            QUANTITY: holdingData[2]?.quantity? Number(holdingData[2].quantity).toFixed(0): null,
            CURRENT_PRICE: prices[2] != null? `$${prices[2].toFixed(2)}`: "ERR",
            TOTAL_VALUE: prices[2] != null && holdingData[2]?.quantity != null? `$${(holdingData[2].quantity * prices[1]).toFixed(2)}`: "ERR"
        },
             {
            ID: 3,
            TICKER: tickers[3],
            QUANTITY: holdingData[3]?.quantity? Number(holdingData[3].quantity).toFixed(0): null,
            CURRENT_PRICE: prices[3] != null? `$${prices[3].toFixed(2)}`: "ERR",
            TOTAL_VALUE: prices[3] != null && holdingData[3]?.quantity != null? `$${(holdingData[3].quantity * prices[1]).toFixed(2)}`: "ERR"
        },
    ]
            
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