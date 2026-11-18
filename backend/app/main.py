"""
FastAPI Main Application for MEDINTEL AI.
Initializes database, loads multimodal models once at startup with lifespan,
and mounts clinical and evaluation API routers.
"""

from pathlib import Path
import os
import sys
from contextlib import asynccontextmanager

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    init_db()
    # Load and warm up models once at startup
    try:
        from backend.app.services.multimodal_service import get_multimodal_service
        svc = get_multimodal_service()
        if svc.is_ready:
            svc.warmup()
        else:
            print(f"[WARN] Startup check: model missing at {svc.missing_path}")
    except Exception as e:
        print(f"[WARN] Model initialization warning: {e}")
    yield
    print("Application shutting down...")

app = FastAPI(
    title="MEDINTEL AI",
    description="Quality-Robust, Explainable Multimodal Skin Lesion Classifier on PAD-UFES-20",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration: localhost ports 5173 and 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
@app.get("/api/health")
def get_system_status():
    from backend.app.services.multimodal_service import get_multimodal_service
    svc = get_multimodal_service()
    if not svc.is_ready:
        return {
            "status": "unavailable",
            "model": "UNAVAILABLE",
            "missing_path": svc.missing_path,
            "service": "MEDINTEL AI Multimodal Engine",
            "dataset": "PAD-UFES-20 (4 classes)"
        }
    return {
        "status": "ready",
        "model": "Quality-Aware Gated Fusion",
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
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
