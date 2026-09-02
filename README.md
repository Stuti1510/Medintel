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
[ 7. CLINICAL SAFETY & RED-FLAG TRIAGE ] (Acute Coronary, Stroke, Hypoxemia Detection)
       │
       ▼
[ 8. POSTGRESQL / SQLALCHEMY PERSISTENCE ] (10 Relational Schemas & Full Audit History)
       │
       ▼
[ 9. RESEARCH UI CONSOLE ] (Live Pipeline Animation, Attention Heatmaps, Viva Slides)
```

---

## 📊 Benchmark Test-Set Results (Isolated 15% Split, N=375)

All evaluation metrics are calculated on the untouched test split:

| Model Architecture | Model Family | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 | Latency | Artifact Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | Classical ML | **100.00%** | 100.00% | 100.00% | 1.0000 | 1.0000 | 0.015 ms | 391.8 KB |
| **Random Forest** | Classical ML | **100.00%** | 100.00% | 100.00% | 1.0000 | 1.0000 | 0.693 ms | 2.9 MB |
| **XGBoost** | Classical ML | **99.73%** | 99.73% | 99.73% | 0.9973 | 0.9973 | 0.099 ms | 2.0 MB |
| **BioBERT Transformer** | Medical Transformer | **100.00%** | 100.00% | 100.00% | 1.0000 | 1.0000 | 4.935 ms | 38.6 MB |

---

## 📂 Project Structure

```
MEDINTEL-AI/
├── backend/               # FastAPI Application & API Endpoints
│   └── app/
│       ├── api/endpoints/ # /analyze, /ml/predict, /transformer/predict, /rag/search, /history, /models
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
│   └── vectorstore/       # medical_index.json
├── llm/                   # Large Language Model & Safety Engine
│   ├── providers/         # Gemini, OpenAI, and Offline Educational Synthesizer
│   ├── prompts/           # Structured academic decision-support prompt templates
│   └── safety/            # Red-flag detector & prescription prohibition filter
├── knowledge/             # Verified Medical Knowledge Base (43 clinical documents)
│   ├── diseases/          # ACC, AHA, IDSA, ADA, GINA, KDIGO guidelines
│   ├── symptoms/          # Differential diagnostic algorithms
│   ├── red_flags/         # Emergency triage indicators
│   └── precautions/       # Non-prescriptive care guidance
├── data/                  # Data Engineering & Profiling
│   ├── raw/               # clinical_cases_raw.csv (2,500 samples across 20 diseases)
│   ├── processed/         # train.csv (70%), val.csv (15%), test.csv (15%)
│   ├── dataset_validator.py
│   └── preprocess.py
├── evaluation/            # Persisted Scientific Metrics & Registries
│   ├── classical_ml_results.json
│   ├── transformer_results.json
│   └── experiment_registry.json
├── frontend/              # React 18 + TypeScript + Vite + Tailwind CSS Console
│   └── src/
│       ├── components/    # LivePipelineTracker, AttentionHeatmap, DifferentialCard, EvidenceCard
│       ├── pages/         # Landing, ClinicalAnalysis, TransformerLab, ModelComparison, Viva
│       └── services/      # Typed API client
├── docs/                  # Comprehensive Markdown System Documentation
├── tests/                 # Automated PyTest Test Suite
└── scripts/               # Automation scripts (setup, dev, train)
```

---

## 🚀 Quickstart & Reproduction Commands

### 1. Ingest Data & Train Models
```powershell
# 1. Generate & Validate Dataset
python data/import_dataset.py

# 2. Train Classical ML Baseline
python ml/training/train_classical.py

# 3. Train BioBERT Transformer
python transformer/training/train.py

# 4. Build Knowledge Vector Index
python rag/ingestion/index_builder.py

# 5. Initialize Relational Database
python backend/app/database/init_db.py
```

### 2. Start Backend API
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### 3. Start React Frontend Console
```powershell
cd frontend
npm install
npm run dev
```
Open browser at: `http://localhost:5173`

### 4. Run Automated PyTest Suite
```powershell
python -m pytest tests/ -v
```

---

## 🎓 Viva & Presentation Mode (`/presentation`)
The platform includes an interactive 12-slide Viva Defense deck accessible directly in the UI at `http://localhost:5173/presentation`, demonstrating:
1. Dataset validation statistics (zero nulls, 20 balanced classes).
2. Leakage-free TF-IDF and PyTorch training curves.
3. WordPiece token attention heatmaps.
4. Classical ML vs BioBERT benchmark comparison.
5. Vector RAG grounded evidence citation.
6. PostgreSQL case audit trails.
