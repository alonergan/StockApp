import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Table } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from '../api/finnhub/stocks';

const { Title, Text } = Typography;

const tickers = [
    "AAPL",   // Apple
    "MSFT",   // Microsoft
    "GOOGL",  // Alphabet (Class A)
    "AMZN",   // Amazon
    "NVDA",   // NVIDIA
    "META",   // Meta Platforms
    "TSLA",   // Tesla
    "BRK.B",  // Berkshire Hathaway (Class B)
    "JPM",    // JPMorgan Chase
    "JNJ",    // Johnson & Johnson
    "V",      // Visa
    "PG",     // Procter & Gamble
    "XOM",    // Exxon Mobil
    "UNH",    // UnitedHealth Group
    "MA",     // Mastercard
    "HD",     // Home Depot
    "LLY",    // Eli Lilly
    "AVGO",   // Broadcom
    "COST",   // Costco
    "KO"      // Coca-Cola
]

export default function Market() {
    const { me } = useAuth();

    /**
     *  These are your states, they hold the data currently displayed by the component
     */
    const [holdingData, setHoldingData] = useState([]) // This holds all of the current account holdings
    const [stockPriceByTicker, setStockPriceByTicker] = useState({}); // This holds all of the prices for the current account holdings { AAPL: {price, timestamp, ...}, ... }


    useEffect(() => {
        async function load() {
            // Optional: keep if you need it before prices resolve
            setHoldingData(tickers);

            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            const results = [];

            for (let i = 0; i < tickers.length; i++) {
                const ticker = tickers[i];

                try {
                    const result = await getLatestStockPrice(ticker);
                    const price = result?.c;
                    const change = result?.d;
                    const percentChange = result?.dp;
                    const highPrice = result?.h;
                    const lowPrice = result?.l;
                    const openPrice = result?.o;
                    const previousClose = result?.pc;

                    results.push({
                        status: "fulfilled",
                        value: [ticker, price, change, percentChange, highPrice, lowPrice, openPrice, previousClose]
                    });
                } catch (err) {
                    results.push({
                        status: "rejected",
                        reason: err
                    });
                }

                // Space requests 100ms apart (skip delay after last one)
                if (i < tickers.length - 1) {
                    await delay(100);
                }
            }

            const cleaned = {};
            for (const r of results) {
                if (r.status === "fulfilled") {
                    const [ticker, price, change, percentChange, highPrice, lowPrice, openPrice, previousClose] = r.value;
                    if (price != null) {
                        cleaned[ticker] = {
                            price: Number(price),
                            change: change != null ? Number(change) : null,
                            percentChange: percentChange != null ? Number(percentChange) : null,
                            highPrice: highPrice != null ? Number(highPrice) : null,
                            lowPrice: lowPrice != null ? Number(lowPrice) : null,
                            openPrice: openPrice != null ? Number(lowPrice) : null,
                            previousClose: previousClose != null ? Number(previousClose) : null
                        };
                    }
                }
            }
            setStockPriceByTicker(cleaned);
        }

        load();
    }, []);

    // This combines the data into a single holding information object with latest prices and quantity we can use to easily display in the table
    const holdingsTableRows = useMemo(() => {
        return holdingData.map((ticker) => {
            const data = stockPriceByTicker[ticker];

            return {
                key: ticker,
                ticker,
                price: data?.price ?? null,
                change: data?.change ?? null,
                percentChange: data?.percentChange ?? null,
                lowPrice: data?.lowPrice ?? null,
                highPrice: data?.highPrice ?? null,
                openPrice: data?.openPrice ?? null,
                previousClose: data?.previousClose ?? null
            };
        });
    }, [holdingData, stockPriceByTicker]);

    // columns: use the rows var above
    const holdingsTableColumns = [
        { title: "Ticker", dataIndex: "ticker", key: "ticker" },
        {
            title: "Current Price",
            dataIndex: "price",
            key: "price",
            align: "right",
            render: (num) => (num == null ? "..." : `$${num.toFixed(2)}`),
        },
        {
            title: "Change",
            dataIndex: "change",
            key: "change",
            align: "right",
            render: (num) => {
                if (num == null) return "...";
                const color = num > 0 ? "green" : num < 0 ? "red" : "inherit";
                return (
                    <span style={{ color }}>
                        {num > 0 ? "+" : ""}
                        {num.toFixed(2)}
                    </span>
                );
            },
        },
        {
            title: "Percent Change",
            dataIndex: "percentChange",
            key: "percentChange",
            align: "right",
            render: (num) => {
                if (num == null) return "...";
                const color = num > 0 ? "green" : num < 0 ? "red" : "inherit";
                return (
                    <span style={{ color }}>
                        {num > 0 ? "+" : ""}
                        {num.toFixed(2)}%
                    </span>
                );
            },
        },
        {
            title: "Low Price",
            dataIndex: "highPrice",
            key: "highPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
        },
        {
            title: "High Price",
            dataIndex: "lowPrice",
            key: "lowPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
        },
        {
            title: "Open Price",
            dataIndex: "openPrice",
            key: "openPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
        },
        {
            title: "Previous Close Price",
            dataIndex: "previousClose",
            key: "previousClose",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            { /* Example card to show table containing the account holdings and their current prices */}
            <Col lg={24}>
                <Card style={{ width: "100%", height: "100%" }}>
                    <Table
                        columns={holdingsTableColumns}
                        dataSource={holdingsTableRows}
                        pagination={false} // We want this to be scrollable
                        size="large"
                        scroll={{ y: "100%" }}
                    />
                </Card>
            </Col>
        </Row>
    );
}