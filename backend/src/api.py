"""
PharmaLens FastAPI Backend API Root
Directs all traffic to canonical production backend application in backend.app.main.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure paths are correctly in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
SRC_DIR = Path(__file__).resolve().parent

for p in [str(ROOT_DIR), str(BACKEND_DIR), str(SRC_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Re-export canonical FastAPI app
from backend.app.main import app

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
