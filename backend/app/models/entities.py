"""
MEDINTEL AI - Database Models / Schema Entities
Implements all tables specified in schema.sql with SQLAlchemy ORM models and relationships.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Boolean, BigInteger
)
from sqlalchemy.orm import relationship
from backend.app.database.base import Base

# ===========================================================================
# 1. CORE ENTITIES
# ===========================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(64), default="clinician")
    hashed_password = Column(String(256), nullable=True)
    is_active = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_cases = relationship("PatientCase", back_populates="user", cascade="all, delete-orphan")
    organization = relationship("Organization", back_populates="users")
    saved_cases = relationship("SavedCase", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

class PatientCase(Base):
    __tablename__ = "patient_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    case_reference = Column(String(64), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String(20), nullable=True)
    symptom_text = Column(Text, nullable=True)
    duration = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    vitals = Column(JSON, nullable=True) # {heart_rate, systolic_bp, diastolic_bp, temp, spo2}
    clinical_narrative = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_cases")
    predictions = relationship("Prediction", back_populates="patient_case", cascade="all, delete-orphan")
    retrieval_results = relationship("RetrievalResult", back_populates="patient_case", cascade="all, delete-orphan")
    llm_interactions = relationship("LLMInteraction", back_populates="patient_case", cascade="all, delete-orphan")
    safety_events = relationship("SafetyEvent", back_populates="patient_case", cascade="all, delete-orphan")
    saved_cases = relationship("SavedCase", back_populates="patient_case", cascade="all, delete-orphan")
    token_analyses = relationship("TokenAnalysis", back_populates="patient_case", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="patient_case", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="patient_case", cascade="all, delete-orphan")

class AIModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    type = Column(String(50), nullable=False) # classical_ml | transformer
    version = Column(String(50), nullable=False)
    dataset = Column(String(255), nullable=True)
    dataset_version = Column(String(50), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    status = Column(String(50), default="ready") # ready | training | not_evaluated | failed
    model_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dataset_rel = relationship("Dataset", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")
    model_metrics = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="model", cascade="all, delete-orphan")
    version_history = relationship("ModelVersionHistory", back_populates="model", cascade="all, delete-orphan")
    class_metrics = relationship("ClassMetric", back_populates="model", cascade="all, delete-orphan")
    drift_monitorings = relationship("DriftMonitoring", back_populates="model", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    predicted_condition = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    prediction_rank = Column(Integer, default=1)
    inference_time = Column(Float, nullable=True) # in ms
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="predictions")
    model = relationship("AIModel", back_populates="predictions")
    probabilities = relationship("PredictionProbability", back_populates="prediction", cascade="all, delete-orphan")
    feature_importances = relationship("FeatureImportance", back_populates="prediction", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="prediction", cascade="all, delete-orphan")

class PredictionProbability(Base):
    __tablename__ = "prediction_probabilities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    condition = Column(String(255), nullable=False)
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
    experiment_name = Column(String(255), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    dataset_name = Column(String(255), nullable=True)
    dataset_version = Column(String(50), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    train_samples = Column(Integer, nullable=False)
    validation_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    training_time = Column(Float, nullable=True) # seconds
    inference_time = Column(Float, nullable=True) # ms
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="experiments")
    dataset_rel = relationship("Dataset", back_populates="experiments")
    training_logs = relationship("TrainingLog", back_populates="experiment", cascade="all, delete-orphan")
    hyperparameter_trials = relationship("HyperparameterTrial", back_populates="experiment", cascade="all, delete-orphan")

class RetrievalResult(Base):
    __tablename__ = "retrieval_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    knowledge_document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=True)
    query = Column(Text, nullable=False)
    document = Column(Text, nullable=False)
    source = Column(String(255), nullable=True)
    source_url = Column(Text, nullable=True)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="retrieval_results")
    knowledge_document = relationship("KnowledgeDocument", back_populates="retrieval_results")

class LLMInteraction(Base):
    __tablename__ = "llm_interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    model_prediction = Column(JSON, nullable=True)
    retrieved_context = Column(JSON, nullable=True)
    llm_response = Column(Text, nullable=False)
    provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="llm_interactions")

class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("red_flag_rules.id"), nullable=True)
    flag_type = Column(String(100), nullable=False)
    trigger_text = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False) # info | warning | critical
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="safety_events")
    rule = relationship("RedFlagRule", back_populates="safety_events")

# ===========================================================================
# 2. DATASET & ML OPS ENTITIES
# ===========================================================================

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    file_type = Column(String(20), default="csv")
    file_path = Column(Text, nullable=True)
    total_samples = Column(Integer, nullable=True)
    total_features = Column(Integer, nullable=True)
    target_column = Column(String(255), nullable=True)
    num_classes = Column(Integer, nullable=True)
    train_samples = Column(Integer, nullable=True)
    validation_samples = Column(Integer, nullable=True)
    test_samples = Column(Integer, nullable=True)
    missing_values = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    class_distribution = Column(JSON, nullable=True)
    status = Column(String(50), default="validated") # valid | invalid | validated
    last_processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    models = relationship("AIModel", back_populates="dataset_rel")
    experiments = relationship("Experiment", back_populates="dataset_rel")
    raw_patient_data = relationship("RawPatientData", back_populates="dataset_rel", cascade="all, delete-orphan")

class RawPatientData(Base):
    __tablename__ = "raw_patient_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    patient_id = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String(20), nullable=True)
    bmi = Column(Float, nullable=True)
    systolic_bp = Column(Float, nullable=True)
    diastolic_bp = Column(Float, nullable=True)
    glucose = Column(Float, nullable=True)
    cholesterol = Column(Float, nullable=True)
    creatinine = Column(Float, nullable=True)
    diabetes = Column(Integer, nullable=True)
    hypertension = Column(Integer, nullable=True)
    diagnosis = Column(String(255), nullable=True)
    readmission_30d = Column(Integer, nullable=True)
    mortality = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dataset_rel = relationship("Dataset", back_populates="raw_patient_data")

class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    epoch = Column(Integer, nullable=False)
    step = Column(Integer, nullable=True)
    train_loss = Column(Float, nullable=True)
    validation_loss = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    learning_rate = Column(Float, nullable=True)
    elapsed_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment = relationship("Experiment", back_populates="training_logs")

class FeatureImportance(Base):
    __tablename__ = "feature_importance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    feature_name = Column(String(255), nullable=False)
    importance = Column(Float, nullable=False)
    rank = Column(Integer, nullable=True)

    # Relationships
    prediction = relationship("Prediction", back_populates="feature_importances")

class TokenAnalysis(Base):
    __tablename__ = "token_analysis"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    input_text = Column(Text, nullable=False)
    tokens = Column(JSON, nullable=False)
    attention_weights = Column(JSON, nullable=True)
    is_educational = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="token_analyses")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(255), nullable=False)
    source_url = Column(Text, nullable=True)
    embedding_id = Column(String(255), nullable=True)
    last_updated = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    retrieval_results = relationship("RetrievalResult", back_populates="knowledge_document")
    document_chunks = relationship("DocumentChunk", back_populates="knowledge_document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_id = Column(String(255), nullable=True)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    knowledge_document = relationship("KnowledgeDocument", back_populates="document_chunks")

class RedFlagRule(Base):
    __tablename__ = "red_flag_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), nullable=False)
    trigger_def = Column(JSON, nullable=False)
    severity = Column(String(20), nullable=False) # info | warning | critical
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    safety_events = relationship("SafetyEvent", back_populates="rule")

class SystemStatusLog(Base):
    __tablename__ = "system_status_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    component = Column(String(50), nullable=False) # ml | biobert | rag | llm | database
    status = Column(String(20), nullable=False) # online | degraded | offline
    detail = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

class ApiRequestLog(Base):
    __tablename__ = "api_request_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time = Column(Float, nullable=True) # ms
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelVersionHistory(Base):
    __tablename__ = "model_version_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    version = Column(String(50), nullable=False)
    change_summary = Column(Text, nullable=True)
    model_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="version_history")

class ClassMetric(Base):
    __tablename__ = "class_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    class_label = Column(String(255), nullable=False)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    support = Column(Integer, nullable=True)
    evaluation_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="class_metrics")

class HyperparameterTrial(Base):
    __tablename__ = "hyperparameter_trials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    trial_number = Column(Integer, nullable=False)
    hyperparameters = Column(JSON, nullable=False)
    metric_value = Column(Float, nullable=True)
    metric_name = Column(String(100), nullable=True)
    status = Column(String(20), default="completed") # running | completed | failed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment = relationship("Experiment", back_populates="hyperparameter_trials")

class DriftMonitoring(Base):
    __tablename__ = "drift_monitoring"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=True)
    baseline_value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    triggered = Column(Boolean, default=False)
    measured_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("AIModel", back_populates="drift_monitorings")

# ===========================================================================
# 3. MULTI-TENANCY & USER-FACING ENTITIES
# ===========================================================================

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization")
    teams = relationship("Team", back_populates="organization", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="teams")

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False) # admin | researcher | viewer

    # Relationships
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)

    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")

class SavedCase(Base):
    __tablename__ = "saved_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    note = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_cases")
    patient_case = relationship("PatientCase", back_populates="saved_cases")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity_type = Column(String(50), nullable=False) # knowledge_document | model | case
    entity_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="favorites")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    rating = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prediction = relationship("Prediction", back_populates="feedbacks")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    role = Column(String(20), nullable=False) # user | assistant | system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="chat_messages")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(BigInteger, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_case = relationship("PatientCase", back_populates="attachments")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("user_sessions.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("UserSession")

class TeamMember(Base):
    __tablename__ = "team_members"

    team_id = Column(Integer, ForeignKey("teams.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), primary_key=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RateLimit(Base):
    __tablename__ = "rate_limits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    identifier = Column(String(255), nullable=False)
    endpoint = Column(String(255), nullable=False)
    request_count = Column(Integer, default=0)
    window_start = Column(DateTime, nullable=False)
    window_seconds = Column(Integer, default=60)

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False)
    label = Column(String(255), nullable=True)
    scopes = Column(JSON, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobQueue(Base):
    __tablename__ = "job_queue"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")  # pending|running|completed|failed
    attempts = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class CacheEntry(Base):
    __tablename__ = "cache_entries"

    cache_key = Column(String(255), primary_key=True)
    cache_value = Column(JSON, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ABTest(Base):
    __tablename__ = "ab_tests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    model_a_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    model_b_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    status = Column(String(20), default="active")  # active|completed|paused
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class ABTestAssignment(Base):
    __tablename__ = "ab_test_assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ab_test_id = Column(Integer, ForeignKey("ab_tests.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False)
    assigned_model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String(255), nullable=False)
    source_path = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    documents_processed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EmbeddingModel(Base):
    __tablename__ = "embedding_models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=True)
    dimensions = Column(Integer, nullable=True)
    version = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ===========================================================================
# 4. MOTOR & COGNITIVE SCREENING ENTITIES
# ===========================================================================

class MotorScreeningSession(Base):
    __tablename__ = "motor_screening_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_reference = Column(String(64), unique=True, index=True, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_sec = Column(Float, nullable=True)
    device_tier = Column(String(64), nullable=True)
    input_sensor = Column(String(64), nullable=True)
    viewport_width = Column(Integer, nullable=True)
    viewport_height = Column(Integer, nullable=True)
    user_agent = Column(String(512), nullable=True)
    overall_quality = Column(String(32), default="INSUFFICIENT DATA")
    completion_status = Column(String(32), default="PARTIAL")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    trials = relationship("MotorScreeningTrial", back_populates="session", cascade="all, delete-orphan")
    metrics = relationship("MotorScreeningMetric", back_populates="session", cascade="all, delete-orphan")

class MotorScreeningTrial(Base):
    __tablename__ = "motor_screening_trials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("motor_screening_sessions.id"), nullable=False)
    test_type = Column(String(64), nullable=False)  # 'reaction-time' | 'motor-stability' | 'finger-tap'
    trial_number = Column(Integer, nullable=False)
    is_practice = Column(Integer, default=0)
    status = Column(String(32), default="VALID")
    stimulus_timestamp = Column(Float, nullable=True)
    response_timestamp = Column(Float, nullable=True)
    reaction_time_ms = Column(Float, nullable=True)
    inter_tap_interval_ms = Column(Float, nullable=True)
    path_id = Column(String(64), nullable=True)
    path_efficiency_pct = Column(Float, nullable=True)
    mean_deviation_px = Column(Float, nullable=True)
    coordinates_data = Column(JSON, nullable=True)
    input_type = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("MotorScreeningSession", back_populates="trials")

class MotorScreeningMetric(Base):
    __tablename__ = "motor_screening_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("motor_screening_sessions.id"), nullable=False)
    test_type = Column(String(64), nullable=False)  # 'reaction-time' | 'motor-stability' | 'finger-tap' | 'battery-summary'
    derived_metrics = Column(JSON, nullable=False)
    quality_status = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("MotorScreeningSession", back_populates="metrics")

