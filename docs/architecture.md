# MEDINTEL AI — System Architecture & Engineering Design

MEDINTEL AI is an academic clinical decision-support platform designed to unite classical statistical machine learning, deep medical Transformers (BioBERT), Retrieval-Augmented Generation (RAG), Large Language Models (LLM), and strict safety filters backed by a relational PostgreSQL database.

## High-Level Architecture Diagram

```
[ CLINICAL USER / RESEARCHER ]
            │
            ▼
   React + TypeScript UI (Vite + Tailwind CSS + Framer Motion)
            │
            ▼ REST API (JSON)
   FastAPI Clinical Orchestrator (/api/analyze)
            │
  ┌─────────┴────────────────────────────────────────┐
  │                                                  │
  ▼                                                  ▼
[ Classical ML Engine ]                   [ Medical Transformer Engine ]
• TF-IDF Vectorizer (2500 n-grams)        • WordPiece Tokenizer
• Logistic Regression (L2 regularized)    • BioBERT-v1.1 Encoder
• Random Forest (150 estimators)          • [CLS] Pooler + Linear Head
• XGBoost (Gradient Boosted Trees)        • Multi-Head Self-Attention
  │                                                  │
  └────────────────────────┬─────────────────────────┘
                           │
                           ▼
          [ Differential Diagnosis & Confidence ]
          • Probability Ranking (Top 1-5)
          • Model Concordance & Calibration
                           │
                           ▼
          [ Vector RAG Knowledge Retrieval ]
          • SentenceTransformer MiniLM Embeddings
          • Cosine Normalized Vector Store (knowledge/)
          • Top-K Clinical Evidence Snippets with Citations
                           │
                           ▼
          [ Grounded LLM Contextual Synthesis ]
          • Gemini / OpenAI / Offline Educational Engine
          • Prompt Template: Structured Differential Synthesis
                           │
                           ▼
          [ Clinical Safety & Red-Flag Audit ]
          • Acute Coronary, Stroke, Hypoxemia Rule Engine
          • Prescription & Diagnostic Prohibition Filter
          • Mandatory Decision-Support Disclaimers
                           │
                           ▼
          [ PostgreSQL / SQLAlchemy Persistence ]
          • Patient Cases, Predictions, Differentials, RAG Evidence, Audit Logs
                           │
                           ▼
          [ Interactive Explainable UI Console ]
```

## Key Architectural Highlights

1. **Dual-Model Parity**: Classical ML baselines are fitted before Transformer fine-tuning, enabling transparent comparative research without black-box opacity.
2. **Leakage-Free Partitioning**: TF-IDF, tokenizers, and scalers are strictly fitted on the 70% training split. The 15% test split remains completely untouched until final benchmark evaluation.
3. **Multi-Stage Grounding**: The LLM never invents diagnostic labels; it contextualizes predictions supplied by the ML/Transformer classifiers and retrieved clinical evidence.
4. **Safety Verification**: Emergency red-flag rules immediately detect critical cardiovascular, respiratory, and neurological events, mandating urgent clinical evaluation.
