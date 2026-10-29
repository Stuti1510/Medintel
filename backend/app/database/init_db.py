"""
MEDINTEL AI - Database Initializer & Seeder
Creates all tables via SQLAlchemy metadata and seeds default AI models, metrics, and demo cases.
Ensures active benchmark models and datasets are synchronized with latest empirical results.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.database.session import engine, SessionLocal
from backend.app.database.base import Base
from backend.app.models.entities import (
    User, PatientCase, AIModel, Prediction, PredictionProbability,
    ModelMetric, Experiment, RetrievalResult, LLMInteraction, SafetyEvent,
    MotorScreeningSession, MotorScreeningTrial, MotorScreeningMetric, Dataset
)

def init_database():
    print("[DATABASE INIT] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[DATABASE INIT] Tables created successfully.")

    db = SessionLocal()
    try:
        # Seed default admin / demo clinician
        demo_user = db.query(User).filter(User.email == "clinician@medintel.ai").first()
        if not demo_user:
            demo_user = User(name="Dr. Alex Vance, MD", email="clinician@medintel.ai")
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("[DATABASE INIT] Created default clinician user.")

        # Seed trained models into database from evaluation results if present
        eval_classical_path = "evaluation/classical_ml_results.json"
        eval_transformer_path = "evaluation/transformer_results.json"

        # 1. Classical ML models
        if os.path.exists(eval_classical_path):
            with open(eval_classical_path, "r", encoding="utf-8") as f:
                c_results = json.load(f)
            for m_name, m_data in c_results.items():
                filename = f"{m_name.lower().replace(' ', '_')}.joblib"
                m_path = os.path.join("models", "classical", filename)
                
                ai_m = db.query(AIModel).filter(AIModel.name == m_name).first()
                if not ai_m:
                    ai_m = AIModel(
                        name=m_name,
                        type="Classical ML",
                        version="v3.0.0-NLP",
                        dataset="Symptom-to-Disease Clinical Benchmark (Symptom2Disease)",
                        dataset_version="v1.0.0",
                        status="READY",
                        model_path=m_path
                    )
                    db.add(ai_m)
                    db.commit()
                    db.refresh(ai_m)
                else:
                    ai_m.version = "v3.0.0-NLP"
                    ai_m.dataset = "Symptom-to-Disease Clinical Benchmark (Symptom2Disease)"
                    ai_m.dataset_version = "v1.0.0"
                    ai_m.status = "READY"
                    ai_m.model_path = m_path
                    db.commit()

                # Add / update metric
                metric = db.query(ModelMetric).filter(ModelMetric.model_id == ai_m.id).first()
                if not metric:
                    metric = ModelMetric(model_id=ai_m.id)
                    db.add(metric)
                    
                metric.accuracy = float(m_data.get("accuracy", 0.0))
                metric.precision = float(m_data.get("precision_macro", 0.0))
                metric.recall = float(m_data.get("recall_macro", 0.0))
                metric.f1 = float(m_data.get("f1_macro", 0.0))
                metric.macro_f1 = float(m_data.get("f1_macro", 0.0))
                metric.weighted_f1 = float(m_data.get("f1_weighted", 0.0))
                metric.evaluation_date = datetime.now()
                db.commit()

        # 2. Transformer model
        if os.path.exists(eval_transformer_path):
            with open(eval_transformer_path, "r", encoding="utf-8") as f:
                t_data = json.load(f)
            t_name = t_data.get("model_name", "BioBERT Clinical Transformer")
            ai_t = db.query(AIModel).filter(AIModel.name == t_name).first()
            if not ai_t:
                ai_t = AIModel(
                    name=t_name,
                    type="Medical Transformer",
                    version="v3.0.0-NLP",
                    dataset="Symptom-to-Disease Clinical Benchmark (Symptom2Disease)",
                    dataset_version="v1.0.0",
                    status="READY",
                    model_path="models/transformer/biobert/model.pt"
                )
                db.add(ai_t)
                db.commit()
                db.refresh(ai_t)
            else:
                ai_t.version = "v3.0.0-NLP"
                ai_t.dataset = "Symptom-to-Disease Clinical Benchmark (Symptom2Disease)"
                ai_t.dataset_version = "v1.0.0"
                ai_t.status = "READY"
                ai_t.model_path = "models/transformer/biobert/model.pt"
                db.commit()

            metric = db.query(ModelMetric).filter(ModelMetric.model_id == ai_t.id).first()
            if not metric:
                metric = ModelMetric(model_id=ai_t.id)
                db.add(metric)
                
            metric.accuracy = float(t_data.get("accuracy", 0.0))
            metric.precision = float(t_data.get("precision_macro", 0.0))
            metric.recall = float(t_data.get("recall_macro", 0.0))
            metric.f1 = float(t_data.get("f1_macro", 0.0))
            metric.macro_f1 = float(t_data.get("f1_macro", 0.0))
            metric.weighted_f1 = float(t_data.get("f1_weighted", 0.0))
            metric.evaluation_date = datetime.now()
            db.commit()

        # 3. Synchronize Dataset Registry Record
        ds_rec = db.query(Dataset).filter(Dataset.name == "symptom_to_disease").first()
        if not ds_rec:
            ds_rec = Dataset(
                name="symptom_to_disease",
                version="v1.0.0",
                file_type="csv",
                file_path="datasets/Symptom2Disease.csv",
                total_samples=1200,
                total_features=2,
                target_column="label",
                num_classes=24,
                train_samples=840,
                validation_samples=180,
                test_samples=180,
                missing_values=0,
                duplicate_records=47,
                status="validated"
            )
            db.add(ds_rec)
            db.commit()
        else:
            ds_rec.total_samples = 1200
            ds_rec.total_features = 2
            ds_rec.target_column = "label"
            ds_rec.num_classes = 24
            ds_rec.train_samples = 840
            ds_rec.validation_samples = 180
            ds_rec.test_samples = 180
            ds_rec.duplicate_records = 47
            ds_rec.status = "validated"
            db.commit()

        print("[DATABASE INIT] Database initialization and model synchronization complete.")
    except Exception as e:
        print(f"[DATABASE INIT ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
