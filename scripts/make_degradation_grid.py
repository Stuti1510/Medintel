"""
Generates a visualization grid showing each degradation type across levels 1, 2, 3.
Saves to reports/multimodal/figures/degradation_grid.png.
"""

import os
import sys
import tempfile
os.environ["MPLCONFIGDIR"] = tempfile.gettempdir()

if "." not in sys.path:
    sys.path.insert(0, ".")

import matplotlib.pyplot as plt
import cv2
import pandas as pd
from vision.preprocessing.degradations import apply_degradation, SEVERITY

def generate_degradation_grid(manifest_path="data/multimodal/manifest.csv", out_path="reports/multimodal/figures/degradation_grid.png"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df = pd.read_csv(manifest_path)
    # Pick a high-quality sample image
    sample_row = df.sort_values(by="blur_laplacian_var", ascending=False).iloc[0]
    img_path = sample_row["image_path"]
    if not os.path.exists(img_path):
        img_path = os.path.join("data", "multimodal", "images", sample_row["img_id"])
        
    bgr = cv2.imread(img_path)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    
    kinds = list(SEVERITY.keys()) # 6 kinds
    levels = [0, 1, 2, 3]         # 4 columns (Original + 3 levels)
    
    fig, axes = plt.subplots(len(kinds), len(levels), figsize=(12, 18))
    
    for row_idx, kind in enumerate(kinds):
        for col_idx, lvl in enumerate(levels):
            ax = axes[row_idx, col_idx]
            if lvl == 0:
                deg_img = rgb
                title = f"{kind}\nOriginal"
            else:
                deg_img = apply_degradation(rgb, kind, lvl)
                param = SEVERITY[kind][lvl]
                title = f"Level {lvl} ({param})"
                
            ax.imshow(deg_img)
            ax.set_title(title, fontsize=10)
            ax.axis("off")
            
    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved degradation grid figure to {out_path}")

if __name__ == "__main__":
    generate_degradation_grid()
