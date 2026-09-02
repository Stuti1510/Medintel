"""
MEDINTEL AI - Database Models / Schema Entities
Implements all 10 schema specifications with full SQLAlchemy foreign keys and relationships.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_cases = relationship("PatientCase", back_populates="user", cascade="all, delete-orphan")

class PatientCase(Base):
    __tablename__ = "patient_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    case_reference = Column(String(64), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(16), nullable=False)
    symptom_text = Column(Text, nullable=False)
    duration = Column(String(64), nullable=True)
    severity = Column(String(32), nullable=True)
    medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    vitals = Column(JSON, nullable=True) # {heart_rate, bp, temp, spo2}
    clinical_narrative = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_cases")
    predictions = relationship("Prediction", back_populates="patient_case", cascade="all, delete-orphan")
    retrieval_results = relationship("RetrievalResult", back_populates="patient_case", cascade="all, delete-orphan")
    llm_interactions = relationship("LLMInteraction", back_populates="patient_case", cascade="all, delete-orphan")
    safety_events = relationship("SafetyEvent", back_populates="patient_case", cascade="all, delete-orphan")

class AIModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False, unique=True)
    type = Column(String(64), nullable=False) # Classical ML, Medical Transformer
    version = Column(String(32), nullable=False)
    dataset = Column(String(128), nullable=False)
    dataset_version = Column(String(32), nullable=False)
    status = Column(String(32), default="READY")
    model_path = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictions = relationship("Prediction", back_populates="model")
    model_metrics = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="model", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    predicted_condition = Column(String(128), nullable=False)
    confidence = Column(Float, nullable=False)
    prediction_rank = Column(Integer, default=1)
    inference_time = Column(Float, nullable=True) # in ms
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="predictions")
    model = relationship("AIModel", back_populates="predictions")
    probabilities = relationship("PredictionProbability", back_populates="prediction", cascade="all, delete-orphan")

class PredictionProbability(Base):
    __tablename__ = "prediction_probabilities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    condition = Column(String(128), nullable=False)
    probability = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)

    # Relationships
    prediction = relationship("Prediction", back_populates="probabilities")

class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1 = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    weighted_f1 = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=True)
    pr_auc = Column(Float, nullable=True)
    evaluation_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="model_metrics")

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_name = Column(String(128), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    dataset_name = Column(String(128), nullable=False)
    dataset_version = Column(String(32), nullable=False)
    hyperparameters = Column(JSON, nullable=True)
    train_samples = Column(Integer, nullable=False)
    validation_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    training_time = Column(Float, nullable=True)
    inference_time = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="experiments")

class RetrievalResult(Base):
    __tablename__ = "retrieval_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    query = Column(Text, nullable=False)
    document = Column(Text, nullable=False)
    source = Column(String(256), nullable=True)
    source_url = Column(String(512), nullable=True)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="retrieval_results")

class LLMInteraction(Base):
    __tablename__ = "llm_interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    model_prediction = Column(String(128), nullable=False)
    retrieved_context = Column(Text, nullable=True)
    llm_response = Column(Text, nullable=False)
    provider = Column(String(64), nullable=False)
    model_name = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="llm_interactions")

class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    flag_type = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False) # CRITICAL, WARNING, ADVISORY
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="safety_events")
