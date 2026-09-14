"""
PharmaLens Production FastAPI Entrypoint
"""

from __future__ import annotations

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import documents, health, query, studies

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pharmalens")

app = FastAPI(
    title="PharmaLens — Clinical Research Intelligence API",
    description="Evidence-first grounded RAG platform operating over multi-page clinical reports, drug labels, and safety bulletins.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(studies.router, prefix="/api")
app.include_router(health.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "PharmaLens Clinical Intelligence API",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs",
    }
