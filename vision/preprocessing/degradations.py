"""
Realistic smartphone image degradations and controlled severity levels.
"""

import numpy as np
import cv2
import random
from typing import Optional, Tuple

SEVERITY = {
    "gaussian_blur": {1: 1.5, 2: 3.0, 3: 5.0},
    "motion_blur": {1: 7, 2: 15, 3: 25},
    "low_light": {1: 1.5, 2: 2.2, 3: 3.0},       # gamma > 1 darkens image
    "gaussian_noise": {1: 10.0, 2: 20.0, 3: 35.0},
    "jpeg": {1: 50, 2: 25, 3: 10},               # lower quality = higher compression
    "downscale": {1: 2, 2: 3, 3: 4}
}

def gaussian_blur(img: np.ndarray, sigma: float) -> np.ndarray:
    ksize = int(2 * round(3 * sigma) + 1)
    return cv2.GaussianBlur(img, (ksize, ksize), sigmaX=sigma, sigmaY=sigma)

def motion_blur(img: np.ndarray, length: int, angle: Optional[float] = None) -> np.ndarray:
    if length <= 1:
        return img
    if angle is None:
        angle = random.uniform(0, 360)
    kernel = np.zeros((length, length), dtype=np.float32)
    center = length // 2
    cos_a = np.cos(np.radians(angle))
    sin_a = np.sin(np.radians(angle))
    for i in range(length):
        offset = i - center
        x = int(round(center + offset * cos_a))
        y = int(round(center + offset * sin_a))
        if 0 <= x < length and 0 <= y < length:
            kernel[y, x] = 1.0
    k_sum = kernel.sum()
    if k_sum > 0:
        kernel /= k_sum
    else:
        kernel[center, center] = 1.0
    return cv2.filter2D(img, -1, kernel)

def low_light(img: np.ndarray, gamma: float) -> np.ndarray:
    """Simulates low-light by applying gamma > 1.0 (darkening) and scaling."""
    inv_gamma = 1.0 / max(gamma, 1e-4)
    table = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype("uint8")
    return cv2.LUT(img, table)

def gaussian_noise(img: np.ndarray, sigma: float) -> np.ndarray:
    noise = np.random.normal(0, sigma, img.shape)
    noisy = img.astype(np.float32) + noise
    return np.clip(noisy, 0, 255).astype(np.uint8)

def jpeg_compression(img: np.ndarray, quality: int) -> np.ndarray:
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), max(1, min(quality, 100))]
    # cv2 encode expects BGR or RGB
    _, enc = cv2.imencode(".jpg", img, encode_param)
    return cv2.imdecode(enc, 1)

def downscale(img: np.ndarray, factor: int) -> np.ndarray:
    h, w = img.shape[:2]
    small = cv2.resize(img, (max(1, w // factor), max(1, h // factor)), interpolation=cv2.INTER_AREA)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)

def apply_degradation(img: np.ndarray, kind: str, level: int) -> np.ndarray:
    """Applies a specific degradation kind at severity level 0, 1, 2, or 3."""
    if level == 0 or kind == "none":
        return img.copy()
    if level not in [1, 2, 3]:
        raise ValueError(f"Level must be 0, 1, 2, or 3. Got {level}")
        
    param = SEVERITY[kind][level]
    if kind == "gaussian_blur":
        return gaussian_blur(img, sigma=param)
    elif kind == "motion_blur":
        return motion_blur(img, length=int(param))
    elif kind == "low_light":
        return low_light(img, gamma=param)
    elif kind == "gaussian_noise":
        return gaussian_noise(img, sigma=param)
    elif kind == "jpeg":
        return jpeg_compression(img, quality=int(param))
    elif kind == "downscale":
        return downscale(img, factor=int(param))
    else:
        raise ValueError(f"Unknown degradation kind: {kind}")

def random_degrade(img: np.ndarray, rng: Optional[random.Random] = None, max_ops: int = 2) -> np.ndarray:
    """Applies 1 to max_ops random degradations for data augmentation."""
    r = rng if rng is not None else random
    out = img.copy()
    kinds = list(SEVERITY.keys())
    num_ops = r.randint(1, max_ops)
    chosen_kinds = r.sample(kinds, num_ops)
    for k in chosen_kinds:
        lvl = r.choice([1, 2, 3])
        out = apply_degradation(out, k, lvl)
    return out
