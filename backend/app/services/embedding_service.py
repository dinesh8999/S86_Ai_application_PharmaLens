"""
PharmaLens Embedding Service
Wrapper around Gemini / OpenAI API embedding calls with deterministic fallback.
"""

from __future__ import annotations

import logging
from typing import Any
# pyrefly: ignore [missing-import]
from backend.src.embeddings import embed_query, embed_texts, get_llm_client

logger = logging.getLogger(__name__)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate vector embeddings for a list of text chunks."""
    return embed_texts(texts)


def generate_query_embedding(query: str) -> list[float]:
    """Generate vector embedding for a search query."""
    return embed_query(query)
