# MEDINTEL AI — Empirical Model Benchmark & Multiclass Evaluation (v2.0)

**Evaluation Date**: `2026-09-03 UTC`  
**Test Set Size**: **1,500 samples** (Held-out from 10,000 population)  
**Dataset Hash**: `bee99ea6e73b263a19402172cd61dc012089e1dccdd2ba13c43d12722e7a988b`  
**Stratification**: Exact 4-class population proportions preserved across partitions  

---

## 1. Summary Benchmark Matrix

| Model | Model Family | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | Inference Latency | Model Size |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost** | Gradient Boosted Trees | **55.13%** | 0.2262 | 0.2495 | **0.1859** | **0.4036** | **0.034 ms** | 1.1 MB |
| **Random Forest** | Bagged Ensemble (200 trees) | **52.07%** | 0.2517 | 0.2556 | **0.2243** | **0.4242** | **0.138 ms** | 14.4 MB |
| **Logistic Regression** | Balanced Multiclass Linear | **23.87%** | 0.2421 | 0.2365 | **0.2088** | **0.2687** | **0.002 ms** | 32.5 KB |
| **BioBERT Transformer** | Biomedical Transformer | *Evaluating in Phase 12* | *Phase 12* | *Phase 12* | *Phase 12* | *Phase 12* | *Phase 12* | ~40 MB |

---

## 2. Multiclass Metric Averaging Strategy

In imbalanced clinical multiclass problems (Normal 55.9%, Pneumonia 20.1%, Heart Failure 17.6%, Sepsis 6.4%), single overall accuracy is insufficient because a naïve model predicting the majority class ("Normal") achieves 55.9% accuracy with zero clinical discriminative power.

1. **Macro F1 (Primary Metric)**:
   $$\text{Macro F1} = \frac{1}{K}\sum_{k=1}^{K} \text{F1}_k$$
   Calculates F1 independently for each disease class and takes the unweighted arithmetic mean. Treats rare critical classes (e.g. Sepsis at 6.4%) with equal importance to common classes.
2. **Weighted F1 (Prevalence-Weighted)**:
   $$\text{Weighted F1} = \sum_{k=1}^{K} \frac{N_k}{N} \text{F1}_k$$
   Weights each class F1 score by its proportion in the test set.
3. **Class Support ($N_k$)**:
   - `Normal`: 838 test cases
   - `Pneumonia`: 301 test cases
   - `Heart Failure`: 265 test cases
   - `Sepsis`: 96 test cases

---

## 3. Per-Class Empirical Breakdown

### Random Forest (Test Accuracy: 52.07%, Macro F1: 0.2243)
- **Normal**: Precision `56.30%`, Recall `88.54%`, F1 `0.6883` (Support: 838)
- **Pneumonia**: Precision `22.77%`, Recall `7.64%`, F1 `0.1144` (Support: 301)
- **Heart Failure**: Precision `21.62%`, Recall `6.04%`, F1 `0.0944` (Support: 265)
- **Sepsis**: Precision `0.00%`, Recall `0.00%`, F1 `0.0000` (Support: 96)

### Logistic Regression (Balanced Weights, Test Accuracy: 23.87%, Macro F1: 0.2088)
- **Normal**: Precision `55.34%`, Recall `23.51%`, F1 `0.3300` (Support: 838)
- **Pneumonia**: Precision `19.18%`, Recall `26.58%`, F1 `0.2228` (Support: 301)
- **Heart Failure**: Precision `16.57%`, Recall `22.64%`, F1 `0.1914` (Support: 265)
- **Sepsis**: Precision `5.75%`, Recall `21.88%`, F1 `0.0911` (Support: 96)

### XGBoost (Test Accuracy: 55.13%, Macro F1: 0.1859)
- **Normal**: Precision `55.77%`, Recall `98.09%`, F1 `0.7111` (Support: 838)
- **Pneumonia**: Precision `22.22%`, Recall `1.33%`, F1 `0.0251` (Support: 301)
- **Heart Failure**: Precision `12.50%`, Recall `0.38%`, F1 `0.0073` (Support: 265)
- **Sepsis**: Precision `0.00%`, Recall `0.00%`, F1 `0.0000` (Support: 96)

---

## 4. Confusion Matrices

### Random Forest Confusion Matrix (Actual $\times$ Predicted)
| Ground Truth \ Predicted | Heart Failure | Normal | Pneumonia | Sepsis |
| :--- | :---: | :---: | :---: | :---: |
| **Heart Failure** | **16** | 227 | 22 | 0 |
| **Normal** | 40 | **742** | 52 | 4 |
| **Pneumonia** | 13 | 262 | **23** | 3 |
| **Sepsis** | 5 | 87 | 4 | **0** |

### Logistic Regression Confusion Matrix (Actual $\times$ Predicted)
| Ground Truth \ Predicted | Heart Failure | Normal | Pneumonia | Sepsis |
| :--- | :---: | :---: | :---: | :---: |
| **Heart Failure** | **60** | 64 | 82 | 59 |
| **Normal** | 204 | **197** | 228 | 209 |
| **Pneumonia** | 77 | 68 | **80** | 76 |
| **Sepsis** | 21 | 27 | 27 | **21** |
