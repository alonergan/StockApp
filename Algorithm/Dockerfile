FROM tensorflow/tensorflow:2.16.1-gpu

WORKDIR /app

RUN pip install --no-cache-dir scikit-learn pandas

CMD ["python", "quarterly_clusters_model\clustering_algo.py"]