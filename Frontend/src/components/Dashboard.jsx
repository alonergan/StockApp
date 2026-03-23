import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button } from "antd";
import { Pie, Line } from "@ant-design/charts"; 
import { useEffect, useState } from "react";
import { getCurrentHoldings } from '../api/holdings';
import { getLatestStockPrice } from "../api/finnhub/stocks";

export default function Dashboard() {

    //holdings 
    const [holdingData, setHoldingData] = useState([]);

    //grabbing tickers
    const [tickers, setTickers] = useState([]);

    //sets prices for tickers
    const [prices, setPrices] = useState([]);

    useEffect(() => {
    async function load() {

    // Get holdings from django
    const data = await getCurrentHoldings();

    // Saving holding data
    setHoldingData(data);

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
        }
        load();
    }, []); 


    // Build pie data
    const pieChartData = holdingData.map((item, index) => {
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
    };

    }).filter(Boolean); // remove null entries

    // is my pieData available
    const pieDataAvailable = pieChartData.length > 0;

    // Pie Chart logic and configurations
    const pieChartConfig = {
        data: pieChartData,
        //Slices shows price * quantity of ticker
        angleField: "value",
        colorField: "type",
        radius: 1,        
        innerRadius: 0.6, 
        theme: "dark",
        //Shows ticker prices inside pie chart slices
        label: {
            text: (data) => 
                `$${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n${data.type}`,
            style: {
                fill: "#fff", 
            },
        },

        legend: {
            position: "bottom",
            itemName: {
            formatter: (text) => {
            // get data for tickers
            const found = pieChartData.find(data => data.type === text);
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
    };

    //simulating 3 monthes of data for Account Balance
    const lineData = [
    { date: "2025-01-02", balance: 10000 },
    { date: "2025-01-15", balance: 11000 },
    { date: "2025-01-22", balance: 11020 },
    { date: "2025-01-28", balance: 12000 },
    { date: "2025-02-12", balance: 12670 },
    { date: "2025-02-20", balance: 13670 },
    { date: "2025-02-30", balance: 12670 },
    { date: "2025-03-04", balance: 11000 },
    { date: "2025-03-15", balance: 12000 },
    { date: "2025-03-25", balance: 15000 },
  ];

  //Configuring Line graph
  const lineChartConfig = {
    data: lineData,
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
  };

    return (
        <>
            <Row gutter={[16, 16]}>
                {/* Row 1: Summary cards */}
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
                {/* Row 2 */}
                  <Col xs={24} lg={16}>
                <Card
                  title="Account Standings Chart"
                  style={{ background: "#141414", color: "#fff" }}
                >
                  <div style={{ width: "100%", height: 480 }}>
                    <Line {...lineChartConfig} />
                  </div>
                </Card>
              </Col>
                <Col span={8}>
                    <Card
                    style={{ width: "100%", background: "#141414", color: "#fff" }}
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
                    <Card style={{ width: "100%" }} title="Account Holdings Table" />
                </Col>
                <Col span={12}>
                    <Card style={{ width: "100%" }} title="Recent Trades Table" />
                </Col>

            </Row>
        </>
    );
}