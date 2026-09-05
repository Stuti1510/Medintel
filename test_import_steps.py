import sys
import os
import time

print("STEP 1: Starting test import...")
t0 = time.time()

print("STEP 2: Importing database session...")
from backend.app.database.session import SessionLocal, engine
print(f"STEP 2 OK ({time.time() - t0:.2f}s)")

print("STEP 3: Importing document parser...")
t0 = time.time()
from backend.app.services.document_parser import medical_document_parser
print(f"STEP 3 OK ({time.time() - t0:.2f}s)")

print("STEP 4: Importing classical ML inference...")
t0 = time.time()
from ml.inference.classical_inference import classical_ml_service
print(f"STEP 4 OK ({time.time() - t0:.2f}s)")

print("STEP 5: Importing BioBERT inference...")
t0 = time.time()
from transformer.inference.biobert_inference import BioBERTInferenceService
b = BioBERTInferenceService()
print(f"STEP 5 OK ({time.time() - t0:.2f}s)")

print("STEP 6: Importing RAG retriever...")
t0 = time.time()
from rag.retrieval.retriever import RAGRetrieverService
r = RAGRetrieverService()
print(f"STEP 6 OK ({time.time() - t0:.2f}s)")

print("STEP 7: Importing LLM engine...")
t0 = time.time()
from llm.services.llm_engine import LLMServiceEngine
l = LLMServiceEngine()
print(f"STEP 7 OK ({time.time() - t0:.2f}s)")

print("STEP 8: Importing clinical orchestrator...")
t0 = time.time()
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator
co = ClinicalAnalysisOrchestrator()
print(f"STEP 8 OK ({time.time() - t0:.2f}s)")

print("STEP 9: Importing FastAPI app...")
t0 = time.time()
from backend.app.main import app
print(f"STEP 9 OK ({time.time() - t0:.2f}s)")

print("ALL IMPORTS SUCCEEDED IN TOTAL TIME!")
