-- ==============================================================================
-- MEDINTEL AI — Complete Clinical Intelligence Persistence Schema (schema.sql)
-- Target: PostgreSQL 14+ / SQLite兼容
-- Purpose: Research-Grade Experimentation, Clinical Decision Support & Model Governance
-- ==============================================================================

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(256) UNIQUE NOT NULL,
    role VARCHAR(64) DEFAULT 'clinician',
    hashed_password VARCHAR(256),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(256) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Datasets & Versioning Registry
CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(128) NOT NULL,
    version VARCHAR(32) NOT NULL,
    dataset_hash VARCHAR(64) NOT NULL UNIQUE,
    file_path VARCHAR(256) NOT NULL,
    file_type VARCHAR(32) DEFAULT 'csv',
    sample_count INTEGER NOT NULL,
    feature_count INTEGER NOT NULL,
    target_column VARCHAR(64) NOT NULL,
    classes_json TEXT, -- JSON array of target classes
    class_distribution TEXT, -- JSON distribution
    missing_values_count INTEGER DEFAULT 0,
    duplicate_records_count INTEGER DEFAULT 0,
    train_samples INTEGER,
    validation_samples INTEGER,
    test_samples INTEGER,
    validation_status VARCHAR(32) DEFAULT 'VALIDATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI Models Registry
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(128) NOT NULL UNIQUE,
    type VARCHAR(64) NOT NULL, -- Classical ML, Medical Transformer (BioBERT)
    version VARCHAR(32) NOT NULL,
    dataset_id INTEGER REFERENCES datasets(id),
    dataset VARCHAR(128) NOT NULL,
    dataset_version VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'READY',
    model_path VARCHAR(256),
    feature_metadata_path VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Model Version History & Drift Monitoring
CREATE TABLE IF NOT EXISTS model_version_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    version VARCHAR(32) NOT NULL,
    change_summary TEXT,
    trained_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drift_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    drift_metric VARCHAR(64) NOT NULL,
    drift_score FLOAT NOT NULL,
    threshold FLOAT NOT NULL,
    status VARCHAR(32) DEFAULT 'NORMAL',
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Empirical Benchmark & Metrics
CREATE TABLE IF NOT EXISTS model_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    accuracy FLOAT NOT NULL,
    precision FLOAT NOT NULL,
    recall FLOAT NOT NULL,
    f1 FLOAT NOT NULL,
    macro_f1 FLOAT NOT NULL,
    weighted_f1 FLOAT NOT NULL,
    roc_auc FLOAT,
    pr_auc FLOAT,
    latency_ms FLOAT,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    class_name VARCHAR(128) NOT NULL,
    precision FLOAT NOT NULL,
    recall FLOAT NOT NULL,
    f1_score FLOAT NOT NULL,
    support INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Experiment Registry & Reproducibility
CREATE TABLE IF NOT EXISTS experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_name VARCHAR(128) NOT NULL,
    experiment_id VARCHAR(64) UNIQUE,
    model_id INTEGER REFERENCES models(id),
    dataset_id INTEGER REFERENCES datasets(id),
    dataset_name VARCHAR(128) NOT NULL,
    dataset_version VARCHAR(32) NOT NULL,
    dataset_hash VARCHAR(64),
    random_seed INTEGER DEFAULT 42,
    split_ratio VARCHAR(32) DEFAULT '70/15/15',
    preprocessing_steps TEXT,
    hyperparameters TEXT, -- JSON
    train_samples INTEGER NOT NULL,
    validation_samples INTEGER NOT NULL,
    test_samples INTEGER NOT NULL,
    training_time_seconds FLOAT,
    inference_time_ms FLOAT,
    macro_f1 FLOAT,
    accuracy FLOAT,
    status VARCHAR(32) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hyperparameter_trials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    trial_number INTEGER NOT NULL,
    parameters TEXT, -- JSON
    validation_score FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Patient Cases & Clinical Input
CREATE TABLE IF NOT EXISTS patient_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    case_reference VARCHAR(64) UNIQUE NOT NULL,
    age INTEGER NOT NULL,
    sex VARCHAR(16) NOT NULL,
    symptom_text TEXT NOT NULL,
    duration VARCHAR(64),
    severity VARCHAR(32),
    medical_history TEXT,
    current_medications TEXT,
    vitals TEXT, -- JSON: {heart_rate, systolic_bp, diastolic_bp, temp, spo2}
    clinical_narrative TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Predictions & Multiclass Probabilities
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES patient_cases(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES models(id),
    predicted_condition VARCHAR(128) NOT NULL,
    confidence FLOAT NOT NULL,
    prediction_rank INTEGER DEFAULT 1,
    inference_time FLOAT, -- in ms
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prediction_probabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    condition VARCHAR(128) NOT NULL,
    probability FLOAT NOT NULL,
    rank INTEGER NOT NULL
);

-- 9. Explainability (Feature Importance & Token Attention)
CREATE TABLE IF NOT EXISTS feature_importance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES models(id),
    feature_name VARCHAR(128) NOT NULL,
    importance_score FLOAT NOT NULL,
    contribution_direction VARCHAR(16), -- POSITIVE, NEGATIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL,
    token_id INTEGER NOT NULL,
    attention_weight FLOAT NOT NULL,
    position INTEGER NOT NULL
);

-- 10. RAG Vector Knowledge & Document Ingestion
CREATE TABLE IF NOT EXISTS embedding_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name VARCHAR(128) NOT NULL,
    dimensions INTEGER NOT NULL,
    status VARCHAR(32) DEFAULT 'READY'
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(256) NOT NULL,
    disease VARCHAR(128) NOT NULL,
    source VARCHAR(256) NOT NULL,
    source_url VARCHAR(512),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding_json TEXT
);

CREATE TABLE IF NOT EXISTS retrieval_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES patient_cases(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    document TEXT NOT NULL,
    source VARCHAR(256),
    source_url VARCHAR(512),
    similarity_score FLOAT NOT NULL,
    retrieval_time_ms FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. LLM Grounded Synthesis & Safety Layer
CREATE TABLE IF NOT EXISTS red_flag_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_code VARCHAR(64) UNIQUE NOT NULL,
    rule_name VARCHAR(128) NOT NULL,
    condition_expression TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL, -- CRITICAL, WARNING, ADVISORY
    alert_message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES patient_cases(id) ON DELETE CASCADE,
    flag_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL, -- CRITICAL, WARNING, ADVISORY
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS llm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES patient_cases(id) ON DELETE CASCADE,
    model_prediction VARCHAR(128) NOT NULL,
    retrieved_context TEXT,
    safety_constraints TEXT,
    prompt_payload TEXT,
    llm_response TEXT NOT NULL,
    provider VARCHAR(64) NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    latency_ms FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Governance, System Status & Audit Logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(128) NOT NULL,
    details TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
