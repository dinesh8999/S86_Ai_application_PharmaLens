"""
PharmaLens Retrieval & Vector Database Module
Handles Qdrant connection, collection setup, indexing, vector search, and metadata filtering.
"""

from __future__ import annotations

import logging
from typing import Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams, Filter, FieldCondition, MatchValue

from backend.src.config import get_settings, OUTPUTS_DIR

logger = logging.getLogger(__name__)

_qdrant_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Return QdrantClient instance, falling back to local memory if connection fails."""
    global _qdrant_client
    if _qdrant_client is None:
        settings = get_settings()
        url = str(settings["qdrant_url"])
        try:
            client = QdrantClient(url=url, timeout=3.0)
            client.get_collections()
            logger.info(f"Connected to Qdrant server at {url}")
            _qdrant_client = client
        except Exception as err:
            logger.warning(f"Could not connect to Qdrant at {url} ({err}). Initializing local Qdrant instance.")
            local_path = OUTPUTS_DIR / "qdrant_db"
            local_path.mkdir(parents=True, exist_ok=True)
            _qdrant_client = QdrantClient(path=str(local_path))

    return _qdrant_client


def ensure_collection_exists(collection_name: str | None = None, dimension: int | None = None) -> str:
    """Ensure Qdrant collection exists with proper vector dimension and Cosine metric."""
    settings = get_settings()
    col_name = collection_name or str(settings["qdrant_collection"])
    dim = dimension or int(settings["vector_dimension"])

    client = get_qdrant_client()
    try:
        collections = [c.name for c in client.get_collections().collections]
        if col_name not in collections:
            logger.info(f"Creating Qdrant collection '{col_name}' with vector dim {dim}")
            client.create_collection(
                collection_name=col_name,
                vectors_config=VectorParams(
                    size=dim,
                    distance=Distance.COSINE,
                ),
            )
    except Exception as err:
        logger.error(f"Error ensuring Qdrant collection: {err}")

    return col_name


def store_chunks(points: list[dict[str, Any]], collection_name: str | None = None) -> int:
    """
    Store chunk vector points into Qdrant.
    Each point dict should contain:
    - id: unique string ID or UUID
    - vector: list of float values
    - payload: dict containing original_chunk_id, text, metadata
    """
    if not points:
        return 0

    col_name = ensure_collection_exists(collection_name)
    client = get_qdrant_client()

    qdrant_points = [
        PointStruct(
            id=p["id"],
            vector=p["vector"],
            payload=p["payload"],
        )
        for p in points
    ]

    client.upsert(
        collection_name=col_name,
        points=qdrant_points,
    )
    return len(points)


def retrieve_context(
    query_vector: list[float],
    k: int = 4,
    filters: dict[str, Any] | None = None,
    collection_name: str | None = None,
) -> list[dict[str, Any]]:
    """
    Retrieve top-k relevant chunks from Qdrant vector database.
    """
    if k <= 0:
        raise ValueError("k must be greater than 0")

    col_name = ensure_collection_exists(collection_name)
    client = get_qdrant_client()

    # Build Qdrant metadata filters if supplied
    query_filter = None
    if filters:
        must_conditions = []
        for key, val in filters.items():
            if val:
                must_conditions.append(
                    FieldCondition(
                        key=f"metadata.{key}",
                        match=MatchValue(value=val),
                    )
                )
        if must_conditions:
            query_filter = Filter(must=must_conditions)

    try:
        if hasattr(client, "query_points"):
            response = client.query_points(
                collection_name=col_name,
                query=query_vector,
                limit=k,
                query_filter=query_filter,
                with_payload=True,
            )
            points = response.points
        elif hasattr(client, "search"):
            points = client.search(
                collection_name=col_name,
                query_vector=query_vector,
                limit=k,
                query_filter=query_filter,
                with_payload=True,
            )
        else:
            points = []

        retrieved = []
        for res in points:
            payload = getattr(res, "payload", {}) or {}
            score = getattr(res, "score", 0.0)
            point_id = getattr(res, "id", "")
            retrieved.append(
                {
                    "score": round(score, 4),
                    "chunk_id": payload.get("original_chunk_id", str(point_id)),
                    "text": payload.get("text", ""),
                    "metadata": payload.get("metadata", {}),
                    "source": payload.get("metadata", {}).get("source", "Unknown"),
                    "study_id": payload.get("metadata", {}).get("study_id", "N/A"),
                    "page": payload.get("metadata", {}).get("page"),
                    "section": payload.get("metadata", {}).get("section"),
                    "chunk_index": payload.get("metadata", {}).get("chunk_index"),
                }
            )

        return retrieved

    except Exception as err:
        logger.error(f"Retrieval error: {err}")
        return []


def get_indexed_documents(collection_name: str | None = None) -> list[dict[str, Any]]:
    """
    Retrieve distinct documents indexed in Qdrant with chunk counts and status.
    """
    col_name = ensure_collection_exists(collection_name)
    client = get_qdrant_client()

    try:
        records, _ = client.scroll(
            collection_name=col_name,
            limit=1000,
            with_payload=True,
            with_vectors=False,
        )

        doc_summary: dict[str, dict[str, Any]] = {}
        for r in records:
            payload = r.payload or {}
            meta = payload.get("metadata", {})
            source = meta.get("source", "Unknown")
            study_id = meta.get("study_id", "STUDY-GENERIC")
            upload_date = meta.get("upload_date", "2026-09-12")

            if source not in doc_summary:
                doc_summary[source] = {
                    "document_name": source,
                    "study_id": study_id,
                    "chunk_count": 0,
                    "status": "Indexed",
                    "upload_date": upload_date,
                    "doc_type": source.split(".")[-1].upper() if "." in source else "TXT",
                }
            doc_summary[source]["chunk_count"] += 1

        return list(doc_summary.values())
    except Exception as err:
        logger.error(f"Error fetching indexed documents: {err}")
        return []
