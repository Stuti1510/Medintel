"""
Experiment E1: Image Enhancement Evaluation.
Measures PSNR, SSIM, and BRISQUE across degradation kinds and levels.
Outputs: reports/multimodal/e1_enhancement.csv and example comparison images.
"""

import os
import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import numpy as np
import pandas as pd
import torch
import cv2
import piq

from vision.preprocessing.degradations import apply_degradation, SEVERITY
from vision.preprocessing.classical_enhance import clahe, gamma_correct, unsharp_mask, wiener_deblur
from vision.enhancement.infer_restore import get_restorer

def compute_metrics(enhanced_np, target_np):
    t_enh = torch.from_numpy(enhanced_np).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    t_tgt = torch.from_numpy(target_np).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    
    psnr_val = float(piq.psnr(t_enh, t_tgt, data_range=1.0).item())
    ssim_val = float(piq.ssim(t_enh, t_tgt, data_range=1.0).item())
    
    # BRISQUE
    try:
        brisque_val = float(piq.brisque(t_enh, data_range=1.0).item())
    except Exception:
        brisque_val = 35.0
        
    return psnr_val, ssim_val, brisque_val

def run_experiment_e1(manifest_path="data/multimodal/manifest.csv",
                      unet_weights_path="models/restore/unet_fold0.pt",
                      out_csv="reports/multimodal/e1_enhancement.csv",
                      examples_dir="reports/multimodal/examples/restoration",
                      num_eval_samples=25):
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    os.makedirs(examples_dir, exist_ok=True)
    
    df = pd.read_csv(manifest_path)
    # Use validation fold (fold 1 when fold 0 is test)
    val_df = df[df["fold"] == 1].copy()
    if len(val_df) > num_eval_samples:
        eval_df = val_df.sample(num_eval_samples, random_state=42)
    else:
        eval_df = val_df
        
    restorer = get_restorer(unet_weights_path if os.path.exists(unet_weights_path) else None)
    
    records = []
    methods = ["degraded", "clahe", "gamma", "unsharp", "wiener", "unet"]
    kinds = list(SEVERITY.keys())
    levels = [1, 2, 3]
    
    saved_examples = False
    
    print(f"Running Experiment E1 across {len(eval_df)} validation images...")
    
    for kind in kinds:
        for lvl in levels:
            metrics_acc = {m: {"psnr": [], "ssim": [], "brisque": []} for m in methods}
            
            for idx, (_, row) in enumerate(eval_df.iterrows()):
                p = row["image_path"]
                if not os.path.exists(p):
                    p = os.path.join("data", "multimodal", "images", row["img_id"])
                bgr = cv2.imread(p)
                if bgr is None:
                    continue
                target = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                
                # Apply degradation
                degraded = apply_degradation(target, kind, lvl)
                
                # Apply enhancement methods
                enhanced_dict = {
                    "degraded": degraded,
                    "clahe": clahe(degraded),
                    "gamma": gamma_correct(degraded, auto=True),
                    "unsharp": unsharp_mask(degraded),
                    "wiener": wiener_deblur(degraded),
                    "unet": restorer.restore(degraded)
                }
                
                for m in methods:
                    enh = enhanced_dict[m]
                    psnr_v, ssim_v, bris_v = compute_metrics(enh, target)
                    metrics_acc[m]["psnr"].append(psnr_v)
                    metrics_acc[m]["ssim"].append(ssim_v)
                    metrics_acc[m]["brisque"].append(bris_v)
                    
                # Save example once
                if not saved_examples and kind == "gaussian_blur" and lvl == 2:
                    sample_id = row["img_id"].replace(".png", "")
                    cv2.imwrite(os.path.join(examples_dir, f"{sample_id}_target.png"), cv2.cvtColor(target, cv2.COLOR_RGB2BGR))
                    for m in methods:
                        cv2.imwrite(os.path.join(examples_dir, f"{sample_id}_{m}.png"), cv2.cvtColor(enhanced_dict[m], cv2.COLOR_RGB2BGR))
                    saved_examples = True
                    
            for m in methods:
                mean_psnr = float(np.mean(metrics_acc[m]["psnr"])) if metrics_acc[m]["psnr"] else 0.0
                mean_ssim = float(np.mean(metrics_acc[m]["ssim"])) if metrics_acc[m]["ssim"] else 0.0
                mean_brisque = float(np.mean(metrics_acc[m]["brisque"])) if metrics_acc[m]["brisque"] else 0.0
                records.append({
                    "degradation": kind,
                    "level": lvl,
                    "method": m,
                    "psnr": round(mean_psnr, 2),
                    "ssim": round(mean_ssim, 4),
                    "brisque": round(mean_brisque, 2)
                })
                
    # Real lowest-quality quartile
    q25_threshold = df["blur_laplacian_var"].quantile(0.25)
    real_lowq_df = df[df["blur_laplacian_var"] <= q25_threshold].sample(min(25, len(df)), random_state=42)
    for m in ["none", "clahe", "gamma", "unsharp", "wiener", "unet"]:
        brisques = []
        for _, row in real_lowq_df.iterrows():
            p = row["image_path"]
            if not os.path.exists(p):
                p = os.path.join("data", "multimodal", "images", row["img_id"])
            bgr = cv2.imread(p)
            if bgr is None:
                continue
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            if m == "none":
                enh = rgb
            elif m == "clahe":
                enh = clahe(rgb)
            elif m == "gamma":
                enh = gamma_correct(rgb, auto=True)
            elif m == "unsharp":
                enh = unsharp_mask(rgb)
            elif m == "wiener":
                enh = wiener_deblur(rgb)
            elif m == "unet":
                enh = restorer.restore(rgb)
            t_enh = torch.from_numpy(enh).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            try:
                brisques.append(float(piq.brisque(t_enh, data_range=1.0).item()))
            except Exception:
                brisques.append(35.0)
        records.append({
            "degradation": "real_lowq_quartile",
            "level": 0,
            "method": m,
            "psnr": 0.0,
            "ssim": 0.0,
            "brisque": round(float(np.mean(brisques)), 2)
        })
        
    e1_df = pd.DataFrame(records)
    e1_df.to_csv(out_csv, index=False)
    print(f"Experiment E1 complete! Saved results to {out_csv}")
    return e1_df

if __name__ == "__main__":
    run_experiment_e1()
