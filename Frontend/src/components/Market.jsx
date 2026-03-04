import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Table, Spin } from "antd";
import React, { useEffect, useMemo } from "react"; 
import { useMarket } from "../context/MarketContext";

const { Title, Text } = Typography;

export default function Market() {
    const {
        tickers,
        stockPriceByTicker,
        loading,
        loadMarket,
    } = useMarket();

    useEffect(() => {
        if (Object.keys(stockPriceByTicker).length === 0) {
            loadMarket();
        }
    }, [stockPriceByTicker, loadMarket]);
    
    // This combines the data into a single holding information object with latest prices and quantity we can use to easily display in the table
    const holdingsTableRows = useMemo(() => {
        return tickers.map((ticker) => {
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
                previousClose: data?.previousClose ?? null,
            };
        });
    }, [tickers, stockPriceByTicker]);

    // columns: use the rows var above
    const holdingsTableColumns = [
        {
            title: "Ticker",
            dataIndex: "ticker",
            key: "ticker",
            defaultSortOrder: "ascend",
            sorter: (a, b) => a.ticker.localeCompare(b.ticker),
        },
        {
            title: "Current Price",
            dataIndex: "price",
            key: "price",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: "Change",
            dataIndex: "change",
            key: "change",
            align: "right",
            render: (num) => {
                if (num == null) return "--";
                const color = num > 0 ? "green" : num < 0 ? "red" : "inherit";
                return (
                    <span style={{ color }}>
                        {num > 0 ? "+" : ""}
                        {num.toFixed(2)}
                    </span>
                );
            },
            sorter: (a, b) => a.change - b.change,
        },
        {
            title: "Percent Change",
            dataIndex: "percentChange",
            key: "percentChange",
            align: "right",
            render: (num) => {
                if (num == null) return "--";
                const color = num > 0 ? "green" : num < 0 ? "red" : "inherit";
                return (
                    <span style={{ color }}>
                        {num > 0 ? "+" : ""}
                        {num.toFixed(2)}%
                    </span>
                );
            },
            sorter: (a, b) => a.percentChange - b.percentChange,
        },
        {
            title: "High Price",
            dataIndex: "highPrice",
            key: "highPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.highPrice - b.lowPrice,
        },
        {
            title: "Low Price",
            dataIndex: "lowPrice",
            key: "lowPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.lowPrice - b.lowPrice,
        },
        {
            title: "Open Price",
            dataIndex: "openPrice",
            key: "openPrice",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.openPrice - b.openPrice,
        },
        {
            title: "Previous Close Price",
            dataIndex: "previousClose",
            key: "previousClose",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.previousClose - b.previousClose,
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            <Col lg={24}>
                <Spin spinning={loading}>
                    <Card style={{ width: "100%", height: "100%" }}>
                        <Table
                            columns={holdingsTableColumns}
                            dataSource={holdingsTableRows}
                            pagination={false} // We want this to be scrollable
                            size="large"
                            scroll={{ y: "100%" }}
                        />
                    </Card>
                </Spin>
            </Col>
        </Row>
    );
}