"""
Self-supervised training of U-Net restoration on PAD-UFES-20 clean training images.
Loss = L1 + 0.1 * (1 - SSIM).
Early stopping on validation PSNR.
"""

import os
import argparse
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.cuda.amp import autocast, GradScaler
import cv2
import piq

from vision.enhancement.unet_restore import UNetRestore
from vision.preprocessing.degradations import random_degrade

class RestorationDataset(Dataset):
    def __init__(self, df, crop_size=256, is_train=True):
        self.crop_size = crop_size
        self.is_train = is_train
        self.image_paths = []
        for _, row in df.iterrows():
            p = row["image_path"]
            if os.path.exists(p):
                self.image_paths.append(p)
            else:
                cand = os.path.join("data", "multimodal", "images", row["img_id"])
                if os.path.exists(cand):
                    self.image_paths.append(cand)
                    
    def __len__(self):
        return len(self.image_paths)
        
    def __getitem__(self, idx):
        path = self.image_paths[idx]
        bgr = cv2.imread(path)
        if bgr is None:
            rgb = np.zeros((self.crop_size, self.crop_size, 3), dtype=np.uint8)
        else:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            
        h, w = rgb.shape[:2]
        if h < self.crop_size or w < self.crop_size:
            rgb = cv2.resize(rgb, (max(w, self.crop_size), max(h, self.crop_size)))
            h, w = rgb.shape[:2]
            
        if self.is_train:
            top = random.randint(0, h - self.crop_size)
            left = random.randint(0, w - self.crop_size)
        else:
            top = (h - self.crop_size) // 2
            left = (w - self.crop_size) // 2
            
        target = rgb[top:top+self.crop_size, left:left+self.crop_size].copy()
        degraded = random_degrade(target)
        
        target_t = torch.from_numpy(target).permute(2, 0, 1).float() / 255.0
        degraded_t = torch.from_numpy(degraded).permute(2, 0, 1).float() / 255.0
        
        return degraded_t, target_t

def train_unet_restoration(fold=0, manifest_path="data/multimodal/manifest.csv", epochs=60, batch_size=16, lr=2e-4, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training U-Net Restoration on fold {fold} using device: {device}")
    
    df = pd.read_csv(manifest_path)
    k = fold
    val_fold = (k + 1) % 5
    
    train_df = df[(df["fold"] != k) & (df["fold"] != val_fold)].copy()
    val_df = df[df["fold"] == val_fold].copy()
    
    # Clean targets: blur and brightness both above training median
    med_blur = train_df["blur_laplacian_var"].median()
    med_bright = train_df["brightness_mean"].median()
    clean_train_df = train_df[(train_df["blur_laplacian_var"] >= med_blur) & (train_df["brightness_mean"] >= med_bright)].copy()
    if len(clean_train_df) < 50:
        clean_train_df = train_df
        
    print(f"Clean training images: {len(clean_train_df)}, Val images: {len(val_df)}")
    
    train_dataset = RestorationDataset(clean_train_df, crop_size=256, is_train=True)
    val_dataset = RestorationDataset(val_df, crop_size=256, is_train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    model = UNetRestore(in_channels=3, out_channels=3, residual=True).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    scaler = GradScaler(enabled=(device.type == "cuda"))
    
    l1_loss_fn = nn.L1Loss()
    
    best_psnr = -1.0
    save_dir = "models/restore"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, f"unet_fold{k}.pt")
    
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for degraded, target in train_loader:
            degraded, target = degraded.to(device), target.to(device)
            optimizer.zero_grad()
            
            with autocast(enabled=(device.type == "cuda")):
                restored = model(degraded)
                l1 = l1_loss_fn(restored, target)
                ssim = piq.ssim(restored, target, data_range=1.0)
                loss = l1 + 0.1 * (1.0 - ssim)
                
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item() * len(target)
            
        train_loss /= len(train_dataset)
        scheduler.step()
        
        # Validation PSNR
        model.eval()
        val_psnr = 0.0
        val_count = 0
        with torch.no_grad():
            for degraded, target in val_loader:
                degraded, target = degraded.to(device), target.to(device)
                restored = model(degraded)
                psnr = piq.psnr(restored, target, data_range=1.0)
                val_psnr += psnr.item() * len(target)
                val_count += len(target)
        val_psnr /= max(val_count, 1)
        
        if epoch % 5 == 0 or epoch == epochs or val_psnr > best_psnr:
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val PSNR: {val_psnr:.2f} dB")
            
        if val_psnr > best_psnr:
            best_psnr = val_psnr
            torch.save(model.state_dict(), save_path)
            
    print(f"Training completed! Best Val PSNR: {best_psnr:.2f} dB. Saved to {save_path}")
    return best_psnr

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=0)
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-4)
    args = parser.parse_args()
    train_unet_restoration(fold=args.fold, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
