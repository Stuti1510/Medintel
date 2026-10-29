# MEDINTEL AI — Clinical Symptom Intelligence Platform

> **Academic Clinical Decision-Support Platform uniting Natural-Language Symptom Classification, Medical Transformers (BioBERT), Vector Retrieval-Augmented Generation (RAG), Grounded Clinical Synthesis, and Relational SQLite / PostgreSQL Storage.**

---

## 🌟 Executive Summary & Architecture

MEDINTEL AI is built upon the fundamental principle: **"THE AI PIPELINE IS THE PRODUCT."**
Rather than presenting an ungrounded LLM or synthetic placeholder, the platform implements an interpretable, leakage-safe clinical NLP intelligence workflow:

```
[ PATIENT SYMPTOM NARRATIVE ] 
       │
       ▼
[ 1. INPUT VALIDATION & TOKEN CLEANING ] (Group-Stratified 70/15/15 Leakage-Free Splits)
       │
       ├──► [ 2. CLASSICAL NLP BASELINE ] (Calibrated Linear SVM, Logistic Regression, RF, XGBoost)
       │
       └──► [ 3. BIOBERT TRANSFORMER ] (PyTorch Clinical Transformer + WordPiece Tokenizer)
                 │
                 ▼
[ 4. MODEL CONCORDANCE & CONFIDENCE ABSTENTION ] (Low-Confidence Filter < 0.15)
       │
       ▼
[ 5. VECTOR RAG EVIDENCE GROUNDING ] (Normalized Cosine Index across 43 Verified Guidelines)
       │
       ▼
[ 6. GROUNDED CLINICAL SYNTHESIS ] (Differential Diagnosis Grounded in Empirical Probabilities)
       │
       ▼
[ 7. CLINICAL SAFETY & RED-FLAG TRIAGE ] (Hypertensive Crisis, Hypoxemia, Sepsis Screening)
       │
       ▼
[ 8. RELATIONAL PERSISTENCE & AUDIT LOGGING ] (SQLAlchemy Entities & Decision Auditing)
       │
       ▼
[ 9. RESEARCH UI CONSOLE ] (Live Pipeline Visualization, Explanations, Benchmarks)
```

---

## 📊 Empirical Benchmark Results (`Symptom2Disease`, Held-Out Test Split, N=180)

All evaluation metrics are calculated on the untouched, sealed test partition across all 24 disease classes:
*Acne, Arthritis, Bronchial Asthma, Cervical spondylosis, Chicken pox, Common Cold, Dengue, Diabetes, Fungal infection, Gastroesophageal reflux disease, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Pneumonia, Psoriasis, Typhoid, Urinary tract infection, Varicose veins, allergy, peptic ulcer disease.*

| Model Architecture | Model Family | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | Single Latency (p50) | Expected Calibration Error (ECE) | Artifact Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear SVM (Calibrated)** | Classical NLP (TF-IDF) | **96.67%** | **0.9707** | **0.9643** | **0.9653** | **0.9666** | 1.83 ms (batch: 0.14 ms) | 0.1698 | 1.7 MB |
| **Logistic Regression** | Classical NLP (TF-IDF) | **96.11%** | 0.9645 | 0.9598 | 0.9598 | 0.9608 | **1.71 ms** (batch: 0.02 ms) | 0.4674 | 577 KB |
| **Random Forest** | Classical NLP (TF-IDF) | **92.78%** | 0.9371 | 0.9249 | 0.9251 | 0.9261 | 2.10 ms (batch: 0.21 ms) | 0.4639 | 7.8 MB |
| **XGBoost** | Classical NLP (TF-IDF) | **92.22%** | 0.9220 | 0.9204 | 0.9191 | 0.9216 | 1.95 ms (batch: 0.07 ms) | **0.1112** | 2.3 MB |
| **BioBERT Transformer** | Medical Transformer | **81.11%** | 0.8300 | 0.8043 | 0.7981 | 0.8012 | 7.87 ms (batch: 3.14 ms) | — | 40.5 MB |

> **Key Evaluation Finding**: On this 1,200-instance clinical dataset (50 examples per class), calibrated Linear SVM and Logistic Regression with sublinear TF-IDF word/bigram representations outperform the compact BioBERT transformer by over 13 percentage points in test accuracy, while operating with sub-millisecond inference latencies.

---

## 🔍 Dataset Audit & Leakage Prevention Protocol

- **Dataset**: `data/raw/Symptom2Disease.csv` (1,200 records, 24 target disease labels).
- **Audit Findings**:
  - Exactly 43 distinct symptom descriptions appear 90 times (47 repeated occurrences).
  - Cross-tabulation audit confirmed **100% label consistency** across all repeated descriptions (0 conflicting labels).
  - Standard random cross-validation would have allowed identical patient symptom descriptions into both training and test partitions, artificially inflating model accuracy.
- **Group-Stratified Partitioning**:
  - Implemented grouping by MD5 symptom narrative hash in `data/preprocess.py`.
  - Partitioning ensures that identical narratives remain strictly within the same split:
    - **Train Split (70%)**: 840 instances (35 cases per class across all 24 classes).
    - **Validation Split (15%)**: 180 instances (calibrated thresholding & tuning).
    - **Held-Out Test Split (15%)**: 180 instances (untouched empirical evaluation).

---

## 📂 Project Structure

```
MEDINTEL-AI/
├── backend/               # FastAPI Application & API Endpoints
│   └── app/
│       ├── api/endpoints/ # /analyze, /predict/classical, /predict/transformer, /rag/search, /history, /models
│       ├── database/      # SQLAlchemy session factory & database seeder (init_db.py)
│       ├── models/        # Relational schema entities (PatientEncounter, PredictionRecord, etc.)
│       ├── schemas/       # Pydantic validation schemas
│       ├── services/      # Clinical Orchestrator & Multi-Model Pipeline
│       └── main.py        # FastAPI server entrypoint
├── ml/                    # Classical Machine Learning Engine
│   ├── training/          # train_classical.py (SVM, LR, RF, XGBoost)
│   ├── inference/         # classical_inference.py (Calibrated probability + lexical attribution)
│   └── saved_models/      # Fitted pipeline artifacts & vectorizer
├── transformer/           # Deep Learning & Medical Transformer
│   ├── model/             # PyTorch ClinicalTransformerClassifier
│   ├── tokenizer/         # BioBERT WordPiece tokenizer service
│   ├── training/          # train.py (PyTorch AdamW training loop)
│   └── inference/         # biobert_inference.py (with attention extraction)
├── rag/                   # Retrieval-Augmented Generation Engine
│   ├── ingestion/         # index_builder.py (Chunking & guideline embedding)
│   ├── embeddings/        # embedder.py (Normalized dense representations)
│   ├── retrieval/         # retriever.py (Top-K vector lookup)
│   └── vectorstore/       # medical_index.json (43 peer-reviewed clinical guidelines)
├── llm/                   # Large Language Model & Clinical Safety Engine
│   ├── providers/         # Gemini, OpenAI, and Offline Educational Synthesizer
│   ├── prompts/           # Structured academic decision-support prompt templates
│   └── safety/            # Red-flag detector & prescription prohibition filter
├── data/                  # Data Engineering & Profiling
│   ├── raw/               # Symptom2Disease.csv (1,200 records)
│   ├── cleaned/           # symptom_to_disease_clean.csv & cleaning_audit_report.json
│   ├── processed/         # train.csv (840), val.csv (180), test.csv (180)
│   ├── dataset_registry.py# Active dataset metadata & schema registry
│   ├── feature_pipeline.py# Sublinear TF-IDF (1,2)-gram text feature pipeline
│   └── preprocess.py      # Leakage-safe group-stratified dataset partitioner
├── reports/               # Persisted Scientific Metrics & Audit Reports
│   └── evaluation/        # model_evaluation_report.md, classical_ml_results.json, transformer_results.json
├── frontend/              # React 18 + TypeScript + Vite + Tailwind CSS Console
│   └── src/               # Diagnostic Console, Benchmarks, Dataset Dashboard, Presentation
└── tests/                 # Automated Pytest Verification Suite (38 Tests Passing)
```

---

## 🚀 Quickstart & Reproduction Workflow

### 1. Data Cleaning & Group-Stratified Preprocessing
```bash
python data/preprocess.py
```
Validates columns, audits duplicate texts, and outputs leakage-safe `train.csv` (840), `val.csv` (180), and `test.csv` (180).

### 2. Feature Pipeline Generation & Classical Model Training
```bash
python ml/training/train_classical.py
```
Fits `TfidfVectorizer` on `train.csv` only, trains Calibrated Linear SVM, Logistic Regression, Random Forest, and XGBoost, and saves evaluation metrics to `reports/evaluation/classical_ml_results.json`.

### 3. Transformer Fine-Tuning (Optional)
```bash
python transformer/training/train.py --epochs 4 --batch_size 16
```
Trains PyTorch BioBERT transformer on the 24 classes and saves weights to `models/transformer_biobert/`.

### 4. Database Synchronization & Seeder
```bash
python -m backend.app.database.init_db
```
Populates `medintel.db` with registered datasets, active 24-class models, and benchmark evaluation metrics.

### 5. Run Automated Test Suite (38/38 Passing)
```bash
python -m pytest tests/ -v
```

### 6. Start FastAPI Backend Daemon
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 7. Start React Frontend Console
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚠️ Clinical Safety & Scope Limitations

1. **Investigational Decision-Support Only**: MEDINTEL AI is engineered as an educational and investigational clinical decision-support tool. Predictions represent statistical differential hypotheses, not definitive medical diagnoses.
2. **Low-Confidence Abstention Filter (<0.15) & OOD Limitations**: The 0.15 confidence threshold is an empirical heuristic filter against sparse, uninformative inputs (uniform random guessing across 24 classes is ~0.0417). On in-distribution validation data, min confidence is 0.1963 (0.0% abstention). Crucially, out-of-distribution non-medical texts (e.g. general sentences) or unmodeled acute conditions can still exceed 0.15 without triggering abstention; hence it is not a validated clinical safety mechanism.
3. **Near-Duplicate Data Leakage Risk**: Exact duplicate symptom narratives are strictly grouped to prevent train-test overlap (0 exact matches across partitions). However, audit revealed 22 cross-split pairs with cosine similarity >= 0.85 (17 pairs >= 0.90) originating from paraphrasing in the raw dataset, which presents a minor optimistic evaluation bias.
4. **Deterministic Emergency Red-Flag Overrides**: Severe clinical emergency indicators (e.g., severe hypoxemia SpO2 < 90%, hypertensive emergency BP > 180/120, sepsis qSOFA alerts) trigger high-priority emergency triage warnings that explicitly take precedence over statistical model probability scores.
