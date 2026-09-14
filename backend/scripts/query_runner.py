import urllib.request
import json
import sys

def test_query(question, study_id=None):
    payload = {"question": question, "k": 4}
    if study_id:
        payload["study_id"] = study_id
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/query", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print(f"=== Question: {question} (Study: {study_id}) ===")
            print(f"Evidence Strength: {result.get('evidence_strength')}")
            print(f"Answer: {result.get('answer')}\n")
            print("Citations:")
            for cit in result.get("used_citations", []):
                print(f"  [{cit.get('citation_id')}]: {cit.get('source')} (Page {cit.get('page')}, Section: {cit.get('section')})")
                print(f"    Text: {cit.get('text')[:120]}...\n")
            print("-" * 60)
    except Exception as e:
        print("Error querying API:", e)

if __name__ == "__main__":
    test_query("What did Study 001 evaluate?")
    test_query("What was the primary endpoint of CHECKMATE-067?")
    test_query("What adverse events were reported for Drug X?")
    test_query("What is the pediatric dosage for Drug Z in Study 999?")
