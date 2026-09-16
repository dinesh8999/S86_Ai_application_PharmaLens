"""
PharmaLens Retrieval & Vector Database Module
Handles Qdrant connection, collection setup, indexing, vector search, and metadata filtering.
"""

from __future__ import annotations

import logging
from typing import Any
# pyrefly: ignore [missing-import]
from qdrant_client import QdrantClient
# pyrefly: ignore [missing-import]
from qdrant_client.models import Distance, PointStruct, VectorParams, Filter, FieldCondition, MatchValue

from .config import get_settings, OUTPUTS_DIR

logger = logging.getLogger(__name__)

_qdrant_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Return QdrantClient instance, supporting Qdrant Cloud or falling back to local storage."""
    global _qdrant_client
    if _qdrant_client is None:
        settings = get_settings()
        url = str(settings.get("qdrant_url", "http://localhost:6333"))
        api_key = (settings.get("qdrant_api_key") or "").strip() or None

        # Check if remote Qdrant Cloud cluster
        if api_key and url.startswith("https://") and "localhost" not in url:
            try:
                client = QdrantClient(url=url, api_key=api_key, timeout=30.0)
                client.get_collections()
                logger.info(f"Connected to remote Qdrant Cloud cluster at {url}")
                _qdrant_client = client
                return _qdrant_client
            except Exception as cloud_err:
                logger.warning(f"Could not connect to Qdrant Cloud at {url}: {cloud_err}")

        # Local Qdrant server connection attempt (short timeout for fast fallback)
        if url.startswith("http://") and ("localhost" in url or "127.0.0.1" in url):
            try:
                client = QdrantClient(url=url, api_key=api_key, prefer_grpc=False, timeout=0.8)
                client.get_collections()
                logger.info(f"Connected to local Qdrant server at {url}")
                _qdrant_client = client
                return _qdrant_client
            except Exception:
                pass

        # Fallback to embedded disk-backed Qdrant instance
        local_path = OUTPUTS_DIR / "qdrant_db"
        local_path.mkdir(parents=True, exist_ok=True)
        _qdrant_client = QdrantClient(path=str(local_path))
        logger.info(f"Initialized embedded local Qdrant instance at {local_path}")

    return _qdrant_client


def ensure_collection_exists(collection_name: str | None = None, dimension: int | None = None) -> str:
    """Ensure Qdrant collection exists with proper vector dimension, Cosine metric, and payload indices."""
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
        
        # Ensure keyword payload indices exist for filtering
        indexed_fields = [
            "metadata.document_name",
            "metadata.source",
            "metadata.study_id",
            "metadata.document_type",
            "metadata.document_id",
            "metadata.drug",
        ]
        for field in indexed_fields:
            try:
                client.create_payload_index(
                    collection_name=col_name,
                    field_name=field,
                    field_schema="keyword",
                )
            except Exception:
                pass
    except Exception as err:
        logger.error(f"Error ensuring Qdrant collection: {err}")

    return col_name


def _normalize_token(text: str) -> str:
    """Normalize text token for resilient substring matching."""
    import re
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def _chunk_matches_filters(chunk_meta: dict[str, Any], filters: dict[str, Any]) -> bool:
    """Check if a chunk's metadata matches the supplied query filters resiliently."""
    if not filters:
        return True

    doc_name_filter = filters.get("document_name")
    if doc_name_filter and str(doc_name_filter).strip():
        target = str(doc_name_filter).strip().lower()
        target_norm = _normalize_token(target)

        meta_name = str(chunk_meta.get("document_name", "")).lower()
        meta_source = str(chunk_meta.get("source", "")).lower()
        meta_doc_id = str(chunk_meta.get("document_id", "")).lower()
        meta_drug = str(chunk_meta.get("drug", "")).lower()

        name_norm = _normalize_token(meta_name)
        source_norm = _normalize_token(meta_source)
        doc_id_norm = _normalize_token(meta_doc_id)
        drug_norm = _normalize_token(meta_drug)

        matched_doc = (
            target in meta_name
            or meta_name in target
            or target in meta_source
            or meta_source in target
            or target in meta_doc_id
            or meta_doc_id in target
            or (target_norm and (
                target_norm in name_norm
                or name_norm in target_norm
                or target_norm in source_norm
                or source_norm in target_norm
                or target_norm in doc_id_norm
                or doc_id_norm in target_norm
                or target_norm in drug_norm
            ))
        )
        if not matched_doc:
            return False

    study_filter = filters.get("study_id")
    if study_filter and str(study_filter).strip():
        sid_target = str(study_filter).strip().lower()
        if sid_target not in {"all studies", "all", "none", ""}:
            meta_sid = str(chunk_meta.get("study_id", "")).lower()
            sid_norm = _normalize_token(sid_target)
            meta_sid_norm = _normalize_token(meta_sid)
            if sid_norm not in meta_sid_norm and meta_sid_norm not in sid_norm:
                return False

    doc_type_filter = filters.get("document_type")
    if doc_type_filter and str(doc_type_filter).strip():
        dt_target = str(doc_type_filter).strip().lower()
        if dt_target not in {"all types", "all", "none", ""}:
            meta_dt = str(chunk_meta.get("document_type", "")).lower()
            dt_norm = _normalize_token(dt_target)
            meta_dt_norm = _normalize_token(meta_dt)
            if dt_norm not in meta_dt_norm and meta_dt_norm not in dt_norm:
                return False

    return True


def store_chunks(points: list[dict[str, Any]], collection_name: str | None = None) -> int:
    """
    Store chunk vector points into Qdrant.
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
    Retrieve top-k relevant chunks from Qdrant vector database with resilient fallback filtering.
    """
    if k <= 0:
        raise ValueError("k must be greater than 0")

    col_name = ensure_collection_exists(collection_name)
    client = get_qdrant_client()

    # Clean active filters
    active_filters = {}
    if filters:
        for k_name, v_val in filters.items():
            if v_val and str(v_val).strip() and str(v_val).strip().lower() not in {"all", "all studies", "all types"}:
                active_filters[k_name] = str(v_val).strip()

    def _format_point(res: Any) -> dict[str, Any]:
        payload = getattr(res, "payload", {}) or {}
        score = getattr(res, "score", 0.0)
        point_id = getattr(res, "id", "")
        meta = payload.get("metadata", {})
        return {
            "score": round(score, 4),
            "chunk_id": payload.get("original_chunk_id", str(point_id)),
            "text": payload.get("text", ""),
            "metadata": meta,
            "source": meta.get("source") or meta.get("document_name") or "Unknown",
            "study_id": meta.get("study_id", "N/A"),
            "page": meta.get("page", 1),
            "section": meta.get("section", "General Section"),
            "chunk_index": meta.get("chunk_index", 1),
        }

    # Step 1: Try exact filtered Qdrant query if filters are present
    if active_filters:
        must_conditions = []
        for key, val in active_filters.items():
            must_conditions.append(
                FieldCondition(
                    key=f"metadata.{key}",
                    match=MatchValue(value=val),
                )
            )
        q_filter = Filter(must=must_conditions) if must_conditions else None

        try:
            if hasattr(client, "query_points"):
                resp = client.query_points(
                    collection_name=col_name,
                    query=query_vector,
                    limit=k,
                    query_filter=q_filter,
                    with_payload=True,
                )
                points = resp.points
            elif hasattr(client, "search"):
                points = client.search(
                    collection_name=col_name,
                    query_vector=query_vector,
                    limit=k,
                    query_filter=q_filter,
                    with_payload=True,
                )
            else:
                points = []

            if points:
                return [_format_point(p) for p in points]
        except Exception as err:
            logger.warning(f"Direct Qdrant filtered search notice: {err}. Falling back to broad search.")

    # Step 2: Broad semantic search + In-memory resilient filter matching
    try:
        search_limit = max(k * 8, 32)
        if hasattr(client, "query_points"):
            resp = client.query_points(
                collection_name=col_name,
                query=query_vector,
                limit=search_limit,
                with_payload=True,
            )
            raw_points = resp.points
        elif hasattr(client, "search"):
            raw_points = client.search(
                collection_name=col_name,
                query_vector=query_vector,
                limit=search_limit,
                with_payload=True,
            )
        else:
            raw_points = []

        all_candidates = [_format_point(p) for p in raw_points]

        if active_filters:
            # Filter candidate chunks in memory
            matched_candidates = [c for c in all_candidates if _chunk_matches_filters(c.get("metadata", {}), active_filters)]
            if matched_candidates:
                return matched_candidates[:k]

            # If still no candidates found from vector search, scroll collection records for the filtered doc
            records, _ = client.scroll(
                collection_name=col_name,
                limit=500,
                with_payload=True,
                with_vectors=False,
            )
            doc_records = []
            for r in records:
                pl = r.payload or {}
                m = pl.get("metadata", {})
                if _chunk_matches_filters(m, active_filters):
                    doc_records.append({
                        "score": 0.50,
                        "chunk_id": pl.get("original_chunk_id", str(r.id)),
                        "text": pl.get("text", ""),
                        "metadata": m,
                        "source": m.get("source") or m.get("document_name") or "Unknown",
                        "study_id": m.get("study_id", "N/A"),
                        "page": m.get("page", 1),
                        "section": m.get("section", "General Section"),
                        "chunk_index": m.get("chunk_index", 1),
                    })
            if doc_records:
                return doc_records[:k]

        return all_candidates[:k]

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
