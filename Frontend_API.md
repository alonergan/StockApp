# StockApp Frontend API Documentation

## READ Backend_API.md FIRST

This document describes how the frontend should interact with the Django backend using the wrapper files located in:

1. src/api/holdings.js  
2. src/api/stockPrices.js  
3. src/api/trades.js  

These wrapper files act as a structured interface between React components and the backend API.

React components should not call axios directly or hardcode API URLs.

---

# Architecture Overview

All backend communication should go through:

- src/api/client.js (axios instance)
- Then through the specific wrapper file

Example (Correct):

- import { getHoldings } from "../api/holdings";
- const data = await getHoldings({ currentlyHeld: true });

Incorrect:

- await axios.get("/api/account-holdings/?currentlyHeld=true");

---

# holdings.js

Handles user account holdings. Front end should only need the getters. Setting and updates 
will be done by the algorithm

All routes require authentication.

---

## getCurrentHoldings()

GET /api/account-holdings/current/

Returns all holdings where currentlyHeld = true for the authenticated user.

Usage:

const holdings = await getCurrentHoldings();

Returns:

[
  {
    id,
    account,
    stock,
    ticker,
    stockName,
    quantity,
    currentlyHeld
  }
]

---

## getHoldings(options)

GET /api/account-holdings/

Optional Filters:

- currentlyHeld (boolean)
- stockId (number)
- ordering (string)

Example:

await getHoldings({ currentlyHeld: true });
await getHoldings({ stockId: 1 });
await getHoldings({ ordering: "id" });

---

# stockPrices.js

Handles stock price historical data queries.

Public endpoint (no authentication required)

---

## getStockPrices(options)

GET /api/stock-prices/

Query Parameters:

- ticker (preferred)
- stockId (internal DB id)
- start (ISO datetime)
- end (ISO datetime)
- ordering (default "timeStamp")

Examples:

await getStockPrices({ ticker: "AAPL" });

await getStockPrices({
  ticker: "AAPL",
  start: "2024-01-01T00:00:00Z",
  end: "2024-12-31T00:00:00Z"
});

---

## getLatestStockPrice(options)

Returns the most recent stock price for a stock ticker.

Example:

const latest = await getLatestStockPrice({ ticker: "AAPL" });

---

# trades.js

Handles user trade history.

All routes require authentication.

---

## getTrades(options)

GET /api/trades/

Optional Filters:

- stockId
- method (BUY / SELL)
- start
- end
- ordering (default "-timeStamp")

Examples:

await getTrades();
await getTrades({ method: "BUY" });
await getTrades({ stockId: 1 });

Returns:

[
  {
    id,
    account,
    stock,
    ticker,
    stockName,
    timeStamp,
    price,
    quantity,
    method
  }
]

---

## getTrade(id)

GET /api/trades/:id/

Example:

await getTrade(3);

---

# Folder Structure Reference

src/
  api/
    client.js
    holdings.js
    stockPrices.js
    trades.js
  components/
  pages/
  context/

---