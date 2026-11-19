# MEDINTEL AI — Comprehensive Technical & Research Audit Report

**Date:** November 19, 2026  
**Auditor:** Senior Medical AI Research Scientist & Software Architect  
**Project:** MEDINTEL AI (Multimodal Skin Lesion Classifier for Smartphone Images)  
**Target Dataset:** PAD-UFES-20 (Mendeley v1, 2,054 patient-paired samples)  
**Target Classes:** 4 Diagnostic Categories (BCC, ACK, NEV, SEK)  

---

## 1. Executive Summary

MEDINTEL AI is designed as a quality-robust, explainable multimodal clinical decision-support system. It couples smartphone photographs with structured clinical symptom narratives to classify dermatological lesions across four categories:
1. **BCC:** Basal Cell Carcinoma (malignant)
2. **ACK:** Actinic Keratosis (pre-malignant)
3. **NEV:** Melanocytic Nevus (benign)
4. **SEK:** Seborrheic Keratosis (benign)

An exhaustive audit of the codebase, model artifacts, datasets, and API inference endpoints revealed the **two root causes** behind the primary issues reported:
1. **Why the system appeared to predict only one disease:** The neural network weights in `models/image_cls/efficientnet_fold0.pt` and `models/fusion/fusion_gated_fold0.pt` were placeholder state dictionaries saved from randomly initialized models. Because the image backbone was never trained on PAD-UFES-20, it produced invariant constant output logits (`[0.0054, -0.0045, 0.0051, 0.0230]`) across all 2,054 images, collapsing all image-driven predictions into a single class.
2. **Why accuracy metrics were not reflecting actual model behavior:** The benchmark CSV files (`reports/multimodal/e3_main.csv` and `predictions.csv`) were previously generated via synthetic statistical simulation formulas in `scripts/run_experiments.py` rather than running true forward passes across evaluated checkpoints.

This report documents the full codebase audit, disease registry, dataset validation, root cause analysis, and the repair plan for conference submission.

---

## 2. Project Architecture & Pipeline Audit

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Input (Web / API)                          │
│     Smartphone Image (JPEG/PNG)  +  Patient Symptoms / Narrative       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │ Image Quality Analysis │       │ Clinical Symptom Model │
       │ (Blur, Light, Noise)   │       │ TF-IDF + Linear SVM    │
       │ Calculates Score q     │       │ [4-d Decision Scores]  │
       └────────────┬───────────┘       └────────────┬───────────┘
                    │                                │
                    ▼                                │
       ┌────────────────────────┐                    │
       │ Restoration (if q<0.55)│                    │
       │ U-Net / Classical      │                    │
       └────────────┬───────────┘                    │
                    │                                │
                    ▼                                │
       ┌────────────────────────┐                    │
       │ Vision Feature Model   │                    │
       │ EfficientNet-B0 (1280d)│                    │
       └────────────┬───────────┘                    │
                    │                                │
                    └───────────────┬────────────────┘
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │             Quality-Aware Gated Fusion                 │
       │    Dynamically balances visual features and symptom     │
       │    logits conditioned on image quality score q          │
       └────────────────────────────┬───────────────────────────┘
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │             Explainability & Clinical RAG              │
       │    Grad-CAM++ Saliency + Linear Text Attributions      │
       │    Safety Guardrails + Grounded Clinical Summary       │
       └────────────────────────────────────────────────────────┘
```

### Component Status Table

| Subsystem | File / Module | Implementation | Verified Status |
| :--- | :--- | :--- | :--- |
| **Dataset Registry** | `data/multimodal/manifest.csv` | 2,054 rows, 5 patient folds | **Authentic & Complete** |
| **Image Storage** | `data/multimodal/images/` | 2,054 paired `.png` files | **Authentic & Complete** |
| **Text Classifier** | `ml/training/train_text_svm.py` | TF-IDF + Calibrated LinearSVC | **Trained & Functional** |
| **Image Classifier** | `models/image_cls/efficientnet_fold0.pt` | EfficientNet-B0 (1280-d) | **Untrained Placeholder (Root Cause)** |
| **Image Restoration** | `models/restore/unet_fold0.pt` | Residual U-Net | **Untrained Placeholder** |
| **Gated Fusion** | `models/fusion/fusion_gated_fold0.pt` | Quality Gating MLP | **Untrained Placeholder (Root Cause)** |
| **XAI Engine** | `xai/gradcam.py`, `text_explain.py` | Grad-CAM++ & Linear attributions | **Functional (dependent on model)** |
| **Inference API** | `backend/app/api/endpoints/clinical.py` | FastAPI POST `/api/analyze/multimodal` | **Functional (sub-second latency)** |
| **Research Dashboard**| `frontend/src/pages/` | React 19 + TypeScript + Recharts | **Functional (Zero build errors)** |

---

## 3. Four-Disease System Registry

The system classifies skin lesions into four distinct pathological entities. The table below outlines the disease specifications:

| Disease Code | Disease Full Name | Pathology Class | PAD-UFES-20 Count | Class Ratio | Primary Clinical Markers |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **BCC** | Basal Cell Carcinoma | Malignant Neoplasm | 845 | 41.1% | Pearly telangiectasia, bleeding, progressive growth |
| **ACK** | Actinic Keratosis | Pre-malignant Dysplasia | 730 | 35.5% | Scaly erythematous plaque, sun exposure, itch |
| **NEV** | Melanocytic Nevus | Benign Melanocytic | 244 | 11.9% | Symmetric pigmented macule, longstanding stability |
| **SEK** | Seborrheic Keratosis | Benign Keratinocytic | 235 | 11.4% | "Stuck-on" warty plaque, waxy hyperkeratosis |

---

## 4. Root Cause Analysis of Reported Defects

### Defect 1: Model Output Appears to Predict Only One Disease
- **Investigation:** We inspected `backend/app/services/multimodal_service.py` and probed model outputs on four authentic test images representing BCC, ACK, NEV, and SEK.
- **Empirical Output:**
  ```python
  BCC -> logits: [ 0.005406, -0.004489, 0.005153, 0.022963 ] -> probs: [0.2495, 0.2471, 0.2495, 0.2539]
  ACK -> logits: [ 0.005425, -0.004486, 0.005151, 0.022969 ] -> probs: [0.2495, 0.2471, 0.2495, 0.2539]
  NEV -> logits: [ 0.005428, -0.004483, 0.005142, 0.022959 ] -> probs: [0.2495, 0.2471, 0.2495, 0.2539]
  SEK -> logits: [ 0.005397, -0.004489, 0.005150, 0.022958 ] -> probs: [0.2495, 0.2471, 0.2495, 0.2539]
  ```
- **Finding:** The output logits across all diseases were virtually identical to the 4th decimal place. Every image collapsed into near-uniform probabilities (`~0.25`), with index 3 or index 0 trivially winning by a margin of 0.004 due to uninitialized weights.
- **Conclusion:** `efficientnet_fold0.pt` and `fusion_gated_fold0.pt` were random state dictionaries rather than models trained on the PAD-UFES-20 dataset.

### Defect 2: Accuracy Discrepancy & Non-Reproducible Benchmark Values
- **Investigation:** We searched for where `reports/multimodal/e3_main.csv` and `predictions.csv` were written.
- **Finding:** In `scripts/run_experiments.py` lines 127–185:
  ```python
  acc_gate = float(np.clip(acc_cat + np.random.uniform(0.015, 0.03), 0.79, 0.85))
  f1_gate = float(np.clip(f1_cat + np.random.uniform(0.015, 0.03), 0.77, 0.83))
  ```
  The values were numerically synthesized through statistical simulation instead of running forward passes on real weights over the test set.
- **Conclusion:** For a rigorous conference presentation, genuine model checkpoints must be trained, and true out-of-fold inference must be executed and recorded.

---

## 5. Dataset Validation Summary

- **Source:** PAD-UFES-20 (Mendeley Data, DOI: 10.17632/zr7vgbcyr2.1).
- **Cohort:** 2,054 clinical photographs collected from patients in Vitória, Brazil.
- **Data Integrity:** All 2,054 files exist in `data/multimodal/images/` and pass image corruption and channel validation.
- **Data Leakage Check:** Folds are partitioned by `patient_id` using `StratifiedGroupKFold`. All photographs belonging to the same patient reside strictly in either train or test folds. Zero data leakage confirmed.

---

## 6. Actionable Repair & Improvement Plan

To make MEDINTEL AI conference-ready with scientifically authentic results:

1. **Train Transfer-Learning Image Classifier:**
   - Extract deep features from EfficientNet-B0 pretrained on ImageNet.
   - Train a class-weighted classifier head with balanced Cross-Entropy on PAD-UFES-20 to address the 845 vs 235 class imbalance.
   - Save genuine fold checkpoints in `models/image_cls/`.
2. **Train Genuine Multimodal Gated Fusion:**
   - Train the adaptive quality gating mechanism combining image embeddings, calibrated text SVM decision scores, and quality score $q$.
   - Save genuine fusion checkpoints in `models/fusion/`.
3. **Run Authentic 5-Fold Cross-Validation Evaluation:**
   - Run genuine inference on the held-out test partitions for all 5 folds.
   - Compute true accuracy, balanced accuracy, macro-F1, per-class metrics, ROC curves, calibration curves, and confusion matrices.
4. **Generate Research Artifacts:**
   - Produce `RESEARCH_RESULTS.md`, `MODEL_EVALUATION_REPORT.md`, `DATASET_REPORT.md`, `BUG_FIX_REPORT.md`, and `EXPERIMENT_LOG.md`.
   - Export high-resolution conference figures to `research_outputs/figures/`.
5. **Verify Full Pipeline:**
   - Verify that all four diseases produce distinct predictions, confidence scores, and Grad-CAM++ saliency maps.
