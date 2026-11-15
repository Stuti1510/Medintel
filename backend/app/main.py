"""
FastAPI Main Application for MEDINTEL AI.
Mounts clinical and evaluation API routers with CORS support.
"""

from pathlib import Path
import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Configure cache directories within workspace
cache_dir = PROJECT_ROOT / ".cache"
cache_dir.mkdir(exist_ok=True)
os.environ["MPLCONFIGDIR"] = str(cache_dir / "matplotlib")
os.environ["HF_HUB_OFFLINE"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.endpoints.clinical import router as clinical_router
from backend.app.api.endpoints.models_eval import router as eval_router
from backend.app.database.init_db import init_db

app = FastAPI(
    title="MEDINTEL AI",
    description="Quality-Robust, Explainable Multimodal Skin Lesion Classifier on PAD-UFES-20",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    print("Application starting up...")
    init_db()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MEDINTEL AI Multimodal Engine",
        "dataset": "PAD-UFES-20 (4 classes)",
        "models": {
            "image": "EfficientNet-B0",
            "text": "TF-IDF + Linear SVM",
            "restoration": "U-Net",
            "fusion": "Quality-Aware Gated Fusion"
        }
    }

# Include API endpoints under /api
app.include_router(clinical_router, prefix="/api", tags=["Clinical Analysis"])
app.include_router(eval_router, prefix="/api", tags=["Evaluation & Benchmarks"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
