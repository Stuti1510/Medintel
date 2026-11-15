"""
Classical image enhancement baselines: CLAHE, gamma correction, unsharp masking, Wiener deblurring.
"""

import numpy as np
import cv2
from typing import Optional, Dict
from skimage import restoration

def clahe(img: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """Applies Contrast Limited Adaptive Histogram Equalization on the LAB L channel."""
    if img.ndim == 3:
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe_op = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        l_eq = clahe_op.apply(l)
        lab_eq = cv2.merge((l_eq, a, b))
        return cv2.cvtColor(lab_eq, cv2.COLOR_LAB2RGB)
    else:
        clahe_op = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        return clahe_op.apply(img)

def gamma_correct(img: np.ndarray, gamma: Optional[float] = None, auto: bool = True) -> np.ndarray:
    """Adjusts luminance via gamma correction. If auto=True, computes optimal gamma from mean brightness."""
    if auto and gamma is None:
        if img.ndim == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        else:
            gray = img
        mean_val = max(float(gray.mean()), 1.0)
        # Target mid-gray ~ 128
        gamma = np.log(128.0 / 255.0) / np.log(mean_val / 255.0)
        gamma = np.clip(gamma, 0.4, 2.5)
        
    g = gamma if gamma is not None else 1.0
    inv_gamma = 1.0 / max(g, 1e-4)
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
    return cv2.LUT(img, table)

def unsharp_mask(img: np.ndarray, radius: float = 1.0, amount: float = 1.5) -> np.ndarray:
    """Sharpens edges by subtracting a Gaussian-blurred version."""
    ksize = int(2 * round(3 * radius) + 1)
    blurred = cv2.GaussianBlur(img, (ksize, ksize), sigmaX=radius, sigmaY=radius)
    sharpened = float(amount + 1) * img.astype(np.float32) - float(amount) * blurred.astype(np.float32)
    return np.clip(sharpened, 0, 255).astype(np.uint8)

def wiener_deblur(img: np.ndarray, psf_size: int = 5, nsr: float = 0.01) -> np.ndarray:
    """Applies Wiener deconvolution using a Gaussian Point Spread Function (PSF)."""
    # Create Gaussian PSF
    kernel_1d = cv2.getGaussianKernel(psf_size, psf_size / 3.0)
    psf = np.outer(kernel_1d, kernel_1d)
    
    img_float = img.astype(np.float32) / 255.0
    if img.ndim == 3:
        restored = np.zeros_like(img_float)
        for c in range(3):
            restored[:, :, c] = restoration.wiener(img_float[:, :, c], psf, balance=nsr)
        out = np.clip(restored * 255.0, 0, 255).astype(np.uint8)
    else:
        restored = restoration.wiener(img_float, psf, balance=nsr)
        out = np.clip(restored * 255.0, 0, 255).astype(np.uint8)
    return out

def auto_enhance(img: np.ndarray, scores: Optional[Dict[str, float]] = None) -> np.ndarray:
    """
    Combines classical enhancement techniques:
    1. If low light / contrast -> CLAHE + gamma
    2. If blurry -> unsharp mask
    """
    enhanced = img.copy()
    if scores is None:
        from vision.preprocessing.quality import assess_image_quality
        scores = assess_image_quality(img)
        
    # Contrast & Brightness
    if scores.get("brightness", 128.0) < 100.0 or scores.get("q", 1.0) < 0.6:
        enhanced = clahe(enhanced, clip_limit=2.0)
        enhanced = gamma_correct(enhanced, auto=True)
        
    # Sharpness
    if scores.get("blur", 200.0) < 150.0:
        enhanced = unsharp_mask(enhanced, radius=1.0, amount=1.2)
        
    return enhanced
