"""
PharmaLens RAG Service Bridge
"""

from __future__ import annotations

from typing import Any
from backend.src.rag_pipeline import (
    answer_with_citations,
    compare_studies,
    clear_cache,
    generate_cache_key,
    get_cached_response,
)

__all__ = [
    "answer_with_citations",
    "compare_studies",
    "clear_cache",
    "generate_cache_key",
    "get_cached_response",
]
