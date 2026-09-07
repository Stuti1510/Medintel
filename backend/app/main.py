"""
MEDINTEL AI - FastAPI Main Application Entrypoint
Clinical Diagnosis Prediction & Medical Recommendation Engine
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.api.endpoints.clinical import router as clinical_router
from backend.app.api.endpoints.models_eval import router as models_eval_router
from backend.app.api.endpoints.motor import router as motor_router
from backend.app.database.init_db import init_database
from rag.ingestion.index_builder import build_knowledge_index

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("MEDINTEL AI - INITIALIZING BACKEND SERVICES")
    print("=" * 60)
    # 1. Initialize Database & Seed Models
    try:
        init_database()
    except Exception as e:
        print(f"[STARTUP] Database init warning: {e}")

    # 2. Build RAG Index if needed
    if not os.path.exists("rag/vectorstore/medical_index.json"):
        try:
            build_knowledge_index()
        except Exception as e:
            print(f"[STARTUP] RAG indexing warning: {e}")

    print("[STARTUP] MEDINTEL AI backend initialized and ready for inference.")
    yield
    print("[SHUTDOWN] Terminating MEDINTEL AI backend.")

app = FastAPI(
    title="MEDINTEL AI - Clinical Intelligence Engine",
    description="Full-stack AI Clinical Decision-Support Platform combining Classical ML, Medical Transformers (BioBERT), RAG, and Grounded LLM synthesis.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(clinical_router)
app.include_router(models_eval_router)
app.include_router(motor_router, prefix="/api/motor", tags=["Motor Screening"])

@app.get("/")
async def root():
    return {
        "service": "MEDINTEL AI",
        "description": "Clinical Intelligence, Made Interpretable.",
        "status": "ONLINE",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
