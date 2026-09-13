"""
PharmaLens RAG Pipeline Engine
Coordinates query normalization, caching, embedding, vector retrieval, context assembly,
grounded generation, citation mapping, structured logging, and fallback responses.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any

# pyrefly: ignore [missing-import]
from backend.src.config import get_settings
# pyrefly: ignore [missing-import]
from backend.src.embeddings import embed_query
# pyrefly: ignore [missing-import]
from backend.src.retrieval import retrieve_context
# pyrefly: ignore [missing-import]
from backend.src.citations import (
    assemble_context,
    build_citation_map,
    generate_cited_answer,
)
# pyrefly: ignore [missing-import]
from backend.src.monitoring import log_request, calculate_cost

logger = logging.getLogger(__name__)

# Response Cache store: { cache_key: { "created_at": float, "response": dict } }
_QUERY_CACHE: dict[str, dict[str, Any]] = {}


def generate_cache_key(question: str, filters: dict[str, Any] | None = None, k: int = 4) -> str:
    """Generate deterministic hash key for caching."""
    norm_q = question.strip().lower()
    filter_str = json.dumps(filters or {}, sort_keys=True)
    raw = f"{norm_q}:{filter_str}:{k}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get_cached_response(cache_key: str) -> dict[str, Any] | None:
    """Retrieve response from cache if not expired."""
    settings = get_settings()
    ttl = int(settings["cache_ttl_seconds"])

    if cache_key in _QUERY_CACHE:
        item = _QUERY_CACHE[cache_key]
        age = time.time() - item["created_at"]
        if age < ttl:
            res = dict(item["response"])
            res["usage"] = dict(res["usage"])
            res["usage"]["cache_hit"] = True
            res["usage"]["latency_ms"] = 0.0
            return res
        else:
            # Expired
            del _QUERY_CACHE[cache_key]

    return None


def clear_cache() -> None:
    """Clear all cached query responses."""
    global _QUERY_CACHE
    _QUERY_CACHE.clear()


def store_cached_response(cache_key: str, response: dict[str, Any]) -> None:
    """Store response in query cache."""
    _QUERY_CACHE[cache_key] = {
        "created_at": time.time(),
        "response": response,
    }


def answer_with_citations(
    question: str,
    k: int = 4,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Main RAG pipeline entry point.
    Returns:
    {
        "answer": str,
        "citations": dict,
        "sources": list[str],
        "chunks": list[dict],
        "usage": {
            "request_id": str,
            "cache_hit": bool,
            "input_tokens": int,
            "output_tokens": int,
            "estimated_cost": float,
            "latency_ms": float
        }
    }
    """
    start_time = time.time()
    request_id = f"req-{uuid.uuid4().hex[:8]}"

    if not question or not question.strip():
        return fallback_response("Please enter a valid research question.", request_id, 0.0)

    # 1. Check Query Cache
    c_key = generate_cache_key(question, filters, k)
    cached = get_cached_response(c_key)
    if cached:
        logger.info(f"Cache HIT for query: '{question}'")
        return cached

    # 2. Query Embedding
    try:
        query_vector = embed_query(question)
    except Exception as err:
        logger.error(f"Failed generating query embedding: {err}")
        return fallback_response(
            "I don't have enough information in the available documents to answer that question.",
            request_id,
            (time.time() - start_time) * 1000,
            error=str(err),
        )

    # 3. Vector Similarity Search
    chunks = retrieve_context(query_vector, k=k, filters=filters)

    # 4. Filter / Quality check: Fallback if no relevant chunks found
    if not chunks:
        latency = (time.time() - start_time) * 1000
        res = fallback_response(
            "I don't have enough information in the available documents to answer that question.",
            request_id,
            latency,
        )
        log_request(
            request_id=request_id,
            question=question,
            answer=res["answer"],
            sources=[],
            cache_hit=False,
            input_tokens=0,
            output_tokens=0,
            latency_ms=latency,
        )
        return res

    # 5. Context Assembly & Citation Map
    context = assemble_context(chunks)
    citations = build_citation_map(chunks)
    sources = list({c["source"] for c in chunks})

    # 6. LLM Grounded Generation
    answer, input_tokens, output_tokens = generate_cited_answer(question, context)

    # If LLM response indicates insufficient context, wipe fake citations
    if "don't have enough information" in answer.lower():
        citations = {}

    latency_ms = (time.time() - start_time) * 1000
    cost = calculate_cost(input_tokens, output_tokens)

    response = {
        "answer": answer,
        "citations": citations,
        "sources": sources,
        "chunks": chunks,
        "usage": {
            "request_id": request_id,
            "cache_hit": False,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "estimated_cost": cost,
            "latency_ms": round(latency_ms, 2),
        },
    }

    # 7. Log & Cache Response
    log_request(
        request_id=request_id,
        question=question,
        answer=answer,
        sources=sources,
        cache_hit=False,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )
    store_cached_response(c_key, response)

    return response


def compare_studies(study_id_1: str, study_id_2: str, aspect: str = "safety and efficacy") -> dict[str, Any]:
    """
    Perform multi-document comparison query between two clinical trial studies.
    """
    question = f"Compare {study_id_1} and {study_id_2} regarding {aspect}."
    return answer_with_citations(question, k=6)



def fallback_response(answer: str, request_id: str, latency_ms: float, error: str | None = None) -> dict[str, Any]:
    """Generate no-source fallback response structure."""
    return {
        "answer": answer,
        "citations": {},
        "sources": [],
        "chunks": [],
        "usage": {
            "request_id": request_id,
            "cache_hit": False,
            "input_tokens": 0,
            "output_tokens": 0,
            "estimated_cost": 0.0,
            "latency_ms": round(latency_ms, 2),
            "error": error,
        },
    }
