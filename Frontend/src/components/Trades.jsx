import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Table, Spin } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { getTrades } from "../api/trades"

const { Title, Text } = Typography;

export default function Trades() {
    const { me } = useAuth();

    const [loading, setLoading] = useState(false);
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        async function load() {
            setLoading(true);

            const trades = {};
            try {
                const r = await getTrades();
                setTrades(r);
            } catch(err) { console.log(err) }

            setLoading(false);
        }

        load();
    }, []);

    const renderMethod = (method) => {
        if (method == null) return "--";
        const color = method == "BUY" ? "green" : method == "SELL" ? "red" : "inherit";
        return (
            <span style={{ color }}>
                {method}
            </span>
        );
    };

    const tradeTableColumns = [
        {
            title: "TimeStamp",
            dataIndex: "timeStamp",
            key: "timeStamp",
            defaultSortOrder: "descend",
            sorter: (a, b) => new Date(a.timeStamp) - new Date(b.timeStamp),
        },
        {
            title: "Method",
            dataIndex: "method",
            key: "method",
            align: "right",
            sorter: (a, b) => (a.method ?? "").localeCompare(b.method ?? ""),
            render: (method) => renderMethod(method)
        },
        {
            title: "Ticker",
            dataIndex: "ticker",
            key: "ticker",
            align: "right",
            sorter: (a, b) => a.ticker.localeCompare(b.ticker),
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            align: "right",
            render: (num) => (num == null ? "--" : num.toFixed(2)),
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: "Total Value",
            dataIndex: "totalValue",
            key: "totalValue",
            align: "right",
            render: (num) => (num == null ? "--" : `$${num.toFixed(2)}`),
            sorter: (a, b) => a.totalValue - b.totalValue,
        },
    ];

    const tradeTableRows = (trades ?? []).map((trade, i) => {
        const price = trade?.price != null ? Number(trade.price) : null;
        const quantity = trade?.quantity != null ? Number(trade.quantity) : null;
        const wholeTimeStamp = trade?.timeStamp != null ? new Date(trade.timeStamp) : null;
        const timeStamp = `${wholeTimeStamp?.getMonth()}/${wholeTimeStamp?.getDate()}/${wholeTimeStamp?.getFullYear()} - ${wholeTimeStamp?.getHours()}:${wholeTimeStamp?.getSeconds()}`

        return {
            key: trade?.id ?? `${trade?.ticker ?? "t"}-${trade?.timeStamp ?? "ts"}-${i}`,
            timeStamp: timeStamp,
            method: trade?.method ?? null,
            ticker: trade?.ticker ?? null,
            price,
            quantity,
            totalValue: price != null && quantity != null ? price * quantity : null,
        };
    });

    return (
        <Row gutter={[16, 16]}>
            <Col lg={24}>
                <Spin spinning={loading}>
                    <Card style={{ width: "100%", height: "100%" }}>
                        <Table
                            columns={tradeTableColumns}
                            dataSource={tradeTableRows}
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