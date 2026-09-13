# PharmaLens – Clinical Research Intelligence Assistant

**PharmaLens** is a production-grade, AI-powered research intelligence platform designed for pharmaceutical organizations, clinical researchers, team leads, and knowledge base administrators. Built with Retrieval-Augmented Generation (RAG), Qdrant vector database, Google Gemini AI models, FastAPI, and React + TypeScript + Tailwind CSS.

---

## 🌟 Key Capabilities & Features

- 🎯 **Grounded AI Answers**: Zero hallucination RAG engine strictly bound to retrieved context.
- 📌 **Source Citation System**: Inline clickable citations (`[1]`, `[2]`) mapping directly to real document metadata (Source, Study ID, Section, Page, Chunk ID, Similarity Score).
- 🛡️ **No-Source Fallback**: Returns `"I don't have enough information in the available documents to answer that question."` when context is missing or irrelevant.
- ⚡ **Query Response Caching**: Hash-based response caching with 900s TTL for zero-latency repeated queries.
- 📊 **Usage Analytics & Cost Estimation**: Structured JSONL request logging (`outputs/rag_requests.jsonl`) with input/output token tracking and USD cost calculation (`outputs/usage_report.json`).
- 🔬 **Automated RAG Evaluation**: Scores Correctness, Grounding Ratio, Citation Accuracy, and Overall Quality (`outputs/evaluation_results.json` and `outputs/evaluation_summary.md`).
- 🏥 **Healthcare UI/UX Aesthetics**: Modern healthcare AI dashboard with responsive navigation, document upload drag-and-drop, evidence inspection drawer, and live API connectivity status.

---

## 📁 Clean Architecture & Folder Structure

```
S86_Ai_application_PharmaLens/
├── backend/
│   ├── src/
│   │   ├── config.py             # Settings & path resolution
│   │   ├── ingestion.py          # Document parsing, chunking, payload builder & Qdrant indexing
│   │   ├── embeddings.py         # Embedding generation & vector dimension matching
│   │   ├── retrieval.py          # Qdrant client, vector similarity search & metadata filtering
│   │   ├── rag_pipeline.py       # Core RAG pipeline with query caching & fallback
│   │   ├── citations.py          # Context assembly & grounded prompt builder with citations ([1], [2])
│   │   ├── evaluation.py         # Correctness, Grounding, Citation Accuracy & Overall scoring
│   │   ├── monitoring.py         # Request logging, token/cost estimation & usage reports
│   │   └── api.py                # FastAPI REST API
│   ├── outputs/
│   │   ├── evaluation_results.json
│   │   ├── evaluation_summary.md
│   │   ├── usage_report.json
│   │   └── rag_requests.jsonl
│   ├── uploads/                  # Ingested clinical research files
│   ├── data/
│   │   └── sample_corpus/        # Built-in sample clinical reports & bulletins
│   ├── .env                      # API keys & model configuration
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Navigation bar
│   │   │   ├── Header.tsx        # Top header & connectivity status
│   │   │   ├── DashboardCards.tsx# Key performance widgets
│   │   │   ├── ResearchAssistant.tsx # Q&A interface with interactive citations & evidence panel
│   │   │   ├── CitationViewer.tsx# Source citation inspection modal
│   │   │   ├── DocumentManager.tsx # Document uploader & chunk browser
│   │   │   ├── EvaluationView.tsx# Grounding, Correctness & Citation Accuracy dashboard
│   │   │   ├── UsageMonitoring.tsx # Token, cost, latency & request log analytics
│   │   │   └── SettingsView.tsx  # System status & configuration settings
│   │   ├── services/
│   │   │   └── api.ts            # Frontend REST client
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript type definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css             # Tailwind CSS & healthcare styling
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml             # Orchestration for Backend, Frontend, and Qdrant
└── README.md                      # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (virtual environment recommended)
pip install -r requirements.txt

# Run FastAPI backend server
python -m backend.src.api
```
Backend API will run on `http://localhost:8000`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Launch Vite development server
npm run dev
```
Frontend Web UI will run on `http://localhost:3000`.

### 3. Docker Compose Deployment

To launch all services (Qdrant, Backend, Frontend) with Docker:

```bash
docker-compose up --build
```

---

## 🔌 API Reference Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/query` | Submit natural language research question (`question`, `k`, `filters`) |
| `POST` | `/api/documents/upload` | Upload & index clinical research file (`file`, `study_id`) |
| `GET` | `/api/documents` | List indexed documents with chunk count & status |
| `GET` | `/api/usage` | Retrieve aggregate RAG usage report & cost metrics |
| `GET` | `/api/evaluation` | Get evaluation benchmark results |
| `POST` | `/api/evaluation/run` | Run automated RAG evaluation suite |
| `GET` | `/api/health` | Backend & Qdrant connectivity health check |

---

## 🧪 RAG Safety Rules & Verification

1. **Context-Only Grounding**: The LLM system prompt mandates answering *only* using retrieved document context.
2. **Citation Verification**: Every factual assertion contains citation markers (`[1]`, `[2]`) pointing back to inspectable vector payloads.
3. **No Fake Citations**: Citations are generated exclusively for real retrieved chunks. If context is insufficient, citations are cleared and fallback response is served.
4. **Deterministic Fallback**: In the absence of supported evidence, returns `"I don't have enough information in the available documents to answer that question."`
