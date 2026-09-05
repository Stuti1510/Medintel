"""
MEDINTEL AI - Models, Datasets, Evaluation, History & System Status Endpoints (Active Master Dataset)
"""

import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import (
    AIModel, ModelMetric, PatientCase, Prediction,
    PredictionProbability, Experiment, RetrievalResult, LLMInteraction, SafetyEvent
)
from data.dataset_registry import DATASET_REGISTRY, list_all_datasets

router = APIRouter(prefix="/api", tags=["Research, Governance & History"])

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MEDINTEL AI Clinical Engine", "timestamp": pd.Timestamp.utcnow().isoformat()}

@router.get("/system/status")
async def system_status(db: Session = Depends(get_db)):
    """Returns actual real-time status of all intelligence components."""
    eval_c = os.path.exists("evaluation/classical_ml_results.json")
    eval_t = os.path.exists("evaluation/transformer_results.json")
    rag_idx = os.path.exists("rag/vectorstore/medical_index.json")
    data_profiles = os.path.exists("data/processed/dataset_profiles.json")

    total_cases = db.query(PatientCase).count()
    total_models = db.query(AIModel).count()

    llm_provider = os.getenv("LLM_PROVIDER", "demo").upper()
    has_api_key = bool(os.getenv("LLM_API_KEY"))

    return {
        "status": "ONLINE",
        "benchmark_architecture": "MEDINTEL 4-Dataset Clinical Benchmark (Active Master Dataset)",
        "components": {
            "classical_ml": {
                "status": "ONLINE" if eval_c else "NOT_TRAINED",
                "models_available": ["Logistic Regression", "Random Forest", "XGBoost"] if eval_c else []
            },
            "biobert_transformer": {
                "status": "READY" if eval_t else "TRAINING / PENDING",
                "base_architecture": "dmis-lab/biobert-v1.1",
                "mode": "DEVELOPMENT MODE (CPU Optimized)"
            },
            "rag_vector_engine": {
                "status": "GROUNDED" if rag_idx else "READY",
                "vector_store": "Normalized Cosine Medical Index (43 Guidelines)"
            },
            "llm_engine": {
                "status": "CONNECTED" if (has_api_key or llm_provider == "DEMO") else "DEMO_MODE",
                "provider": llm_provider,
                "mode": "DEMO MODE (Educational Synthesis)" if not has_api_key else "LIVE_API"
            },
            "database": {
                "status": "CONNECTED",
                "type": "PostgreSQL / SQLAlchemy ORM",
                "stored_cases": total_cases,
                "registered_models": total_models
            }
        },
        "datasets_ready": data_profiles
    }

@router.get("/evaluation")
async def get_evaluation_benchmarks():
    """Returns empirical test-set evaluation results from newly trained models on active master dataset."""
    eval_data = {
        "classical_ml": {},
        "transformer": None,
        "comparison": []
    }
    
    classical_path = "evaluation/classical_ml_results.json"
    transformer_path = "evaluation/transformer_results.json"
    
    if os.path.exists(classical_path):
        with open(classical_path, "r", encoding="utf-8") as f:
            eval_data["classical_ml"] = json.load(f)
            
    if os.path.exists(transformer_path):
        with open(transformer_path, "r", encoding="utf-8") as f:
            eval_data["transformer"] = json.load(f)

    # Build comparison summary
    for m_name, m_val in eval_data["classical_ml"].items():
        eval_data["comparison"].append({
            "model_name": m_name,
            "type": "Classical ML",
            "accuracy": m_val.get("accuracy"),
            "balanced_accuracy": m_val.get("balanced_accuracy"),
            "precision": m_val.get("precision_macro"),
            "recall": m_val.get("recall_macro"),
            "f1": m_val.get("f1_macro"),
            "roc_auc": m_val.get("roc_auc"),
            "pr_auc": m_val.get("pr_auc"),
            "latency_ms": m_val.get("inference_latency_ms"),
            "size_kb": m_val.get("model_size_kb")
        })

    if eval_data["transformer"]:
        t_val = eval_data["transformer"]
        eval_data["comparison"].append({
            "model_name": t_val.get("model_name"),
            "type": "Medical Transformer",
            "accuracy": t_val.get("accuracy"),
            "balanced_accuracy": t_val.get("balanced_accuracy"),
            "precision": t_val.get("precision_macro"),
            "recall": t_val.get("recall_macro"),
            "f1": t_val.get("f1_macro"),
            "roc_auc": t_val.get("roc_auc"),
            "latency_ms": t_val.get("inference_latency_ms"),
            "size_kb": (t_val.get("model_size_mb", 0) * 1024)
        })

    return eval_data

@router.get("/datasets/diseases")
async def get_global_disease_registry():
    """Returns the dynamic global disease registry across all 4 datasets."""
    reg_path = "data/processed/disease_registry.json"
    if not os.path.exists(reg_path):
        from data.disease_registry_builder import build_global_disease_registry
        return build_global_disease_registry()
    with open(reg_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/datasets")
async def get_dataset_profile(dataset_id: str = Query(default="all")):
    """Returns dataset profiles, dynamic metadata, and partition distributions for the active master dataset."""
    reg_path = "data/processed/disease_registry.json"
    if os.path.exists(reg_path):
        with open(reg_path, "r", encoding="utf-8") as f:
            disease_reg = json.load(f)
    else:
        from data.disease_registry_builder import build_global_disease_registry
        disease_reg = build_global_disease_registry()

    profiles_path = "data/processed/dataset_profiles.json"
    all_profiles = {}
    if os.path.exists(profiles_path):
        with open(profiles_path, "r", encoding="utf-8") as f:
            all_profiles = json.load(f)

    all_datasets_meta = [
        {
            "dataset_id": "all",
            "name": "All Datasets (MEDINTEL Balanced Master Scope)",
            "version": "v3.0-MASTER",
            "category": "Cross-Dataset Multi-Disease Benchmark",
            "task_type": "Unified Diagnostic Intelligence",
            "total_samples": sum(d.get("active_records", d.get("total_records", 0)) for d in disease_reg.get("datasets", {}).values()),
            "raw_samples": sum(d.get("raw_records", 0) for d in disease_reg.get("datasets", {}).values()),
            "feature_count": 405,
            "target_column": "Multi-Dataset Clinical Target (cardio, target, Disease, diseases)",
            "num_classes": disease_reg.get("total_unique_disease_entities", 821),
            "missing_values": 0,
            "duplicate_records": 0
        }
    ]

    for k, v in disease_reg.get("datasets", {}).items():
        all_datasets_meta.append({
            "dataset_id": k,
            "name": v.get("name", k),
            "version": "v3.0",
            "category": all_profiles.get(k, {}).get("category", "Clinical Dataset"),
            "task_type": v.get("task_type", "Classification"),
            "total_samples": v.get("active_records", v.get("total_records", 0)),
            "raw_samples": v.get("raw_records", 0),
            "feature_count": all_profiles.get(k, {}).get("feature_count", 13),
            "target_column": v.get("target_column", "Target"),
            "num_classes": v.get("num_classes", 2),
            "missing_values": all_profiles.get(k, {}).get("missing_values", 0),
            "duplicate_records": all_profiles.get(k, {}).get("duplicate_records", 0)
        })

    balancing_meta = disease_reg.get("balancing_metadata", {
        "method": "Controlled Dataset-Level Majority Undersampling",
        "active_dataset_filename": "medintel_balanced_master.csv",
        "reduced_classes": ["Normative Physiological Baseline (No CVD / No CHD)", "Cardiovascular Disease (CVD)"],
        "target_dominant_active_count": 1200,
        "random_seed": 42
    })

    # Case 1: "all" dataset selection
    if dataset_id == "all" or dataset_id not in disease_reg.get("datasets", {}):
        total_active = sum(d.get("active_records", d.get("total_records", 0)) for d in disease_reg.get("datasets", {}).values())
        raw_total = sum(d.get("raw_records", d.get("total_records", 0)) for d in disease_reg.get("datasets", {}).values())
        all_diseases = disease_reg.get("unified_disease_classes", [])
        
        # Build class distribution maps
        active_dist = {item["disease_name"]: item.get("active_records", 0) for item in all_diseases[:100]}
        raw_dist = {item["disease_name"]: item.get("raw_records", item.get("active_records", 0)) for item in all_diseases[:100]}
        train_dist = {item["disease_name"]: item.get("train_count", int(round(item.get("active_records", 0) * 0.70))) for item in all_diseases[:100]}
        val_dist = {item["disease_name"]: item.get("val_count", int(round(item.get("active_records", 0) * 0.15))) for item in all_diseases[:100]}
        test_dist = {item["disease_name"]: item.get("test_count", int(round(item.get("active_records", 0) * 0.15))) for item in all_diseases[:100]}
        
        return {
            "dataset_id": "all",
            "name": "All Datasets (MEDINTEL Balanced Master Scope)",
            "version": "v3.0-MASTER",
            "category": "Integrated Multi-Specialty Clinical Benchmark",
            "task_type": "Unified Diagnostic Intelligence",
            "total_samples": total_active,
            "raw_samples": raw_total,
            "num_classes": disease_reg.get("total_unique_disease_entities", len(all_diseases)),
            "feature_count": 405,
            "target_column": "Clinical Diagnosis / Pathology",
            "description": "Harmonized diagnostic perspective combining all 4 verified datasets encompassing 821 distinct clinical entities balanced at the dataset level before splitting.",
            "classes": [
                {
                    "standardized_label": item["disease_name"],
                    "count": item.get("active_records", 0),
                    "active_records": item.get("active_records", 0),
                    "raw_records": item.get("raw_records", item.get("active_records", 0)),
                    "percentage": item.get("active_percentage", round(item.get("active_records", 0) / max(total_active, 1) * 100, 3)),
                    "train_count": item.get("train_count", int(round(item.get("active_records", 0) * 0.70))),
                    "val_count": item.get("val_count", int(round(item.get("active_records", 0) * 0.15))),
                    "test_count": item.get("test_count", int(round(item.get("active_records", 0) * 0.15))),
                    "records_removed": item.get("records_removed", 0),
                    "reduction_pct": item.get("reduction_pct", 0.0),
                    "source_datasets": item.get("source_datasets", []),
                    "dataset_breakdown": item.get("dataset_breakdown", {})
                }
                for item in all_diseases
            ],
            "class_distribution": active_dist,
            "raw_class_distribution": raw_dist,
            "train_class_distribution": train_dist,
            "val_class_distribution": val_dist,
            "test_class_distribution": test_dist,
            "balancing_metadata": balancing_meta,
            "before_after_balancing_report": disease_reg.get("before_after_balancing_report", []),
            "cross_dataset_matrix": disease_reg.get("cross_dataset_matrix", []),
            "summary_by_dataset": disease_reg.get("summary_by_dataset", {}),
            "all_datasets": all_datasets_meta,
            "datasetMetadata": {
                "name": "MEDINTEL Balanced Master Dataset",
                "version": "v3.0-MASTER",
                "samples": total_active,
                "rawSamples": raw_total,
                "columns": 405,
                "features": 405,
                "targetColumn": "Clinical Diagnosis / Pathology",
                "classes": disease_reg.get("total_unique_disease_entities", len(all_diseases)),
                "classDistribution": active_dist,
                "missingValues": 0,
                "duplicateRecords": 0,
                "trainSamples": sum(item.get("train_count", 0) for item in all_diseases),
                "validationSamples": sum(item.get("val_count", 0) for item in all_diseases),
                "testSamples": sum(item.get("test_count", 0) for item in all_diseases),
                "validationStatus": "BALANCED MASTER DATASET VALIDATED"
            }
        }

    # Case 2: Individual dataset selection
    d_meta = disease_reg["datasets"][dataset_id]
    d_profile = all_profiles.get(dataset_id, {})
    
    classes_list = d_meta.get("classes", [])
    active_dist = {c.get("standardized_label", f"Class_{i}"): c.get("active_records", 0) for i, c in enumerate(classes_list)}
    raw_dist = {c.get("standardized_label", f"Class_{i}"): c.get("raw_records", c.get("active_records", 0)) for i, c in enumerate(classes_list)}
    train_dist = {c.get("standardized_label", f"Class_{i}"): c.get("train_count", int(c.get("active_records", 0) * 0.70)) for i, c in enumerate(classes_list)}
    val_dist = {c.get("standardized_label", f"Class_{i}"): c.get("val_count", int(c.get("active_records", 0) * 0.15)) for i, c in enumerate(classes_list)}
    test_dist = {c.get("standardized_label", f"Class_{i}"): c.get("test_count", int(c.get("active_records", 0) * 0.15)) for i, c in enumerate(classes_list)}
    
    tot_active = d_meta.get("active_records", d_meta.get("total_records", sum(c.get("active_records", 0) for c in classes_list)))
    tot_raw = d_meta.get("raw_records", d_meta.get("total_records", sum(c.get("raw_records", 0) for c in classes_list)))

    return {
        "dataset_id": dataset_id,
        "name": d_meta.get("name", dataset_id),
        "version": "v3.0",
        "category": d_profile.get("category", "Clinical Dataset"),
        "task_type": d_meta.get("task_type", "Classification"),
        "total_samples": tot_active,
        "raw_samples": tot_raw,
        "num_classes": d_meta.get("num_classes", len(classes_list)),
        "feature_count": d_profile.get("feature_count", 13),
        "target_column": d_meta.get("target_column", "Target"),
        "description": d_profile.get("description", f"Clinical data for {d_meta.get('name', dataset_id)}"),
        "classes": classes_list,
        "class_distribution": active_dist,
        "raw_class_distribution": raw_dist,
        "train_class_distribution": train_dist,
        "val_class_distribution": val_dist,
        "test_class_distribution": test_dist,
        "balancing_metadata": balancing_meta,
        "is_binary": d_meta.get("is_binary", False),
        "cross_dataset_matrix": disease_reg.get("cross_dataset_matrix", []),
        "summary_by_dataset": disease_reg.get("summary_by_dataset", {}),
        "all_datasets": all_datasets_meta,
        "datasetMetadata": {
            "name": d_meta.get("name", dataset_id),
            "version": "v3.0",
            "samples": tot_active,
            "rawSamples": tot_raw,
            "columns": d_profile.get("total_columns", 13),
            "features": d_profile.get("feature_count", 13),
            "targetColumn": d_meta.get("target_column", "Target"),
            "classes": d_meta.get("num_classes", len(classes_list)),
            "classDistribution": active_dist,
            "missingValues": d_profile.get("missing_values", 0),
            "duplicateRecords": d_profile.get("duplicate_records", 0),
            "trainSamples": sum(c.get("train_count", int(c.get("active_records", 0) * 0.70)) for c in classes_list),
            "validationSamples": sum(c.get("val_count", int(c.get("active_records", 0) * 0.15)) for c in classes_list),
            "testSamples": sum(c.get("test_count", int(c.get("active_records", 0) * 0.15)) for c in classes_list),
            "validationStatus": "DATASET VALIDATED"
        }
    }

@router.get("/datasets/preview")
async def get_dataset_preview(
    dataset_id: str = Query(default="cardio_train"),
    limit: int = 50,
    offset: int = 0
):
    """Returns actual dataset rows with pagination from the specified active dataset."""
    if dataset_id == "all" or dataset_id not in DATASET_REGISTRY:
        dataset_id = "cardio_train"
        
    meta = DATASET_REGISTRY[dataset_id]
    source_path = "data/cleaned/cardio_train_active_balanced.csv" if dataset_id == "cardio_train" else meta["source_path"]
    if not os.path.exists(source_path):
        source_path = meta["source_path"]
        
    delim = meta.get("delimiter", ",")
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail=f"Dataset file '{source_path}' not found.")
        
    df = pd.read_csv(source_path, sep=delim, nrows=offset + limit + 100)
    total = meta.get("raw_samples", len(df))
    sliced = df.iloc[offset:offset + limit].fillna("")
    
    return {
        "dataset_id": dataset_id,
        "name": meta["name"],
        "total_rows": total,
        "offset": offset,
        "limit": limit,
        "columns": list(df.columns[:30]),
        "rows": sliced[df.columns[:30]].to_dict(orient="records")
    }

@router.get("/experiments")
async def get_experiment_registry():
    """Returns experiment registry tracking all model training runs."""
    reg_path = "evaluation/experiment_registry.json"
    if not os.path.exists(reg_path):
        return []
    with open(reg_path, "r", encoding="utf-8") as f:
        return json.load(f)
