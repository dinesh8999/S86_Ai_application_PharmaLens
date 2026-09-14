"""
PharmaLens Document Service
Manages multi-page document parsing, Qdrant payload scrolling, corpus summary metrics,
and single-file user uploads.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

# pyrefly: ignore [missing-import]
from backend.app.core.config import DATA_DIR, UPLOADS_DIR
# pyrefly: ignore [missing-import]
from backend.app.services.retrieval_service import ensure_collection_exists, get_qdrant_client
# pyrefly: ignore [missing-import]
from backend.src.ingestion import ingest_file

logger = logging.getLogger(__name__)


def get_corpus_summary() -> dict[str, Any]:
    """Calculate total documents, pages, chunks, and document_type breakdown from Qdrant."""
    docs = get_all_documents()

    total_documents = len(docs)
    total_chunks = sum(d.get("chunk_count", 0) for d in docs)
    total_pages = sum(d.get("page_count", 1) for d in docs)

    type_counts: dict[str, int] = {
        "clinical_trial_report": 0,
        "drug_label": 0,
        "safety_bulletin": 0,
        "regulatory_guidance": 0,
    }

    for d in docs:
        dt = d.get("document_type", "clinical_trial_report")
        type_counts[dt] = type_counts.get(dt, 0) + 1

    return {
        "total_documents": total_documents,
        "total_pages": total_pages,
        "total_chunks": total_chunks,
        "document_type_breakdown": type_counts,
        "clinical_reports_count": type_counts.get("clinical_trial_report", 0),
        "drug_labels_count": type_counts.get("drug_label", 0),
        "safety_bulletins_count": type_counts.get("safety_bulletin", 0),
        "regulatory_guidance_count": type_counts.get("regulatory_guidance", 0),
    }


def get_all_documents() -> list[dict[str, Any]]:
    """Retrieve full indexed document library with page numbers, section info, and study linkage."""
    col_name = ensure_collection_exists()
    client = get_qdrant_client()

    try:
        records, _ = client.scroll(
            collection_name=col_name,
            limit=5000,
            with_payload=True,
            with_vectors=False,
        )

        docs_map: dict[str, dict[str, Any]] = {}

        for r in records:
            payload = r.payload or {}
            meta = payload.get("metadata", {})
            doc_name = meta.get("document_name") or meta.get("source") or "Unknown Document"
            study_id = meta.get("study_id", "STUDY-GENERIC")
            doc_type = meta.get("document_type", "clinical_trial_report")
            sponsor = meta.get("sponsor", "N/A")
            phase = meta.get("phase", "N/A")
            drug = meta.get("drug", "N/A")
            page = meta.get("page", 1)
            synthetic = meta.get("synthetic_demo_document", False)

            if doc_name not in docs_map:
                docs_map[doc_name] = {
                    "document_id": meta.get("document_id") or f"DOC-{hash(doc_name) & 0xffff}",
                    "document_name": doc_name,
                    "study_id": study_id,
                    "document_type": doc_type,
                    "sponsor": sponsor,
                    "phase": phase,
                    "drug": drug,
                    "chunk_count": 0,
                    "page_count": page,
                    "pages": set(),
                    "synthetic_demo_document": synthetic,
                    "status": "Indexed",
                    "upload_date": meta.get("upload_date", "2026-09-12"),
                }

            docs_map[doc_name]["chunk_count"] += 1
            docs_map[doc_name]["pages"].add(page)
            if page > docs_map[doc_name]["page_count"]:
                docs_map[doc_name]["page_count"] = page

        # Convert set of pages to count
        result = []
        for d in docs_map.values():
            d["page_count"] = max(len(d["pages"]), d["page_count"])
            del d["pages"]
            result.append(d)

        return sorted(result, key=lambda x: x["document_name"])

    except Exception as err:
        logger.error(f"Error reading document library from Qdrant: {err}")
        return []


def upload_and_index_document(file_path: Path, study_id: str | None = None) -> dict[str, Any]:
    """Ingest user-uploaded document file."""
    return ingest_file(file_path, study_id=study_id)


def find_document_file(document_name: str) -> Path | None:
    """Locate source document file on disk across corpus and uploads directories."""
    import re
    norm_name = document_name.strip().lower()

    search_dirs = [
        DATA_DIR / "expanded_corpus" / "clinical_reports",
        DATA_DIR / "expanded_corpus" / "drug_labels",
        DATA_DIR / "expanded_corpus" / "safety_bulletins",
        DATA_DIR / "expanded_corpus",
        DATA_DIR / "sample_corpus",
        Path(__file__).resolve().parent.parent.parent / "data" / "sample_corpus",
        UPLOADS_DIR,
    ]

    for sdir in search_dirs:
        if sdir.exists():
            for f in sdir.glob("*.*"):
                if f.name.lower() == norm_name or f.stem.lower() == norm_name:
                    return f

    # Fallback substring match
    for sdir in search_dirs:
        if sdir.exists():
            for f in sdir.glob("*.*"):
                if norm_name in f.name.lower():
                    return f

    return None


def get_document_detail(document_name: str) -> dict[str, Any] | None:
    """
    Retrieve full multi-page content of a document with pages, sections, and metadata
    for the researcher Document Viewer.
    """
    import re

    # First check indexed documents to resolve canonical metadata
    all_docs = get_all_documents()
    matching_doc = next(
        (
            d
            for d in all_docs
            if d["document_name"].lower() == document_name.lower()
            or d.get("document_id", "").lower() == document_name.lower()
            or document_name.lower() in d["document_name"].lower()
        ),
        None,
    )

    resolved_name = matching_doc["document_name"] if matching_doc else document_name
    file_path = find_document_file(resolved_name)

    doc_id = matching_doc.get("document_id", f"DOC-{hash(resolved_name) & 0xffff}") if matching_doc else f"DOC-{hash(resolved_name) & 0xffff}"
    study_id = matching_doc.get("study_id", "STUDY-GENERIC") if matching_doc else "STUDY-GENERIC"
    raw_doc_type = matching_doc.get("document_type", "clinical_trial_report") if matching_doc else "clinical_trial_report"
    sponsor = matching_doc.get("sponsor", "Pharmaceutical Sponsor") if matching_doc else "Pharmaceutical Sponsor"
    phase = matching_doc.get("phase", "Phase 3") if matching_doc else "Phase 3"
    drug = matching_doc.get("drug", "Target Compound") if matching_doc else "Target Compound"
    synthetic = matching_doc.get("synthetic_demo_document", False) if matching_doc else False
    chunk_count = matching_doc.get("chunk_count", 0) if matching_doc else 0

    pages: list[dict[str, Any]] = []
    raw_content = ""

    if file_path and file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_content = f.read()

            # Parse metadata lines from header
            lines = raw_content.splitlines()
            for l in lines[:20]:
                if l.startswith("Document ID:"):
                    doc_id = l.split(":", 1)[1].strip()
                elif l.startswith("Study ID:"):
                    study_id = l.split(":", 1)[1].strip()
                elif l.startswith("Document Type:"):
                    raw_doc_type = l.split(":", 1)[1].strip()
                elif l.startswith("Sponsor:"):
                    sponsor = l.split(":", 1)[1].strip()
                elif l.startswith("Phase:"):
                    phase = l.split(":", 1)[1].strip()
                elif l.startswith("Drug:"):
                    drug = l.split(":", 1)[1].strip()
                elif l.startswith("Synthetic Demo Document:"):
                    synthetic = l.split(":", 1)[1].strip().lower() == "true"

            # Parse pages
            page_splits = re.split(r"(?i)---\s*page\s*(\d+)\s*---", raw_content)
            if len(page_splits) > 1:
                for i in range(1, len(page_splits), 2):
                    pnum = int(page_splits[i])
                    ptext = page_splits[i + 1].strip()
                    secs = re.findall(r"(?m)^(?:##|Section:)\s*(.+)", ptext)
                    clean_secs = [s.strip() for s in secs if s.strip()]
                    pages.append({
                        "page_number": pnum,
                        "sections": clean_secs,
                        "text": ptext,
                    })
            else:
                secs = re.findall(r"(?m)^(?:##|Section:)\s*(.+)", raw_content)
                clean_secs = [s.strip() for s in secs if s.strip()]
                pages.append({
                    "page_number": 1,
                    "sections": clean_secs,
                    "text": raw_content.strip(),
                })

        except Exception as err:
            logger.error(f"Error reading document file {file_path}: {err}")

    # Fallback to Qdrant chunks if file read failed or empty
    if not pages:
        col_name = ensure_collection_exists()
        client = get_qdrant_client()
        try:
            records, _ = client.scroll(
                collection_name=col_name,
                limit=1000,
                with_payload=True,
                with_vectors=False,
            )
            doc_records = [
                r for r in records
                if (r.payload or {}).get("metadata", {}).get("document_name", "").lower() == resolved_name.lower()
                or (r.payload or {}).get("metadata", {}).get("source", "").lower() == resolved_name.lower()
            ]

            by_page: dict[int, list[str]] = {}
            for r in doc_records:
                payload = r.payload or {}
                meta = payload.get("metadata", {})
                p = meta.get("page", 1)
                t = payload.get("text", "")
                by_page.setdefault(p, []).append(t)

            for pnum in sorted(by_page.keys()):
                joined = "\n\n".join(by_page[pnum])
                pages.append({
                    "page_number": pnum,
                    "sections": [f"Page {pnum} Content"],
                    "text": joined,
                })
            raw_content = "\n\n".join([p["text"] for p in pages])
        except Exception as err:
            logger.error(f"Error reading document chunks from Qdrant: {err}")

    # Format normalized document type label
    dt_norm = raw_doc_type.lower()
    if "report" in dt_norm:
        formatted_type = "Clinical Trial Report"
    elif "label" in dt_norm or "insert" in dt_norm:
        formatted_type = "Drug Label"
    elif "bulletin" in dt_norm or "alert" in dt_norm or "warn" in dt_norm or "comm" in dt_norm:
        formatted_type = "Safety Bulletin"
    else:
        formatted_type = "Clinical Trial Report"

    provenance = "Synthetic Demo" if synthetic else "Authoritative Public"

    return {
        "document_id": doc_id,
        "document_name": resolved_name,
        "study_id": study_id,
        "document_type": formatted_type,
        "raw_document_type": raw_doc_type,
        "sponsor": sponsor,
        "phase": phase,
        "drug": drug,
        "provenance": provenance,
        "synthetic_demo_document": synthetic,
        "page_count": len(pages),
        "chunk_count": chunk_count or len(pages),
        "pages": pages,
        "raw_content": raw_content,
        "has_file_on_disk": file_path is not None,
    }

