"""
PharmaLens Embedding Module
Generates vector embeddings using Gemini API (via OpenAI SDK compatibility layer).
"""

from __future__ import annotations

import logging
from typing import Any
# pyrefly: ignore [missing-import]
from openai import OpenAI
from .config import get_settings

logger = logging.getLogger(__name__)

_openai_client: OpenAI | None = None


def get_llm_client() -> OpenAI:
    """Initialize or return singleton OpenAI client for Gemini API."""
    global _openai_client
    if _openai_client is None:
        settings = get_settings()
        api_key = settings["openai_api_key"]
        base_url = settings["openai_base_url"]
        
        _openai_client = OpenAI(
            api_key=api_key or "dummy-key",
            base_url=base_url,
            timeout=15.0,
            max_retries=1,
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
        return _generate_fallback_vector(query, target_dim)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks with automatic rate limit backoff.
    """
    if not texts:
        return []

    settings = get_settings()
    embed_model = settings["embed_model"]
    target_dim = settings["vector_dimension"]
    client = get_llm_client()

    import time
    embeddings = []
    batch_size = 16  # Smaller batch size to prevent hitting free-tier RPM limits

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        max_attempts = 4
        success = False

        for attempt in range(max_attempts):
            try:
                response = client.embeddings.create(
                    model=embed_model,
                    input=batch,
                )
                for item in response.data:
                    vec = _adjust_vector_dimension(item.embedding, target_dim)
                    embeddings.append(vec)
                success = True
                time.sleep(1.0)  # Gentle delay between batches to stay under rate limits
                break
            except Exception as err:
                err_msg = str(err)
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                    wait_time = (attempt + 1) * 15
                    logger.warning(f"Rate limit 429 hit. Waiting {wait_time}s before retry (attempt {attempt + 1}/{max_attempts})...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Embedding error: {err}")
                    time.sleep(2.0)

        if not success:
            logger.warning("Using normalized deterministic fallback vectors for batch after retries.")
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
