import React, { useState, useEffect, useMemo } from "react";
import { Modal, Typography, Spin, Space, Select } from "antd";
import { Line } from '@ant-design/plots';
import { getStockPrice } from '../api/alphaVantage/stocks'

const { Text } = Typography;

function normalizeDailyTimeSeries(res) {
    const series = res?.["Time Series (Daily)"];
    if (!series) return [];

    // Convert to array
    const rows = Object.entries(series).map(([date, d]) => ({
        date: new Date(date),
        open: Number(d["1. open"]),
        high: Number(d["2. high"]),
        low: Number(d["3. low"]),
        close: Number(d["4. close"]),
        volume: Number(d["5. volume"]),
    }));

    // Sort date ascending
    rows.sort((a, b) => a.date - b.date);

    return rows;
}

const filterOptions = [
    { value: "close", label: "Close Price ($)" },
    { value: "open", label: "Open Price ($)" },
    { value: "high", label: "High Price ($)" },
    { value: "low", label: "Low Price ($)" },
    { value: "volume", label: "Volume" },
];

export default function StockInfoModal({ open, ticker, onClose }) {
    const [loading, setLoading] = useState(false);
    const [lineChartData, setLineChartData] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("close");

    useEffect(() => {
        if (!ticker) return;

        async function loadData() {
            setLoading(true);

            // Get stock prices
            const res = await getStockPrice(ticker);

            // Normalize for chart readings
            const normalized = normalizeDailyTimeSeries(res);
            setLineChartData(normalized);

            setLoading(false);
        };

        loadData();
    }, [open, ticker]);

    const selectedLabel = useMemo(
        () => filterOptions.find((o) => o.value === selectedFilter)?.label ?? selectedFilter,
        [selectedFilter]
    );

    const lineChartConfig = useMemo(
        () => ({
            data: lineChartData,
            xField: "date",
            yField: selectedFilter,
            height: 400,
            shapeField: "smooth",

            axis: {
                x: {
                    title: "Date",
                    titleFill: "#fff",
                    labelFill: "#fff",
                    tickStroke: "#fff",
                    lineStroke: "#fff",
                    tickCount: 6,
                    labelAutoHide: true,
                    labelFormatter: (d) => new Date(d).toLocaleDateString("en-US"),
                },
                y: {
                    title: `${selectedLabel}`,
                    titleFill: "#fff",
                    labelFill: "#fff",
                    tickStroke: "#fff",
                    lineStroke: "#fff",
                    tickCount: 5,
                    labelFormatter: (v) => `${Number(v).toFixed(2)}`,
                },
            },
        }),
        [lineChartData, selectedFilter, selectedLabel]
    );

    const getModalTitle = () => {
        return (
            <Space>
                <span>{ticker ? `${ticker} details - ` : "Stock details"}</span>
                <Select
                    value={selectedFilter}
                    options={filterOptions}
                    onChange={setSelectedFilter}
                    style={{ width: 160 }}
                />
            </Space>
        );
    }

    return (
        <Modal
            title={getModalTitle()}
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width="90%"
        >
            <Spin spinning={loading}>
                {open && <Line {...lineChartConfig} />}
            </Spin>
        </Modal>
    );
}