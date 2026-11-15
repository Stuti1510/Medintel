"""
Generates publication-quality figures for MEDINTEL AI paper and saves them to reports/multimodal/figures/.
"""

import os
import sys
import tempfile
os.environ["MPLCONFIGDIR"] = tempfile.gettempdir()

if "." not in sys.path:
    sys.path.insert(0, ".")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

FIG_DIR = "reports/multimodal/figures"
os.makedirs(FIG_DIR, exist_ok=True)
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

def plot_e3_comparison(e3_path="reports/multimodal/e3_main.csv"):
    if not os.path.exists(e3_path):
        return
    df = pd.read_csv(e3_path)
    summary = df.groupby("model")["macro_f1"].agg(["mean", "std"]).reset_index()
    
    # Sort order
    order = ["text_svm", "image_efficientnet", "late_fusion", "concat_fusion", "gated_fusion"]
    summary["order"] = summary["model"].map(lambda x: order.index(x) if x in order else 99)
    summary = summary.sort_values("order")
    
    labels = [m.replace("_", "\n").title() for m in summary["model"]]
    
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(labels, summary["mean"], yerr=summary["std"], capsize=5, color=["#4A5568", "#2B6CB0", "#319795", "#805AD5", "#38A169"], edgecolor="black", alpha=0.9)
    ax.set_ylabel("Macro-F1 Score", fontsize=12)
    ax.set_title("5-Fold Clean Classification Performance Comparison", fontsize=14, fontweight="bold")
    ax.set_ylim(0.5, 0.95)
    
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, h + 0.015, f"{h:.3f}", ha="center", va="bottom", fontsize=10, fontweight="bold")
        
    plt.tight_layout()
    out = os.path.join(FIG_DIR, "fig_e3_model_comparison.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Generated {out}")

def plot_e4_robustness(e4_path="reports/multimodal/e4_robustness.csv"):
    if not os.path.exists(e4_path):
        return
    df = pd.read_csv(e4_path)
    # Filter to unet enhancement vs none for gated vs baselines
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    sub = df[df["degradation"] == "gaussian_blur"]
    
    for m, col, ls in [("text_svm", "#4A5568", "--"), ("image_efficientnet", "#E53E3E", "-"),
                       ("concat_fusion", "#805AD5", "-"), ("gated_fusion", "#38A169", "-")]:
        sub_m = sub[(sub["model"] == m) & (sub["enhance"].isin(["none", "unet"]))]
        means = sub_m.groupby("level")["macro_f1"].mean()
        label = m.replace("_", " ").title() + (" (U-Net)" if m == "gated_fusion" else "")
        ax1.plot(means.index, means.values, marker="o", color=col, linestyle=ls, linewidth=2.5, label=label)
        
    ax1.set_xlabel("Degradation Severity Level", fontsize=12)
    ax1.set_ylabel("Macro-F1", fontsize=12)
    ax1.set_title("Robustness Under Gaussian Blur", fontsize=13, fontweight="bold")
    ax1.set_xticks([0, 1, 2, 3])
    ax1.legend(loc="lower left")
    
    # Gate allocation weight vs severity
    sub_g = sub[sub["model"] == "gated_fusion"].groupby("level")["gate_mean"].mean()
    ax2.plot(sub_g.index, sub_g.values, marker="s", color="#38A169", linewidth=2.5, label="Image Modality Weight (g)")
    ax2.plot(sub_g.index, 1.0 - sub_g.values, marker="^", color="#3182CE", linewidth=2.5, linestyle="--", label="Text Modality Weight (1 - g)")
    ax2.set_xlabel("Degradation Severity Level", fontsize=12)
    ax2.set_ylabel("Modality Gate Allocation", fontsize=12)
    ax2.set_title("Quality-Aware Dynamic Gate Re-weighting", fontsize=13, fontweight="bold")
    ax2.set_xticks([0, 1, 2, 3])
    ax2.set_ylim(0.0, 1.0)
    ax2.legend(loc="center right")
    
    plt.tight_layout()
    out = os.path.join(FIG_DIR, "fig_e4_robustness_and_gate.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Generated {out}")

def plot_e5_incomplete_text(e5_path="reports/multimodal/e5_text.csv"):
    if not os.path.exists(e5_path):
        return
    df = pd.read_csv(e5_path)
    fig, ax = plt.subplots(figsize=(8, 5))
    
    colors = {"text_svm": "#E53E3E", "late_fusion": "#319795", "concat_fusion": "#805AD5", "gated_fusion": "#38A169"}
    for m in ["text_svm", "late_fusion", "concat_fusion", "gated_fusion"]:
        sub = df[df["model"] == m].groupby("text_pct")["macro_f1"].mean().sort_index(ascending=False)
        ax.plot(sub.index, sub.values, marker="o", linewidth=2.5, color=colors.get(m, "black"), label=m.replace("_", " ").title())
        
    ax.set_xlabel("Percentage of Clinical Symptoms Provided (%)", fontsize=12)
    ax.set_ylabel("Macro-F1 Score", fontsize=12)
    ax.set_title("Classification Resilience Under Incomplete Patient Symptoms", fontsize=13, fontweight="bold")
    ax.set_xticks([100, 50, 25, 0])
    ax.legend(loc="lower right")
    
    plt.tight_layout()
    out = os.path.join(FIG_DIR, "fig_e5_incomplete_text.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Generated {out}")

def plot_e7_ablations(e7_path="reports/multimodal/e7_ablation.csv"):
    if not os.path.exists(e7_path):
        return
    df = pd.read_csv(e7_path)
    summary = df.groupby("ablation")["macro_f1"].agg(["mean", "std"]).reset_index()
    summary = summary.sort_values("mean", ascending=True)
    
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.barh(summary["ablation"], summary["mean"], xerr=summary["std"], capsize=5, color="#2B6CB0", edgecolor="black", alpha=0.85)
    ax.set_xlabel("Macro-F1 Score", fontsize=12)
    ax.set_title("Ablation Study: Key Architecture Components", fontsize=13, fontweight="bold")
    ax.set_xlim(0.70, 0.86)
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.005, bar.get_y() + bar.get_height() / 2.0, f"{w:.3f}", ha="left", va="center", fontsize=10, fontweight="bold")
        
    plt.tight_layout()
    out = os.path.join(FIG_DIR, "fig_e7_ablations.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Generated {out}")

if __name__ == "__main__":
    plot_e3_comparison()
    plot_e4_robustness()
    plot_e5_incomplete_text()
    plot_e7_ablations()
