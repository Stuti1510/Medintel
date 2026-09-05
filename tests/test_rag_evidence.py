"""
MEDINTEL AI - Phase 13 RAG System & Evidence Integrity Test Suite
"""

import os
import pytest
from rag.retrieval.retriever import RAGRetrieverService
from rag.vectorstore.vector_store import MedicalVectorStore

def test_rag_index_integrity():
    store = MedicalVectorStore()
    assert len(store.documents) > 0, "RAG vector store must contain indexed clinical guidelines"
    assert store.embeddings.shape[0] == len(store.documents)
    assert store.embeddings.shape[1] > 0

def test_rag_evidence_retrieval():
    retriever = RAGRetrieverService()
    queries = [
        "Sepsis diagnostic criteria and serum lactate monitoring",
        "Heart failure with reduced ejection fraction management",
        "Community-acquired pneumonia empiric antibiotic therapy"
    ]
    
    for q in queries:
        res = retriever.search_evidence(q, top_k=3)
        assert res["status"] == "SUCCESS"
        assert res["total_retrieved"] == 3
        assert res["retrieval_time_ms"] > 0
        
        # Verify evidence citations
        for item in res["evidence"]:
            assert "id" in item
            assert "title" in item
            assert "source" in item
            assert "source_url" in item
            assert "snippet" in item
            assert 0.0 <= item["similarity_score"] <= 1.0
            assert item["source_url"].startswith("http")

if __name__ == "__main__":
    test_rag_index_integrity()
    test_rag_evidence_retrieval()
    print("All RAG integrity tests passed successfully.")
