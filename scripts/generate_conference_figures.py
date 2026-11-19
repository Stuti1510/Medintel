"""
Generate Conference-Ready Publication Figures for MEDINTEL AI.
Produces publication-quality 300 DPI PNGs and vector PDFs in `research_outputs/figures/`:
1. Figure 1: 4x4 Confusion Matrix (counts & row-normalized recall percentages)
2. Figure 2: Multimodal Architecture Comparison (Accuracy, Macro F1, Balanced Acc, Macro AUC)
3. Figure 3: Multi-class ROC Curves (BCC, ACK, NEV, SEK, Macro Average)
4. Figure 4: Dataset & Cohort Demographics (Class counts, Patient Demographics, Biopsy rates)
5. Figure 5: Reliability Calibration Diagram & Confidence Distribution
6. Figure 6: Quality-Aware Dynamic Gating Analysis (Visual Weight vs. Image Quality Score)
"""

import os
import sys
from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, auc, confusion_matrix
from sklearn.calibration import calibration_curve

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from multimodal.fusion_model import MultimodalClassifier
from ml.inference.text_svm_inference import get_text_classifier

FIGURES_DIR = PROJECT_ROOT / "research_outputs" / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

# Styling for academic conference papers (IEEE / Springer / ACM style)
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 11,
    "axes.labelsize": 12,
    "axes.titlesize": 13,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "legend.fontsize": 10,
    "figure.titlesize": 14,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight"
})

CLASSES = ["BCC", "ACK", "NEV", "SEK"]
CLASS_NAMES = ["Basal Cell Carcinoma", "Actinic Keratosis", "Melanocytic Nevus", "Seborrheic Keratosis"]
COLOR_PALETTE = ["#1b1938", "#0f766e", "#3b82f6", "#f59e0b", "#ec4899"]

def load_all_predictions_and_probs():
    """Load cached features and run 5-fold evaluation to obtain all 2054 out-of-fold probabilities."""
    manifest = pd.read_csv(PROJECT_ROOT / "data/multimodal/manifest.csv")
    img_features = torch.load(PROJECT_ROOT / "reports/multimodal/cache/img_features_b0.pt")
    
    all_y_true = []
    all_gated_probs = []
    all_gated_preds = []
    all_weights = []
    all_qualities = []
    
    for fold in range(5):
        test_mask = (manifest["fold"] == fold).values
        y_test = manifest.loc[test_mask, "label"].values
        
        # Calculate image quality score q from blur and brightness in manifest
        b = manifest.loc[test_mask, "blur_laplacian_var"].values
        br = manifest.loc[test_mask, "brightness_mean"].values
        q_blur = np.clip(b / 300.0, 0.0, 1.0)
        q_bright = 1.0 - np.clip(np.abs(br - 128.0) / 100.0, 0.0, 1.0)
        q_test = np.clip((q_blur + q_bright) / 2.0, 0.05, 0.95)
        
        img_feat_fold = img_features[test_mask]
        
        # Load text classifier using project's inference wrapper
        svm_clf = get_text_classifier(fold=fold)
        test_texts = manifest.loc[test_mask, "narrative"].tolist()
        txt_scores_list = []
        for t in test_texts:
            pred = svm_clf.predict(str(t))
            txt_scores_list.append(pred["decision_scores"])
        txt_feat_fold = torch.tensor(np.array(txt_scores_list), dtype=torch.float32)
        q_tensor = torch.tensor(q_test, dtype=torch.float32).unsqueeze(1)
        
        # Load gated model
        gated_model = MultimodalClassifier(fusion="gated", img_dim=1280, txt_dim=4, d=64, num_classes=4)
        ckpt = torch.load(PROJECT_ROOT / f"models/fusion/fusion_gated_fold{fold}.pt", map_location="cpu")
        if isinstance(ckpt, dict) and "fusion_model" in ckpt:
            gated_model.load_state_dict(ckpt["fusion_model"])
        else:
            gated_model.load_state_dict(ckpt)
        gated_model.eval()
        
        with torch.no_grad():
            logits, g_weights = gated_model(img_feat_fold, txt_feat_fold, q_tensor)
            probs = torch.softmax(logits, dim=1).numpy()
            preds = np.argmax(probs, axis=1)
            weights = g_weights.detach().cpu().numpy().flatten()
            
        all_y_true.extend(y_test)
        all_gated_probs.extend(probs)
        all_gated_preds.extend(preds)
        all_weights.extend(weights)
        all_qualities.extend(q_test)
        
    return (
        np.array(all_y_true),
        np.array(all_gated_probs),
        np.array(all_gated_preds),
        np.array(all_weights),
        np.array(all_qualities)
    )

def plot_confusion_matrix(y_true, y_pred):
    """Figure 1: 4x4 Confusion Matrix with raw counts and normalized recall percentages."""
    print("Generating Figure 1: Confusion Matrix...")
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100.0

    fig, ax = plt.subplots(figsize=(7, 6))
    
    # Custom annotations combining count and percentage
    annot = np.empty_like(cm).astype(str)
    nrows, ncols = cm.shape
    for i in range(nrows):
        for j in range(ncols):
            c = cm[i, j]
            p = cm_norm[i, j]
            annot[i, j] = f"{c}\n({p:.1f}%)"
            
    sns.heatmap(
        cm_norm,
        annot=annot,
        fmt="",
        cmap="Blues",
        cbar_kws={'label': 'Recall / Sensitivity (%)'},
        xticklabels=CLASSES,
        yticklabels=CLASSES,
        ax=ax,
        vmin=0,
        vmax=100
    )
    
    ax.set_title("5-Fold Out-of-Fold Confusion Matrix (Gated Multimodal Fusion)\nTotal Test Cases: N = 2,054", pad=15)
    ax.set_xlabel("Predicted Class", labelpad=10)
    ax.set_ylabel("Ground Truth Class (Biopsy Confirmed)", labelpad=10)
    
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig1_confusion_matrix.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig1_confusion_matrix.pdf")
    plt.close()
    print("  Saved Figure 1 to PNG and PDF.")

def plot_multimodal_comparison():
    """Figure 2: Performance comparison across unimodal vs multimodal architectures."""
    print("Generating Figure 2: Multimodal Architecture Comparison...")
    df = pd.read_csv(PROJECT_ROOT / "reports/multimodal/e3_main.csv")
    
    models_order = ["image_efficientnet", "text_svm", "late_fusion", "gated_fusion"]
    model_labels = ["Image-Only\n(EfficientNet-B0)", "Text-Only\n(Linear SVM)", "Late Fusion\n(Soft Voting)", "Gated Fusion\n(Proposed System)"]
    
    summary = df.groupby("model").agg({
        "accuracy": ["mean", "std"],
        "macro_f1": ["mean", "std"],
        "balanced_accuracy": ["mean", "std"],
        "macro_auc": ["mean", "std"]
    }).reindex(models_order)
    
    metrics = ["accuracy", "macro_f1", "balanced_accuracy", "macro_auc"]
    metric_names = ["Overall Accuracy", "Macro F1-Score", "Balanced Accuracy", "Macro AUC"]
    
    x = np.arange(len(models_order))
    width = 0.18
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    colors = ["#3b82f6", "#10b981", "#8b5cf6", "#1b1938"]
    
    for idx, (m, name, col) in enumerate(zip(metrics, metric_names, colors)):
        means = summary[(m, "mean")].values * 100.0
        stds = summary[(m, "std")].values * 100.0
        rects = ax.bar(x + idx * width - (len(metrics) - 1) * width / 2, means, width, yerr=stds,
                       label=name, color=col, capsize=4, edgecolor="black", linewidth=0.5, alpha=0.9)
        # Value labels above bars
        for r in rects:
            h = r.get_height()
            ax.annotate(f"{h:.1f}",
                        xy=(r.get_x() + r.get_width() / 2, h + 1.2),
                        xytext=(0, 3), textcoords="offset points",
                        ha='center', va='bottom', fontsize=7.5, rotation=0)

    ax.set_ylabel("Metric Score (%)", labelpad=10)
    ax.set_title("5-Fold Cross-Validation Performance Across Modalities\n(Patient-Grouped Stratified Split, N = 2,054)", pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(model_labels)
    ax.set_ylim(60, 103)
    ax.grid(axis='y', linestyle='--', alpha=0.5)
    ax.legend(loc='lower right', frameon=True, framealpha=0.95)
    
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig2_multimodal_comparison.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig2_multimodal_comparison.pdf")
    plt.close()
    print("  Saved Figure 2 to PNG and PDF.")

def plot_roc_curves(y_true, y_probs):
    """Figure 3: Multi-class 1-vs-Rest ROC Curves."""
    print("Generating Figure 3: ROC Curves...")
    fig, ax = plt.subplots(figsize=(7.5, 6))
    
    colors = ["#1b1938", "#0f766e", "#3b82f6", "#f59e0b"]
    
    # Per-class ROC
    for i, (cls, name, color) in enumerate(zip(CLASSES, CLASS_NAMES, colors)):
        y_binary = (y_true == i).astype(int)
        fpr, tpr, _ = roc_curve(y_binary, y_probs[:, i])
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, color=color, lw=2.2,
                label=f"{cls} ({name}) — AUC = {roc_auc:.3f}")
        
    # Macro-average ROC
    all_fpr = np.unique(np.concatenate([roc_curve((y_true == i).astype(int), y_probs[:, i])[0] for i in range(4)]))
    mean_tpr = np.zeros_like(all_fpr)
    for i in range(4):
        fpr_i, tpr_i, _ = roc_curve((y_true == i).astype(int), y_probs[:, i])
        mean_tpr += np.interp(all_fpr, fpr_i, tpr_i)
    mean_tpr /= 4.0
    macro_auc = auc(all_fpr, mean_tpr)
    
    ax.plot(all_fpr, mean_tpr, color="#dc2626", linestyle="--", lw=2.5,
            label=f"Macro-Average — AUC = {macro_auc:.3f}")
    
    ax.plot([0, 1], [0, 1], color="grey", linestyle=":", lw=1.2)
    ax.set_xlim([-0.02, 1.0])
    ax.set_ylim([0.0, 1.03])
    ax.set_xlabel("False Positive Rate (1 - Specificity)", labelpad=10)
    ax.set_ylabel("True Positive Rate (Sensitivity / Recall)", labelpad=10)
    ax.set_title("Multi-Class One-vs-Rest ROC Curves\n(Quality-Aware Gated Fusion, 5-Fold Test Cohort)", pad=15)
    ax.legend(loc="lower right", frameon=True, framealpha=0.95)
    ax.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig3_roc_curves.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig3_roc_curves.pdf")
    plt.close()
    print("  Saved Figure 3 to PNG and PDF.")

def plot_dataset_demographics():
    """Figure 4: Comprehensive Dataset Cohort Breakdown."""
    print("Generating Figure 4: Dataset Cohort Demographics...")
    manifest = pd.read_csv(PROJECT_ROOT / "data/multimodal/manifest.csv")
    
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
    
    # Subplot 1: Disease Class Distribution
    class_counts = manifest["diagnostic"].value_counts().reindex(CLASSES)
    bar_colors = ["#1b1938", "#0f766e", "#3b82f6", "#f59e0b"]
    bars1 = axes[0].bar(CLASSES, class_counts.values, color=bar_colors, edgecolor="black", linewidth=0.5)
    axes[0].set_title("Diagnostic Class Distribution", pad=10)
    axes[0].set_ylabel("Number of Lesion Images", labelpad=8)
    axes[0].set_xlabel("Pathology Class", labelpad=8)
    axes[0].grid(axis="y", linestyle="--", alpha=0.5)
    for b in bars1:
        y = b.get_height()
        axes[0].annotate(f"{y}\n({y/len(manifest)*100:.1f}%)",
                         xy=(b.get_x() + b.get_width() / 2, y / 2),
                         xytext=(0, 0), textcoords="offset points",
                         ha="center", va="center", color="white" if y > 300 else "black",
                         fontweight="bold", fontsize=9)

    # Subplot 2: Patient Age Distribution by Diagnostic
    sns.boxplot(
        data=manifest[manifest["age"].notna()],
        x="diagnostic",
        y="age",
        order=CLASSES,
        hue="diagnostic",
        palette=bar_colors,
        legend=False,
        ax=axes[1],
        boxprops=dict(alpha=0.85),
        fliersize=3
    )
    axes[1].set_title("Patient Age Distribution by Pathology", pad=10)
    axes[1].set_xlabel("Pathology Class", labelpad=8)
    axes[1].set_ylabel("Patient Age (Years)", labelpad=8)
    axes[1].grid(axis="y", linestyle="--", alpha=0.5)

    # Subplot 3: Cross-Validation Fold Partitioning (Zero Patient Leakage)
    fold_counts = manifest.groupby(["fold", "diagnostic"]).size().unstack(fill_value=0).reindex(columns=CLASSES)
    fold_counts.plot(
        kind="bar",
        stacked=True,
        color=bar_colors,
        edgecolor="black",
        linewidth=0.5,
        ax=axes[2]
    )
    axes[2].set_title("5-Fold Stratified Grouping\n(Zero Patient Overlap Across Folds)", pad=10)
    axes[2].set_xlabel("Cross-Validation Fold Index", labelpad=8)
    axes[2].set_ylabel("Sample Count", labelpad=8)
    axes[2].set_xticklabels([f"Fold {i}" for i in range(5)], rotation=0)
    axes[2].legend(title="Class", loc="upper right", framealpha=0.9)
    axes[2].grid(axis="y", linestyle="--", alpha=0.5)

    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig4_dataset_distribution.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig4_dataset_distribution.pdf")
    plt.close()
    print("  Saved Figure 4 to PNG and PDF.")

def plot_calibration_diagram(y_true, y_probs, y_pred):
    """Figure 5: Calibration curve and reliability diagram."""
    print("Generating Figure 5: Reliability Calibration Diagram...")
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(7, 7), gridspec_kw={'height_ratios': [3, 1]}, sharex=True)
    
    # Calculate top-1 confidence and accuracy
    confidences = np.max(y_probs, axis=1)
    accuracies = (y_pred == y_true).astype(float)
    
    prob_true, prob_pred = calibration_curve(accuracies, confidences, n_bins=10, strategy='uniform')
    
    # Calculate ECE
    bin_edges = np.linspace(0, 1, 11)
    bin_indices = np.digitize(confidences, bin_edges) - 1
    ece = 0.0
    for b in range(10):
        bin_mask = bin_indices == b
        if np.sum(bin_mask) > 0:
            bin_acc = np.mean(accuracies[bin_mask])
            bin_conf = np.mean(confidences[bin_mask])
            ece += (np.sum(bin_mask) / len(confidences)) * np.abs(bin_acc - bin_conf)
            
    # Calibration Curve
    ax1.plot([0, 1], [0, 1], "k:", label="Perfect Calibration")
    ax1.plot(prob_pred, prob_true, "s-", color="#1b1938", lw=2, label=f"Gated Fusion (ECE = {ece:.3f})")
    ax1.set_ylabel("Empirical Accuracy", labelpad=10)
    ax1.set_ylim([-0.05, 1.05])
    ax1.set_title("Reliability Calibration Diagram\n(Gated Multimodal Architecture)", pad=15)
    ax1.legend(loc="lower right", frameon=True, framealpha=0.95)
    ax1.grid(True, linestyle="--", alpha=0.5)
    
    # Confidence Histogram
    ax2.hist(confidences, bins=10, range=(0, 1), color="#0f766e", edgecolor="black", alpha=0.8)
    ax2.set_xlabel("Predicted Model Confidence", labelpad=10)
    ax2.set_ylabel("Count", labelpad=10)
    ax2.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig5_calibration_curve.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig5_calibration_curve.pdf")
    plt.close()
    print("  Saved Figure 5 to PNG and PDF.")

def plot_gating_mechanism_analysis(weights, qualities):
    """Figure 6: Quality-aware dynamic gating mechanism response."""
    print("Generating Figure 6: Dynamic Gating Analysis...")
    fig, ax = plt.subplots(figsize=(7.5, 5))
    
    # Scatter points with polynomial regression fit
    sns.regplot(
        x=qualities,
        y=weights,
        scatter_kws={'alpha': 0.25, 'color': '#0f766e', 's': 20},
        line_kws={'color': '#1b1938', 'lw': 2.5, 'label': 'Adaptive Gating Trajectory'},
        order=2,
        ax=ax
    )
    
    ax.axvline(x=0.55, color="#dc2626", linestyle="--", lw=1.5, label="Restoration Threshold (q < 0.55)")
    ax.set_title("Quality-Aware Dynamic Modality Weight Allocation\nVisual Modality Weight vs. Image Quality Score (q)", pad=15)
    ax.set_xlabel("Objective Image Quality Score q in [0, 1]", labelpad=10)
    ax.set_ylabel(r"Learned Visual Weight ($\alpha_{visual}$)", labelpad=10)
    ax.set_ylim([0.0, 1.0])
    ax.set_xlim([0.0, 1.0])
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="upper left", frameon=True, framealpha=0.95)
    
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "fig6_gating_mechanism_analysis.png", dpi=300)
    plt.savefig(FIGURES_DIR / "fig6_gating_mechanism_analysis.pdf")
    plt.close()
    print("  Saved Figure 6 to PNG and PDF.")

def main():
    print("Loading test set data and running out-of-fold inference across 5 folds...")
    y_true, y_probs, y_pred, weights, qualities = load_all_predictions_and_probs()
    print(f"Total samples processed: N = {len(y_true)}")
    
    plot_confusion_matrix(y_true, y_pred)
    plot_multimodal_comparison()
    plot_roc_curves(y_true, y_probs)
    plot_dataset_demographics()
    plot_calibration_diagram(y_true, y_probs, y_pred)
    plot_gating_mechanism_analysis(weights, qualities)
    
    print("\nAll 6 conference figures successfully generated in `research_outputs/figures/`!")

if __name__ == "__main__":
    main()
