# MEDINTEL AI — Retrieval-Augmented Generation (RAG) Architecture

## Overview
The RAG subsystem grounds clinical recommendations and explanations in verified, peer-reviewed medical literature and official clinical guidelines.

## Vector Indexing & Ingestion
- **Document Store**: 43 structured clinical knowledge chunks across `knowledge/diseases/`, `knowledge/symptoms/`, `knowledge/precautions/`, `knowledge/red_flags/`, and `knowledge/general_information/`.
- **Sources**: ACC/AHA (Cardiology), IDSA/ATS (Infectious Diseases), ADA (Diabetes), GINA (Asthma), KDIGO (Nephrology), WSES (Emergency Surgery).
- **Embeddings**: High-dimensional normalized vector representations.
- **Search Metric**: Normalized Cosine Similarity ($L2$ normalized dot product).
- **Persisted Index**: `rag/vectorstore/medical_index.json`.

## Query Pipeline
1. Input narrative and predicted disease names are constructed into a targeted query vector.
2. The index performs top-K nearest-neighbor lookup (default $K=4$).
3. Retrieved snippets with attribution citations and similarity scores are injected directly into the LLM prompt context.
