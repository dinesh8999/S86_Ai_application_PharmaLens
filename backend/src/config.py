"""
PharmaLens Configuration Loader
Handles environment variables, default settings, and directory paths.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Base paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
OUTPUTS_DIR = BACKEND_DIR / "outputs"
UPLOADS_DIR = BACKEND_DIR / "uploads"
DATA_DIR = BACKEND_DIR / "data"

# Ensure directories exist
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")


def get_settings() -> dict[str, Any]:
    """Retrieve application settings."""
    openai_api_key = os.getenv("OPENAI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    openai_base_url = os.getenv(
        "OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    chat_model = os.getenv("CHAT_MODEL", "gemini-3.6-flash")
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection = os.getenv("QDRANT_COLLECTION", "rag_chunks")
    
    try:
        vector_dim = int(os.getenv("VECTOR_DIMENSION", "3072"))
    except ValueError:
        vector_dim = 3072

    try:
        cache_ttl = int(os.getenv("CACHE_TTL_SECONDS", "900"))
    except ValueError:
        cache_ttl = 900

    return {
        "openai_api_key": openai_api_key,
        "openai_base_url": openai_base_url,
        "chat_model": chat_model,
        "embed_model": embed_model,
        "qdrant_url": qdrant_url,
        "qdrant_api_key": qdrant_api_key,
        "qdrant_collection": qdrant_collection,
        "vector_dimension": vector_dim,
        "cache_ttl_seconds": cache_ttl,
    }
