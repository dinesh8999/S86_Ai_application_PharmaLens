"""
PharmaLens Retrieval Service
Manages Qdrant vector retrieval, metadata filtering, and document inventory scrolling.
"""

from __future__ import annotations

import logging
from typing import Any
from backend.src.retrieval import (
    ensure_collection_exists,
    get_indexed_documents,
    get_qdrant_client,
    retrieve_context,
    store_chunks,
)

logger = logging.getLogger(__name__)


def retrieve_chunks(
    query_vector: list[float],
    k: int = 5,
    study_id: str | None = None,
    document_type: str | None = None,
    filters: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Retrieve top-K matching chunks from Qdrant with optional study & doc_type filtering."""
    query_filters = filters or {}
    if study_id:
        query_filters["study_id"] = study_id
    if document_type:
        query_filters["document_type"] = document_type

    chunks = retrieve_context(query_vector=query_vector, k=k, filters=query_filters)

    # Standardize chunk attributes for RAG pipeline & citations
    standardized = []
    for c in chunks:
        meta = c.get("metadata", {})
        standardized.append({
            "chunk_id": c.get("chunk_id") or meta.get("chunk_id", "chk-unknown"),
            "score": c.get("score", 0.0),
            "text": c.get("text", ""),
            "source": meta.get("document_name") or c.get("source") or "Unknown Document",
            "study_id": meta.get("study_id") or c.get("study_id") or "N/A",
            "document_type": meta.get("document_type") or "clinical_trial_report",
            "sponsor": meta.get("sponsor") or "N/A",
            "phase": meta.get("phase") or "N/A",
            "drug": meta.get("drug") or "N/A",
            "page": meta.get("page") or c.get("page") or 1,
            "section": meta.get("section") or c.get("section") or "General Section",
            "synthetic_demo_document": meta.get("synthetic_demo_document", False),
            "metadata": meta,
        })
    return standardized
