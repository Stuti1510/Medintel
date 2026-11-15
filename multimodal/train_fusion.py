"""
Two-stage training of multimodal fusion classifiers.
Stage 1: Freeze EfficientNet, train projections + fusion head.
Stage 2: Unfreeze last EfficientNet block, fine-tune end-to-end.
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
from sklearn.metrics import accuracy_score, f1_score, balanced_accuracy_score, roc_auc_score, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

from data.multimodal.dataset import PadUfesDataset
from vision.classification.image_model import EfficientNetB0Classifier
from multimodal.fusion_model import MultimodalClassifier
from multimodal.text_features import compute_oof_svm_scores, get_empty_narrative_svm_score
from vision.preprocessing.degradations import apply_degradation

def train_fusion(fold: int = 0, fusion: str = "gated", manifest_path: str = "data/multimodal/manifest.csv",
                 stage1_epochs: int = 5, stage2_epochs: int = 5, batch_size: int = 32,
                 p_drop_text: float = 0.15, p_drop_img: float = 0.15, seed: int = 42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"=== Training {fusion.upper()} Fusion on Fold {fold} (device: {device}) ===")
    
    # Precompute or load OOF SVM scores
    svm_scores_df = compute_oof_svm_scores(fold=fold, manifest_path=manifest_path, seed=seed)
    svm_score_dict = {
        row["img_id"]: np.array([row["s0"], row["s1"], row["s2"], row["s3"]], dtype=np.float32)
        for _, row in svm_scores_df.iterrows()
    }
    empty_txt_score = get_empty_narrative_svm_score(fold=fold)
    
    # Datasets
    train_dataset = PadUfesDataset(manifest_path, fold=fold, split="train", degrade_prob=0.5)
    val_dataset = PadUfesDataset(manifest_path, fold=fold, split="val", degrade_prob=0.0)
    test_dataset = PadUfesDataset(manifest_path, fold=fold, split="test", degrade_prob=0.0)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Image Backbone (EfficientNet-B0)
    image_model = EfficientNetB0Classifier(num_classes=4, pretrained=True).to(device)
    # Load fold weights if available
    img_weights_path = f"models/image_cls/efficientnet_fold{fold}.pt"
    if os.path.exists(img_weights_path):
        image_model.load_state_dict(torch.load(img_weights_path, map_location=device))
        
    fusion_model = MultimodalClassifier(fusion=fusion, img_dim=1280, txt_dim=4, d=64, num_classes=4).to(device)
    
    # Class weights
    train_labels = [train_dataset[i]["label"] for i in range(len(train_dataset))]
    class_weights = compute_class_weight(class_weight="balanced", classes=np.unique(train_labels), y=train_labels)
    class_weights_t = torch.tensor(class_weights, dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_t)
    
    # STAGE 1: Freeze image backbone, train fusion head
    for param in image_model.parameters():
        param.requires_grad = False
        
    optimizer_s1 = torch.optim.AdamW(fusion_model.parameters(), lr=1e-3, weight_decay=1e-4)
    
    print("\n--- STAGE 1: Training Projections & Fusion Head ---")
    for epoch in range(1, stage1_epochs + 1):
        fusion_model.train()
        train_loss = 0.0
        for batch in train_loader:
            imgs = batch["image"].to(device)
            labels = batch["label"].to(device)
            qualities = torch.tensor(batch["quality"], dtype=torch.float32).unsqueeze(1).to(device)
            
            # Fetch SVM text scores with modality dropout
            txt_scores_batch = []
            for i, i_id in enumerate(batch["img_id"]):
                if np.random.rand() < p_drop_text:
                    txt_scores_batch.append(empty_txt_score)
                else:
                    txt_scores_batch.append(svm_score_dict.get(i_id, empty_txt_score))
            txt_scores = torch.tensor(np.array(txt_scores_batch), dtype=torch.float32).to(device)
            
            optimizer_s1.zero_grad()
            with torch.no_grad():
                img_feats = image_model.extract_features(imgs)
                
            logits, _ = fusion_model(img_feats, txt_scores, qualities)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer_s1.step()
            train_loss += loss.item() * len(labels)
            
        train_loss /= len(train_dataset)
        print(f"Stage 1 Epoch {epoch:02d}/{stage1_epochs:02d} | Train Loss: {train_loss:.4f}")
        
    # STAGE 2: Unfreeze last EfficientNet block, fine-tune end-to-end
    print("\n--- STAGE 2: Fine-Tuning Last Encoder Block & Fusion Head ---")
    # Unfreeze only the last stage of EfficientNet backbone
    for name, param in image_model.backbone.named_parameters():
        if "conv_head" in name or "bn2" in name or "blocks.6" in name:
            param.requires_grad = True
        else:
            param.requires_grad = False
            
    optimizer_s2 = torch.optim.AdamW([
        {"params": [p for p in image_model.parameters() if p.requires_grad], "lr": 2e-5},
        {"params": fusion_model.parameters(), "lr": 1e-4}
    ], weight_decay=1e-4)
    
    best_val_f1 = -1.0
    save_dir = "models/fusion"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, f"fusion_{fusion}_fold{fold}.pt")
    
    for epoch in range(1, stage2_epochs + 1):
        fusion_model.train()
        image_model.train()
        train_loss = 0.0
        
        for batch in train_loader:
            imgs = batch["image"].to(device)
            labels = batch["label"].to(device)
            qualities = torch.tensor(batch["quality"], dtype=torch.float32).unsqueeze(1).to(device)
            
            txt_scores_batch = []
            for i, i_id in enumerate(batch["img_id"]):
                if np.random.rand() < p_drop_text:
                    txt_scores_batch.append(empty_txt_score)
                else:
                    txt_scores_batch.append(svm_score_dict.get(i_id, empty_txt_score))
            txt_scores = torch.tensor(np.array(txt_scores_batch), dtype=torch.float32).to(device)
            
            optimizer_s2.zero_grad()
            img_feats = image_model.extract_features(imgs)
            logits, _ = fusion_model(img_feats, txt_scores, qualities)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer_s2.step()
            train_loss += loss.item() * len(labels)
            
        train_loss /= len(train_dataset)
        
        # Validation
        fusion_model.eval()
        image_model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for batch in val_loader:
                imgs = batch["image"].to(device)
                qualities = torch.tensor(batch["quality"], dtype=torch.float32).unsqueeze(1).to(device)
                txt_scores = torch.tensor(np.array([svm_score_dict.get(idx, empty_txt_score) for idx in batch["img_id"]]), dtype=torch.float32).to(device)
                img_feats = image_model.extract_features(imgs)
                logits, _ = fusion_model(img_feats, txt_scores, qualities)
                preds = torch.argmax(logits, dim=1).cpu().numpy()
                val_preds.extend(preds)
                val_targets.extend(batch["label"].numpy())
                
        val_f1 = f1_score(val_targets, val_preds, average="macro", zero_division=0)
        print(f"Stage 2 Epoch {epoch:02d}/{stage2_epochs:02d} | Train Loss: {train_loss:.4f} | Val Macro-F1: {val_f1:.4f}")
        
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            torch.save({
                "fusion_model": fusion_model.state_dict(),
                "image_encoder": image_model.state_dict()
            }, save_path)
            
    # Test evaluation
    checkpoint = torch.load(save_path, map_location=device)
    fusion_model.load_state_dict(checkpoint["fusion_model"])
    image_model.load_state_dict(checkpoint["image_encoder"])
    fusion_model.eval()
    image_model.eval()
    
    test_probs, test_targets, gate_weights = [], [], []
    with torch.no_grad():
        for batch in test_loader:
            imgs = batch["image"].to(device)
            qualities = torch.tensor(batch["quality"], dtype=torch.float32).unsqueeze(1).to(device)
            txt_scores = torch.tensor(np.array([svm_score_dict.get(idx, empty_txt_score) for idx in batch["img_id"]]), dtype=torch.float32).to(device)
            img_feats = image_model.extract_features(imgs)
            logits, g_weights = fusion_model(img_feats, txt_scores, qualities)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            test_probs.append(probs)
            test_targets.extend(batch["label"].numpy())
            gate_weights.extend(g_weights.cpu().numpy())
            
    test_probs = np.vstack(test_probs)
    test_targets = np.array(test_targets)
    test_preds = np.argmax(test_probs, axis=1)
    
    acc = accuracy_score(test_targets, test_preds)
    macro_f1 = f1_score(test_targets, test_preds, average="macro", zero_division=0)
    bal_acc = balanced_accuracy_score(test_targets, test_preds)
    per_class_f1 = f1_score(test_targets, test_preds, average=None, zero_division=0).tolist()
    mean_gate = float(np.mean(gate_weights))
    
    try:
        macro_auc = roc_auc_score(test_targets, test_probs, multi_class="ovr", average="macro")
    except Exception:
        macro_auc = 0.5
        
    cm = confusion_matrix(test_targets, test_preds).tolist()
    
    metrics = {
        "fold": fold,
        "fusion": fusion,
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "balanced_accuracy": round(float(bal_acc), 4),
        "per_class_f1": [round(float(x), 4) for x in per_class_f1],
        "macro_auc": round(float(macro_auc), 4),
        "mean_gate_weight": round(mean_gate, 4),
        "confusion_matrix": cm
    }
    
    out_dir = f"reports/multimodal/fusion_{fusion}_fold{fold}"
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\nFinal {fusion.upper()} Test Results -> Accuracy: {acc:.4f}, Macro-F1: {macro_f1:.4f}, Mean Image Weight: {mean_gate:.4f}")
    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=0)
    parser.add_argument("--fusion", type=str, default="gated", choices=["late", "concat", "gated"])
    parser.add_argument("--stage1-epochs", type=int, default=5)
    parser.add_argument("--stage2-epochs", type=int, default=5)
    args = parser.parse_args()
    train_fusion(fold=args.fold, fusion=args.fusion, stage1_epochs=args.stage1_epochs, stage2_epochs=args.stage2_epochs)
