# MEDINTEL AI — Experimental Run Log & Reproducibility Ledger

**Project:** MEDINTEL AI: Multimodal Smartphone Skin Lesion Classification  
**Lead Researchers:** Senior ML Engineer, Multimodal AI Specialist  
**Dataset:** PAD-UFES-20 (Federal University of Espírito Santo)  
**Hardware Environment:** Windows 11, Intel Core i7 / AMD CPU, Localhost Sandbox  
**Random Seed:** `42` (Fixed across NumPy, PyTorch, Scikit-learn, Python random)

---

## 1. Experiment Overview & Reproducibility Parameters

| Parameter | Configuration Value | Justification / Standard |
| :--- | :--- | :--- |
| **Random Seed** | `42` | Deterministic cross-validation splits and weight initialization |
| **Splitting Protocol** | `StratifiedGroupKFold(n_splits=5)` | Grouped by `patient_id` to enforce zero patient data leakage |
| **Image Backbone** | `timm.create_model('efficientnet_b0')` | Pretrained on ImageNet-1k, pooled representation (1,280 dims) |
| **Image Resolution** | $224 \times 224$ (Resize 256, CenterCrop 224) | Standard EfficientNet-B0 input tensor |
| **Normalization** | ImageNet Mean `[0.485, 0.456, 0.406]`, Std `[0.229, 0.224, 0.225]` | Matches pre-trained transfer learning distribution |
| **Text Vectorizer** | `TfidfVectorizer(max_features=5000, ngram_range=(1,2))` | Sublinear term frequency on patient narratives |
| **Text Classifier** | `LinearSVC(C=1.0)` + `CalibratedClassifierCV(method='sigmoid')` | Calibrated posterior probabilities for multimodal fusion |
| **Gated Fusion Dim** | Visual: 1,280 $\to$ 64; Text: 4 $\to$ 64; Quality: 1 | Compact low-dimensional projection preventing overfitting |
| **Gated Optimizer** | `torch.optim.AdamW(lr=1e-3, weight_decay=1e-3)` | Decoupled weight decay regularization |
| **Loss Function** | Balanced Class-Weighted Cross-Entropy | Compensates for 3.6:1 class imbalance between BCC and SEK |

---

## 2. Chronological Experiment Timeline

### Run ID: `EXP-001` — Dataset Integrity & Partitioning Verification
- **Date & Time:** 2026-11-19 12:45 UTC
- **Script Executed:** `scripts/validate_dataset.py`
- **Actions:**
  1. Verified 2,054 JPEG images in `data/multimodal/images/`.
  2. Verified 2,054 metadata entries in `data/multimodal/manifest.csv`.
  3. Validated 1,272 distinct `patient_id`s.
  4. Tested pairwise patient set intersections across all 5 folds:
     $$\text{Overlap}(Fold_i, Fold_j) = \emptyset \quad \forall i \neq j$$
- **Outcome:** **0 missing files, 0 corrupted images, 0 patient leakage.** Status: **PASSED**.

---

### Run ID: `EXP-002` — Visual Embedding Cache Generation
- **Date & Time:** 2026-11-19 13:10 UTC
- **Script Executed:** `scripts/train_genuine_models.py` (extract_all_image_features)
- **Actions:**
  1. Instantiated ImageNet-1k pre-trained EfficientNet-B0 backbone.
  2. Extracted 1,280-dimensional global average pooled embeddings across all 2,054 images in mini-batches of 64.
  3. Saved tensor of shape `torch.Size([2054, 1280])` to `reports/multimodal/cache/img_features_b0.pt`.
- **Outcome:** **Feature extraction completed in 37.8 seconds.** Deterministic cache locked.

---

### Run ID: `EXP-003` — 5-Fold Vision Classification Head Training
- **Date & Time:** 2026-11-19 13:25 UTC
- **Model Checkpoints:** `models/image_cls/efficientnet_fold0.pt` through `fold4.pt`
- **Training Hyperparameters:**
  - Head: `Sequential(Dropout(0.3), Linear(1280, 4))`
  - Epochs: 25 per fold
  - Batch size: 32
  - Optimizer: AdamW ($\text{lr} = 10^{-3}$, weight decay $= 10^{-3}$)
  - Early Stopping: Tracked best validation Macro F1
- **Epoch Convergence Summary:**
  - Fold 0: Peak Val F1 = 0.718 (Epoch 18), Test Acc = 69.36%, Test F1 = 67.43%
  - Fold 1: Peak Val F1 = 0.742 (Epoch 21), Test Acc = 73.00%, Test F1 = 70.07%
  - Fold 2: Peak Val F1 = 0.755 (Epoch 16), Test Acc = 78.16%, Test F1 = 73.34%
  - Fold 3: Peak Val F1 = 0.729 (Epoch 22), Test Acc = 73.75%, Test F1 = 69.96%
  - Fold 4: Peak Val F1 = 0.738 (Epoch 19), Test Acc = 72.68%, Test F1 = 70.47%
- **Outcome:** **Mean Test Vision Accuracy: 73.39% $\pm$ 3.16%, Mean Test Vision F1: 70.25% $\pm$ 2.08%.**

---

### Run ID: `EXP-004` — 5-Fold Calibrated Text Classifier Training
- **Date & Time:** 2026-11-19 13:35 UTC
- **Model Checkpoints:** `models/text_svm/fold0/` through `fold4/` (`model.joblib`, `vectorizer.joblib`)
- **Pipeline:**
  - TF-IDF unigram + bigram vectorizer on patient symptoms and clinical history
  - Linear Support Vector Classifier with balanced class weighting
  - 3-fold internal Platt sigmoid probability calibration via `CalibratedClassifierCV`
- **Performance Across Folds:**
  - Fold 0 Test Acc: 74.82%, F1: 67.97%
  - Fold 1 Test Acc: 80.75%, F1: 73.08%
  - Fold 2 Test Acc: 76.21%, F1: 67.36%
  - Fold 3 Test Acc: 79.75%, F1: 73.65%
  - Fold 4 Test Acc: 80.52%, F1: 72.74%
- **Outcome:** **Mean Test Text Accuracy: 78.41% $\pm$ 2.78%, Mean Test Text F1: 70.96% $\pm$ 3.09%.**

---

### Run ID: `EXP-005` — 5-Fold Quality-Aware Gated Multimodal Fusion
- **Date & Time:** 2026-11-19 13:42 UTC
- **Model Checkpoints:** `models/fusion/fusion_gated_fold0.pt` through `fold4.pt`
- **Architecture:**
  - $\mathbf{h}_{img} \in \mathbb{R}^{64}$, $\mathbf{h}_{txt} \in \mathbb{R}^{64}$
  - Quality score $q \in [0, 1]$ incorporated into gating MLP:
    $$\mathbf{g} = \sigma(\mathbf{W}_{gate} [\mathbf{h}_{img}; \mathbf{h}_{txt}; q] + \mathbf{b}_{gate})$$
  - Output head: $\mathbf{h}_{fused} \to \text{Linear}(64, 64) \to \text{GELU} \to \text{Linear}(64, 4)$
- **Training Hyperparameters:**
  - Epochs: 30 per fold
  - Batch size: 32
  - Optimizer: AdamW ($\text{lr} = 10^{-3}$, weight decay $= 10^{-3}$)
- **Results Across 5 Folds:**
  - Fold 0: Acc = 81.24%, Macro F1 = 79.60%, Balanced Acc = 79.62%, AUC = 0.9418
  - Fold 1: Acc = 84.75%, Macro F1 = 81.48%, Balanced Acc = 81.30%, AUC = 0.9670
  - Fold 2: Acc = 83.25%, Macro F1 = 79.05%, Balanced Acc = 78.47%, AUC = 0.9459
  - Fold 3: Acc = 85.75%, Macro F1 = 80.65%, Balanced Acc = 80.59%, AUC = 0.9598
  - Fold 4: Acc = 85.75%, Macro F1 = 82.08%, Balanced Acc = 81.95%, AUC = 0.9743
- **Outcome:** **Mean Gated Fusion Accuracy: 84.15% $\pm$ 1.92%, Macro F1: 80.57% $\pm$ 1.26%, Macro AUC: 0.9578.**

---

### Run ID: `EXP-006` — 4-Disease Multi-Class Forward Inference Verification
- **Date & Time:** 2026-11-19 13:49 UTC
- **Script Executed:** `scripts/verify_4_diseases.py`
- **Objective:** Verify elimination of the single-disease prediction collapse across all 4 dermatological categories.
- **Results:**
  - BCC samples: Predicted as BCC (Prob: 99.98%, Grad-CAM++ active)
  - ACK samples: Predicted as ACK (Prob: 100.00%, Grad-CAM++ active)
  - NEV samples: Predicted as NEV (Prob: 100.00%, Grad-CAM++ active)
  - SEK samples: Differential predicted across test cases (Prob: 99.71%, Grad-CAM++ active)
  - Set of predicted classes: `{'ACK', 'BCC', 'NEV', 'SEK'}`.
- **Outcome:** **Single disease collapse permanently resolved.** Status: **PASSED**.

---

### Run ID: `EXP-007` — Conference Publication Figures Generation
- **Date & Time:** 2026-11-19 14:01 UTC
- **Script Executed:** `scripts/generate_conference_figures.py`
- **Outputs Created:**
  - `fig1_confusion_matrix.png` & `.pdf` (Confusion matrix with raw counts & recall %)
  - `fig2_multimodal_comparison.png` & `.pdf` (Multi-metric bar chart with SD error bars)
  - `fig3_roc_curves.png` & `.pdf` (Per-class 1-vs-Rest and Macro ROC curves)
  - `fig4_dataset_distribution.png` & `.pdf` (Cohort demographics & zero patient leakage)
  - `fig5_calibration_curve.png` & `.pdf` (Reliability calibration diagram & ECE)
  - `fig6_gating_mechanism_analysis.png` & `.pdf` (Learned visual weight vs image quality)
- **Outcome:** **12 high-resolution vector PDFs and 300 DPI PNGs successfully rendered.**

---

## 3. Storage & Artifact Verification

All experimental outputs are persisted in the workspace:
- Pre-computed embeddings: `reports/multimodal/cache/img_features_b0.pt`
- Evaluation results: `reports/multimodal/e3_main.csv`
- Out-of-fold predictions: `reports/multimodal/predictions.csv`
- Summary metrics: `experiments/experiment_summary.json`
- Comprehensive table: `experiments/experiment_results.csv`
- High-res figures: `research_outputs/figures/`
