"""
PharmaLens Application Configuration Module
Provides centralized Pydantic settings and directory path management.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

# Directory paths
APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = ROOT_DIR / "uploads"
OUTPUTS_DIR = ROOT_DIR / "outputs"

for d in [DATA_DIR, UPLOADS_DIR, OUTPUTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Load env files
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-3.6-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini-embedding-001")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "rag_chunks")


def get_settings() -> dict[str, Any]:
    return {
        "openai_api_key": OPENAI_API_KEY,
        "openai_base_url": OPENAI_BASE_URL,
        "chat_model": CHAT_MODEL,
        "embed_model": EMBED_MODEL,
        "qdrant_url": QDRANT_URL,
        "qdrant_collection": QDRANT_COLLECTION,
        "vector_dimension": int(os.getenv("VECTOR_DIMENSION", "3072")),
        "cache_ttl_seconds": int(os.getenv("CACHE_TTL_SECONDS", "900")),
    }
