import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.api.query import run_query, QueryRequest
from backend.app.services.embedding_service import generate_query_embedding
from backend.app.services.retrieval_service import retrieve_chunks
from backend.src.retrieval import get_indexed_documents

print("Indexed docs in Qdrant:")
docs = get_indexed_documents()
for d in docs:
    print(" -", d.get("document_name"), "| study:", d.get("study_id"), "| chunks:", d.get("chunk_count"))

q = "Who is the sponsor of Nivolumab plus Ipilimumab?"
q_vec = generate_query_embedding(q)
chunks = retrieve_chunks(q_vec, k=8)
print(f"\nRetrieved {len(chunks)} chunks for query: '{q}'")
for i, c in enumerate(chunks):
    print(f"[{i+1}] score={c.get('score')} doc={c.get('source')} p.{c.get('page')}")
    print("    ", repr(c.get("text")[:120]))

print("\nExecuting run_query...")
res = run_query(QueryRequest(question=q, k=8))
print("ANSWER:", repr(res.get("answer")))
print("STRENGTH:", res.get("evidence_strength"))
print("SOURCES:", res.get("sources"))
print("USED CITATIONS:", len(res.get("used_citations", [])))
