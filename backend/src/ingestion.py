"""
PharmaLens Document Ingestion & Chunking Module
Handles PDF/TXT/DOCX reading, recursive chunking, metadata preservation, and Qdrant indexing.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any

from .config import UPLOADS_DIR, DATA_DIR
from .embeddings import embed_texts
from .retrieval import store_chunks, get_indexed_documents

logger = logging.getLogger(__name__)


def extract_text_from_file(file_path: Path) -> str:
    """Extract raw text from PDF, TXT, MD, or DOCX document."""
    ext = file_path.suffix.lower()

    if ext in {".txt", ".md"}:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    elif ext == ".pdf":
        try:
            # pyrefly: ignore [missing-import]
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            text_pages = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                text_pages.append(f"--- Page {i+1} ---\n" + txt)
            return "\n\n".join(text_pages)
        except Exception as err:
            logger.warning(f"pypdf extraction error: {err}. Falling back to plain text read.")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    elif ext == ".docx":
        try:
            # pyrefly: ignore [missing-import]
            import docx
            doc = docx.Document(str(file_path))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as err:
            logger.warning(f"python-docx extraction error: {err}")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    raise ValueError(f"Unsupported file format: {ext}")


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100,
    metadata: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Recursive chunking strategy preserving source metadata, page numbers, and section headers."""
    import re
    if not text or not text.strip():
        return []

    meta = dict(metadata or {})
    chunks = []
    chunk_idx = 1

    # Split by pages if present
    page_splits = re.split(r"(?i)---\s*page\s*(\d+)\s*---", text)
    if len(page_splits) > 1:
        # We have page markers
        pages_content = []
        for i in range(1, len(page_splits), 2):
            pnum = int(page_splits[i])
            ptext = page_splits[i + 1].strip()
            pages_content.append((pnum, ptext))
    else:
        pages_content = [(meta.get("page", 1), text.strip())]

    for pnum, ptext in pages_content:
        # Detect active section title in this page
        current_section = meta.get("section", "General Section")
        secs = re.findall(r"(?m)^(?:##|Section:|Topic:)\s*(.+)", ptext)
        if secs:
            current_section = secs[0].strip()

        raw_paragraphs = [p.strip() for p in ptext.split("\n\n") if p.strip()]
        current_chunk = ""

        for para in raw_paragraphs:
            # Update section if paragraph is a header
            header_match = re.match(r"(?m)^(?:##|Section:|Topic:)\s*(.+)", para)
            if header_match:
                current_section = header_match.group(1).strip()

            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" + para) if current_chunk else para
            else:
                if current_chunk:
                    chunk_id = f"chk-{uuid.uuid4().hex[:8]}"
                    chunks.append(
                        {
                            "chunk_id": chunk_id,
                            "text": current_chunk.strip(),
                            "metadata": {
                                **meta,
                                "page": pnum,
                                "section": current_section,
                                "chunk_index": chunk_idx,
                                "original_chunk_id": chunk_id,
                            },
                        }
                    )
                    chunk_idx += 1
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
                current_chunk = (overlap_text + "\n\n" + para).strip()

        if current_chunk:
            chunk_id = f"chk-{uuid.uuid4().hex[:8]}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "text": current_chunk.strip(),
                    "metadata": {
                        **meta,
                        "page": pnum,
                        "section": current_section,
                        "chunk_index": chunk_idx,
                        "original_chunk_id": chunk_id,
                    },
                }
            )
            chunk_idx += 1

    return chunks


def ingest_file(file_path: Path, study_id: str | None = None) -> dict[str, Any]:
    """Ingest a single document file into Qdrant with robust metadata extraction."""
    import re
    filename = file_path.name
    sid = study_id or infer_study_id(filename)

    raw_text = extract_text_from_file(file_path)
    if not raw_text.strip():
        raise ValueError(f"No text could be extracted from {filename}")

    # Extract metadata from header if available
    doc_id = f"DOC-{uuid.uuid4().hex[:8]}"
    doc_type = "clinical_trial_report" if "report" in filename.lower() else ("drug_label" if "label" in filename.lower() or "insert" in filename.lower() else "safety_bulletin")
    sponsor = "Pharmaceutical Sponsor"
    phase = "Phase 3"
    drug = sid
    synthetic = False

    # Check for Document ID pattern
    doc_id_match = re.search(r"(?i)Document ID[:\s\n]+([A-Z0-9\-_]+)", raw_text)
    if doc_id_match:
        doc_id = doc_id_match.group(1).strip()

    # Check for Study ID pattern
    study_id_match = re.search(r"(?i)Study ID[:\s\n]+([A-Z0-9\-_]+)", raw_text)
    if study_id_match:
        sid = study_id_match.group(1).strip()
    elif "PL-NICIP" in doc_id or "nicip" in filename.lower():
        sid = "STUDY-NICIP"

    # Check for Document Type pattern
    doc_type_match = re.search(r"(?i)Document Type[:\s\n]+([A-Za-z0-9\s\-_\(\)]+)", raw_text)
    if doc_type_match:
        dt_val = doc_type_match.group(1).splitlines()[0].strip()
        if dt_val:
            doc_type = dt_val

    # Check for Brand / Drug name
    brand_match = re.search(r"(?i)Brand[:\s\n]+([A-Za-z0-9\s\-_]+)", raw_text)
    generic_match = re.search(r"(?i)Generic name[:\s\n]+([A-Za-z0-9\s\-_]+)", raw_text)
    drug_match = re.search(r"(?i)Drug[:\s\n]+([A-Za-z0-9\s\-_]+)", raw_text)
    
    if brand_match and generic_match:
        drug = f"{brand_match.group(1).strip()} ({generic_match.group(1).strip()})"
    elif brand_match:
        drug = brand_match.group(1).strip()
    elif generic_match:
        drug = generic_match.group(1).strip()
    elif drug_match:
        drug = drug_match.group(1).strip()
    elif "nicip" in filename.lower():
        drug = "Nicip (Nimesulide)"

    # Check for Sponsor
    sponsor_match = re.search(r"(?i)Sponsor[:\s\n]+([A-Za-z0-9\s\-_]+)", raw_text)
    if sponsor_match:
        sponsor = sponsor_match.group(1).splitlines()[0].strip()

    # Check for Phase
    phase_match = re.search(r"(?i)Phase[:\s\n]+([A-Za-z0-9\s\-_]+)", raw_text)
    if phase_match:
        phase = phase_match.group(1).splitlines()[0].strip()

    # Check for Synthetic status
    if "synthetic" in raw_text.lower() or "synthetic demonstration" in raw_text.lower():
        synthetic = True

    meta = {
        "source": filename,
        "document_name": filename,
        "document_id": doc_id,
        "study_id": sid,
        "document_type": doc_type,
        "sponsor": sponsor,
        "phase": phase,
        "drug": drug,
        "synthetic_demo_document": synthetic,
        "upload_date": "2026-09-14",
    }

    chunks = chunk_text(raw_text, metadata=meta)
    texts = [c["text"] for c in chunks]

    embeddings = embed_texts(texts)

    points = []
    for c, vec in zip(chunks, embeddings):
        points.append(
            {
                "id": str(uuid.uuid4()),
                "vector": vec,
                "payload": {
                    "original_chunk_id": c["chunk_id"],
                    "text": c["text"],
                    "metadata": c["metadata"],
                },
            }
        )

    stored_count = store_chunks(points)

    return {
        "status": "success",
        "document_name": filename,
        "study_id": sid,
        "chunks_created": stored_count,
        "message": f"Successfully indexed {filename} ({stored_count} chunks) into Qdrant.",
    }


def infer_study_id(filename: str) -> str:
    """Infer study ID from filename convention."""
    fn = filename.upper()
    if "STUDY_001" in fn or "STUDY001" in fn or "STUDY-001" in fn:
        return "STUDY-001"
    elif "STUDY_002" in fn or "STUDY002" in fn or "STUDY-002" in fn:
        return "STUDY-002"
    elif "DRUG" in fn:
        return "STUDY-DRUG-X"
    return "STUDY-001"


def seed_sample_clinical_documents() -> None:
    """Seed initial sample clinical trial reports and bulletins into vector storage."""
    sample_dir = DATA_DIR / "sample_corpus"
    if not sample_dir.exists():
        sample_dir = Path(__file__).resolve().parent.parent / "data" / "sample_corpus"

    if not sample_dir.exists():
        logger.info("Sample corpus directory not found. Skipping auto-seeding.")
        return

    existing = get_indexed_documents()
    if existing:
        logger.info(f"Qdrant already contains {len(existing)} indexed documents. Skipping seed.")
        return

    for doc_file in sample_dir.glob("*.*"):
        if doc_file.suffix.lower() in {".pdf", ".txt", ".md", ".docx"}:
            try:
                ingest_file(doc_file)
                logger.info(f"Seeded sample document: {doc_file.name}")
            except Exception as err:
                logger.error(f"Error seeding {doc_file.name}: {err}")
