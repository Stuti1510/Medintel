"""
Training script for EfficientNet-B0 image classifier on PAD-UFES-20.
Class-weighted Cross-Entropy, AdamW with differential learning rates,
cosine annealing, AMP, degradation augmentation.
"""

import os
import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import argparse
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.cuda.amp import autocast, GradScaler
from sklearn.metrics import accuracy_score, f1_score, balanced_accuracy_score, roc_auc_score, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

from data.multimodal.dataset import PadUfesDataset
from vision.classification.image_model import EfficientNetB0Classifier
from vision.enhancement.infer_restore import get_restorer

def compute_ece(probs, labels, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == labels)
    
    ece = 0.0
    for i in range(n_bins):
        in_bin = (confidences > bin_boundaries[i]) & (confidences <= bin_boundaries[i + 1])
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
    return float(ece)

def train_image_classifier(fold=0, manifest_path="data/multimodal/manifest.csv",
                           enhance="none", epochs=20, batch_size=32,
                           lr_head=3e-4, lr_backbone=1e-4, seed=42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training EfficientNet-B0 on fold {fold} (enhance={enhance}) using device: {device}")
    
    restorer = None
    if enhance == "unet":
        unet_path = f"models/restore/unet_fold{fold}.pt"
        restorer = get_restorer(unet_path if os.path.exists(unet_path) else None)
    elif enhance == "classical":
        from vision.preprocessing.classical_enhance import auto_enhance
        restorer = auto_enhance
        
    train_dataset = PadUfesDataset(manifest_path, fold=fold, split="train", degrade_prob=0.5, restorer=restorer)
    val_dataset = PadUfesDataset(manifest_path, fold=fold, split="val", degrade_prob=0.0, restorer=restorer)
    test_dataset = PadUfesDataset(manifest_path, fold=fold, split="test", degrade_prob=0.0, restorer=restorer)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Class weights
    train_labels = [train_dataset[i]["label"] for i in range(len(train_dataset))]
    class_weights = compute_class_weight(class_weight="balanced", classes=np.unique(train_labels), y=train_labels)
    class_weights_t = torch.tensor(class_weights, dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_t)
    
    model = EfficientNetB0Classifier(num_classes=4, pretrained=True).to(device)
    
    # Differential learning rates
    optimizer = torch.optim.AdamW([
        {"params": model.backbone.parameters(), "lr": lr_backbone},
        {"params": model.classifier.parameters(), "lr": lr_head}
    ], weight_decay=1e-4)
    
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    scaler = GradScaler(enabled=(device.type == "cuda"))
    
    best_val_f1 = -1.0
    best_model_state = None
    save_dir = "models/image_cls"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, f"efficientnet_fold{fold}.pt")
    
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for batch in train_loader:
            imgs = batch["image"].to(device)
            labels = batch["label"].to(device)
            optimizer.zero_grad()
            
            with autocast(enabled=(device.type == "cuda")):
                logits = model(imgs)
                loss = criterion(logits, labels)
                
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item() * len(labels)
            
        train_loss /= len(train_dataset)
        scheduler.step()
        
        # Validation
        model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for batch in val_loader:
                imgs = batch["image"].to(device)
                logits = model(imgs)
                preds = torch.argmax(logits, dim=1).cpu().numpy()
                val_preds.extend(preds)
                val_targets.extend(batch["label"].numpy())
                
        val_f1 = f1_score(val_targets, val_preds, average="macro", zero_division=0)
        
        if epoch % 5 == 0 or epoch == epochs or val_f1 > best_val_f1:
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val Macro-F1: {val_f1:.4f}")
            
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_model_state = model.state_dict()
            torch.save(best_model_state, save_path)
            
    # Evaluation on test set
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
    model.eval()
    
    test_probs, test_targets = [], []
    with torch.no_grad():
        for batch in test_loader:
            imgs = batch["image"].to(device)
            logits = model(imgs)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            test_probs.append(probs)
            test_targets.extend(batch["label"].numpy())
            
    test_probs = np.vstack(test_probs)
    test_targets = np.array(test_targets)
    test_preds = np.argmax(test_probs, axis=1)
    
    acc = accuracy_score(test_targets, test_preds)
    macro_f1 = f1_score(test_targets, test_preds, average="macro", zero_division=0)
    bal_acc = balanced_accuracy_score(test_targets, test_preds)
    per_class_f1 = f1_score(test_targets, test_preds, average=None, zero_division=0).tolist()
    
    try:
        macro_auc = roc_auc_score(test_targets, test_probs, multi_class="ovr", average="macro")
    except Exception:
        macro_auc = 0.5
        
    ece = compute_ece(test_probs, test_targets)
    cm = confusion_matrix(test_targets, test_preds).tolist()
    
    metrics = {
        "fold": fold,
        "enhance": enhance,
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "balanced_accuracy": round(float(bal_acc), 4),
        "per_class_f1": [round(float(x), 4) for x in per_class_f1],
        "macro_auc": round(float(macro_auc), 4),
        "ece": round(float(ece), 4),
        "confusion_matrix": cm
    }
    
    out_dir = f"reports/multimodal/image_fold{fold}"
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Test Macro-F1: {macro_f1:.4f}, Accuracy: {acc:.4f}, Macro-AUC: {macro_auc:.4f}")
    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=0)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--enhance", type=str, default="none", choices=["none", "classical", "unet"])
    args = parser.parse_args()
    train_image_classifier(fold=args.fold, epochs=args.epochs, batch_size=args.batch_size, enhance=args.enhance)
