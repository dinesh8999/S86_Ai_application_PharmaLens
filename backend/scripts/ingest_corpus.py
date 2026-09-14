"""
PharmaLens Repeatable Multi-Page Corpus Ingestion & Vector Indexing Script
Parses multi-page clinical documents, preserves page & section metadata,
embeds chunks, indexes into Qdrant, and generates corpus summary metrics.
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# Import application core services & settings
from backend.app.core.config import DATA_DIR, UPLOADS_DIR, QDRANT_COLLECTION
from backend.app.services.embedding_service import generate_embeddings
from backend.app.services.retrieval_service import store_chunks, get_indexed_documents

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def parse_multipage_document(filepath: Path) -> dict[str, Any]:
    """Parse text file or PDF, extracting headers, metadata, and page sections."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        full_text = f.read()

    # Extract header metadata if present
    doc_id = f"DOC-{uuid.uuid4().hex[:8]}"
    study_id = "STUDY-001"
    doc_type = "clinical_trial_report"
    sponsor = "General Pharma"
    phase = "Phase 3"
    drug = "Clinical Drug"
    synthetic = True

    lines = full_text.splitlines()
    body_lines = []
    for line in lines:
        if line.startswith("Document ID:"):
            doc_id = line.split(":", 1)[1].strip()
        elif line.startswith("Study ID:"):
            study_id = line.split(":", 1)[1].strip()
        elif line.startswith("Document Type:"):
            doc_type = line.split(":", 1)[1].strip()
        elif line.startswith("Sponsor:"):
            sponsor = line.split(":", 1)[1].strip()
        elif line.startswith("Phase:"):
            phase = line.split(":", 1)[1].strip()
        elif line.startswith("Drug:"):
            drug = line.split(":", 1)[1].strip()
        elif line.startswith("Synthetic Demo Document:"):
            synthetic = line.split(":", 1)[1].strip().lower() == "true"
        else:
            body_lines.append(line)

    body_text = "\n".join(body_lines)

    # Split pages using '--- Page X ---' markers or treat as single page
    page_splits = re.split(r"--- Page (\d+) ---", body_text)
    pages = []

    if len(page_splits) > 1:
        # We have page markers
        for i in range(1, len(page_splits), 2):
            page_num = int(page_splits[i])
            page_content = page_splits[i + 1].strip()
            if page_content:
                pages.append({"page": page_num, "text": page_content})
    else:
        pages.append({"page": 1, "text": body_text.strip()})

    return {
        "document_name": filepath.name,
        "filepath": str(filepath),
        "doc_id": doc_id,
        "study_id": study_id,
        "document_type": doc_type,
        "sponsor": sponsor,
        "phase": phase,
        "drug": drug,
        "synthetic_demo_document": synthetic,
        "pages": pages,
    }


def chunk_parsed_document(
    parsed_doc: dict[str, Any], chunk_size: int = 400, overlap: int = 80
) -> list[dict[str, Any]]:
    """Chunk pages while attaching page numbers, section headers, and study metadata."""
    chunks = []
    global_chunk_idx = 1

    for page_info in parsed_doc["pages"]:
        page_num = page_info["page"]
        page_text = page_info["text"]

        # Parse sections (marked by ## Section Name)
        sections = re.split(r"(## [^\n]+)", page_text)
        current_section = f"Page {page_num} Section"

        for i in range(0, len(sections)):
            part = sections[i].strip()
            if not part:
                continue

            if part.startswith("## "):
                current_section = part.replace("## ", "").strip()
                continue

            # Split paragraphs within section
            paragraphs = [p.strip() for p in part.split("\n\n") if p.strip()]
            current_chunk_text = ""

            for para in paragraphs:
                if len(current_chunk_text) + len(para) <= chunk_size:
                    current_chunk_text += ("\n\n" + para) if current_chunk_text else para
                else:
                    if current_chunk_text:
                        cid = f"chk-{uuid.uuid4().hex[:8]}"
                        chunks.append(
                            {
                                "chunk_id": cid,
                                "text": current_chunk_text,
                                "metadata": {
                                    "document_id": parsed_doc["doc_id"],
                                    "study_id": parsed_doc["study_id"],
                                    "document_name": parsed_doc["document_name"],
                                    "document_type": parsed_doc["document_type"],
                                    "sponsor": parsed_doc["sponsor"],
                                    "phase": parsed_doc["phase"],
                                    "drug": parsed_doc["drug"],
                                    "synthetic_demo_document": parsed_doc["synthetic_demo_document"],
                                    "page": page_num,
                                    "section": current_section,
                                    "chunk_index": global_chunk_idx,
                                },
                            }
                        )
                        global_chunk_idx += 1
                    overlap_str = (
                        current_chunk_text[-overlap:] if len(current_chunk_text) > overlap else ""
                    )
                    current_chunk_text = (overlap_str + "\n\n" + para).strip()

            if current_chunk_text:
                cid = f"chk-{uuid.uuid4().hex[:8]}"
                chunks.append(
                    {
                        "chunk_id": cid,
                        "text": current_chunk_text,
                        "metadata": {
                            "document_id": parsed_doc["doc_id"],
                            "study_id": parsed_doc["study_id"],
                            "document_name": parsed_doc["document_name"],
                            "document_type": parsed_doc["document_type"],
                            "sponsor": parsed_doc["sponsor"],
                            "phase": parsed_doc["phase"],
                            "drug": parsed_doc["drug"],
                            "synthetic_demo_document": parsed_doc["synthetic_demo_document"],
                            "page": page_num,
                            "section": current_section,
                            "chunk_index": global_chunk_idx,
                        },
                    }
                )
                global_chunk_idx += 1

    return chunks


def ingest_expanded_corpus() -> dict[str, Any]:
    """Scans expanded corpus directory, chunks documents, embeds, and indexes into Qdrant."""
    expanded_dir = DATA_DIR / "expanded_corpus"
    if not expanded_dir.exists():
        logger.error(f"Expanded corpus directory {expanded_dir} not found. Run generate_expanded_corpus.py first.")
        return {}

    all_files = list(expanded_dir.rglob("*.txt")) + list(expanded_dir.rglob("*.md")) + list(expanded_dir.rglob("*.pdf"))
    logger.info(f"Found {len(all_files)} documents to ingest.")

    total_documents = len(all_files)
    total_pages = 0
    all_chunks = []
    type_counts: dict[str, int] = {}
    study_counts: dict[str, int] = {}

    for filepath in all_files:
        parsed = parse_multipage_document(filepath)
        total_pages += len(parsed["pages"])

        dtype = parsed["document_type"]
        sid = parsed["study_id"]
        type_counts[dtype] = type_counts.get(dtype, 0) + 1
        study_counts[sid] = study_counts.get(sid, 0) + 1

        chunks = chunk_parsed_document(parsed)
        all_chunks.extend(chunks)

    logger.info(f"Total Chunks Created: {len(all_chunks)}. Generating Embeddings...")

    # Embed chunks in batches of 64
    texts = [c["text"] for c in all_chunks]
    batch_size = 64
    all_vectors = []

    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i : i + batch_size]
        vectors = generate_embeddings(batch_texts)
        all_vectors.extend(vectors)

    logger.info("Indexing points into Qdrant vector database...")

    points = []
    for chunk, vec in zip(all_chunks, all_vectors):
        points.append(
            {
                "id": str(uuid.uuid4()),
                "vector": vec,
                "payload": {
                    "chunk_id": chunk["chunk_id"],
                    "text": chunk["text"],
                    "metadata": chunk["metadata"],
                },
            }
        )

    stored_count = store_chunks(points)

    summary = {
        "status": "success",
        "documents_processed": total_documents,
        "pages_processed": total_pages,
        "chunks_created": len(all_chunks),
        "embeddings_created": len(all_vectors),
        "points_stored_in_qdrant": stored_count,
        "document_type_breakdown": type_counts,
        "study_count": len(study_counts),
    }

    print("\n" + "=" * 55)
    print("PHARMALENS CORPUS INGESTION METRICS REPORT")
    print("=" * 55)
    print(f"Documents Processed: {summary['documents_processed']}")
    print(f"Pages Processed:     {summary['pages_processed']}")
    print(f"Chunks Created:      {summary['chunks_created']}")
    print(f"Embeddings Created:  {summary['embeddings_created']}")
    print(f"Qdrant Points Stored:{summary['points_stored_in_qdrant']}")
    print(f"Studies Represented: {summary['study_count']}")
    print("Breakdown by Document Type:")
    for dt, cnt in type_counts.items():
        print(f"  - {dt}: {cnt}")
    print("=" * 55 + "\n")

    return summary


if __name__ == "__main__":
    ingest_expanded_corpus()
