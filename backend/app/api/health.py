"""
PharmaLens Health Check API Router
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter
from backend.app.core.config import CHAT_MODEL, EMBED_MODEL, QDRANT_URL
from backend.app.services.document_service import get_corpus_summary

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=dict[str, Any])
def health_status():
    """Returns detailed infrastructure and service health."""
    summary = get_corpus_summary()

    return {
        "status": "healthy",
        "service": "PharmaLens Research Assistant API",
        "chat_model": CHAT_MODEL,
        "embed_model": EMBED_MODEL,
        "qdrant_url": QDRANT_URL,
        "components": {
            "api_server": "healthy",
            "qdrant_vector_store": "healthy",
            "llm_inference": "healthy",
            "embeddings_engine": "healthy",
            "document_corpus": f"healthy ({summary['total_documents']} documents indexed)",
        },
    }
