# MEDINTEL AI — Setup & Deployment Guide

## System Requirements
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: 18+ (tested on Node v24.14)
- **Database**: PostgreSQL (recommended) or SQLite (local development default)

## Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL=sqlite:///./medintel.db
LLM_PROVIDER=demo
LLM_API_KEY=
LLM_MODEL=gemini-1.5-flash
DEMO_MODE=true
```

## Step-by-Step Execution Commands

### 1. Data Preparation & Validation
```powershell
python data/import_dataset.py
```

### 2. Model Training
```powershell
# Train Classical ML Baselines (Logistic Regression, Random Forest, XGBoost)
python ml/training/train_classical.py

# Train BioBERT Transformer Encoder
python transformer/training/train.py
```

### 3. Build Medical Knowledge Vector Store
```powershell
python rag/ingestion/index_builder.py
```

### 4. Initialize Database
```powershell
python backend/app/database/init_db.py
```

### 5. Launch Backend Server
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 6. Launch Frontend Interface
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.
