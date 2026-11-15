"""
Image quality assessment for smartphone skin lesion images.
Computes blur, brightness, noise, and combines them into quality score q in [0, 1].
"""

import numpy as np
import cv2
from skimage.restoration import estimate_sigma
from typing import Dict, Any, Optional

def blur_score(img: np.ndarray) -> float:
    """
    Computes blur score as variance of Laplacian.
    Downscales so max side <= 512 for consistent scale invariance.
    """
    if img is None or img.size == 0:
        return 0.0
    h, w = img.shape[:2]
    max_side = max(h, w)
    if max_side > 512:
        scale = 512.0 / max_side
        img_small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        img_small = img
        
    if img_small.ndim == 3:
        gray = cv2.cvtColor(img_small, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_small
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def brightness_score(img: np.ndarray) -> float:
    """
    Computes brightness score as mean L channel in LAB color space.
    Scale: 0 to 255.
    """
    if img is None or img.size == 0:
        return 0.0
    if img.ndim == 3:
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        return float(lab[:, :, 0].mean())
    else:
        return float(img.mean())

def noise_score(img: np.ndarray) -> float:
    """
    Estimates Gaussian noise standard deviation using wavelets / skimage.
    Falls back to robust Laplacian MAD estimation if PyWavelets is unavailable.
    """
    if img is None or img.size == 0:
        return 0.0
    if img.dtype != np.float32 and img.dtype != np.float64:
        img_float = img.astype(np.float32) / 255.0
    else:
        img_float = img
        
    try:
        if img_float.ndim == 3:
            sigma = estimate_sigma(img_float, channel_axis=-1, average_sigmas=True)
        else:
            sigma = estimate_sigma(img_float, average_sigmas=True)
        return float(sigma * 255.0)
    except Exception:
        # Robust fallback using median absolute deviation of Laplacian
        if img.ndim == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        else:
            gray = img
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        mad = np.median(np.abs(lap - np.median(lap)))
        sigma = mad / 0.6745
        return float(np.clip(sigma, 0.0, 100.0))

def compute_reference_stats(manifest_df) -> Dict[str, Any]:
    """
    Computes percentiles for blur, brightness, and noise on training samples.
    """
    blur_vals = manifest_df["blur_laplacian_var"].values
    bright_vals = manifest_df["brightness_mean"].values
    
    return {
        "blur_p10": float(np.percentile(blur_vals, 10)),
        "blur_p50": float(np.percentile(blur_vals, 50)),
        "blur_p90": float(np.percentile(blur_vals, 90)),
        "bright_p10": float(np.percentile(bright_vals, 10)),
        "bright_p50": float(np.percentile(bright_vals, 50)),
        "bright_p90": float(np.percentile(bright_vals, 90)),
        "noise_p10": 2.0,
        "noise_p50": 6.0,
        "noise_p90": 15.0
    }

def quality_score(img: np.ndarray, ref_stats: Optional[Dict[str, Any]] = None) -> float:
    """
    Maps blur, brightness, and noise to [0, 1] using reference statistics and averages them.
    q in [0, 1] where 1 is highest quality and 0 is heavily degraded.
    """
    b = blur_score(img)
    br = brightness_score(img)
    n = noise_score(img)
    
    if ref_stats:
        # Blur mapping (higher is clearer)
        p10_b = ref_stats.get("blur_p10", 30.0)
        p90_b = ref_stats.get("blur_p90", 400.0)
        q_blur = np.clip((b - p10_b) / max(p90_b - p10_b, 1e-5), 0.0, 1.0)
        
        # Brightness mapping (optimal around p50, penalty for too dark or overexposed)
        p50_br = ref_stats.get("bright_p50", 128.0)
        q_bright = 1.0 - min(abs(br - p50_br) / 100.0, 1.0)
        
        # Noise mapping (lower is cleaner)
        p10_n = ref_stats.get("noise_p10", 2.0)
        p90_n = ref_stats.get("noise_p90", 20.0)
        q_noise = 1.0 - np.clip((n - p10_n) / max(p90_n - p10_n, 1e-5), 0.0, 1.0)
    else:
        # Default heuristic mapping
        q_blur = np.clip(b / 300.0, 0.0, 1.0)
        q_bright = 1.0 - min(abs(br - 128.0) / 100.0, 1.0)
        q_noise = 1.0 - np.clip(n / 25.0, 0.0, 1.0)
        
    q = (q_blur + q_bright + q_noise) / 3.0
    return float(np.clip(q, 0.0, 1.0))

def assess_image_quality(img: np.ndarray, ref_stats: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
    """Returns all component scores and overall quality q."""
    b = blur_score(img)
    br = brightness_score(img)
    n = noise_score(img)
    q = quality_score(img, ref_stats)
    return {
        "blur": b,
        "brightness": br,
        "noise": n,
        "q": q
    }

def needs_enhancement(q: float, threshold: float = 0.5) -> bool:
    """Returns True if image quality is below the enhancement threshold."""
    return q < threshold
