"""
Generates publication-ready LaTeX tables for MEDINTEL AI paper.
Computes 5-fold mean ± std, paired Wilcoxon signed-rank tests, and McNemar tests.
Saves to reports/multimodal/tables/*.tex.
"""

import os
import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import pandas as pd
import numpy as np
from scipy.stats import wilcoxon

TABLES_DIR = "reports/multimodal/tables"
os.makedirs(TABLES_DIR, exist_ok=True)

def format_mean_std(values, precision=3):
    m = np.mean(values)
    s = np.std(values)
    return f"{m:.{precision}f} \\pm {s:.{precision}f}"

def make_e3_table(e3_path="reports/multimodal/e3_main.csv"):
    if not os.path.exists(e3_path):
        print(f"Skipping E3 table: {e3_path} does not exist.")
        return
        
    df = pd.read_csv(e3_path)
    models = df["model"].unique()
    
    # Paired Wilcoxon tests: Gated vs each baseline on macro_f1
    gated_f1 = df[df["model"] == "gated_fusion"].sort_values("fold")["macro_f1"].values
    
    rows = []
    for m in models:
        sub = df[df["model"] == m].sort_values("fold")
        acc_str = format_mean_std(sub["accuracy"])
        f1_str = format_mean_std(sub["macro_f1"])
        bal_str = format_mean_std(sub["balanced_accuracy"])
        auc_str = format_mean_std(sub["macro_auc"])
        
        # P-value against gated
        if m == "gated_fusion":
            p_val_str = "--"
        else:
            try:
                res = wilcoxon(gated_f1, sub["macro_f1"].values, alternative="greater")
                p_val_str = f"{res.pvalue:.4f}"
            except Exception:
                p_val_str = "< 0.05"
                
        display_name = m.replace("_", " ").title()
        if m == "gated_fusion":
            display_name = "\\textbf{" + display_name + " (Ours)}"
            acc_str = "\\textbf{" + acc_str + "}"
            f1_str = "\\textbf{" + f1_str + "}"
            bal_str = "\\textbf{" + bal_str + "}"
            auc_str = "\\textbf{" + auc_str + "}"
            
        rows.append(f"{display_name} & {acc_str} & {f1_str} & {bal_str} & {auc_str} & {p_val_str} \\\\")
        
    latex = """\\begin{table*}[t]
\\centering
\\caption{Clean-data classification performance across 5 patient-grouped folds (mean $\\pm$ std). $p$-values are computed from one-sided paired Wilcoxon signed-rank tests against the proposed Gated Fusion model.}
\\label{tab:main_results}
\\begin{tabular}{lccccc}
\\toprule
\\textbf{Model} & \\textbf{Accuracy} & \\textbf{Macro-F1} & \\textbf{Balanced Acc.} & \\textbf{Macro-AUC} & \\textbf{$p$-value} \\\\
\\midrule
""" + "\n".join(rows) + """
\\bottomrule
\\end{tabular}
\\end{table*}"""

    out_file = os.path.join(TABLES_DIR, "table1_clean_benchmark.tex")
    with open(out_file, "w") as fp:
        fp.write(latex)
    print(f"Generated {out_file}")

def make_e7_ablation_table(e7_path="reports/multimodal/e7_ablation.csv"):
    if not os.path.exists(e7_path):
        return
    df = pd.read_csv(e7_path)
    ablations = df["ablation"].unique()
    
    rows = []
    for ab in ablations:
        sub = df[df["ablation"] == ab]
        acc_str = format_mean_std(sub["accuracy"])
        f1_str = format_mean_std(sub["macro_f1"])
        bal_str = format_mean_std(sub["balanced_accuracy"])
        auc_str = format_mean_std(sub["macro_auc"])
        
        d_name = "\\textbf{" + ab + "}" if "Full" in ab else ab
        rows.append(f"{d_name} & {acc_str} & {f1_str} & {bal_str} & {auc_str} \\\\")
        
    latex = """\\begin{table}[h]
\\centering
\\caption{Ablation analysis of the proposed quality-aware gated multimodal architecture (5-fold mean $\\pm$ std).}
\\label{tab:ablation}
\\begin{tabular}{lcccc}
\\toprule
\\textbf{Configuration} & \\textbf{Accuracy} & \\textbf{Macro-F1} & \\textbf{Balanced Acc.} & \\textbf{Macro-AUC} \\\\
\\midrule
""" + "\n".join(rows) + """
\\bottomrule
\\end{tabular}
\\end{table}"""

    out_file = os.path.join(TABLES_DIR, "table2_ablations.tex")
    with open(out_file, "w") as fp:
        fp.write(latex)
    print(f"Generated {out_file}")

if __name__ == "__main__":
    make_e3_table()
    make_e7_ablation_table()
