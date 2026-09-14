# PharmaLens — Production Deployment Checklist

This document details the complete pre-flight and production verification checklist for **PharmaLens**, ensuring secure, reliable, and compliant deployment across staging and production environments.

---

## 1. Environment & Configuration Checklist

| Component | Setting / Variable | Production Target | Verified Status |
|---|---|---|---|
| **Python Runtime** | Python 3.10+ | `.venv` / Container runtime | ✅ Verified (Python 3.12) |
| **Node.js Runtime** | Node 18+ / npm 9+ | LTS Node container | ✅ Verified (Node 20+) |
| **LLM Model** | `CHAT_MODEL` | `gemini-3.6-flash` | ✅ Verified & Tested |
| **Embedding Model** | `EMBED_MODEL` | `gemini-embedding-001` (3072-dim) | ✅ Verified & Indexed |
| **Vector DB** | `QDRANT_URL` / Local storage | `outputs/qdrant_db` / Qdrant Cloud | ✅ Active (632 chunks) |
| **Backend API Port** | `PORT` / Uvicorn | Port 8000 (FastAPI ASGI) | ✅ Healthy (`/api/health`) |
| **Frontend Web Port** | Vite / Nginx | Port 3000 | ✅ Healthy (`http://localhost:3000`) |
| **Firebase Auth** | `VITE_FIREBASE_*` / `FIREBASE_PROJECT_ID` | Production Firebase project | ✅ Configured with dev fallback |

---

## 2. Core Functional Verification

- [x] **Clinical Research Dashboard (`/dashboard`)**:
  - Knowledge Base scale rendered: 14 Studies, 21 Documents, 295 Pages, 632 Chunks.
  - Corpus breakdown: 13 Clinical Reports, 4 Drug Labels, 4 Safety Bulletins.
  - RAG quality benchmark scores: Grounding 69%, Citation Accuracy 100%, Overall 89%.
  - Real query telemetry & quick actions (*Ask a Question*, *Browse Studies*, *Inspect Documents*).
- [x] **Primary Navigation Structure**:
  - Strictly 4 primary tabs: **Dashboard**, **Research Assistant**, **Studies**, **Documents**.
  - Discreet Admin controls for users with `ADMIN` role.
- [x] **Authentication & Role-Based Access Control (RBAC)**:
  - Google OAuth Sign-In & Institutional Email/Password.
  - Role management (`RESEARCHER` vs `ADMIN`).
  - Protected administrative endpoints (`/api/evaluation/run` returns 403 for researchers).
  - Profile menu in header with avatar, role pill, and sign-out.
- [x] **Evidence-Grounded RAG Pipeline**:
  - Strictly grounded generation using `gemini-3.6-flash`.
  - Inline clickable citation markers (`[1]`, `[2]`).
  - Strict zero-hallucination refusal for queries with no relevant evidence.
- [x] **Multi-Page Document Viewer**:
  - Full text inspection with real page-by-page extracted clinical text.
  - Page navigation list with active selection indicator.
  - In-document keyword search with real-time occurrence count.
  - Deep-linking from citations directly to matching document page and section.

---

## 3. Automated Test Verification Results

All automated test suites executed cleanly:
- `tests/test_production_suite.py`: **7/7 PASSED** (Health, Dashboard, Studies, Documents, RBAC, Grounded RAG, No-Evidence Refusal).
- `tests/test_security.py`: **4/4 PASSED** (Token verification, Admin guard enforcement, Researcher restriction).
- `npm run build`: **PASSED** (0 TypeScript errors, 1,499 modules transformed, optimized Vite bundle generated).

---

## 4. Production Deployment Commands

### Backend Deployment (FastAPI)
```bash
# 1. Install production dependencies
python -m pip install -r requirements.txt

# 2. Launch production ASGI server (with Gunicorn/Uvicorn workers)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Deployment (Nginx / Static Hosting)
```bash
# 1. Build optimized static assets
cd frontend
npm ci
npm run build

# 2. Deploy ./frontend/dist to your CDN, S3/CloudFront, or Nginx container
```

### Docker Compose Single-Command Stack
```bash
docker-compose up --build -d
```

---

## 5. Security & Clinical Regulatory Guidelines

1. **Evidence-First Constraint**: The model system prompt enforces `STRICT GROUNDING RULES`: do not use outside knowledge or extrapolate beyond the indexed clinical evidence.
2. **Clinical Decision Support Disclaimer**: Prominently displayed across the Header, Research Assistant, and Dashboard: *"PharmaLens is an evidence-grounded research support tool. Verify findings against primary trial reports."*
3. **No Diagnosis Guarantee**: The system rejects medical diagnostic requests and redirects users to licensed healthcare professionals.
