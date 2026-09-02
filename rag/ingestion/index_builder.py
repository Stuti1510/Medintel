"""
MEDINTEL AI - Medical Knowledge Base Ingestion Pipeline
Parses markdown files in knowledge/, extracts YAML frontmatter metadata,
creates searchable text chunks, generates dense embeddings, and persists the vector index.
"""

import os
import sys
import re
import json
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from rag.embeddings.embedder import ClinicalEmbedder
from rag.vectorstore.vector_store import MedicalVectorStore

def parse_markdown_with_frontmatter(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    metadata = {}
    body = content

    # Parse YAML frontmatter if present
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if match:
        raw_meta, body = match.groups()
        for line in raw_meta.split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                metadata[k.strip()] = v.strip().strip('"').strip("'")

    return metadata, body.strip()

def build_knowledge_index(
    knowledge_dir: str = "knowledge",
    index_output: str = "rag/vectorstore/medical_index.json"
):
    print("=" * 60)
    print("MEDINTEL AI - MEDICAL KNOWLEDGE RAG INGESTION PIPELINE")
    print("=" * 60)

    embedder = ClinicalEmbedder()
    vector_store = MedicalVectorStore(index_path=index_output)
    # Reset store
    vector_store.documents = []

    doc_chunks = []
    chunk_texts = []

    for root, _, files in os.walk(knowledge_dir):
        for filename in files:
            if not filename.endswith(".md"):
                continue
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, knowledge_dir)
            category = os.path.basename(os.path.dirname(file_path)) or "general_information"

            metadata, body = parse_markdown_with_frontmatter(file_path)
            title = metadata.get("title", filename.replace(".md", "").replace("_", " ").title())
            source = metadata.get("source", "Peer-Reviewed Medical Literature / Clinical Guidelines")
            source_url = metadata.get("source_url", "https://pubmed.ncbi.nlm.nih.gov/")
            last_updated = metadata.get("last_updated", datetime.utcnow().strftime("%Y-%m-%d"))

            # Split body into sections / paragraphs
            sections = re.split(r'\n(?=##?\s)', body)
            for s_idx, sec in enumerate(sections):
                clean_sec = sec.strip()
                if len(clean_sec) < 40:
                    continue

                # Generate concise snippet
                snippet = clean_sec[:350] + ("..." if len(clean_sec) > 350 else "")
                chunk_id = f"{filename}_{s_idx}"

                doc_meta = {
                    "id": chunk_id,
                    "title": title,
                    "category": category,
                    "source": source,
                    "source_url": source_url,
                    "last_updated": last_updated,
                    "file_path": rel_path,
                    "snippet": snippet,
                    "full_content": clean_sec
                }

                doc_chunks.append(doc_meta)
                # Form queryable text representation
                searchable_text = f"{title}. Category: {category}. Source: {source}. Content: {clean_sec}"
                chunk_texts.append(searchable_text)

    if not chunk_texts:
        print("[RAG INGESTION] No documents found to index.")
        return

    print(f"[RAG INGESTION] Fitting vocabulary and generating embeddings for {len(chunk_texts)} knowledge chunks...")
    embedder.fit_and_save(chunk_texts)
    embeddings = embedder.embed(chunk_texts)

    vector_store.add_documents(doc_chunks, embeddings)
    vector_store.save_index()
    print(f"[RAG INGESTION] Index successfully built with {len(doc_chunks)} chunks from {knowledge_dir}")
    print("=" * 60)

if __name__ == "__main__":
    build_knowledge_index()
