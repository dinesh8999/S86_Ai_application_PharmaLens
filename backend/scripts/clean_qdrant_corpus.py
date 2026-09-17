"""
PharmaLens Corpus Deduplication & Normalization Script
Cleans Qdrant database to retain strictly the canonical substantial documents:
- Eliminates 3-page summary duplicates
- Normalizes document types (clinical_trial_report, drug_label, safety_bulletin)
- Fixes Drug_X_Safety_Bulletin to safety_bulletin
"""

from __future__ import annotations
import logging
# pyrefly: ignore [missing-import]
from qdrant_client.models import Filter, FieldCondition, MatchValue
# pyrefly: ignore [missing-import]
from backend.src.retrieval import get_qdrant_client, ensure_collection_exists

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CANONICAL_DOCUMENTS = {
    # Clinical Trial Reports (Substantial 16-22 pages, 34-48 chunks)
    "Study_001_Clinical_Report.txt",
    "Clinical_Trial_Protocol_002.txt",
    "STUDY_003_Clinical_Report.txt",
    "STUDY_014_Clinical_Report.txt",
    "STUDY_019_Clinical_Report.txt",
    "CHECKMATE_067_Clinical_Report.txt",
    "DAPA_HF_Clinical_Report.txt",
    "EINSTEIN_PE_Clinical_Report.txt",
    "EMPEROR_REDUCED_Clinical_Report.txt",
    "KEYNOTE_006_Clinical_Report.txt",
    "MONALEESA_2_Clinical_Report.txt",
    "SUSTAIN_6_Clinical_Report.txt",
    "TRAILBLAZER_ALZ_Clinical_Report.txt",

    # Drug Labels (Substantial 14-15 pages, 31-34 chunks)
    "Keytruda_US_Package_Insert.txt",
    "Kisunla_US_Package_Insert.txt",
    "Ozempic_US_Package_Insert.txt",
    "Xarelto_US_Package_Insert.txt",

    # Safety Bulletins (Substantial 8 pages, 18-19 chunks + Drug X)
    "Drug_X_Safety_Bulletin.txt",
    "EMA_PRAC_Safety_Communication_Semaglutide.txt",
    "FDA_Black_Box_Warning_Donanemab_ARIA.txt",
    "FDA_Safety_Alert_Pembrolizumab_Pneumonitis.txt",
}

def clean_corpus():
    client = get_qdrant_client()
    col_name = ensure_collection_exists()

    records, _ = client.scroll(
        collection_name=col_name,
        limit=5000,
        with_payload=True,
        with_vectors=False,
    )

    deleted_points = []
    updated_points = 0

    for r in records:
        payload = r.payload or {}
        meta = payload.get("metadata", {})
        doc_name = meta.get("document_name") or meta.get("source") or ""

        if doc_name not in CANONICAL_DOCUMENTS:
            deleted_points.append(r.id)
        else:
            # Fix Drug_X_Safety_Bulletin metadata if needed
            if "Drug_X_Safety_Bulletin" in doc_name:
                if meta.get("document_type") != "safety_bulletin":
                    meta["document_type"] = "safety_bulletin"
                    meta["study_id"] = "STUDY-DRUG-X"
                    meta["sponsor"] = "Pharma Global"
                    meta["drug"] = "Drug X"
                    client.set_payload(
                        collection_name=col_name,
                        payload={"metadata": meta},
                        points=[r.id],
                    )
                    updated_points += 1

    if deleted_points:
        logger.info(f"Deleting {len(deleted_points)} duplicate/short points from Qdrant...")
        # Batch delete in chunks of 500
        for i in range(0, len(deleted_points), 500):
            batch = deleted_points[i : i + 500]
            client.delete(
                collection_name=col_name,
                points_selector=batch,
            )

    logger.info(f"Corpus cleanup complete. Deleted {len(deleted_points)} points. Updated {updated_points} points.")

if __name__ == "__main__":
    clean_corpus()
