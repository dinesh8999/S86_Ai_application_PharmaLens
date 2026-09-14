# PharmaLens — Clinical Research Intelligence Assistant

**PharmaLens** is an evidence-first, enterprise-grade clinical research assistant designed to answer complex pharmaceutical questions across clinical trial reports, regulatory drug labels, and pharmacovigilance safety communications with exact page-level citations and interactive document inspection.

---

## 1. Product Purpose & Problem Statement

### The Problem
Pharmaceutical and biotech researchers spend hours manually combing through lengthy clinical study reports, FDA/EMA package inserts, and post-marketing safety alerts to answer specific clinical, pharmacokinetic, and regulatory questions. Generic AI chatbots frequently hallucinate patient counts, trial endpoints, dosages, or safety signals, and lack verifiable provenance.

### The Solution
PharmaLens provides a unified, evidence-first research intelligence workflow:
1. **Clinical Research Inquiry**: Researcher inputs a clinical or safety inquiry.
2. **Semantic Retrieval**: Qdrant vector database retrieves candidate chunks using cosine similarity with optional study or document-type scoping.
3. **Relevance Threshold Filtering**: Chunks must pass a strict relevance threshold ($\ge 0.40$) to qualify as `relevant_evidence`. Unrelated chunks are discarded.
4. **Grounded Generation**: Google Gemini (`gemini-3.6-flash`) generates concise answers strictly grounded in the retrieved evidence.
5. **Citations & Provenance**: Factual assertions cite sources (`[1]`, `[2]`), mapping directly to document name, study ID, document type, page number, and section header.
6. **Multi-Page Document Viewer**: Clicking any citation deep-links directly into the Document Viewer to inspect the original text in context.
7. **Zero-Hallucination Fallback**: When no relevant documents exist (or negative queries are tested), the system returns `"No sufficiently relevant evidence was found in the available documents to answer this question."` with zero fabricated facts.

> [!IMPORTANT]
> **Research Support Tool Disclaimer**: PharmaLens is an evidence-grounded research support system. Always verify critical clinical, regulatory, or safety findings against the original source documents before making clinical decisions. Not intended for direct medical diagnosis.

---

## 2. Primary Navigation Architecture

The application focuses on a streamlined, researcher-first workflow organized into strictly four primary tabs:

```
PharmaLens
Clinical Research Intelligence

├── 1. Dashboard              # Real-time Knowledge Base scale, RAG quality benchmarks & quick actions
├── 2. Research Assistant     # Grounded Q&A workspace with clinical filters, citations & evidence drawer
├── 3. Studies                # Clinical studies registry with linked documents & "Ask About Study"
└── 4. Documents              # Document library with multi-page text viewer & in-doc keyword search

[ADMIN CONTROLS] (Visible for users with ADMIN role)
├── Evaluation Suite          # Automated benchmark test runner & metrics
└── Token & Cost Telemetry    # Real-time token consumption, cache hit rate & latency metrics
```

- **Top Bar**: Displays active tab title, clinical workspace pill, API connection health status, and the **User Profile Menu** (showing name, institutional email, role badge, and role switcher).
- **Sidebar**: High-contrast dark navy sidebar with active tab indicator and vector engine status pill (`Qdrant Active · 632 Chunks`).

---

## 3. Canonical Knowledge Base Corpus

PharmaLens operates over an expanded canonical corpus of **21 substantial documents** comprising **295 pages** and **632 indexed chunks**:

| Document Type | Count | Representative Documents |
|---|---|---|
| **Clinical Trial Report** | 13 | `STUDY-001`, `STUDY-002`, `STUDY-003`, `CHECKMATE-067`, `DAPA-HF`, `EINSTEIN-PE`, `EMPEROR-REDUCED`, `KEYNOTE-006`, `MONALEESA-2`, `STUDY-014`, `STUDY-019`, `SUSTAIN-6`, `TRAILBLAZER-ALZ` |
| **Drug Label** | 4 | `Keytruda_US_Package_Insert.txt`, `Kisunla_US_Package_Insert.txt`, `Ozempic_US_Package_Insert.txt`, `Xarelto_US_Package_Insert.txt` |
| **Safety Bulletin** | 4 | `Drug_X_Safety_Bulletin.txt`, `EMA_PRAC_Safety_Communication_Semaglutide.txt`, `FDA_Black_Box_Warning_Donanemab_ARIA.txt`, `FDA_Safety_Alert_Pembrolizumab_Pneumonitis.txt` |

### Document Type Normalization
All documents are categorized into one of three normalized document types:
- `Clinical Trial Report` (`clinical_trial_report`)
- `Drug Label` (`drug_label`)
- `Safety Bulletin` (`safety_bulletin`)

---

## 4. Grounded RAG Architecture

```
                                  USER QUERY
                                      │
                                      ▼
                             Gemini Embedding
                           (3072-dim Vector)
                                      │
                                      ▼
                           Qdrant Similarity Search
                        (Cosine Distance Metric)
                                      │
                                      ▼
                        Candidate Retrieval (Top-K)
                                      │
                                      ▼
                        Relevance Threshold (>= 0.40)
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
               Score < 0.40                   Score >= 0.40
            (Zero Evidence)                 (Relevant Evidence)
                   │                                 │
                   ▼                                 ▼
      "No sufficiently relevant              Context Assembly
        evidence was found..."               & Citation Map
                   │                                 │
                   ▼                                 ▼
         Evidence Strength:                  Grounded LLM Prompt
            Insufficient                             │
                   │                                 ▼
         Chunks Displayed: 0              Clinical Evidence Answer
                                          with Citations [1], [2]
```

### Distinction of Internal Evidence Concepts
- `retrieved_candidates`: Raw similarity search matches from Qdrant.
- `relevant_evidence`: Filtered chunks exceeding the relevance score threshold ($\ge 0.40$).
- `context_chunks`: Chunks passed into the LLM system prompt.
- `used_citations`: Explicit citations referenced in the final generated answer text.

---

## 5. Technology Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, OpenAI Python SDK (`gemini-3.6-flash` Google Gemini integration)
- **Vector Database**: Qdrant (`rag_chunks` collection, 3072-dimensional vectors, local persistent storage fallback)
- **Authentication**: Firebase Authentication (Google OAuth + Email/Password) with secure local developer/guest evaluation fallback
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Testing**: Python `unittest`, live integration test suite, Vite production build

---

## 6. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Valid Google Gemini API Key (`OPENAI_API_KEY`)

### Backend Setup
1. Activate virtual environment:
   ```powershell
   .\.venv\Scripts\activate
   ```
2. Configure `.env` in project root:
   ```env
   OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
   OPENAI_API_KEY=your_gemini_api_key_here
   CHAT_MODEL=gemini-3.6-flash
   EMBED_MODEL=gemini-embedding-001
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=rag_chunks
   VECTOR_DIMENSION=3072
   ```
3. Start the FastAPI backend:
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
   ```
   *Interactive API documentation is available at: `http://localhost:8000/docs`*

### Frontend Setup
1. Navigate to the `frontend/` directory and install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *Access the web application at: `http://localhost:3000`*

---

## 7. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & component check |
| `GET` | `/api/dashboard` | Aggregated metrics: Knowledge Base scale, RAG Quality, activity & health |
| `POST` | `/api/query` | Grounded RAG query with `top_k`, `study_id`, `document_type` filters |
| `POST` | `/api/compare` | Compare two studies across clinical aspects |
| `GET` | `/api/documents` | List indexed documents with page and chunk counts |
| `GET` | `/api/documents/{doc_name}` | Multi-page extracted text & metadata for Document Viewer |
| `POST` | `/api/documents/upload` | Ingest user-uploaded clinical document |
| `GET` | `/api/studies` | List canonical clinical study profiles |
| `GET` | `/api/studies/{study_id}` | Detailed study overview, endpoints, and linked documents |
| `GET` | `/api/evaluation` | Latest gold-standard QA benchmark evaluation metrics |
| `POST` | `/api/evaluation/run` | Trigger evaluation benchmark runner (*Admin Protected*) |
| `GET` | `/api/usage` | Token telemetry, cost tracking, and latency metrics |

---

## 8. Verification & Test Execution

Run the complete production verification test suite:

```powershell
# 1. Live production API, RBAC, and RAG verification suite (7/7 tests)
.\.venv\Scripts\python.exe -m unittest tests/test_production_suite.py

# 2. Security token resolution & role guard tests (4/4 tests)
.\.venv\Scripts\python.exe -m unittest tests/test_security.py

# 3. Frontend production build and TypeScript compilation
cd frontend
npm run build
```

See [DEPLOYMENT_CHECKLIST.md](file:///d:/Pharma/S86_Ai_application_PharmaLens/DEPLOYMENT_CHECKLIST.md) for full pre-flight checklist and container deployment instructions.

---

## 9. Research Safety Disclaimer

*PharmaLens is an evidence-grounded research support tool. Always verify critical clinical, regulatory, or safety findings against the primary trial reports before making medical decisions.*
