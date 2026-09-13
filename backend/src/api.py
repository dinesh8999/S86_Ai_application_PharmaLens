"""
PharmaLens FastAPI Backend API
Exposes REST endpoints for RAG querying, document upload & management, system evaluation, usage monitoring, and health status.
"""

from __future__ import annotations

import sys
import logging
from pathlib import Path
from typing import Any

# Ensure project root and backend dir are in sys.path for seamless imports
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

try:
    # pyrefly: ignore [missing-import]
    from backend.src.config import get_settings, UPLOADS_DIR, OUTPUTS_DIR
    # pyrefly: ignore [missing-import]
    from backend.src.ingestion import ingest_file, get_indexed_documents, seed_sample_clinical_documents
    # pyrefly: ignore [missing-import]
    from backend.src.rag_pipeline import answer_with_citations
    # pyrefly: ignore [missing-import]
    from backend.src.monitoring import update_usage_report
    # pyrefly: ignore [missing-import]
    from backend.src.evaluation import run_evaluation, EVAL_RESULTS_FILE
except ImportError:
    # pyrefly: ignore [missing-import]
    from src.config import get_settings, UPLOADS_DIR
     # pyrefly: ignore [missing-import]
    from src.ingestion import ingest_file, get_indexed_documents, seed_sample_clinical_documents
    # pyrefly: ignore [missing-import]
    from src.rag_pipeline import answer_with_citations
    # pyrefly: ignore [missing-import]
    from src.monitoring import update_usage_report
    # pyrefly: ignore [missing-import]
    from src.evaluation import run_evaluation, EVAL_RESULTS_FILE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PharmaLens API",
    description="Clinical Research Intelligence Assistant API",
    version="2.0.0",
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Seed initial sample clinical trial documents on startup."""
    try:
        logger.info("Initializing PharmaLens backend...")
        seed_sample_clinical_documents()
    except Exception as err:
        logger.error(f"Startup initialization warning: {err}")


# -------------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str = Field(..., example="What did Study 001 evaluate?")
    k: int = Field(default=4, ge=1, le=10)
    filters: dict[str, Any] | None = Field(default=None)


class QueryResponse(BaseModel):
    answer: str
    citations: dict[str, Any]
    sources: list[str]
    chunks: list[dict[str, Any]]
    usage: dict[str, Any]


class CompareRequest(BaseModel):
    study_id_1: str = Field(..., example="STUDY-001")
    study_id_2: str = Field(..., example="STUDY-002")
    aspect: str = Field(default="safety and efficacy", example="inclusion criteria")


# -------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------

@app.get("/")
def root():
    """Root endpoint redirecting to health check."""
    return {"message": "PharmaLens API is active. Access docs at /docs"}


@app.get("/api/health")
def health_check():
    """Health check endpoint returning system status."""
    settings = get_settings()
    return {
        "status": "healthy",
        "service": "PharmaLens API",
        "chat_model": settings["chat_model"],
        "embed_model": settings["embed_model"],
        "qdrant_url": settings["qdrant_url"],
    }


@app.post("/api/query", response_model=QueryResponse)
def query_rag(request: QueryRequest):
    """
    Query the PharmaLens RAG pipeline with natural language questions.
    Returns grounded answer with source citations and usage metadata.
    """
    try:
        response = answer_with_citations(
            question=request.question,
            k=request.k,
            filters=request.filters,
        )
        return response
    except Exception as err:
        logger.exception("Error processing query request")
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/compare", response_model=QueryResponse)
def compare_clinical_studies(request: CompareRequest):
    """
    Compare two clinical trial studies on specific aspect (e.g. inclusion criteria, safety, endpoints).
    """
    try:
        # pyrefly: ignore [missing-import]
        from backend.src.rag_pipeline import compare_studies
        return compare_studies(request.study_id_1, request.study_id_2, request.aspect)
    except Exception as err:
        logger.exception("Error processing study comparison")
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    study_id: str | None = Form(None),
):
    """
    Upload and index a research document (PDF, TXT, MD, DOCX).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing.")

    save_path = UPLOADS_DIR / file.filename
    try:
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        res = ingest_file(save_path, study_id=study_id)
        return res
    except Exception as err:
        logger.exception("Error uploading document")
        raise HTTPException(status_code=500, detail=str(err))


@app.get("/api/documents")
def list_documents():
    """List all indexed clinical documents in vector database."""
    try:
        return get_indexed_documents()
    except Exception as err:
        logger.exception("Error listing documents")
        raise HTTPException(status_code=500, detail=str(err))


@app.get("/api/usage")
def get_usage_metrics():
    """Get aggregated usage metrics and RAG analytics."""
    try:
        return update_usage_report()
    except Exception as err:
        logger.exception("Error retrieving usage metrics")
        raise HTTPException(status_code=500, detail=str(err))


@app.get("/api/evaluation")
def get_evaluation_results():
    """Retrieve existing RAG evaluation results."""
    if EVAL_RESULTS_FILE.exists():
        try:
            import json
            with open(EVAL_RESULTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as err:
            logger.error(f"Error reading evaluation results file: {err}")

    # Fallback if evaluation hasn't been run yet
    return run_evaluation()


@app.post("/api/evaluation/run")
def trigger_evaluation():
    """Trigger an on-demand RAG evaluation suite run."""
    try:
        return run_evaluation()
    except Exception as err:
        logger.exception("Error running evaluation suite")
        raise HTTPException(status_code=500, detail=str(err))


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("api:app" if Path("api.py").exists() else "backend.src.api:app", host="0.0.0.0", port=8000, reload=True)
