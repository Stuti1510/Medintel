# MEDINTEL AI - Windows Development Start Script
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "MEDINTEL AI - Launching Full-Stack Platform" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if models exist, if not train them
if (-not (Test-Path "models/classical/logistic_regression.joblib")) {
    Write-Host "[1/4] Preparing dataset..." -ForegroundColor Yellow
    python data/import_dataset.py

    Write-Host "[2/4] Training Classical ML..." -ForegroundColor Yellow
    python ml/training/train_classical.py

    Write-Host "[3/4] Training Transformer..." -ForegroundColor Yellow
    python transformer/training/train.py

    Write-Host "[4/4] Ingesting RAG Knowledge..." -ForegroundColor Yellow
    python rag/ingestion/index_builder.py
}

# Initialize Database
python backend/app/database/init_db.py

Write-Host "`n[STARTING SERVICES]" -ForegroundColor Green
Write-Host "1. Backend: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "2. API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "3. Frontend: http://localhost:5173" -ForegroundColor White

# Start uvicorn
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start vite frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
