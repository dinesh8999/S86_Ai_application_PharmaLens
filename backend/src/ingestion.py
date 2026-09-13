"""
PharmaLens Document Ingestion Module
Extracts text from PDF, TXT, MD, DOCX files, splits into chunk points with preserved metadata,
generates embeddings, and indexes them into Qdrant.
"""

from __future__ import annotations

import logging
import uuid
import re
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

from backend.src.config import get_settings, UPLOADS_DIR, DATA_DIR
from backend.src.embeddings import embed_texts
from backend.src.retrieval import store_chunks, get_indexed_documents

logger = logging.getLogger(__name__)


def ingest_file(file_path: Path | str, study_id: str | None = None) -> dict[str, Any]:
    """
    Ingest a single document file into Qdrant.
    Extracts text, creates chunks, computes embeddings, and indexes.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    text = extract_text_from_file(path)
    if not text.strip():
        raise ValueError(f"No readable text found in file {path.name}")

    file_study_id = study_id or infer_study_id(path.name, text)
    chunks = create_chunks(text, source=path.name, study_id=file_study_id)
    
    chunk_texts = [c["text"] for c in chunks]
    embeddings = embed_texts(chunk_texts)

    points = []
    for chunk, vector in zip(chunks, embeddings):
        vector_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{path.name}-{chunk['chunk_id']}"))
        points.append(
            {
                "id": vector_id,
                "vector": vector,
                "payload": {
                    "original_chunk_id": chunk["chunk_id"],
                    "text": chunk["text"],
                    "metadata": chunk["metadata"],
                },
            }
        )

    indexed_count = store_chunks(points)
    logger.info(f"Ingested {indexed_count} chunks for document '{path.name}' (Study ID: {file_study_id})")

    return {
        "source": path.name,
        "study_id": file_study_id,
        "chunks_indexed": indexed_count,
        "status": "Indexed",
    }


def extract_text_from_file(file_path: Path) -> str:
    """Extract plain text based on file extension."""
    suffix = file_path.suffix.lower()

    if suffix in [".txt", ".md", ".csv", ".json"]:
        return file_path.read_text(encoding="utf-8", errors="ignore")

    elif suffix == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages_text = []
            for idx, page in enumerate(reader.pages, start=1):
                t = page.extract_text() or ""
                pages_text.append(f"--- PAGE {idx} ---\n{t}")
            return "\n\n".join(pages_text)
        except Exception as err:
            logger.warning(f"pypdf extraction failed for {file_path.name}: {err}. Falling back to plain text read.")
            return file_path.read_text(encoding="utf-8", errors="ignore")

    elif suffix == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception as err:
            logger.warning(f"docx extraction failed for {file_path.name}: {err}")
            return file_path.read_text(encoding="utf-8", errors="ignore")

    else:
        # Default text read
        return file_path.read_text(encoding="utf-8", errors="ignore")


def infer_study_id(filename: str, text: str) -> str:
    """Infer Study ID from filename or text content."""
    # Look for STUDY-xxx or Study_xxx in filename
    match = re.search(r"STUDY[-_]?(\d+)", filename, re.IGNORECASE)
    if match:
        return f"STUDY-{match.group(1).zfill(3)}"

    # Search in text content
    text_match = re.search(r"Study\s+(\d+)", text[:1000], re.IGNORECASE)
    if text_match:
        return f"STUDY-{text_match.group(1).zfill(3)}"

    return "STUDY-001"


def create_chunks(
    text: str,
    source: str,
    study_id: str,
    chunk_size: int = 500,
    chunk_overlap: int = 80,
) -> list[dict[str, Any]]:
    """
    Split text into sliding window chunks while retaining metadata.
    """
    clean_text = text.replace("\r\n", "\n")
    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]

    chunks = []
    chunk_counter = 1
    current_section = "General"
    current_page = 1

    current_chunk_words: list[str] = []
    current_len = 0

    for paragraph in paragraphs:
        # Detect page indicators
        page_match = re.search(r"--- PAGE (\d+) ---", paragraph)
        if page_match:
            current_page = int(page_match.group(1))
            paragraph = re.sub(r"--- PAGE \d+ ---", "", paragraph).strip()
            if not paragraph:
                continue

        # Detect section headings
        if len(paragraph) < 80 and any(kw in paragraph.lower() for kw in ["safety", "efficacy", "method", "result", "discussion", "introduction", "background", "endpoint"]):
            current_section = paragraph.strip("#").strip()

        words = paragraph.split()
        for word in words:
            current_chunk_words.append(word)
            current_len += len(word) + 1

            if current_len >= chunk_size:
                chunk_str = " ".join(current_chunk_words)
                chunk_id = f"{study_id.lower()}-chunk-{str(chunk_counter).zfill(3)}"
                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "text": chunk_str,
                        "metadata": {
                            "source": source,
                            "study_id": study_id,
                            "chunk_index": chunk_counter,
                            "section": current_section,
                            "page": current_page,
                            "upload_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        },
                    }
                )
                chunk_counter += 1
                # Sliding overlap
                overlap_words = current_chunk_words[-(chunk_overlap // 5) :] if len(current_chunk_words) > 10 else []
                current_chunk_words = overlap_words
                current_len = sum(len(w) + 1 for w in current_chunk_words)

    # Flush remaining text
    if current_chunk_words:
        chunk_str = " ".join(current_chunk_words)
        if len(chunk_str) > 20:
            chunk_id = f"{study_id.lower()}-chunk-{str(chunk_counter).zfill(3)}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "text": chunk_str,
                    "metadata": {
                        "source": source,
                        "study_id": study_id,
                        "chunk_index": chunk_counter,
                        "section": current_section,
                        "page": current_page,
                        "upload_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    },
                }
            )

    return chunks


def seed_sample_clinical_documents() -> list[dict[str, Any]]:
    """
    Check if vector database is empty. If empty, create and ingest sample clinical trial documents.
    """
    existing_docs = get_indexed_documents()
    if existing_docs:
        logger.info(f"Vector DB already has {len(existing_docs)} indexed documents. Skipping seeding.")
        return existing_docs

    sample_dir = DATA_DIR / "sample_corpus"
    sample_dir.mkdir(parents=True, exist_ok=True)

    # Create sample clinical trial 001
    doc1 = sample_dir / "Study_001_Clinical_Report.txt"
    if not doc1.exists():
        doc1.write_text(
            "--- PAGE 1 ---\n"
            "CLINICAL STUDY REPORT: STUDY-001\n"
            "Title: Safety and Efficacy of Drug X in Adult Patients with Moderate Disease\n"
            "Section: Overview and Primary Endpoint\n"
            "Study 001 evaluated the safety and efficacy of Drug X in adult patients with moderate disease. "
            "The primary endpoint was the change in disease severity from baseline after twelve weeks of treatment. "
            "A total of 450 subjects were randomized across 12 clinical trial sites.\n\n"
            "--- PAGE 2 ---\n"
            "Section: Safety and Adverse Events\n"
            "In Study 001, adverse events were generally mild to moderate. The most common treatment-emergent adverse event "
            "was transient headache, reported in 8.5% of patients receiving Drug X versus 3.2% in the placebo group. "
            "No drug-related serious adverse events or treatment-related deaths were observed during the 12-week study period.",
            encoding="utf-8",
        )

    # Create sample safety bulletin
    doc2 = sample_dir / "Drug_X_Safety_Bulletin.txt"
    if not doc2.exists():
        doc2.write_text(
            "--- PAGE 1 ---\n"
            "PHARMACOVIGILANCE SAFETY BULLETIN: DRUG X\n"
            "Section: Contraindications and Drug Interactions\n"
            "Drug X is contraindicated in patients with severe hepatic impairment or known hypersensitivity to active ingredients. "
            "Concomitant administration with strong CYP3A4 inhibitors may increase systemic exposure to Drug X and requires dose reduction. "
            "Renal monitoring is recommended for elderly patients over 75 years of age.",
            encoding="utf-8",
        )

    # Create sample eligibility protocol
    doc3 = sample_dir / "Clinical_Trial_Protocol_002.txt"
    if not doc3.exists():
        doc3.write_text(
            "--- PAGE 1 ---\n"
            "CLINICAL PROTOCOL: STUDY-002\n"
            "Title: Phase III Study of Combination Therapy in Refractory Patient Cohorts\n"
            "Section: Inclusion and Exclusion Criteria\n"
            "Inclusion Criteria for Study 002: Patients aged 18 to 65 years with documented refractory disease severity >= 4. "
            "Exclusion Criteria: Prior exposure to biologic therapies within 90 days, pregnant or lactating female subjects, "
            "or baseline AST/ALT elevation greater than 2.5 times the upper limit of normal.",
            encoding="utf-8",
        )

    ingest_file(doc1, study_id="STUDY-001")
    ingest_file(doc2, study_id="SAFETY-BULLETIN")
    ingest_file(doc3, study_id="STUDY-002")

    return get_indexed_documents()
