# MEDINTEL AI — Symptom2Disease Benchmark Evaluation Report

> **Empirical Multi-Class Performance on Sealed Test Partition (N=180, 24 Disease Classes)**

## 1. Executive Summary & Model Comparison

| Model Architecture | Model Family | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | ECE | Latency (ms) | Artifact Size |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | Classical ML (NLP) | **95.56%** | 0.9564 | 0.9539 | **0.9540** | 0.9554 | 0.4544 | 0.022 ms | 563.71 KB |
| **Linear SVM** | Classical ML (NLP) | **96.11%** | 0.9630 | 0.9583 | **0.9582** | 0.9604 | 0.1708 | 0.144 ms | 1695.13 KB |
| **Random Forest** | Classical ML (NLP) | **92.78%** | 0.9371 | 0.9249 | **0.9251** | 0.9261 | 0.4541 | 0.208 ms | 7618.45 KB |
| **XGBoost** | Classical ML (NLP) | **91.67%** | 0.9208 | 0.9137 | **0.9138** | 0.9162 | 0.0895 | 0.066 ms | 2242.68 KB |

## 2. Partition Class Distribution & Leakage Safeguards
- **Dataset**: Symptom2Disease (1,200 verified cases, 24 balanced classes)
- **Partitioning**: 70% Train (840), 15% Val (180), 15% Test (180)
- **Leakage Prevention**: Group-aware stratified splitting on unique text descriptions. Zero duplicate overlap between partitions.
- **Vocabulary**: 3,000 sublinear TF-IDF word unigrams and bigrams fitted strictly on training partition.

## 3. Per-Class Performance Breakdown (Selected Model: Logistic Regression)

| Disease Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Acne** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **Arthritis** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Bronchial Asthma** | 0.8571 | 0.8571 | 0.8571 | 7 |
| **Cervical spondylosis** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Chicken pox** | 0.8750 | 1.0000 | 0.9333 | 7 |
| **Common Cold** | 0.8750 | 0.8750 | 0.8750 | 8 |
| **Dengue** | 0.8333 | 0.7143 | 0.7692 | 7 |
| **Dimorphic Hemorrhoids** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Fungal infection** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **Hypertension** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Impetigo** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **Jaundice** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Malaria** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **Migraine** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Pneumonia** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **Psoriasis** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **Typhoid** | 0.7500 | 0.8571 | 0.8000 | 7 |
| **Varicose Veins** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **allergy** | 1.0000 | 0.8571 | 0.9231 | 7 |
| **diabetes** | 0.8750 | 0.8750 | 0.8750 | 8 |
| **drug reaction** | 1.0000 | 0.8571 | 0.9231 | 7 |
| **gastroesophageal reflux disease** | 1.0000 | 1.0000 | 1.0000 | 8 |
| **peptic ulcer disease** | 1.0000 | 1.0000 | 1.0000 | 7 |
| **urinary tract infection** | 0.8889 | 1.0000 | 0.9412 | 8 |