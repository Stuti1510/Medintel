"""
Inference wrapper for U-Net restoration model.
Handles arbitrary image sizes with reflection padding to multiples of 16.
"""

import os
import torch
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Union, Optional
from vision.enhancement.unet_restore import UNetRestore

class Restorer:
    def __init__(self, model_path: Optional[str] = None, device: Optional[str] = None):
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
            
        self.model = UNetRestore(in_channels=3, out_channels=3, residual=True).to(self.device)
        self.model.eval()
        self.is_loaded = False
        
        if model_path and os.path.exists(model_path):
            self.load_weights(model_path)
            
    def load_weights(self, model_path: str):
        state_dict = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.is_loaded = True
        
    def __call__(self, img: Union[np.ndarray, torch.Tensor]) -> Union[np.ndarray, torch.Tensor]:
        return self.restore(img)
        
    def restore(self, img: Union[np.ndarray, torch.Tensor]) -> Union[np.ndarray, torch.Tensor]:
        """
        Enhances image using U-Net.
        Accepts: uint8 RGB numpy array (H, W, 3) or normalized float tensor.
        Returns: enhanced uint8 RGB numpy array (H, W, 3) or float tensor.
        """
        if not self.is_loaded:
            # Fallback to classical auto-enhance if weights not loaded
            if isinstance(img, np.ndarray):
                from vision.preprocessing.classical_enhance import auto_enhance
                return auto_enhance(img)
            return img
            
        is_numpy = isinstance(img, np.ndarray)
        if is_numpy:
            h, w = img.shape[:2]
            tensor = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
            tensor = tensor.unsqueeze(0).to(self.device)
        else:
            tensor = img
            if tensor.dim() == 3:
                tensor = tensor.unsqueeze(0)
            tensor = tensor.to(self.device)
            h, w = tensor.shape[2:]
            
        # Pad to multiple of 16
        pad_h = (16 - (h % 16)) % 16
        pad_w = (16 - (w % 16)) % 16
        
        if pad_h > 0 or pad_w > 0:
            padded = F.pad(tensor, (0, pad_w, 0, pad_h), mode="reflect")
        else:
            padded = tensor
            
        with torch.no_grad():
            out = self.model(padded)
            
        # Unpad
        if pad_h > 0 or pad_w > 0:
            out = out[:, :, :h, :w]
            
        if is_numpy:
            out_np = out.squeeze(0).permute(1, 2, 0).cpu().numpy()
            return np.clip(out_np * 255.0, 0, 255).astype(np.uint8)
        else:
            return out.squeeze(0)

_global_restorer = None

def get_restorer(model_path: Optional[str] = None, device: Optional[str] = None) -> Restorer:
    global _global_restorer
    if _global_restorer is None or model_path is not None:
        _global_restorer = Restorer(model_path, device)
    return _global_restorer
