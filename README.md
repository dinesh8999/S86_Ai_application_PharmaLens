# PharmaLens — Clinical Research Intelligence Assistant

**PharmaLens** is an AI-powered, evidence-grounded clinical research assistant designed to answer complex pharmaceutical questions across clinical trial reports, regulatory drug labels, and safety communications with exact page-level citations.

---

## 1. Product Purpose & Problem Statement

### The Problem
Pharmaceutical and biotech researchers spend hours manually combing through lengthy clinical study reports, FDA/EMA package inserts, and post-marketing safety alerts to answer specific clinical and regulatory questions. Generic AI chatbots and search engines often hallucinate patient counts, trial endpoints, dosages, or safety signals, and fail to provide exact page-level provenance.

### The Solution
PharmaLens provides a unified, evidence-first research workflow:
1. **Clinical Research Question**: Researcher enters a clinical or safety inquiry.
2. **Semantic Retrieval**: Qdrant vector database retrieves candidate chunks using cosine similarity and optional study/doc-type filters.
3. **Relevance Threshold Filtering**: Chunks must pass a relevance threshold (>= 0.40) to qualify as `relevant_evidence`. Unrelated candidates are strictly discarded.
4. **Grounded Generation**: Gemini generates a concise answer strictly grounded in the retrieved evidence.
5. **Citations & Provenance**: Factual assertions cite sources (`[1]`, `[2]`), mapping directly to document name, study ID, document type, page number, and section header.
6. **Evidence Inspection**: Clicking any citation opens the Evidence Drawer with full context and source excerpts.
7. **Zero-Hallucination Fallback**: When no relevant documents exist (or negative queries are tested), the system returns `"No sufficiently relevant evidence was found in the available documents to answer this question."` with zero unrelated candidate chunks displayed.

> [!IMPORTANT]
> **Research Support Tool Disclaimer**: PharmaLens is an evidence-grounded research support system. Always verify critical clinical, regulatory, or safety findings against the original source documents before making clinical decisions.

---

## 2. Core Primary Navigation

The application focuses on the researcher-first workflow with a streamlined navigation hierarchy:

```
PharmaLens
Clinical Research Assistant

├── Research Assistant     # Primary Q&A screen with filters, grounded answers & citations
├── Studies                # Clinical studies registry with linked documents & "Ask About Study"
└── Documents              # Knowledge base inventory with real-time page & chunk statistics
```

- **Top Bar**: Displays `Research Preview`, `Clinical Research Support`, and live `API Connected` status indicator.
- **Sidebar**: Dark navy sidebar with restrained blue accents and a subtle `Qdrant Active (Evidence-First RAG)` indicator.

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
- `relevant_evidence`: Filtered chunks exceeding the relevance score threshold (>= 0.40).
- `context_chunks`: Chunks passed into the LLM system prompt.
- `used_citations`: Explicit citations referenced in the final generated answer text.

---

## 5. Technology Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, OpenAI Python SDK (Google Gemini compatibility layer)
- **Vector Database**: Qdrant (`rag_chunks` collection, 3072-dimensional vectors, local persistent storage fallback)
- **AI Model**: Google Gemini (`gemini-3.6-flash` via OpenAI compatibility endpoint)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Testing**: Python unittest, FastAPI TestClient, Vitest / Vite build

---

## 6. Repository Structure

```
S86_Ai_application_PharmaLens/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint with CORS & route registration
│   │   ├── api/                     # REST route controllers
│   │   │   ├── query.py             # /api/query & /api/compare endpoints
│   │   │   ├── documents.py         # /api/documents & /api/documents/upload
│   │   │   ├── studies.py           # /api/studies & /api/studies/{study_id}
│   │   │   └── health.py            # /api/health endpoint
│   │   ├── services/                # Modular backend service layer
│   │   │   ├── retrieval_service.py # Qdrant search & metadata filtering
│   │   │   ├── embedding_service.py # Gemini embedding generator
│   │   │   ├── citation_service.py  # Context assembly & citation extraction
│   │   │   ├── document_service.py  # Multi-page parsing & corpus metrics
│   │   │   ├── study_service.py     # Canonical study grouping & profiles
│   │   │   └── evaluation_service.py# Evaluation dataset runner
│   │   └── core/
│   │       └── config.py            # Application configuration
│   ├── scripts/
│   │   ├── ingest_corpus.py         # Multi-page corpus ingestion script
│   │   ├── clean_qdrant_corpus.py   # Corpus deduplication & cleanup script
│   │   ├── link_canonical_studies.py# Study linkage script
│   │   └── verify_rag_suite.py      # Automated 18-scenario RAG test suite
│   ├── src/                         # Core utility implementations
│   │   ├── citations.py             # Grounded prompt construction
│   │   ├── embeddings.py            # Gemini client & embedding calls
│   │   └── retrieval.py             # Qdrant client connection & query
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # 3-item navigation (Assistant, Studies, Documents)
│   │   │   ├── Header.tsx           # Status header with Research Preview badge
│   │   │   ├── ResearchAssistant.tsx# Main query interface & Supporting Evidence
│   │   │   ├── StudiesView.tsx      # Clinical studies registry cards
│   │   │   ├── DocumentManager.tsx  # Knowledge base documents table & metrics
│   │   │   └── EvidenceDrawer.tsx   # Slide-out source document inspector
│   │   ├── services/api.ts          # Frontend API client
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── App.tsx                  # Main layout container
│   │   └── index.css                # Styling & tokens
│   └── package.json
├── data/
│   ├── expanded_corpus/             # Canonical 21 multi-page clinical documents
│   │   ├── clinical_reports/        # 13 clinical trial reports
│   │   ├── drug_labels/             # 4 drug package inserts
│   │   └── safety_bulletins/        # 4 safety alerts & communications
│   └── evaluation_test_set.json     # Benchmark evaluation questions
└── README.md                        # Documentation
```

---

## 7. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Valid Google Gemini API Key

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
   *Interactive API docs available at: `http://localhost:8000/docs`*

### Frontend Setup
1. Navigate to the `frontend/` directory:
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

## 8. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & component check |
| `POST` | `/api/query` | Grounded RAG query with `top_k`, `study_id`, `document_type` filters |
| `POST` | `/api/compare` | Compare two studies across clinical aspects |
| `GET` | `/api/documents` | List indexed documents with page and chunk counts |
| `POST` | `/api/documents/upload` | Ingest user-uploaded clinical document |
| `GET` | `/api/studies` | List canonical clinical study profiles |
| `GET` | `/api/studies/{study_id}` | Detailed study overview, endpoints, and linked documents |

---

## 9. Verification & Quality Testing

To execute the automated 18-scenario RAG quality test suite covering answerable queries, no-evidence negative controls, study-filtered queries, and multi-document synthesis:

```powershell
.\.venv\Scripts\python.exe -m backend.scripts.verify_rag_suite
```

To build and type-check the frontend production bundle:
```powershell
cd frontend
npm run build
```

---

## 10. Research Safety Disclaimer

*PharmaLens is an evidence-grounded research support system. Always verify critical clinical, regulatory, or safety findings against the original source documents.*
