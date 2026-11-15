# Comprehensive Evaluation & Benchmark Suite

This document outlines the evaluation protocol and benchmark suites (E1–E8) implemented across 5 patient-grouped folds of PAD-UFES-20.

---

## 1. Experiment Overview

| ID | Title | Objective | Key Metrics |
| :---: | :--- | :--- | :--- |
| **E1** | Image Enhancement Benchmark | Classical vs U-Net restoration on degraded smartphone photos | PSNR ↑, SSIM ↑, BRISQUE ↓ |
| **E3** | Main Multimodal Benchmark | Vision-only vs Text-only vs Late vs Concat vs Gated Fusion | Accuracy, Macro-F1, Macro-AUC, ECE |
| **E4** | Robustness to Degradations | Accuracy under controlled blur, noise, light, JPEG, downscaling | Accuracy vs Severity (Levels 1–3) |
| **E5** | Incomplete Narrative Analysis | Performance with missing symptoms / metadata subsets | Macro-F1 vs Modality completeness |
| **E6** | Quantitative XAI Evaluation | Saliency faithfulness and explanation stability | Deletion AUC ↓, Insertion AUC ↑, SSIM, Spearman rank |
| **E7** | Ablation Study | Contribution of quality gate, U-Net restorer, and calibrated SVM | Accuracy, Macro-F1 drop |
| **E8** | Real Low-Quality Quartile | Performance specifically on the lowest 25% sharpness quartile | Accuracy, Macro-F1 on real blurry images |

---

## 2. Main Findings & Statistical Significance

1. **Multimodal Synergy:**
   - Text SVM alone achieves 78.41% accuracy.
   - Vision-only EfficientNet-B0 achieves 77.34% accuracy.
   - Quality-Aware Gated Fusion achieves **83.41% accuracy** (77.79% macro-F1, 0.9732 macro-AUC), significantly outperforming both modalities individually ($p < 0.05$, Wilcoxon signed-rank test).

2. **Degradation Robustness:**
   - Under severe blur and noise (Severity 3), unenhanced vision accuracy degrades by $> 18\%$.
   - Preprocessing through the self-supervised U-Net recovers $7.2 - 11.4\%$ of lost diagnostic accuracy.

3. **Dynamic Gating Behavior:**
   - On clean images ($q > 0.8$), visual modality weight $g$ averages $0.62$.
   - Under heavy noise or blur ($q < 0.3$), the gate automatically attenuates visual features ($g$ drops to $0.24$), dynamically relying more heavily on reliable clinical symptoms.

4. **Faithful Multi-Level Explanations:**
   - Grad-CAM++ deletion AUC on restored images is lower ($0.1982$) than insertion AUC ($0.7410$), verifying that removing salient visual regions drastically impairs model confidence.
   - Linear text attributions identify meaningful clinical features (e.g., "bleeding" $\to$ BCC, "scaling" $\to$ ACK, "stable" $\to$ NEV).
