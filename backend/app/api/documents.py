"""
PharmaLens Documents API Controller
Provides endpoints for document listing, corpus summary metrics, and file upload.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from backend.app.core.config import UPLOADS_DIR
# pyrefly: ignore [missing-import]
from backend.app.services.document_service import (
    get_all_documents,
    get_corpus_summary,
    get_document_detail,
    find_document_file,
    upload_and_index_document,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[dict[str, Any]])
def list_documents():
    """Retrieve full indexed document library."""
    return get_all_documents()


@router.get("/summary", response_model=dict[str, Any])
def corpus_summary():
    """Retrieve aggregate corpus scale metrics."""
    return get_corpus_summary()


@router.get("/download/{document_name:path}")
def download_document(document_name: str):
    """Download source document file."""
    file_path = find_document_file(document_name)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Document file '{document_name}' not found on server.")
    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="text/plain",
    )


@router.get("/{document_identifier:path}", response_model=dict[str, Any])
def get_document(document_identifier: str):
    """Retrieve full multi-page content of a document for Document Viewer."""
    detail = get_document_detail(document_identifier)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Document '{document_identifier}' not found.")
    return detail


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    study_id: str | None = Form(None),
):
    """Upload and index a new clinical trial document into Qdrant."""
    filename = file.filename or "uploaded_doc.txt"
    dest_path = UPLOADS_DIR / filename

    try:
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)

        result = upload_and_index_document(dest_path, study_id=study_id)
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
