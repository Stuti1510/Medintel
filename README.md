# MEDINTEL AI — Clinical Intelligence, Made Interpretable

> **Academic Clinical Decision-Support Platform uniting Classical Machine Learning, Medical Transformers (BioBERT), Vector Retrieval-Augmented Generation (RAG), Grounded LLM Contextual Synthesis, and Relational PostgreSQL Storage.**

---

## 🌟 Executive Summary & Key Highlights

MEDINTEL AI is built upon the fundamental principle: **"THE AI PIPELINE IS THE PRODUCT."**
Rather than presenting a generic chatbot or simulated mockup, the platform exposes a complete, verified, and interpretable 10-stage clinical intelligence workflow:

```
[ CLINICAL ENCOUNTER ] 
       │
       ▼
[ 1. INPUT VALIDATION & PREPROCESSING ] (Stratified 70/15/15 Leakage-Free Splits)
       │
       ├──► [ 2. CLASSICAL ML BASELINE ] (Logistic Regression, Random Forest, XGBoost)
       │
       └──► [ 3. BIOBERT TRANSFORMER ] (PyTorch Encoder + WordPiece Tokenizer + [CLS] Head)
                 │
                 ▼
[ 4. MODEL CONCORDANCE & CONFIDENCE ]
       │
       ▼
[ 5. VECTOR RAG RETRIEVAL ] (Normalized Cosine Index across 43 Verified Guidelines)
       │
       ▼
[ 6. GROUNDED LLM SYNTHESIS ] (Grounded in Model Probabilities & Retrieved Evidence)
       │
       ▼
[ 7. CLINICAL SAFETY & RED-FLAG TRIAGE ] (Sepsis, Hypoxemia, Hemodynamic Monitoring)
       │
       ▼
[ 8. POSTGRESQL / SQLALCHEMY PERSISTENCE ] (10 Relational Schemas & Full Audit History)
       │
       ▼
[ 9. RESEARCH UI CONSOLE ] (Live Pipeline Animation, Attention Heatmaps, Viva Slides)
```

---

## 📊 Empirical Benchmark Test-Set Results (Held-Out 15% Split, N=1,500)

All evaluation metrics are calculated on the untouched, sealed test partition across 4 diagnostic classes (`Normal`, `Pneumonia`, `Heart Failure`, `Sepsis`):

| Model Architecture | Model Family | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | Latency | Artifact Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | Classical ML | **23.87%** | 0.2644 | 0.2618 | 0.2088 | 0.2673 | 0.002 ms | 39.8 KB |
| **Random Forest** | Classical ML | **52.07%** | 0.2817 | 0.2657 | 0.2243 | 0.4072 | 0.138 ms | 1.8 MB |
| **XGBoost** | Classical ML | **55.13%** | 0.2679 | 0.2483 | 0.1859 | 0.3957 | 0.034 ms | 1.5 MB |
| **BioBERT Transformer** | Medical Transformer | **55.87%** | 0.1397 | 0.2500 | 0.1792 | 0.4007 | 10.18 ms | 38.6 MB |

---

## 📂 Project Structure

```
MEDINTEL-AI/
├── backend/               # FastAPI Application & API Endpoints
│   └── app/
│       ├── api/endpoints/ # /analyze, /predict/classical, /predict/transformer, /rag/search, /history, /models
│       ├── database/      # SQLAlchemy session factory & database seeder
│       ├── models/        # 10 relational schema entities
│       ├── schemas/       # Pydantic validation schemas
│       ├── services/      # Master Clinical Orchestrator
│       └── main.py        # FastAPI server entrypoint
├── ml/                    # Classical Machine Learning Engine
│   ├── training/          # train_classical.py (LR, RF, XGBoost)
│   └── inference/         # classical_inference.py
├── transformer/           # Deep Learning & Medical Transformer
│   ├── model/             # PyTorch ClinicalTransformerClassifier
│   ├── tokenizer/         # BioBERT WordPiece tokenizer service
│   ├── training/          # train.py (PyTorch AdamW training loop)
│   └── inference/         # biobert_inference.py (with attention extraction)
├── rag/                   # Retrieval-Augmented Generation Engine
│   ├── ingestion/         # index_builder.py (Chunking & embedding)
│   ├── embeddings/        # embedder.py (Normalized dense representations)
│   ├── retrieval/         # retriever.py (Top-K vector lookup)
│   └── vectorstore/       # medical_index.json (43 guidelines)
├── llm/                   # Large Language Model & Safety Engine
│   ├── providers/         # Gemini, OpenAI, and Offline Educational Synthesizer
│   ├── prompts/           # Structured academic decision-support prompt templates
│   └── safety/            # Red-flag detector & prescription prohibition filter
├── data/                  # Data Engineering & Profiling
│   ├── raw/               # synthetic_clinical_dataset.csv (10,000 records)
│   ├── processed/         # train.csv (7,000), val.csv (1,500), test.csv (1,500)
│   ├── dataset_validator.py
│   ├── feature_pipeline.py
│   └── preprocess.py
├── evaluation/            # Persisted Scientific Metrics & Registries
│   ├── classical_ml_results.json
│   ├── transformer_results.json
│   └── experiment_registry.json
├── frontend/              # React 18 + TypeScript + Vite + Tailwind CSS Console
│   └── src/
└── tests/                 # Complete Automated Pytest Verification Suite
```

---

## 🚀 Quickstart & Execution

### 1. Run Automated Test Suite (22/22 Passing)
```bash
python -m pytest -v
```

### 2. Start FastAPI Backend Daemon
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 3. Start React Frontend Console
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
