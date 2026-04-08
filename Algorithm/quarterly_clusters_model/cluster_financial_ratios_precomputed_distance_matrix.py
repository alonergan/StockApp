# Author: Danny Lillard
# Date: 2026-04-02
# Desc: we cluster the stocks based on our 10 financial ratios here.

import numpy as np
import pandas as pd
from dtaidistance import dtw
from sklearn_extra.cluster import KMedoids
from sklearn.metrics import silhouette_score

def compute_dtw_distance_matrix(X, weights=None):
    """
    X: shape (n_stocks, n_timepoints, n_ratios)
    weights: shape (n_ratios,) — uniform if None
    Returns: (n_stocks, n_stocks) precomputed distance matrix
    """
    n_stocks, n_timepoints, n_ratios = X.shape
    if weights is None:
        weights = np.ones(n_ratios) / n_ratios

    dist_matrix = np.zeros((n_stocks, n_stocks))

    for i in range(n_stocks):
        for j in range(i + 1, n_stocks):
            d = 0.0
            for r in range(n_ratios):
                d += weights[r] * dtw.distance(X[i, :, r], X[j, :, r])
            dist_matrix[i, j] = d
            dist_matrix[j, i] = d

    return dist_matrix


def find_optimal_k(dist_matrix, k_range=range(2, 31)):
    """
    Sweeps k and returns silhouette scores for each k.
    """
    results = {}
    for k in k_range:
        model = KMedoids(n_clusters=k, metric='precomputed', random_state=42)
        labels = model.fit_predict(dist_matrix)
        score = silhouette_score(dist_matrix, labels, metric='precomputed')
        results[k] = score
        print(f"k={k:2d}  silhouette={score:.4f}")
    return results


ratios_df = pd.read_csv('clustering/all_stock_ratios_2021-q1_2026.csv')

# for q2 2026, only use up to q4 2025
ratios_df = ratios_df[ratios_df['fiscalDateEnding'] <= '2025-12-31']

# if there are stocks without all the dates, remove that stock
ratios_df = ratios_df.groupby('Ticker').filter(lambda x: len(x) == 58)

#reducing the number of colummns
# first two are not ratios. 
# Had a poor individual score for q2 2022: net_income_minus_taxes_over_net_income, pretax_non_operating_over_sales, income_to_equity,working_capital_over_sales
cols_to_remove = ['dividend_per_share','relative_price_evolution','net_income_minus_taxes_over_net_income', 'pretax_non_operating_over_sales', 'income_to_equity','working_capital_over_sales']
ratios_df = ratios_df.drop(columns=cols_to_remove)

ratios = ratios_df.columns[2:].to_list()

# all columns except 'Ticker' and 'Date' should be numeric, so we convert them to numeric and coerce errors to NaN
#try to fill with mean, then 0.
ratios_df.replace([np.inf, -np.inf], np.nan, inplace=True)
for col in ratios_df.columns[2:]:
    ratios_df[col] = pd.to_numeric(ratios_df[col], errors='coerce')
    mean_value = ratios_df[col].mean()
    ratios_df[col] = ratios_df[col].fillna(mean_value)
    # there could still be some nan if there is no values.
    ratios_df[col] = ratios_df[col].fillna(0)

print(f"we have the {ratios_df['Ticker'].nunique()} stocks with 58 months of data.")

# remove the 'Date' column
ratios_df = ratios_df.drop(columns=['fiscalDateEnding'])

columns = ratios_df.columns[1:].to_list()

X_numpy = [
    group[columns].to_numpy()
    for _, group in ratios_df.groupby('Ticker')
]

X_numpy = np.stack(X_numpy)


# for ratio in ratios:
#     print(f"Clustering on ratio: {ratio}")
#     # X shape: (n_stocks, n_timepoints, n_ratios)
#     X_ratio = X_numpy[:,:,columns.index(ratio)]
#     dist_matrix = compute_dtw_distance_matrix(X_ratio[:,:,np.newaxis])  # add a dummy ratio dimension
#     scores = find_optimal_k(dist_matrix)

#     # Pick k
#     optimal_k = max(scores, key=scores.get)
#     model = KMedoids(n_clusters=optimal_k, metric='precomputed', random_state=42)
#     labels = model.fit_predict(dist_matrix)


# X shape: (n_stocks, n_timepoints, n_ratios)
dist_matrix = compute_dtw_distance_matrix(X_numpy)
scores = find_optimal_k(dist_matrix)

# Pick k
optimal_k = max(scores, key=scores.get)
model = KMedoids(n_clusters=optimal_k, metric='precomputed', random_state=42)
labels = model.fit_predict(dist_matrix)

# export the stock tickers and their cluster labels to a csv
output_df = pd.DataFrame({
    'Ticker': ratios_df['Ticker'].unique(),
    'Cluster': labels
})
output_df.to_csv('cluster_results/stock_clusters_precompute_q1_2026.csv', index=False)

