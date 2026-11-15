# Machine Learning Models & Training Specifications

## 1. Text Classification: TF-IDF + Calibrated Linear SVM
- **Decision Rationale:** Selected based on the project's held-out benchmark where Linear SVM achieved 0.9611 test accuracy and 0.9582 macro-F1, outperforming Logistic Regression, Random Forest, XGBoost, and BioBERT.
- **Preprocessing:** Sublinear term frequency ($1 + \log(\text{tf})$), unigram and bigram features, min document frequency = 2, max features = 2,500.
- **Model:** `LinearSVC(C=1.0, max_iter=2000, loss="squared_hinge")`.
- **Calibration:** Sigmoid Platt scaling via `CalibratedClassifierCV(method="sigmoid", cv="prefit")` on validation fold to produce well-calibrated posterior probabilities.

---

## 2. Image Classification: EfficientNet-B0
- **Architecture:** EfficientNet-B0 loaded via `timm` with ImageNet-1k pretrained weights.
- **Classifier Head:** 1280-d adaptive average pooling $\to$ Dropout($p=0.2$) $\to$ Linear($1280 \to 4$).
- **Data Augmentations:** Random horizontal/vertical flip, random affine (rotation $\pm 20^\circ$, scale 0.9–1.1), ColorJitter (brightness 0.15, contrast 0.15, saturation 0.1), Resize(256) $\to$ CenterCrop(224).
- **Optimizer:** AdamW ($\text{lr} = 10^{-4}$, weight decay = $10^{-4}$).
- **Loss:** Cross-Entropy with inverse class weighting.

---

## 3. Self-Supervised U-Net Restoration Model
- **Concept:** Trained purely on clear smartphone images from PAD-UFES-20 training folds (Laplacian variance $> 100$). No external dataset is used.
- **Self-Supervised Degradations:** Controlled synthetic degradation applied during training (Gaussian blur $\sigma \in [1, 3]$, low light $\gamma \in [1.5, 2.5]$, Gaussian noise $\sigma_n \in [10, 35]$, JPEG $Q \in [30, 70]$, downscaling $\times 2 - \times 4$).
- **Architecture:** 4-level encoder-decoder with double conv blocks, max pooling, bilinear upsampling, skip connections, and residual addition:
  $$\hat{I} = \text{clamp}(I_{\text{deg}} + \mathcal{U}(I_{\text{deg}}), 0, 1)$$
- **Loss Function:**
  $$\mathcal{L} = \mathcal{L}_1(\hat{I}, I_{\text{clean}}) + 0.5 \cdot (1 - \text{SSIM}(\hat{I}, I_{\text{clean}}))$$

---

## 4. Quality-Aware Gated Multimodal Fusion
- **Two-Stage Training:**
  - *Stage 1 (Frozen Backbones):* EfficientNet-B0 and Text SVM weights frozen; train projection layers ($W_{\text{img}}, W_{\text{txt}}$), gate parameters ($W_g, b_g$), and classifier ($W_c, b_c$) for 10 epochs.
  - *Stage 2 (Fine-Tuning):* Unfreeze final conv block of EfficientNet-B0; train end-to-end with AdamW ($\text{lr} = 10^{-5}$) for 15 epochs.
- **Modality Dropout:** During training, modality dropout with $p=0.15$ sets visual or clinical stream to zero, ensuring robustness when one modality is missing at inference time.
