"""
PharmaLens Usage & Monitoring API Controller
Provides endpoints for query activity, token counts, and estimated cost reports.
"""

from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, Depends

from backend.app.core.security import UserPayload, get_current_user
from backend.src.monitoring import update_usage_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("", response_model=dict[str, Any])
def get_usage_metrics(current_user: UserPayload = Depends(get_current_user)):
    """Retrieve aggregated usage monitoring metrics and token consumption."""
    report = update_usage_report()
    return report
