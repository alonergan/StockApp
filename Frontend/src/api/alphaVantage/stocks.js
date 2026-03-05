import axios from 'axios';

const apiKey = "K95O6J38RTNG8IRS";
const baseURL = "https://www.alphavantage.co/query"
const timeFunctionDay = "TIME_SERIES_DAILY";

export const getStockPrice = async (ticker) => {
    const res = await axios.get(`${baseURL}?function=${timeFunctionDay}&symbol=${ticker}&apikey=${apiKey}`)
    console.log(res.data);
    return res.data;
}