"""
Quantitative Explainable AI (XAI) metrics:
1. Grad-CAM Deletion / Insertion AUC
2. Saliency map stability (SSIM and Spearman correlation) between clean, degraded, and restored images
3. Text explanation faithfulness (confidence drop: top-k removed vs k random words removed)
"""

import numpy as np
import torch
import cv2
from scipy.stats import spearmanr
from skimage.metrics import structural_similarity as ssim

def compute_deletion_insertion_auc(model, input_tensor: torch.Tensor, saliency_map: np.ndarray,
                                   target_class: int, steps: int = 10):
    """
    Computes deletion and insertion AUC scores for an image saliency map.
    Deletion: progressively zeros out highest attribution pixels (lower AUC = more faithful).
    Insertion: progressively reveals highest attribution pixels (higher AUC = more faithful).
    """
    model.eval()
    flat_sal = saliency_map.flatten()
    sorted_indices = np.argsort(flat_sal)[::-1] # High to low
    
    c, h, w = input_tensor.shape[1:]
    total_pixels = h * w
    step_size = total_pixels // steps
    
    del_tensor = input_tensor.clone()
    ins_tensor = torch.zeros_like(input_tensor)
    
    del_scores, ins_scores = [], []
    
    with torch.no_grad():
        base_probs = torch.softmax(model(input_tensor), dim=1)[0, target_class].item()
        del_scores.append(base_probs)
        zero_probs = torch.softmax(model(ins_tensor), dim=1)[0, target_class].item()
        ins_scores.append(zero_probs)
        
        for s in range(1, steps + 1):
            idx_range = sorted_indices[: s * step_size]
            y_coords = idx_range // w
            x_coords = idx_range % w
            
            # Deletion: set top pixels to 0
            del_tensor[:, :, y_coords, x_coords] = 0.0
            p_del = torch.softmax(model(del_tensor), dim=1)[0, target_class].item()
            del_scores.append(p_del)
            
            # Insertion: reveal top pixels
            ins_tensor[:, :, y_coords, x_coords] = input_tensor[:, :, y_coords, x_coords]
            p_ins = torch.softmax(model(ins_tensor), dim=1)[0, target_class].item()
            ins_scores.append(p_ins)
            
    del_auc = float(np.trapz(del_scores, dx=1.0 / steps))
    ins_auc = float(np.trapz(ins_scores, dx=1.0 / steps))
    return del_auc, ins_auc

def compute_saliency_stability(cam_clean: np.ndarray, cam_other: np.ndarray):
    """
    Computes SSIM and Spearman rank correlation between two saliency maps.
    """
    cam_c = np.clip(cam_clean, 0.0, 1.0)
    cam_o = np.clip(cam_other, 0.0, 1.0)
    
    # SSIM
    ssim_val = float(ssim(cam_c, cam_o, data_range=1.0))
    
    # Spearman rank correlation
    flat_c = cam_c.flatten()
    flat_o = cam_o.flatten()
    spearman_corr, _ = spearmanr(flat_c, flat_o)
    if np.isnan(spearman_corr):
        spearman_corr = 0.0
        
    return ssim_val, float(spearman_corr)

def compute_text_faithfulness(clf, narrative: str, top_k_ngrams: list, pred_class: int):
    """
    Computes faithfulness: drop in predicted confidence when top-k n-grams are removed
    compared to when k random words are removed.
    """
    res_orig = clf.predict(narrative)
    conf_orig = res_orig["probabilities_array"][pred_class]
    
    # Remove top-k n-grams
    clean_text = narrative
    for item in top_k_ngrams:
        clean_text = clean_text.replace(item["ngram"], " ")
    res_top_removed = clf.predict(clean_text)
    conf_top_removed = res_top_removed["probabilities_array"][pred_class]
    drop_top = max(0.0, conf_orig - conf_top_removed)
    
    # Remove random words
    words = narrative.split()
    k = min(len(top_k_ngrams), len(words))
    if k > 0:
        rand_indices = set(np.random.choice(len(words), size=k, replace=False))
        rand_text = " ".join([w for i, w in enumerate(words) if i not in rand_indices])
        res_rand_removed = clf.predict(rand_text)
        conf_rand_removed = res_rand_removed["probabilities_array"][pred_class]
        drop_rand = max(0.0, conf_orig - conf_rand_removed)
    else:
        drop_rand = 0.0
        
    # Faithfulness ratio (drop_top / (drop_rand + 1e-4))
    faithfulness = drop_top - drop_rand
    return drop_top, drop_rand, faithfulness
