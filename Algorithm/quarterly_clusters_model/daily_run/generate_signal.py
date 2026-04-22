# Author: Danny Lillard
# Date: 2026-04-08
# Desc: This file generates the signal for the daily run at market open.
import pandas as pd
import requests
import io
import time
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
import os
from azure.storage.blob import BlobServiceClient
from pathlib import Path

# ─────────────────────────────────────────────
# Data loading
# ─────────────────────────────────────────────
load_dotenv(Path(__file__).resolve().parents[3] / "Backend" /".env")
currentDate = date.today().strftime("%m%d%Y")

def api_call(function, symbol, api_key):
    url = f'https://www.alphavantage.co/query?function={function}&symbol={symbol}&apikey={api_key}&datatype=csv&outputsize=full'
    r = requests.get(url)
    data = r.text
    # add ticker symbol to each line of data that is not the header
    data = data.splitlines()
    # header = data[0]
    data = [f'{symbol},{line}' for line in data]

    df = pd.read_csv(io.StringIO(r.text))
    df['symbol'] = symbol
    return df

def load_data(api_key: str, clusters: str) -> pd.DataFrame:
    print("Loading data from API for stocks in clusters...")
    clusters_df = pd.read_csv(clusters)
    stock_list = clusters_df['Ticker'].unique().tolist()
    frames = []
    for stock in stock_list:
        stock_data = api_call('GLOBAL_QUOTE', stock, api_key)
        frames.append(stock_data)
        time.sleep(0.81) # sleep for 0.81 seconds to avoid hitting

    df = pd.concat(frames, ignore_index=True)
    return df

# ─────────────────────────────────────────────
# TRADING SIGNALS
# ─────────────────────────────────────────────
def trading_signal(prev_close: float, open_t: float, predicted: float) -> str:
    """
    Buy  if prev_close < predicted AND open_t < predicted
    Sell if prev_close > predicted AND open_t > predicted
    """
    if prev_close < predicted and open_t < predicted:
        return "BUY"
    elif prev_close > predicted and open_t > predicted:
        return "SELL"
    return "HOLD"

def compute_trade_return(signal: str, open_t: float, close_t: float) -> float:
    if signal == "BUY":
        return (close_t - open_t) / open_t
    elif signal == "SELL":
        return (open_t - close_t) / open_t
    return 0.0

def export_signals_and_returns_to_csv(information):
    print(f"Exporting signals for {currentDate} to CSV...")
    # export to json
    with open(f'Trade_Signals_{currentDate}.csv', 'a') as f:
        f.write('timestamp,ticker,signal\n')
        for item in information:
            f.write(','.join(map(str, item)) + '\n')

# ─────────────────────────────────────────────
# FUNCTION TO UPLOAD THE GENERATED SIGNALS TO AZURE BLOB STORAGE
# ─────────────────────────────────────────────
def upload_signals_to_blob():    
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    container_name = os.getenv("ALGO_SIGNAL_CONTAINER")

    BASE_DIR = Path(__file__).resolve().parents[3]
    file_path = BASE_DIR / "Algorithm" / "quarterly_clusters_model" / "daily_run" / f"Trade_Signals_{currentDate}.csv"

    if not conn_str:
        print("Missing AZURE_STORAGE_CONNECTION_STRING")
        return

    print("Connecting to Azure Blob Storage...")

    try:
        client = BlobServiceClient.from_connection_string(conn_str)
        container_client = client.get_container_client(container_name)

        #Uploading CSV to blob storage    
        blob_name = f"Trade_Signals_{currentDate}.csv"
        blob_client = container_client.get_blob_client(blob_name)
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        print("\n New Signal csv uploaded successfully!")

    except Exception as e:
        print("\nCould not upload to Azure Blob Storage")
        print(e)

# we need to do the following steps:
# 1. Load the predictions for today.
# 2. Load the stock data for today. (open price is all we need)
# 3. For each stock, compute the trading signal based on the predicted price and the open price.

# 1
date_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
predictions_df = pd.read_csv(f'Predictions_{date_str}.csv')
#predictions_df = pd.read_csv('Predictions_2026-04-16.csv')

# 2
api_key = 'K95O6J38RTNG8IRS'
open_prices_df = load_data(api_key, '../cluster_results/stock_clusters_precompute_q1_2026.csv')

open_prices_df = open_prices_df[['symbol', 'open']]
open_prices_df.rename(columns={'symbol': 'ticker'}, inplace=True)

# 3
full_df = pd.merge(predictions_df, open_prices_df, on='ticker')

print(full_df)

signals = []
for test_date, ticker in full_df[['timestamp', 'ticker']].values:
    open_price = full_df[(full_df['timestamp'] == test_date) & (full_df['ticker'] == ticker)]['open'].values[0]
    prev_close = full_df[(full_df['timestamp'] == test_date) & (full_df['ticker'] == ticker)]['prev_close'].values[0]
    pred_price = full_df[(full_df['timestamp'] == test_date) & (full_df['ticker'] == ticker)]['predicted_close'].values[0]
    signal = trading_signal(prev_close, open_price, pred_price)
    signals.append((test_date, ticker, signal))

print(signals)

export_signals_and_returns_to_csv(signals)
upload_signals_to_blob()