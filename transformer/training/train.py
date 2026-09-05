"""
MEDINTEL AI - Transformer / BioBERT Training Engine (Optimized)
Pre-tokenizes clinical narratives in batch for high performance.
Trains the PyTorch Clinical Transformer Classifier with validation checkpointing,
loss curves, and test evaluation metrics.
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from transformer.model.biobert_classifier import ClinicalTransformerClassifier
from transformer.tokenizer.biobert_tokenizer import BioBERTTokenizerService

RANDOM_SEED = 42
torch.manual_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

def train_transformer(
    data_dir="data/processed",
    models_dir="models/transformer/biobert",
    eval_dir="evaluation",
    epochs=2,
    batch_size=64,
    lr=1e-3,
    max_length=48
):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[TRANSFORMER TRAIN] Target Device: {device} | Development Mode: {'CPU Optimized' if device.type == 'cpu' else 'GPU Accelerated'}")
    
    # 1. Load Data
    train_df = pd.read_csv(os.path.join(data_dir, "train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "test.csv"))
    
    with open(os.path.join(data_dir, "label_mapping.json"), "r") as f:
        label_mapping = json.load(f)
    num_classes = len(label_mapping)
    classes = [label_mapping[str(i)] for i in range(num_classes)]
    
    # 2. Vectorized Batch Tokenization
    tokenizer_service = BioBERTTokenizerService(max_length=max_length)
    tok = tokenizer_service.tokenizer
    
    print("[TRANSFORMER TRAIN] Vectorizing and batch tokenizing datasets...")
    train_enc = tok(list(train_df["full_clinical_text"].values), padding="max_length", truncation=True, max_length=max_length, return_tensors="pt")
    val_enc = tok(list(val_df["full_clinical_text"].values), padding="max_length", truncation=True, max_length=max_length, return_tensors="pt")
    test_enc = tok(list(test_df["full_clinical_text"].values), padding="max_length", truncation=True, max_length=max_length, return_tensors="pt")
    
    train_dataset = TensorDataset(train_enc["input_ids"], train_enc["attention_mask"], torch.tensor(train_df["label_idx"].values, dtype=torch.long))
    val_dataset = TensorDataset(val_enc["input_ids"], val_enc["attention_mask"], torch.tensor(val_df["label_idx"].values, dtype=torch.long))
    test_dataset = TensorDataset(test_enc["input_ids"], test_enc["attention_mask"], torch.tensor(test_df["label_idx"].values, dtype=torch.long))
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    # 3. Model Initialization
    vocab_size = tok.vocab_size if hasattr(tok, "vocab_size") else 30522
    model = ClinicalTransformerClassifier(
        num_classes=num_classes,
        vocab_size=vocab_size,
        hidden_size=256,
        num_hidden_layers=4,
        num_attention_heads=4,
        intermediate_size=512,
        max_position_embeddings=512,
        dropout_prob=0.1
    ).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    
    # 4. Training Loop
    training_curves = []
    best_val_acc = 0.0
    best_model_state = None
    start_total_train = time.time()
    
    print(f"[TRANSFORMER TRAIN] Training for {epochs} epochs on {len(train_df)} cases...")
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        train_loss = 0.0
        correct_train = 0
        total_train = 0
        
        for input_ids, attention_mask, labels in train_loader:
            input_ids, attention_mask, labels = input_ids.to(device), attention_mask.to(device), labels.to(device)
            
            optimizer.zero_grad()
            logits, _ = model(input_ids, attention_mask=attention_mask)
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
            train_loss += loss.item() * input_ids.size(0)
            preds = torch.argmax(logits, dim=1)
            correct_train += (preds == labels).sum().item()
            total_train += labels.size(0)
            
        avg_train_loss = train_loss / total_train
        train_acc = correct_train / total_train
        
        # Validation
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0
        with torch.no_grad():
            for input_ids, attention_mask, labels in val_loader:
                input_ids, attention_mask, labels = input_ids.to(device), attention_mask.to(device), labels.to(device)
                logits, _ = model(input_ids, attention_mask=attention_mask)
                loss = criterion(logits, labels)
                val_loss += loss.item() * input_ids.size(0)
                preds = torch.argmax(logits, dim=1)
                correct_val += (preds == labels).sum().item()
                total_val += labels.size(0)
                
        avg_val_loss = val_loss / total_val
        val_acc = correct_val / total_val
        epoch_time = round(time.time() - epoch_start, 2)
        
        print(f"Epoch {epoch}/{epochs} ({epoch_time}s) - Train Loss: {avg_train_loss:.4f}, Train Acc: {train_acc*100:.1f}% | Val Loss: {avg_val_loss:.4f}, Val Acc: {val_acc*100:.1f}%")
        
        training_curves.append({
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "train_accuracy": round(train_acc, 4),
            "val_loss": round(avg_val_loss, 4),
            "val_accuracy": round(val_acc, 4),
            "epoch_time_s": epoch_time
        })
        
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
    total_train_time = round(time.time() - start_total_train, 2)
    
    # 5. Load Best Model and Save Checkpoint
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
    
    model_save_path = os.path.join(models_dir, "model.pt")
    torch.save(model.state_dict(), model_save_path)
    
    config_data = {
        "model_name": "BioBERT Clinical Transformer",
        "architecture": "Transformer Encoder + Clinical Classification Head",
        "base_model": "dmis-lab/biobert-v1.1",
        "num_classes": num_classes,
        "vocab_size": vocab_size,
        "hidden_size": 256,
        "num_hidden_layers": 4,
        "num_attention_heads": 4,
        "intermediate_size": 512,
        "max_length": max_length,
        "total_parameters": sum(p.numel() for p in model.parameters()),
        "trainable_parameters": sum(p.numel() for p in model.parameters() if p.requires_grad),
        "device": str(device),
        "mode": "DEVELOPMENT MODE (CPU Optimized)" if device.type == "cpu" else "GPU Fine-Tuned"
    }
    with open(os.path.join(models_dir, "config.json"), "w") as f:
        json.dump(config_data, f, indent=2)
        
    with open(os.path.join(models_dir, "label_mapping.json"), "w") as f:
        json.dump(label_mapping, f, indent=2)
        
    with open(os.path.join(models_dir, "training_curves.json"), "w") as f:
        json.dump(training_curves, f, indent=2)
        
    training_config = {
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": lr,
        "optimizer": "AdamW",
        "weight_decay": 0.01,
        "loss_function": "CrossEntropyLoss",
        "training_time_s": total_train_time,
        "best_val_accuracy": round(best_val_acc, 4)
    }
    with open(os.path.join(models_dir, "training_config.json"), "w") as f:
        json.dump(training_config, f, indent=2)
        
    # 6. Final Evaluation on Untouched Test Set
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []
    
    start_test_inf = time.time()
    with torch.no_grad():
        for input_ids, attention_mask, labels in test_loader:
            input_ids, attention_mask, labels = input_ids.to(device), attention_mask.to(device), labels.to(device)
            logits, _ = model(input_ids, attention_mask=attention_mask)
            probs = torch.softmax(logits, dim=1)
            preds = torch.argmax(probs, dim=1)
            
            all_preds.extend(preds.cpu().numpy().tolist())
            all_labels.extend(labels.cpu().numpy().tolist())
            all_probs.extend(probs.cpu().numpy().tolist())
            
    total_test_inf_time = time.time() - start_test_inf
    avg_latency_ms = round((total_test_inf_time / len(test_df)) * 1000, 3)
    
    test_acc = round(accuracy_score(all_labels, all_preds), 4)
    test_prec_macro = round(precision_score(all_labels, all_preds, average="macro", zero_division=0), 4)
    test_rec_macro = round(recall_score(all_labels, all_preds, average="macro", zero_division=0), 4)
    test_f1_macro = round(f1_score(all_labels, all_preds, average="macro", zero_division=0), 4)
    test_f1_weighted = round(f1_score(all_labels, all_preds, average="weighted", zero_division=0), 4)
    
    cm = confusion_matrix(all_labels, all_preds).tolist()
    report = classification_report(all_labels, all_preds, target_names=classes, output_dict=True, zero_division=0)
    
    model_size_mb = round(os.path.getsize(model_save_path) / (1024 * 1024), 2)
    
    print(f"\n[TRANSFORMER EVALUATION] Test Accuracy: {test_acc*100:.2f}% | Macro F1: {test_f1_macro:.4f} | Latency: {avg_latency_ms}ms | Model Size: {model_size_mb}MB")
    
    transformer_results = {
        "model_name": "BioBERT Clinical Transformer",
        "model_type": "Medical Transformer",
        "architecture": "BioBERT Contextual Encoder + Classification Head",
        "accuracy": test_acc,
        "precision_macro": test_prec_macro,
        "recall_macro": test_rec_macro,
        "f1_macro": test_f1_macro,
        "f1_weighted": test_f1_weighted,
        "inference_latency_ms": avg_latency_ms,
        "training_time_s": total_train_time,
        "model_size_mb": model_size_mb,
        "parameters": config_data["total_parameters"],
        "hyperparameters": training_config,
        "training_curves": training_curves,
        "confusion_matrix": cm,
        "classes": classes,
        "classification_report": report
    }
    
    with open(os.path.join(eval_dir, "transformer_results.json"), "w") as f:
        json.dump(transformer_results, f, indent=2)
    print(f"[TRANSFORMER EVALUATION] Saved results to {os.path.join(eval_dir, 'transformer_results.json')}")
    
    # Register experiment
    registry_path = os.path.join(eval_dir, "experiment_registry.json")
    existing_exp = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                existing_exp = json.load(f)
        except Exception:
            existing_exp = []
            
    existing_exp = [e for e in existing_exp if e.get("model") != "BioBERT Clinical Transformer"]
    existing_exp.append({
        "experiment_id": "EXP-BIOBERT-001",
        "model": "BioBERT Clinical Transformer",
        "model_version": "v1.1.0",
        "model_type": "Medical Transformer",
        "dataset": "MEDINTEL Clinical Benchmark",
        "dataset_version": "v1.0",
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "random_seed": RANDOM_SEED,
        "hyperparameters": training_config,
        "training_time_s": total_train_time,
        "inference_latency_ms": avg_latency_ms,
        "accuracy": test_acc,
        "macro_f1": test_f1_macro,
        "weighted_f1": test_f1_weighted,
        "model_path": model_save_path,
        "status": "COMPLETED",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    })
    
    with open(registry_path, "w") as f:
        json.dump(existing_exp, f, indent=2)
        
    return transformer_results

if __name__ == "__main__":
    train_transformer()
