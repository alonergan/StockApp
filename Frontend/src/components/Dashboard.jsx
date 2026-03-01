import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Table } from "antd";
import React, { useEffect,useState, useMemo } from "react";
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

    /**
     *  These are your states, they hold the data currently displayed by the component
     */
    const [holdingData, setHoldingData] = useState([]) // This holds all of the current account holdings
    const [stockPriceByTicker, setStockPriceByTicker] = useState([]); // This holds all of the prices for the current account holdings { AAPL: {price, timestamp, ...}, ... }


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
                    const price = await getLatestStockPrice({ ticker: ticker });
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
            const latest = stockPriceByTicker[holding.ticker];
            const price = latest?.price !== undefined ? Number(latest.price) : null;
            const quantity = holding?.quantity !== undefined ? Number(holding.quantity) : null;

            return {
                key: holding.id,
                ticker: holding.ticker,
                quantity: quantity,
                price: price,
                value: price * quantity,
                timeStamp: latest?.timeStamp
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

            { /* Example card to show table containing the account holdings and their current prices */ }
            <Col lg={8}>
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