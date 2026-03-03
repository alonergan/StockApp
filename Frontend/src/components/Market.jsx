import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Table } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from '../api/finnhub/stocks';

const { Title, Text } = Typography;

export default function Market() {
    const { me } = useAuth();

    /**
     *  These are your states, they hold the data currently displayed by the component
     */
    const [holdingData, setHoldingData] = useState([]) // This holds all of the current account holdings
    const [stockPriceByTicker, setStockPriceByTicker] = useState({}); // This holds all of the prices for the current account holdings { AAPL: {price, timestamp, ...}, ... }


    /**
     * This will be the main function that runs when the component loads, here I have set it to
     * 1) Load the accounts current holdings
     * 2) Get the latest stock prices for the current holdings
     */
    useEffect(() => {
        async function load() {
            /** 
             * 1) Load the current holdings for the account
             */
            const holdings = await getCurrentHoldings();
            setHoldingData(holdings);

            /**
             * 2) Get the stock prices for each ticker in the current holdings
             */

            // Get an array of tickers from the current holdings
            const tickers = [...new Set(holdings.map((holding) => holding.ticker).filter(Boolean))]; // Array of all the tickers from holdings

            // Call getLatestStockPrice for all elements in array tickers, wait till all responses are received/resolved before continuing (.allSettled)
            const results = await Promise.allSettled(
                tickers.map(async (ticker) => {
                    var result = await getLatestStockPrice(ticker);
                    var price = result.c;
                    return [ticker, price];
                })
            );

            // Now we need to map the data into the state and make sure there are no rejected responses (null or missing data)
            const cleaned = {};
            for (const result of results) {
                if (result.status === "fulfilled") {
                    const [ticker, price] = result.value;
                    cleaned[ticker] = price;
                }
            }

            // Set the state with the ticker price data
            setStockPriceByTicker(cleaned);
        }
        load();
    }, []);

    // This combines the data into a single holding information object with latest prices and quantity we can use to easily display in the table
    const getHoldingsTableRows = useMemo(() => {
        return holdingData.map((holding) => {
            const price = stockPriceByTicker[holding.ticker] !== undefined ? Number(stockPriceByTicker[holding.ticker]) : null;
            const quantity = holding?.quantity !== undefined ? Number(holding.quantity) : null;

            return {
                key: holding.id,
                ticker: holding.ticker,
                quantity: quantity,
                price: price,
                value: price * quantity,
            };
        });
    }, [holdingData, stockPriceByTicker]);

    // This shows how to render the holding table columnsbv
    const getHoldingsTableColumns = [
        { title: "Ticker", dataIndex: "ticker", key: "ticker" },
        {
            title: "Quantity", dataIndex: "quantity", key: "quantity",
            render: (num) => (num === null ? "ERR" : num)
        },
        {
            title: "Current Price", dataIndex: "price", key: "price",
            render: (num) => (num === null ? "ERR" : `$${num.toFixed(2)}`)
        },
        {
            title: "Total Value", dataIndex: "value", key: "value",
            render: (num) => (num === null ? "ERR" : `$${num.toFixed(2)}`)
        }
    ];

    return (
        <Row gutter={[16, 16]}>
            { /* Example card to show table containing the account holdings and their current prices */}
            <Col lg={24}>
                <Card style={{ width: "100%" }} title="Account Holdings">
                    <Table
                        columns={getHoldingsTableColumns}
                        dataSource={getHoldingsTableRows}
                        pagination={false} // We want this to be scrollable
                        size="small"
                        scroll={{ y: 260 }}
                    />
                </Card>
            </Col>
        </Row>
    );
}