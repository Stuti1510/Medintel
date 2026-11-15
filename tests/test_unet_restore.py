"""
Unit tests for U-Net restoration model and inference wrapper.
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import torch
import numpy as np
import pytest
from vision.enhancement.unet_restore import UNetRestore
from vision.enhancement.infer_restore import Restorer

def test_unet_architecture_and_residual_output():
    model = UNetRestore(in_channels=3, out_channels=3, residual=True)
    model.eval()
    x = torch.rand(2, 3, 256, 256)
    with torch.no_grad():
        out = model(x)
    assert out.shape == x.shape, f"Output shape {out.shape} does not match input {x.shape}"
    assert out.min() >= 0.0 and out.max() <= 1.0, f"Output values not clamped in [0, 1]: min={out.min()}, max={out.max()}"

def test_restorer_arbitrary_resolution():
    restorer = Restorer()
    # Test arbitrary non-multiple-of-16 image dimensions (e.g. 235x197)
    arbitrary_img = np.random.randint(0, 256, (235, 197, 3), dtype=np.uint8)
    enhanced = restorer.restore(arbitrary_img)
    assert enhanced.shape == arbitrary_img.shape, f"Shape mismatch: {enhanced.shape} vs {arbitrary_img.shape}"
    assert enhanced.dtype == np.uint8
