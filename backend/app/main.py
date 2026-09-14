"""
PharmaLens Production FastAPI Entrypoint
"""

from __future__ import annotations

import os
import logging
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from backend.app.api import (
    dashboard,
    documents,
    evaluation,
    health,
    query,
    sources,
    studies,
    usage,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pharmalens")

app = FastAPI(
    title="PharmaLens — Clinical Research Intelligence API",
    description="Evidence-first grounded RAG platform operating over multi-page clinical reports, drug labels, and safety bulletins.",
    version="2.0.0",
)

# Configurable CORS origins with comprehensive Vercel & localhost regex support
raw_cors = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]
if not allowed_origins or "*" in allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(studies.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(health.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "PharmaLens Clinical Intelligence API",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs",
    }
