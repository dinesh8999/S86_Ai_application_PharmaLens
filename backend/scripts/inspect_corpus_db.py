# pyrefly: ignore [missing-import]
from backend.app.services.document_service import get_all_documents

docs = get_all_documents()
print(f"Total Documents: {len(docs)}")
for d in docs:
    print(f"{d['document_name']} :: {d['document_type']} :: Chks={d['chunk_count']} :: Pgs={d['page_count']} :: Study={d['study_id']}")
