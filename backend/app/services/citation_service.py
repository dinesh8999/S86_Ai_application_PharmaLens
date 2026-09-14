"""
PharmaLens Citation & Context Assembly Service
Formats context blocks with explicit Page Number, Section Title, Document ID, and Chunk ID.
Extracts cited markers [1], [2] from LLM response into used_citations.
"""

from __future__ import annotations

import re
import logging
from typing import Any
from backend.src.citations import assemble_context, build_citation_map, build_grounded_system_prompt

logger = logging.getLogger(__name__)


def extract_used_citations(
    answer: str, citation_map: dict[str, dict[str, Any]]
) -> list[dict[str, Any]]:
    """Extract explicit [1], [2] citation tags used in answer and map to full citation objects."""
    found_keys = re.findall(r"\[(\d+)\]", answer)
    used = []
    seen = set()

    for num in found_keys:
        key = f"[{num}]"
        if key in citation_map and key not in seen:
            seen.add(key)
            item = citation_map[key]
            used.append({
                "citation_id": key,
                "source": item.get("source", "Unknown Document"),
                "study_id": item.get("study_id", "N/A"),
                "chunk_id": item.get("chunk_id", f"chk-{num}"),
                "page": item.get("page", 1),
                "section": item.get("section", "General Section"),
                "score": item.get("score", 0.0),
                "text": item.get("text", ""),
                "explanation": f"Explicitly cited evidence block {key} from {item.get('source')} (Page {item.get('page')}, {item.get('section')}).",
            })

    return used
