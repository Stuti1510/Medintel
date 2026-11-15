import os
import random
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as T
import cv2

# ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_train_transforms():
    return T.Compose([
        T.RandomResizedCrop(224, scale=(0.7, 1.0)),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(),
        T.RandomRotation(degrees=20),
        T.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.05),
    ])

def get_val_transforms():
    return T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
    ])

def apply_text_dropout(text, p=0.0):
    """Randomly drop sentences with probability p."""
    if p <= 0.0 or not text:
        return text
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    if not sentences:
        return text
    kept = [s for s in sentences if random.random() >= p]
    if not kept:
        # Keep at least one sentence if all dropped
        kept = [random.choice(sentences)]
    return ". ".join(kept) + "."

class PadUfesDataset(Dataset):
    def __init__(self, manifest, fold=0, split="train", transform=None, degrade_prob=0.0, text_dropout=0.0, restorer=None, ref_stats=None):
        """
        manifest: DataFrame or path to manifest.csv
        fold: current test fold k (0..4)
        split: 'train', 'val', or 'test'
            - test: fold == k
            - val: fold == (k + 1) % 5
            - train: all other 3 folds
        """
        super().__init__()
        if isinstance(manifest, str):
            self.df = pd.read_csv(manifest)
        else:
            self.df = manifest.copy()
            
        self.fold = fold
        self.split = split
        self.degrade_prob = degrade_prob
        self.text_dropout = text_dropout
        self.restorer = restorer
        self.ref_stats = ref_stats
        
        # Filter by fold according to the rule:
        # Fold k = test, (k+1)%5 = validation, the rest = training
        k = self.fold
        val_fold = (k + 1) % 5
        
        if split == "test":
            self.df = self.df[self.df["fold"] == k].reset_index(drop=True)
        elif split == "val":
            self.df = self.df[self.df["fold"] == val_fold].reset_index(drop=True)
        elif split == "train":
            self.df = self.df[(self.df["fold"] != k) & (self.df["fold"] != val_fold)].reset_index(drop=True)
        elif split == "all":
            self.df = self.df.reset_index(drop=True)
        else:
            raise ValueError(f"Unknown split: {split}")
            
        # Transform setup
        if transform is not None:
            self.transform = transform
        else:
            if split == "train":
                self.transform = get_train_transforms()
            else:
                self.transform = get_val_transforms()
                
        self.normalize = T.Compose([
            T.ToTensor(),
            T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
        ])
        
    def __len__(self):
        return len(self.df)
        
    def compute_quality(self, img_np):
        """Estimate quality score q in [0, 1]."""
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
        bright = float(lab[:, :, 0].mean())
        
        # Map to [0, 1] using reference percentiles if provided, else standard sigmoid/clipping
        if self.ref_stats:
            b_min, b_max = self.ref_stats.get("blur_range", (10.0, 500.0))
            q_blur = np.clip((blur_var - b_min) / max(b_max - b_min, 1e-5), 0.0, 1.0)
            # Brightness optimal between 40 and 70
            q_bright = 1.0 - min(abs(bright - 55.0) / 45.0, 1.0)
        else:
            q_blur = np.clip(blur_var / 300.0, 0.0, 1.0)
            q_bright = 1.0 - min(abs(bright - 55.0) / 50.0, 1.0)
            
        q = float(0.6 * q_blur + 0.4 * q_bright)
        return np.clip(q, 0.0, 1.0)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_id = row["img_id"]
        label = int(row["label"])
        text = str(row["narrative"])
        
        # Text dropout in training
        if self.split == "train" and self.text_dropout > 0:
            text = apply_text_dropout(text, self.text_dropout)
            
        # Load image
        img_path = str(row.get("image_path", ""))
        # Normalize relative path to workspace
        if not os.path.exists(img_path):
            cand = os.path.join("data", "multimodal", "images", img_id)
            if os.path.exists(cand):
                img_path = cand
            else:
                img_path = os.path.join("data", "raw", "pad_ufes_20", "images", img_id)
                
        if os.path.exists(img_path):
            img_bgr = cv2.imread(img_path)
            if img_bgr is not None:
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            else:
                img_rgb = np.full((224, 224, 3), 128, dtype=np.uint8)
        else:
            img_rgb = np.full((224, 224, 3), 128, dtype=np.uint8)
            
        # Apply degradation augmentation if training and requested
        if self.split == "train" and self.degrade_prob > 0 and random.random() < self.degrade_prob:
            from vision.preprocessing.degradations import random_degrade
            img_rgb = random_degrade(img_rgb)
            
        # Raw image (before normalization)
        image_raw = img_rgb.copy()
        
        # Calculate quality score
        quality = float(self.compute_quality(img_rgb))
        
        # Optional restoration
        if self.restorer is not None:
            img_rgb = self.restorer(img_rgb)
            
        # PIL transform
        pil_img = Image.fromarray(img_rgb)
        if self.transform is not None:
            pil_img = self.transform(pil_img)
            
        image_tensor = self.normalize(pil_img)
        
        return {
            "image": image_tensor,
            "image_raw": image_raw,
            "text": text,
            "quality": quality,
            "label": label,
            "img_id": img_id
        }
