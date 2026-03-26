import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Table, Spin, Statistic, message, Button } from "antd";
import { Pie, Line } from "@ant-design/charts";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from "../api/finnhub/stocks";
import { getMyAccount, getStandings } from "../api/accounts";
import { getTrades } from "../api/trades"
import StockInfoModal from "../components/StockInfoModal";
export default function Dashboard() {
    // Setters
    const { me } = useAuth();
    const [holdingData, setHoldingData] = useState([]);
    const [tickers, setTickers] = useState([]);
    const [prices, setPrices] = useState([]);
    const [standings, setStandings] = useState([]);
    const [account, setAccount] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stockInfoModalOpen, setStockInfoModalOpen] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState(null);

    useEffect(() => {
        async function load() {
            setLoading(true);

            try {
                // Get holdings from django
                const data = await getCurrentHoldings();
                const standings = await getStandings();
                const account = await getMyAccount();
                const trades = await getTrades();

                // Saving holding data and account
                setHoldingData(data);
                setAccount(account);
                setTrades(trades);

                // Mapping array for x and y axis then sorting and setting
                const newLine = standings
                    .map((item) => ({
                        date: new Date(item.timeStamp),
                        balance: Number(item.balance),
                    }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                setStandings(newLine);

                // Temp holder for prices
                const newPrices = [];

                // Loop through each holding
                for (let i = 0; i < data.length; i++) {
                    // Save ticker symbol
                    tickers.push(data[i].ticker);

                    // Fetch latest price for that ticker
                    const price = await getLatestStockPrice(data[i].ticker);

                    //Save ticker price
                    newPrices.push(price.c);
                }

                // Sets price and tickers
                setPrices(newPrices);
                setTickers(tickers);
            } catch (e) {
                message.error("Failed to load account");
                console.log(e);
            } finally {
                setLoading(false);
            }
        }

        load();

    }, [tickers]);

    // Memo to set the color of the gain/loss and risk statistics
    const { gainPct, gainColor, gainPrefix, riskColor } = useMemo(() => {
        if (!account) {
            return {
                gainPct: 0,
                gainColor: undefined,
                gainPrefix: "",
                riskColor: undefined
            };
        }

        const start = Number(account.startBalance);
        const current = Number(standings.at(-1)?.balance);
        const pct = start > 0 ? ((current - start) / start) * 100 : 0;

        const isGain = pct >= 0;
        const gainColorLocal = isGain ? "#52c41a" : "#ff4d4f"; // green / red
        const gainPrefixLocal = isGain ? "+" : "-";

        const risk = Number(account.riskLevel);
        const riskColorLocal =
            risk === 1 ? "#52c41a" : risk === 2 ? "#faad14" : "#ff4d4f"; // green/yellow/red

        return {
            gainPct: Math.abs(pct),
            gainColor: gainColorLocal,
            gainPrefix: gainPrefixLocal,
            riskColor: riskColorLocal,
        };
    }, [account]);

    // Mapping of trade table rows to format the data
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

    // Trade table column style
    const tradeTableColumns = [{
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
        render: (method) => renderTradeMethod(method)
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

    const renderTradeMethod = (method) => {
        if (method == null) return "--";
        const color = method == "BUY" ? "green" : method == "SELL" ? "red" : "inherit";
        return (
            <span style={{ color }} > {method} </span>
        );
    };

    // Build pie data
    const pieChartData = useMemo(() => {
        return holdingData.map((item, index) => {
            // Get price 
            const price = Number(prices[index]);

            //Checking for availability of price
            if (price === undefined || price === null) return null;

            // Ensure quantity is a number 
            const quantity = Number(item.quantity) || 0;

            //Setting value to two decimal places
            const totValue = Math.round(price * quantity * 100) / 100;
            const convertedPrice = Number(price);

            // Return formatted object for chart
            return {
                type: item.ticker,
                price: convertedPrice,
                value: totValue,
                quantity: quantity
            };
        }).filter(Boolean); // remove null entries
    }, [holdingData, prices]);

    // is my pieData available
    const pieDataAvailable = pieChartData.length > 0;

    // Convert pi chart data to use percentages
    const total = pieChartData.reduce((sum, d) => sum + d.value, 0);
    const dataWithPercent = pieChartData.map(d => ({
                ...d,
                percent: d.value / total,
    }));

    // Pie Chart logic and configurations
    const pieChartConfig = useMemo(() => ({
            data: dataWithPercent,
            //Slices shows price * quantity of ticker
            angleField: "value",
            colorField: "type",
            radius: 1,
            innerRadius: 0.6,
            theme: "dark",
            //Shows ticker prices inside pie chart slices
            label: {
                text: (dataWithPercent) => {

                // Dont show labels for small slices
                if (dataWithPercent.percent < 0.05) {
                    return "";
                }

                return `${dataWithPercent.type}\n${(dataWithPercent.percent * 100).toFixed(1)}%`;
            },
            style: {
                fill: "#fff",
            }
        },

            legend: {
                position: "bottom",
            itemName: {
                formatter: (text) => {
                    // get data for tickers
                    const found = pieChartData.find(dataWithPercent => dataWithPercent.type === text);
                    // If no price, set to 0
                    const price = found?.price || 0;
                    // Setting price to two decimal places
                    return `${text} ($${price.toFixed(2)})`;
                },
            style: {
                fill: "#fff",
                },
            },
        },

            tooltip: {
                items: [
                (d) => ({
                        name: d.type,
                        value: `Quantity: ${d.quantity} <br/> Current Price: $${(d.price).toFixed(2)} <br/> Total Value: $${(d.value).toFixed(2)}  <br/> Percentage of Holdings: ${(d.percent * 100).toFixed(2)}%`,
                }),
            ],
        },
    }), [pieChartData]);

    // Configuring Line graph
    const lineChartConfig = useMemo(() => ({
                data: standings,
            xField: "date",
            yField: "balance",
            smooth: true,
            theme: "dark",
            autoFit: true,
            height: 480,
            point: {
                size: 4,
            shape: "circle",
        },
    }), [standings]);

    // Configuring table Data
    const tableData = useMemo(() => {
        return holdingData.map((item, index) => {
            const price = Number(prices[index]) || 0;
            const quantity = Number(item.quantity) || 0;

            return {
                key: item.ticker,
            type: item.ticker,
            quantity,
            price,
            value: Math.round(price * quantity * 100) / 100,
            };
        });
    }, [holdingData, prices]);

    const openStockInfo = useCallback((ticker) => {
        setSelectedTicker(ticker);
        setStockInfoModalOpen(true);
    }, []);

    const closeStockInfo = useCallback(() => {
        setStockInfoModalOpen(false);
    }, []);

    const renderTickerColumn = useCallback(
        (ticker) => (
            <Button type="text" color="primary" onClick={() => openStockInfo(ticker)}>
                {ticker}
            </Button>
        ),
        [openStockInfo]
    );

    // Table Column Formatting
    const tableColumns = useMemo(() => [{
            title: "Ticker",
            dataIndex: "type",
            key: "ticker",
            defaultSortOrder: "ascend",
            align: "left",
            render: (ticker) => renderTickerColumn(ticker),
            sorter: (a, b) => a.type.localeCompare(b.type),
        },
            {
                title: "Shares",
            dataIndex: "quantity",
            align: "right",
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
        },
            {
                title: "Price",
            dataIndex: "price",
            align: "right",
            render: (val) => `$${(val || 0).toFixed(2)}`,
            sorter: (a, b) => (a.price ?? 0) - (b.price ?? 0),
        },
            {
                title: "Value",
            dataIndex: "value",
            align: "right",
            render: (val) => `$${(val || 0).toLocaleString()}`,
            sorter: (a, b) => (a.value ?? 0) - (b.value ?? 0),
        },
    ], []);

    return (
        <>
            <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                    {/* Row 1: Summary cards */}
                    <Col span={8}>
                        <Card style={{ width: "100%" }} title="Principle">
                            <Statistic
                                value={account?.startBalance}
                                precision={2}
                                prefix="$"
                            />
                        </Card>
                    </Col>
                    <Col span={7}>
                        <Card style={{ width: "100%" }} title="Current Balance">
                            <Statistic
                                value={standings.at(-1)?.balance}
                                precision={2}
                                prefix="$"
                            />
                        </Card>
                    </Col>
                    <Col span={3}>
                        <Card style={{ width: "100%" }} title="Gain/Loss">
                            <Statistic
                                value={gainPct}
                                precision={2}
                                suffix="%"
                                valueStyle={{ color: gainColor }}
                                prefix={gainPrefix}
                            />
                        </Card>
                    </Col>
                    <Col span={3}>
                        <Card style={{ width: "100%" }} title="Withdrawal Threshold">
                            <Statistic
                                value={account?.thresholdPercentage}
                                precision={2}
                                suffix="%"
                            />
                        </Card>
                    </Col>
                    <Col span={3}>
                        <Card style={{ width: "100%" }} title="Risk Level">
                            <Statistic
                                value={Number(account?.riskLevel)}
                                valueStyle={{ color: riskColor }}
                            />
                        </Card>
                    </Col>
                    {/* Row 2 */}
                    <Col span={15}>
                        <Card
                            title="Account Standings"
                            style={{ background: "#141414", color: "#fff" }}
                        >
                            <div style={{ width: "100%", height: 480 }}>
                                <Line {...lineChartConfig} />
                            </div>
                        </Card>
                    </Col>
                    <Col span={9}>
                        <Card
                            style={{
                                width: "100%",
                                background: "#141414",
                                color: "#fff",
                            }}
                            title="Holdings Diversity"
                        >
                            {pieDataAvailable ? (
                                <Pie {...pieChartConfig} />
                            ) : (
                                <p style={{ color: "#fff" }}>Loading chart...</p>
                            )}
                        </Card>
                    </Col>
                    {/* Row 3 */}
                    <Col span={12}>
                        <Card
                            style={{ width: "100%", height: "100%" }}
                            title="Account Holdings"
                        >
                            <Table
                                dataSource={tableData}
                                columns={tableColumns}
                                size="large"
                                pagination={{
                                    pageSize: 10,
                                    placement: ["bottomCenter"],
                                }}
                            />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card style={{ width: "100%" }} title="Recent Trades">
                            <Table
                                columns={tradeTableColumns}
                                dataSource={tradeTableRows}
                                size="large"
                                pagination={{
                                    pageSize: 10,
                                    placement: ["bottomCenter"],
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>
            { /* Stock Info Graph Popup */ }
            <StockInfoModal
                open={stockInfoModalOpen}
                ticker={selectedTicker}
                onClose={closeStockInfo}
            />
        </>
    );
}