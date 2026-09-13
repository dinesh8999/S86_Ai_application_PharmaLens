"""
PharmaLens Embedding Module
Generates vector embeddings using Gemini API (via OpenAI SDK compatibility layer).
"""

from __future__ import annotations

import logging
from typing import Any
from openai import OpenAI
from backend.src.config import get_settings

logger = logging.getLogger(__name__)

_openai_client: OpenAI | None = None


def get_llm_client() -> OpenAI:
    """Initialize or return singleton OpenAI client for Gemini API."""
    global _openai_client
    if _openai_client is None:
        settings = get_settings()
        api_key = settings["openai_api_key"]
        base_url = settings["openai_base_url"]
        
        if not api_key:
            logger.warning("No API Key configured. Fallback dummy embeddings will be used if API fails.")
        
        _openai_client = OpenAI(
            api_key=api_key or "dummy-key",
            base_url=base_url,
        )
    return _openai_client


def embed_query(query: str) -> list[float]:
    """
    Convert user query into an embedding vector.
    """
    if not query.strip():
        raise ValueError("Query cannot be empty.")

    settings = get_settings()
    embed_model = settings["embed_model"]
    target_dim = settings["vector_dimension"]

    client = get_llm_client()
    try:
        response = client.embeddings.create(
            model=embed_model,
            input=query,
        )
        vector = response.data[0].embedding
        return _adjust_vector_dimension(vector, target_dim)
    except Exception as err:
        logger.error(f"Embedding API error for query: {err}")
        # Deterministic fallback vector for offline testing
        return _generate_fallback_vector(query, target_dim)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks.
    """
    if not texts:
        return []

    settings = get_settings()
    embed_model = settings["embed_model"]
    target_dim = settings["vector_dimension"]
    client = get_llm_client()

    embeddings = []
    # Process in batches of 16
    batch_size = 16
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        try:
            response = client.embeddings.create(
                model=embed_model,
                input=batch,
            )
            for item in response.data:
                vec = _adjust_vector_dimension(item.embedding, target_dim)
                embeddings.append(vec)
        except Exception as err:
            logger.error(f"Batch embedding error: {err}")
            for t in batch:
                embeddings.append(_generate_fallback_vector(t, target_dim))

    return embeddings


def _adjust_vector_dimension(vector: list[float], target_dim: int) -> list[float]:
    """Truncate or zero-pad vector to ensure exactly target_dim length."""
    if len(vector) == target_dim:
        return vector
    if len(vector) > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - len(vector))


def _generate_fallback_vector(text: str, target_dim: int) -> list[float]:
    """Generates a normalized deterministic fallback vector when API is offline."""
    import hashlib
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    val = int(seed_hash, 16)
    raw = [(val * (i + 1) % 1000) / 1000.0 - 0.5 for i in range(target_dim)]
    norm = sum(x * x for x in raw) ** 0.5 or 1.0
    return [x / norm for x in raw]
