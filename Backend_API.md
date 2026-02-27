
# StockApp API Documentation (Backend)

## READ THIS FIRST, THEN Frontend_API.md 

Base URL (Local): http://127.0.0.1:8000  
Base URL (Azure): I forget what this is but will update  
All endpoints are under: /api/

Content-Type: application/json

---

## Authentication (JWT)
Were using JSON Web Tokens for this

### Obtain Tokens (Login)
POST /api/token/

Request:
{
  "username": "StockTrader",
  "password": "StrongPass123!"
}

Response:
{
  "refresh": "<refresh_token>",
  "access": "<access_token>"
}

- You want to use the access token as your Bearer, not refresh

---

### Refresh Access Token
POST /api/token/refresh/

Request:
{
  "refresh": "<refresh_token>"
}

Response:
{
  "access": "<new_access_token>"
}

- I added this for the future but we may not need it, might just set the JWT to expire in 24hrs

---

### Auth Header for Protected Endpoints
Authorization: Bearer <access_token>

- ALL ENDPOINTS NOT LISTED AS (Public) REQUIRE JWT
---

## Auth / User

### Register User (Creates a user AND an account)
POST /api/auth/register/

Request:
{
  "username": "StockTrader",
  "password": "StrongPass123!",
  "startBalance": "10000.00",
  "riskLevel": 3,
  "thresholdPercentage": "5.00"
}

- This will create a Django user that allows them to login and it will create an associated account linked to their user account

---

### Current User
GET /api/auth/me/

Response:
{
  "id": 12,
  "username": "StockTrader",
  "accountId": 3
}

---

## Stocks

### List Stocks (Public)
GET /api/stocks/

Response:
[
  {
    "id": 1,
    "ticker": "AAPL",
    "name": "Apple Inc."
  }
]

---

## Stock Prices

### Query Stock Prices (Public)
GET /api/stock-prices/

Optional Query Parameters:
- ticker (string)
- stock (int)
- start (ISO datetime)
- end (ISO datetime)
- ordering (timeStamp, -timeStamp, price, -price) [- means descending]

Example:
/api/stock-prices/?ticker=AAPL&start=2026-01-01T00:00:00Z&end=2026-02-01T00:00:00Z

Response Item:
{
  "id": 10,
  "stock": 1,
  "ticker": "AAPL",
  "price": "123.45",
  "timeStamp": "2026-01-15T17:30:00Z"
}

- All of the query params are optional sending none will return the entire table

---

## Account Holdings (Protected)

### List Holdings
GET /api/account-holdings/

Optional Query Parameters:
- currentlyHeld (true/false)
- stock (int)
- ticker (string)

Response Item:
{
  "id": 5,
  "account": 3,
  "stock": 1,
  "ticker": "AAPL",
  "stockName": "Apple Inc.",
  "currentlyHeld": true
}

---

### Current Holdings Shortcut
GET /api/account-holdings/current/

---

## Trades (Protected)

### List Trades
GET /api/trades/

Optional Query Parameters:
- stock (int)
- method (BUY/SELL)
- start (ISO datetime)
- end (ISO datetime)
- ordering

Response Item:
{
  "id": 22,
  "account": 3,
  "stock": 1,
  "ticker": "AAPL",
  "stockName": "Apple Inc.",
  "timeStamp": "2026-01-15T17:30:00Z",
  "price": "123.45",
  "method": "BUY"
}

---

## Notes

- All protected endpoints return only the authenticated user's account data.
- Datetimes must be ISO 8601 format with timezone (UTC recommended).
- Decimal values (price, balances) are returned as strings.

