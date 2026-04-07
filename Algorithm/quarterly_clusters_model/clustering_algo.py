# Author: Danny Lillard
# Date: 2026-04-02
# Desc: Implementation of the NN with cluster features.

import numpy as np
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping
import pandas as pd
import time # to see how long it takes to run the model.

# MAIN

TRAIN_START  = "2019-07-01"
TRAIN_END    = "2021-12-31"   # last training day before test window
# TEST_START   = "2022-01-03"
# TEST_END     = "2022-03-31"
TEST_START   = "2022-04-01"
TEST_END     = "2022-06-30"
 
WINDOW_SIZE  = 90             # number of past days used as input
EPOCHS       = 40
BATCH_SIZE   = 32


def convert_and_cut_date(df: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df[df['timestamp'] >= start_date]
    df = df[df['timestamp'] <= end_date]
    return df


def smooth_data(df: pd.DataFrame) -> pd.DataFrame:
    # smooth the data using a rolling window of 5 days
    raw_close = df.pivot(columns="ticker", values="close",index="timestamp")
    smoothed  = raw_close.rolling(window=5, min_periods=1).mean()
    return smoothed

def build_model(window: int, n_stocks: int) -> Sequential:
    model = Sequential([
        Input(shape=(window, n_stocks)),
        Conv1D(filters=5, kernel_size=3, activation="relu", padding="same"),
        Dropout(0.2),
        LSTM(128, return_sequences=True),
        Dropout(0.2),
        LSTM(64),
        Dropout(0.2),
        Dense(60, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse")
    return model

def build_sequences(series: np.ndarray, window: int):
    """
    Build (X, y) pairs from a 1D scaled series.
    X shape: (n_samples, window, 1)
    y shape: (n_samples)
    """
    X, y = [], []
    for i in range(window, len(series)):
        X.append(series[i - window:i])
        y.append(series[i])
    return np.array(X), np.array(y)

def build_sequences_multivariate(data: np.ndarray, target_col: int, window: int):
    """
    Build (X, y) pairs from a 2D array of shape (n_days, n_stocks).
    X shape: (n_samples, window, n_stocks)
    y shape: (n_samples,) — target is a single stock (target_col)
    """
    X, y = [], []
    for i in range(window, len(data)):
        X.append(data[i - window:i, :])  # all stocks as features
        y.append(data[i, target_col])    # only the target stock as label
    return np.array(X), np.array(y)
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
    # export to json
    with open('q2_2022_clustered_signals_and_returns.csv', 'a') as f:
        for item in information:
            f.write(','.join(map(str, item)) + '\n')

df = pd.read_csv("aa_daily_data.csv")

# for testing, only use some stocks
# substocks = ['ACHC', 'AEE', 'HCKT', 'HALO', 'MA','TPC','EARN']
# df = df[df['ticker'].isin(substocks)]

df = convert_and_cut_date(df, TRAIN_START, TEST_END)

df_smoothed = smooth_data(df)

raw_open = df.pivot(columns='ticker',index='timestamp')['open']
raw_close = df.pivot(columns='ticker',index='timestamp')['close']


early_stop = EarlyStopping(monitor='loss', patience=8, restore_best_weights=True)

# FOR TESTING, doing less days
# TEST_END = "2022-01-07"


clusters_df = pd.read_csv("stock_clusters_precompute_q1_2022.csv")

print(clusters_df)

# testing, seeing if we are using a GPU?
print("TF config:",tf.config.list_physical_devices('GPU'))

start_time = time.time()

# cool, now we have to move the window and retrain the model for each test day in the test window, 
# then compute signals and returns for each day.
for cluster in clusters_df['Cluster'].unique():
    cluster_tickers = clusters_df[clusters_df['Cluster'] == cluster]['Ticker'].tolist()
    print(f"Testing for cluster {cluster} with tickers: {cluster_tickers}...\n")

    for ticker in cluster_tickers:
        ticker_signals_and_returns = []
        print(f"Testing for {ticker}...\n")

        for i, test_date in enumerate(pd.date_range(TEST_START, TEST_END)):
            if test_date not in raw_close.index:
                continue
            
            test_date = test_date.strftime("%Y-%m-%d")

            train_data = df_smoothed[df_smoothed.index < test_date]
            train_data = train_data[train_data.index <= (pd.to_datetime(test_date) - pd.Timedelta(days=WINDOW_SIZE))]
            train_data = train_data[cluster_tickers]

            if len(train_data) < WINDOW_SIZE:
                continue

            # Scale each stock independently
            scalers = {}
            scaled_cols = []
            for cluster_ticker in cluster_tickers:
                s = MinMaxScaler()
                scaled = s.fit_transform(train_data[cluster_ticker].values.reshape(-1, 1)).flatten()
                scalers[cluster_ticker] = s
                scaled_cols.append(scaled)

            # (n_days, n_stocks)
            scaled_matrix = np.column_stack(scaled_cols)

            # target index is the position of the current ticker in the cluster
            target_idx = cluster_tickers.index(ticker)
            X, y = build_sequences_multivariate(scaled_matrix, target_idx, WINDOW_SIZE)

            tf.keras.backend.clear_session()
            model = build_model(WINDOW_SIZE, n_stocks=len(cluster_tickers))
            model.fit(X, y,
                      epochs=EPOCHS,
                      batch_size=BATCH_SIZE,
                      callbacks=[early_stop],
                      verbose=0)

            # Predict
            last_window = scaled_matrix[-WINDOW_SIZE:].reshape(1, WINDOW_SIZE, len(cluster_tickers))
            pred_scaled = model.predict(last_window, verbose=0)[0, 0]
            pred_price  = scalers[ticker].inverse_transform([[pred_scaled]])[0, 0]

            actual_close = raw_close.loc[test_date, ticker]
            actual_open  = raw_open.loc[test_date, ticker]
            prev_close   = raw_close.iloc[raw_close.index.get_loc(test_date) - 1][ticker]

            signal    = trading_signal(prev_close, actual_open, pred_price)
            return_t  = compute_trade_return(signal, actual_open, actual_close)

            ticker_signals_and_returns.append((test_date, ticker, signal, return_t))

            print(f"Predicted: {pred_price:.2f}, Previous Close: {prev_close:.2f}, "
                  f"Actual Open: {actual_open:.2f}, Actual Close: {actual_close:.2f}, "
                  f"Signal: {signal}\n, "
                  f"Return: {return_t:.4f}\n")

        export_signals_and_returns_to_csv(ticker_signals_and_returns)

print("program took", time.time() - start_time, "to run")