import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# pyrefly: ignore [missing-import]
from backend.app.services.embedding_service import generate_query_embedding
# pyrefly: ignore [missing-import]
from backend.app.services.retrieval_service import retrieve_chunks
# pyrefly: ignore [missing-import]
from backend.src.citations import assemble_context, build_citation_map, generate_cited_answer
# pyrefly: ignore [missing-import]
from backend.app.api.query import run_query, QueryRequest

q = "What safety topics are associated with nimesulide in the report?"
q_vec = generate_query_embedding(q)
chunks = retrieve_chunks(q_vec, k=6, filters=None)

print(f"Retrieved {len(chunks)} chunks for query: '{q}'")
for i, c in enumerate(chunks):
    print(f"[{i+1}] score={c.get('score')} source={c.get('source')} page={c.get('page')}")
    print("   text:", repr(c.get("text")[:140]))

ctx = assemble_context(chunks)
print("\n--- CONTEXT SENT TO LLM ---\n", ctx)

ans, in_tok, out_tok = generate_cited_answer(q, ctx)
print("\n--- RAW LLM ANSWER ---\n", repr(ans))

res = run_query(QueryRequest(question=q, k=6))
print("\n--- RUN_QUERY RESULT ---")
print("Answer:", repr(res.get("answer")))
print("Strength:", res.get("evidence_strength"))
print("Used citations:", res.get("used_citations"))
