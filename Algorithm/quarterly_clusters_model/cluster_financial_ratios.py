# Author: Danny Lillard
# Date: 2026-04-02
# Desc: we cluster the stocks based on our 10 financial ratios here.



import pandas as pd
import numpy as np
from tslearn.preprocessing import TimeSeriesScalerMeanVariance
from tslearn.clustering import TimeSeriesKMeans
from tslearn.metrics import dtw
import matplotlib.pyplot as plt
from tslearn.clustering import silhouette_score

ratios_df = pd.read_csv('all_stock_ratios.csv')

ratios = ratios_df.columns[2:].to_list()

# for testing, only use some stock(s)
# ratios_df = ratios_df[ratios_df['Ticker'].isin(['UE','HALO', 'ACHC', 'AEE', 'HCKT', 'MA',''])]
# ratios_df = ratios_df[ratios_df['Ticker'].isin(['UE','HALO', 'ACHC'])]
# ratios_df = ratios_df[ratios_df['Ticker'].isin(ratios_df['Ticker'].unique()[:68])]

# if there are stocks without all the dates, remove that stock
ratios_df = ratios_df.groupby('Ticker').filter(lambda x: len(x) == 58)

#reducing the number of colummns
# first two are not ratios. 
cols_to_remove = ['dividend_per_share','relative_price_evolution']
ratios_df = ratios_df.drop(columns=cols_to_remove)

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

X_scaled_ts = TimeSeriesScalerMeanVariance().fit_transform(X_numpy)

output_list = []

# currently testing each ratio independently.
# for ratio in ratios:
#     for num_clusters in range(2, 31):
#         model = TimeSeriesKMeans(n_clusters=num_clusters, metric="dtw", max_iter=400, random_state=42)
#         labels = model.fit_predict(X_scaled_ts[:,:,columns.index(ratio)])
#         # model = TimeSeriesKMeans(n_clusters=num_clusters, metric="dtw", max_iter=100, random_state=42)

#         output_list.append({
#             'Ratio': ratio,
#             'Num Clusters': num_clusters,
#             'Silhouette Score': float(silhouette_score(X_scaled_ts[:,:,columns.index(ratio)], labels, metric="dtw"))
#         })

#         print(f"Ratio: {ratio}, Num Clusters: {num_clusters}, Silhouette Score: {float(silhouette_score(X_scaled_ts[:,:,columns.index(ratio)], labels, metric='dtw'))}")

#         # export the stock tickers and their cluster labels to a csv
#         # pd.concat([output_df,concat_df], ignore_index=True)

#         # print(output_list)

#     # save to csv

for num_clusters in range(2, 31):
        model = TimeSeriesKMeans(n_clusters=num_clusters, metric="dtw", max_iter=100, random_state=42)
        labels = model.fit_predict(X_scaled_ts)
        # model = TimeSeriesKMeans(n_clusters=num_clusters, metric="dtw", max_iter=100, random_state=42)

        output_list.append({
            'Num Clusters': num_clusters,
            'Silhouette Score': float(silhouette_score(X_scaled_ts, labels, metric="dtw"))
        })

        print(f"Num Clusters: {num_clusters}, Silhouette Score: {float(silhouette_score(X_scaled_ts, labels, metric='dtw'))}")

        # export the stock tickers and their cluster labels to a csv
        # pd.concat([output_df,concat_df], ignore_index=True)

        # print(output_list)

    # save to csv
print(f"Saving results for whole model to csv...")
output_df = pd.DataFrame(output_list)
output_df.to_csv('q1_2022_stock_clusters_v2.csv', index=False)
    
# sz = 58 # number of months

# for yi in range(num_clusters):
#     plt.subplot(3, 3, 7 + yi)
#     for xx in X_numpy[labels == yi]:
#         plt.plot(xx.ravel(), "k-", alpha=.2)
#     plt.plot(model.cluster_centers_[yi].ravel(), "r-")
#     plt.xlim(0, sz)
#     plt.ylim(-4, 4)
#     plt.text(0.55, 0.85,'Cluster %d' % (yi + 1),
#              transform=plt.gca().transAxes)
#     if yi == 1:
#         plt.title("DTW $k$-means")

# plt.tight_layout()
# plt.show()