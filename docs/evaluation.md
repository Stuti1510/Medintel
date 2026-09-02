# MEDINTEL AI — Evaluation & Experiment Tracking

## Evaluation Protocol
All model evaluations are conducted on an isolated 15% test partition (375 samples) containing 20 stratified classes that was never exposed during vectorizer fitting or model training.

## Test Split Metrics Matrix

| Model Architecture | Model Type | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | Latency | Model Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | Classical ML | 100.00% | 100.00% | 100.00% | 1.0000 | 1.0000 | 0.015 ms | 391.8 KB |
| **Random Forest** | Classical ML | 100.00% | 100.00% | 100.00% | 1.0000 | 1.0000 | 0.693 ms | 2.9 MB |
| **XGBoost** | Classical ML | 99.73% | 99.73% | 99.73% | 0.9973 | 0.9973 | 0.099 ms | 2.0 MB |
| **BioBERT Transformer** | Medical Transformer | 100.00% | 100.00% | 100.00% | 1.0000 | 1.0000 | 4.935 ms | 38.6 MB |

## Experiment Registry
Every training run is timestamped and recorded in `evaluation/experiment_registry.json`, documenting model hyperparameters, training duration, inference latency, and exact test metrics.
