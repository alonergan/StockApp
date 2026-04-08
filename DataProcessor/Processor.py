# 1) Connect to Django backend and PostGresql db

# 2) Get current account standings for each account

# 3) Read in the csv file from some kind of shared drive / location

# 4) Parse CSV file into an object which will hold all the tickers and whether or not to trade them

# 5) Loop through each account 
#   - Join the acccount holdings on the csv file tickers into allowed trades
#   - Perform SELLS first on all allowed trades to increase capital
#   - Perform BUYS next on all allowed trades but distribute buys evenly to fill the capital
#       - i.e. If they have $100 and the csv says to trade TSLA, AAPL, NVDA then buy $33.33 of each
#   - For each trade update the holdings in the account holdings table
#   - For each trade record the trade data into the trades table
