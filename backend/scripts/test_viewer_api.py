import urllib.request
import urllib.parse
import json

def main():
    print("Testing /api/documents ...")
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/documents")
    docs = json.loads(req.read().decode("utf-8"))
    print(f"Total documents returned: {len(docs)}")
    
    for d in docs:
        doc_name = d["document_name"]
        url = f"http://127.0.0.1:8000/api/documents/{urllib.parse.quote(doc_name)}"
        res = urllib.request.urlopen(url)
        detail = json.loads(res.read().decode("utf-8"))
        print(f"Doc: {doc_name:40} | Type: {detail['document_type']:22} | Study: {detail['study_id']:14} | Pages: {detail['page_count']:2} | Parsed: {len(detail['pages']):2} | OnDisk: {detail['has_file_on_disk']}")

    print("\nTesting /api/studies ...")
    s_res = urllib.request.urlopen("http://127.0.0.1:8000/api/studies")
    studies = json.loads(s_res.read().decode("utf-8"))
    print(f"Total studies returned: {len(studies)}")
    for s in studies[:3]:
        print(f"  Study {s['study_id']}: {s['study_name']} ({s['document_count']} docs, {s['chunk_count']} chunks)")

    print("\nTesting /api/query RAG citation linking ...")
    query_payload = json.dumps({
        "question": "What adverse events were reported in Study 003?",
        "k": 3,
        "study_id": "STUDY-003"
    }).encode("utf-8")
    q_req = urllib.request.Request("http://127.0.0.1:8000/api/query", data=query_payload, headers={"Content-Type": "application/json"})
    q_res = urllib.request.urlopen(q_req)
    q_data = json.loads(q_res.read().decode("utf-8"))
    print(f"Query Question: {q_data['question']}")
    print(f"Evidence Strength: {q_data['evidence_strength']}")
    print(f"Used Citations count: {len(q_data.get('used_citations', []))}")
    for c in q_data.get('used_citations', []):
        print(f"  Citation [{c.get('citation_id', '?')}]: source={c['source']}, page={c.get('page')}, section={c.get('section')}")

if __name__ == "__main__":
    main()
