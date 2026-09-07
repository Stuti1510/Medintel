"""
MEDINTEL AI - Database Initializer & Seeder
Creates all tables via SQLAlchemy metadata and seeds default AI models, metrics, and demo cases.
"""

import os
import sys
import json
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.database.session import engine, SessionLocal
from backend.app.database.base import Base
from backend.app.models.entities import (
    User, PatientCase, AIModel, Prediction, PredictionProbability,
    ModelMetric, Experiment, RetrievalResult, LLMInteraction, SafetyEvent,
    MotorScreeningSession, MotorScreeningTrial, MotorScreeningMetric
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
            with open(eval_classical_path, "r") as f:
                c_results = json.load(f)
            for m_name, m_data in c_results.items():
                existing_m = db.query(AIModel).filter(AIModel.name == m_name).first()
                if not existing_m:
                    ai_m = AIModel(
                        name=m_name,
                        type="Classical ML",
                        version="v1.0.0",
                        dataset="MEDINTEL Clinical Benchmark",
                        dataset_version="v1.0",
                        status="READY",
                        model_path=os.path.join("models/classical", m_data.get("model_file", ""))
                    )
                    db.add(ai_m)
                    db.commit()
                    db.refresh(ai_m)

                    # Add metric
                    metric = ModelMetric(
                        model_id=ai_m.id,
                        accuracy=m_data.get("accuracy", 0.0),
                        precision=m_data.get("precision_macro", 0.0),
                        recall=m_data.get("recall_macro", 0.0),
                        f1=m_data.get("f1_macro", 0.0),
                        macro_f1=m_data.get("f1_macro", 0.0),
                        weighted_f1=m_data.get("f1_weighted", 0.0)
                    )
                    db.add(metric)
                    db.commit()

        # 2. Transformer model
        if os.path.exists(eval_transformer_path):
            with open(eval_transformer_path, "r") as f:
                t_data = json.load(f)
            existing_t = db.query(AIModel).filter(AIModel.name == t_data.get("model_name")).first()
            if not existing_t:
                ai_t = AIModel(
                    name=t_data.get("model_name", "BioBERT Clinical Transformer"),
                    type="Medical Transformer",
                    version="v1.1.0",
                    dataset="MEDINTEL Clinical Benchmark",
                    dataset_version="v1.0",
                    status="READY",
                    model_path="models/transformer/biobert/model.pt"
                )
                db.add(ai_t)
                db.commit()
                db.refresh(ai_t)

                metric = ModelMetric(
                    model_id=ai_t.id,
                    accuracy=t_data.get("accuracy", 0.0),
                    precision=t_data.get("precision_macro", 0.0),
                    recall=t_data.get("recall_macro", 0.0),
                    f1=t_data.get("f1_macro", 0.0),
                    macro_f1=t_data.get("f1_macro", 0.0),
                    weighted_f1=t_data.get("f1_weighted", 0.0)
                )
                db.add(metric)
                db.commit()

        print("[DATABASE INIT] Database initialization and model seeding complete.")
    except Exception as e:
        print(f"[DATABASE INIT] Seeding error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
