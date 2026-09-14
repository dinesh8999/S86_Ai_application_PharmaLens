"""
Links regulatory documents and safety bulletins to their canonical study identities.
STUDY-003: Clinical Report + Keytruda Drug Label + Pembrolizumab Pneumonitis Safety Alert
SUSTAIN-6: Clinical Report + Ozempic Drug Label + Semaglutide Safety Communication
EINSTEIN-PE: Clinical Report + Xarelto Drug Label
TRAILBLAZER-ALZ: Clinical Report + Kisunla Drug Label + Donanemab ARIA Black Box Warning
"""

from __future__ import annotations
import logging
from backend.src.retrieval import get_qdrant_client, ensure_collection_exists

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DOC_STUDY_MAPPING = {
    # Pembrolizumab / STUDY-003
    "STUDY_003_Clinical_Report.txt": ("STUDY-003", "Pembrolizumab", "Merck & Co.", "clinical_trial_report"),
    "Keytruda_US_Package_Insert.txt": ("STUDY-003", "Pembrolizumab", "Merck & Co.", "drug_label"),
    "FDA_Safety_Alert_Pembrolizumab_Pneumonitis.txt": ("STUDY-003", "Pembrolizumab", "FDA / CDER", "safety_bulletin"),

    # Semaglutide / SUSTAIN-6
    "SUSTAIN_6_Clinical_Report.txt": ("SUSTAIN-6", "Semaglutide", "Novo Nordisk", "clinical_trial_report"),
    "Ozempic_US_Package_Insert.txt": ("SUSTAIN-6", "Semaglutide", "Novo Nordisk", "drug_label"),
    "EMA_PRAC_Safety_Communication_Semaglutide.txt": ("SUSTAIN-6", "Semaglutide", "EMA / PRAC", "safety_bulletin"),

    # Rivaroxaban / EINSTEIN-PE
    "EINSTEIN_PE_Clinical_Report.txt": ("EINSTEIN-PE", "Rivaroxaban", "Bayer / Janssen", "clinical_trial_report"),
    "Xarelto_US_Package_Insert.txt": ("EINSTEIN-PE", "Rivaroxaban", "Janssen Pharmaceuticals", "drug_label"),

    # Donanemab / TRAILBLAZER-ALZ
    "TRAILBLAZER_ALZ_Clinical_Report.txt": ("TRAILBLAZER-ALZ", "Donanemab", "Eli Lilly and Company", "clinical_trial_report"),
    "Kisunla_US_Package_Insert.txt": ("TRAILBLAZER-ALZ", "Donanemab", "Eli Lilly and Company", "drug_label"),
    "FDA_Black_Box_Warning_Donanemab_ARIA.txt": ("TRAILBLAZER-ALZ", "Donanemab", "FDA / CDER", "safety_bulletin"),

    # Drug X
    "Drug_X_Safety_Bulletin.txt": ("STUDY-DRUG-X", "Drug X", "Pharma Global", "safety_bulletin"),

    # Study 001
    "Study_001_Clinical_Report.txt": ("STUDY-001", "Drug X", "Pharma Global", "clinical_trial_report"),

    # Study 002
    "Clinical_Trial_Protocol_002.txt": ("STUDY-002", "Investigational Agent B", "BioHealth Labs", "clinical_trial_report"),
}

def link_studies():
    client = get_qdrant_client()
    col_name = ensure_collection_exists()

    records, _ = client.scroll(
        collection_name=col_name,
        limit=5000,
        with_payload=True,
        with_vectors=False,
    )

    updated_count = 0
    for r in records:
        payload = r.payload or {}
        meta = payload.get("metadata", {})
        doc_name = meta.get("document_name") or meta.get("source") or ""

        if doc_name in DOC_STUDY_MAPPING:
            sid, drug, sponsor, dtype = DOC_STUDY_MAPPING[doc_name]
            meta["study_id"] = sid
            meta["drug"] = drug
            meta["sponsor"] = sponsor
            meta["document_type"] = dtype
            client.set_payload(
                collection_name=col_name,
                payload={"metadata": meta},
                points=[r.id],
            )
            updated_count += 1

    logger.info(f"Updated {updated_count} chunk payloads with canonical study & document_type mapping.")

if __name__ == "__main__":
    link_studies()
