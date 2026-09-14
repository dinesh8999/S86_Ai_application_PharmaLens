"""
PharmaLens Studies API Controller
Provides endpoints for listing aggregated studies and retrieving study details.
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException
from backend.app.services.study_service import get_all_studies, get_study_detail

router = APIRouter(prefix="/studies", tags=["studies"])


@router.get("", response_model=list[dict[str, Any]])
def list_studies():
    """Retrieve all aggregated clinical studies across the corpus."""
    return get_all_studies()


@router.get("/{study_id}", response_model=dict[str, Any])
def study_detail(study_id: str):
    """Retrieve clinical summary and linked documents for a specific study."""
    return get_study_detail(study_id)
