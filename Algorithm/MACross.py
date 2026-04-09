"""
A simple moving average crossover strategy
1) 20-period short MA vs 50-period long MA
2) Buy if short MA crosses above long MA and price is above long MA
3) 5% stop loss
4) Only show top 3 stocks from NASDAQ100 and QQQ
"""
import pandas as pd
import yfinance as yf
import csv
import os

#Get list of tickers from nasdaq100 and invesco qqq 
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'ticker_list.csv')

start_date = "2024-01-01"
end_date = "2026-03-31"
initial_cash = 10000 #Starting capital 
stop_loss_pct = 0.05  # 5% stop loss

#Getting tickers from csv
tickers = []
with open(csv_path, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        tickers.append(row['Ticker'])

#Get top 3 stocks
scan_results = []

#download historical data for back testing
for ticker in tickers:
    data = yf.download(ticker, start=start_date, end=end_date, progress=False)

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    if data.empty or len(data) < 50:
        continue

    #calculate moving averages and momentum
    data['MA_short'] = data['Close'].rolling(20).mean()
    data['MA_long'] = data['Close'].rolling(200).mean()

    #scoring based on trend and momentum
    trend = float(data['MA_short'].iloc[-1] - data['MA_long'].iloc[-1])
    momentum = float(data['Close'].iloc[-1] - data['Close'].iloc[-20])
    score = trend + momentum

    #store results
    scan_results.append({"Ticker": ticker, "Score": score})

scan_df = pd.DataFrame(scan_results) #Create DataFrame from scan results

top_stocks = scan_df.sort_values(by="Score", ascending=False).head(3)
print("*** The Top 3 Stocks ***")
print(top_stocks.to_string(index=False))

# Backtest 
final_results = []

for ticker in top_stocks['Ticker']:
    print(f"\n*** Trading {ticker} ***\n")

    data = yf.download(ticker, start=start_date, end=end_date, progress=False)
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    data['MA_short'] = data['Close'].rolling(20).mean()
    data['MA_long'] = data['Close'].rolling(50).mean()

    #Buy signals
    data['Signal'] = 0
    data.loc[data['MA_short'] > data['MA_long'], 'Signal'] = 1
    data.loc[data['MA_short'] < data['MA_long'], 'Signal'] = -1
    data['Position'] = data['Signal'].diff()
    data['Trend'] = data['MA_long'] > data['MA_long'].shift(10)

    #initialize trading variables to 0
    cash = initial_cash
    shares = 0
    buy_price = 0

    total_profit = 0
    wins = 0
    losses = 0

    for date, row in data.iterrows():
        price = float(row['Close'])

        #stop loss 
        if shares > 0 and price <= buy_price * (1 - stop_loss_pct):
            sell_value = shares * price
            trade_profit = sell_value - (shares * buy_price)
            pct = (price - buy_price) / buy_price * 100

            print(f"{date.date()} → stop loss sell at ${price:.2f} | P/L: ${trade_profit:.2f} ({pct:.2f}%)")
            total_profit += trade_profit
            if trade_profit > 0:
                wins += 1
            else:
                losses += 1
            cash = sell_value
            shares = 0
            continue

        #Buy signal
        if row['Position'] == 2 and row['Trend'] and cash > 0:
            shares = cash / price
            buy_price = price
            cash = 0
            print(f"{date.date()} → BUY at ${price:.2f}")

        #Sell signal
        elif row['Position'] == -2 and shares > 0:
            sell_value = shares * price
            trade_profit = sell_value - (shares * buy_price)
            pct = (price - buy_price) / buy_price * 100
            print(f"{date.date()} → SELL at ${price:.2f} | P/L: ${trade_profit:.2f} ({pct:.2f}%)")
            total_profit += trade_profit
            if trade_profit > 0:
                wins += 1
            else:
                losses += 1
            cash = sell_value
            shares = 0

    final_value = cash + shares * data['Close'].iloc[-1]
    profit = final_value - initial_cash
    return_pct = (profit / initial_cash) * 100

    final_results.append({
        "Ticker": ticker,
        "Final Value": round(final_value, 2),
        "Profit": round(profit, 2),
        "Return (%)": round(return_pct, 2),
        "Wins": wins,
        "Losses": losses
    })

results_df = pd.DataFrame(final_results)

print("\n*** Backtest Results ***\n")
print(results_df.to_string(index=False))
