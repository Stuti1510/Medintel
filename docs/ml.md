# MEDINTEL AI — Classical Machine Learning Architecture

## Overview
The classical machine learning subsystem provides high-speed, interpretable baseline predictions prior to deep transformer evaluation.

## Models Implemented
1. **Logistic Regression**: L2-regularized linear classifier ($C=2.0$, L-BFGS solver). Test Accuracy: 100.0%, Latency: ~0.015 ms.
2. **Random Forest**: Ensemble of 150 randomized decision trees (max depth 25). Test Accuracy: 100.0%, Latency: ~0.693 ms.
3. **XGBoost**: Extreme Gradient Boosted Trees (120 estimators, depth 6, learning rate 0.1). Test Accuracy: 99.73%, Latency: ~0.099 ms.

## Feature Extraction & Leakage Prevention
- **TF-IDF Vectorizer**: Configured with 2,500 maximum features and $(1, 2)$ n-gram range.
- **Strict Data Partitioning**: Fitted exclusively on the 70% training split (1,750 cases). The 15% test split (375 cases) remains completely untouched until evaluation.
- Feature weights and label encoders are saved under `models/classical/`.
