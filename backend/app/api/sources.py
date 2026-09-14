"""
PharmaLens Sources API Controller
Provides endpoints for retrieving individual source metadata and chunk context.
"""

from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.security import UserPayload, get_current_user
from backend.app.services.document_service import get_document_detail, get_all_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("/{source_id:path}", response_model=dict[str, Any])
def get_source(source_id: str, current_user: UserPayload = Depends(get_current_user)):
    """Retrieve detailed source metadata for citation inspection."""
    detail = get_document_detail(source_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found.")
    return detail
