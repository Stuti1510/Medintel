"""
Shared Preprocessing & Inference Utilities for MEDINTEL AI.
Used uniformly across training, offline evaluation, and FastAPI production backend
to guarantee strict inference parity.
"""

import os
import hashlib
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, Union
import numpy as np
import cv2
import torch
import torchvision.transforms as T
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]

from vision.preprocessing.quality import assess_image_quality, needs_enhancement
from data.multimodal.build_pad_ufes_dataset import build_patient_narrative

CLASSES = ["BCC", "ACK", "NEV", "SEK"]
LABEL_MAP = {"BCC": 0, "ACK": 1, "NEV": 2, "SEK": 3}
INDEX_TO_CLASS = {0: "BCC", 1: "ACK", 2: "NEV", 3: "SEK"}

def get_canonical_transform() -> T.Compose:
    """Canonical ImageNet normalization transform matching pre-trained EfficientNet-B0."""
    return T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def compute_file_checksum(filepath: Union[str, Path]) -> str:
    """Computes SHA-256 checksum for model weight verification."""
    p = Path(filepath)
    if not p.exists():
        return "FILE_NOT_FOUND"
    sha = hashlib.sha256()
    with open(p, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()[:16]

def prepare_image(
    image_input: Union[bytes, np.ndarray, Image.Image, str, Path],
    max_side: int = 1024
) -> Tuple[np.ndarray, torch.Tensor, Dict[str, float]]:
    """
    Standardized image preprocessing pipeline:
    1. Decodes to RGB numpy array.
    2. Resizes large dimensions to max_side while preserving aspect ratio.
    3. Computes objective quality scores (blur, brightness, noise, q).
    4. Applies canonical ImageNet transforms -> 4D tensor (1, 3, 224, 224).
    """
    img_rgb = None
    
    if isinstance(image_input, (str, Path)):
        p = Path(image_input)
        with Image.open(p) as pil_img:
            img_rgb = np.array(pil_img.convert("RGB"))
    elif isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is not None:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_input, np.ndarray):
        if image_input.ndim == 2:
            img_rgb = cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
        elif image_input.shape[2] == 4:
            img_rgb = cv2.cvtColor(image_input, cv2.COLOR_RGBA2RGB)
        elif image_input.shape[2] == 3:
            # Assume RGB
            img_rgb = image_input.copy()
    elif isinstance(image_input, Image.Image):
        img_rgb = np.array(image_input.convert("RGB"))
        
    if img_rgb is None or img_rgb.size == 0:
        raise ValueError("Failed to decode image input into a valid RGB array.")
        
    # Constrain max dimension to prevent memory spikes
    h, w = img_rgb.shape[:2]
    if max(h, w) > max_side:
        scale = max_side / float(max(h, w))
        new_w, new_h = int(w * scale), int(h * scale)
        img_rgb = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
    # Quality metrics
    quality_info = assess_image_quality(img_rgb)
    
    # Canonical tensor
    pil_for_transform = Image.fromarray(img_rgb)
    tensor = get_canonical_transform()(pil_for_transform).unsqueeze(0)
    
    return img_rgb, tensor, quality_info

def prepare_narrative(
    narrative: Optional[str] = None,
    structured_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Consistent clinical narrative resolution.
    Falls back to building narrative from structured clinical fields when omitted.
    """
    if narrative and narrative.strip():
        return narrative.strip()
        
    if structured_data:
        built = build_patient_narrative(structured_data)
        if built and built.strip():
            return built.strip()
            
    return "Patient presents for dermatological examination of a cutaneous lesion."
