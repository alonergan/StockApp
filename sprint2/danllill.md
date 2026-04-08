What you planned to do 
- Algorithm - for training use LSTM models
- Algorithm - implement trading strategy logic

What you did not do 
All goals were accomplished

Issues completed
- Algorithm - for training use LSTM models
- Algorithm - implement trading strategy logic

Files you worked on
In branch: basic_lstm_model
- StockApp/Algorithm/aa_daily_data_pull.ipynb
- StockApp/Algorithm/basic_lstm_no_clusters.ipynb
- StockApp/Algorithm/naive_algo.py

Use of AI and/or 3rd party software
AI was used to understand paper as well as copilot autocomplete.

What you accomplished
I downloaded the alpha advantage historical data for all the stocks we are running the algorithm on.
With this data I set up and trained the naive algorithm, a rolling window LSTM where we train 
on the previous $N$ days for each individual stock.
