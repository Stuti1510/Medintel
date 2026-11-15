"""
Unit tests for vision.preprocessing quality and degradation modules.
Verifies acceptance criteria:
- Output shapes and dtypes match inputs
- Blur degradation strictly lowers blur_score
- Low light degradation strictly lowers brightness_score
- CLAHE raises contrast on a dark image
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import numpy as np
import pytest
from vision.preprocessing.quality import blur_score, brightness_score, noise_score, quality_score
from vision.preprocessing.degradations import (
    gaussian_blur, motion_blur, low_light, gaussian_noise,
    jpeg_compression, downscale, apply_degradation, random_degrade
)
from vision.preprocessing.classical_enhance import clahe, gamma_correct, unsharp_mask, wiener_deblur, auto_enhance

@pytest.fixture
def test_image():
    # Synthetic 256x256 test image with patterns
    img = np.zeros((256, 256, 3), dtype=np.uint8)
    img[::16, :, :] = 255
    img[:, ::16, :] = 255
    img[64:192, 64:192, 0] = 180
    img[64:192, 64:192, 1] = 120
    img[64:192, 64:192, 2] = 90
    return img

def test_degradation_shapes_and_dtypes(test_image):
    for kind in ["gaussian_blur", "motion_blur", "low_light", "gaussian_noise", "jpeg", "downscale"]:
        for lvl in [1, 2, 3]:
            deg = apply_degradation(test_image, kind, lvl)
            assert deg.shape == test_image.shape, f"Shape mismatch for {kind} lvl {lvl}"
            assert deg.dtype == np.uint8, f"Dtype mismatch for {kind} lvl {lvl}"

def test_blur_lowers_blur_score(test_image):
    orig_b = blur_score(test_image)
    blurred = gaussian_blur(test_image, sigma=3.0)
    blurred_b = blur_score(blurred)
    assert blurred_b < orig_b, f"Expected blurred score ({blurred_b}) < original ({orig_b})"

def test_low_light_lowers_brightness_score(test_image):
    orig_br = brightness_score(test_image)
    darkened = low_light(test_image, gamma=2.2)
    darkened_br = brightness_score(darkened)
    assert darkened_br < orig_br, f"Expected darkened brightness ({darkened_br}) < original ({orig_br})"

def test_clahe_raises_contrast_on_dark_image(test_image):
    # Create a dark, low-contrast version
    dark = np.clip(test_image.astype(np.float32) * 0.2 + 20, 0, 255).astype(np.uint8)
    enhanced = clahe(dark, clip_limit=2.0)
    assert enhanced.shape == dark.shape
    assert enhanced.dtype == np.uint8
    # Contrast is standard deviation of intensity
    dark_contrast = float(dark.astype(np.float32).std())
    enhanced_contrast = float(enhanced.astype(np.float32).std())
    assert enhanced_contrast > dark_contrast, f"Expected enhanced contrast ({enhanced_contrast}) > dark ({dark_contrast})"

def test_enhancement_functions(test_image):
    for func in [gamma_correct, unsharp_mask, wiener_deblur, auto_enhance]:
        out = func(test_image)
        assert out.shape == test_image.shape
        assert out.dtype == np.uint8

def test_quality_score_bounds(test_image):
    q = quality_score(test_image)
    assert 0.0 <= q <= 1.0, f"Quality score out of bounds: {q}"
