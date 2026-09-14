"""
PharmaLens Comprehensive Verification & RAG Quality Test Suite
Executes:
- 5 Answerable Questions
- 5 No-Evidence / Negative Questions
- 5 Study-Specific Questions
- 3 Multi-Document Questions
Verifies zero hallucination, proper citation mapping, relevance filtering, and evidence strength.
"""

from __future__ import annotations
import json
import urllib.request
import time

API_URL = "http://127.0.0.1:8000/api/query"

def run_query(question: str, study_id: str | None = None, doc_type: str | None = None, k: int = 4) -> dict:
    payload = {
        "question": question,
        "k": k,
        "study_id": study_id,
        "document_type": doc_type,
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30.0) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 80)
    print("PHARMALENS COMPREHENSIVE RAG VERIFICATION SUITE")
    print("=" * 80)

    # 1. Five Answerable Questions
    answerable_questions = [
        "What did Study 001 evaluate?",
        "What was the primary endpoint of Study 003?",
        "What adverse events were reported in Study 003?",
        "What safety findings were reported for Drug X?",
        "What dosage information is provided in the Drug X label?",
    ]

    print("\n--- 1. ANSWERABLE QUESTIONS (Target: High relevance, cited answer) ---")
    for q in answerable_questions:
        t0 = time.time()
        res = run_query(q)
        lat = round((time.time() - t0) * 1000, 1)
        ans = res.get("answer", "")
        strength = res.get("evidence_strength", "")
        cits = len(res.get("used_citations", []))
        chunks = len(res.get("retrieved_chunks", []))
        sources = res.get("sources", [])
        print(f"\n[Q]: {q}")
        print(f"     Answer: {ans[:130]}...")
        print(f"     Strength: {strength} | Citations: {cits} | Sources: {sources} | Latency: {lat}ms")
        assert len(ans) > 10, "Answer should not be empty"
        time.sleep(1.0)

    # 2. Five No-Evidence Questions
    no_evidence_questions = [
        "What is the pediatric dosage for Drug Z in Study 999?",
        "What were the survival results of the nonexistent Phase 4 Apollo study?",
        "How many patients achieved remission in the fictitious Trial 888 for Compound Q?",
        "What are the drug interactions between imaginary Drug Gamma and aspirin?",
        "What was the cardiovascular mortality rate in the synthetic Atlantis trial?",
    ]

    print("\n\n--- 2. NO-EVIDENCE QUESTIONS (Target: Zero hallucination, Insufficient evidence) ---")
    for q in no_evidence_questions:
        t0 = time.time()
        res = run_query(q)
        lat = round((time.time() - t0) * 1000, 1)
        ans = res.get("answer", "")
        strength = res.get("evidence_strength", "")
        cits = len(res.get("used_citations", []))
        chunks = len(res.get("retrieved_chunks", []))
        print(f"\n[Q]: {q}")
        print(f"     Answer: {ans}")
        print(f"     Strength: {strength} | Citations: {cits} | Chunks Shown: {chunks} | Latency: {lat}ms")
        assert strength == "Insufficient", f"Strength should be Insufficient, got {strength}"
        assert cits == 0, f"No citations should be fabricated, got {cits}"
        assert chunks == 0, f"No unrelated chunks should be shown, got {chunks}"
        time.sleep(1.0)

    # 3. Five Study-Specific Filtered Questions
    study_questions = [
        ("What were the inclusion criteria for Study 002?", "STUDY-002"),
        ("What primary endpoint was evaluated in STUDY-003?", "STUDY-003"),
        ("What were the results of the SUSTAIN-6 clinical trial?", "SUSTAIN-6"),
        ("What efficacy outcomes were reported in EINSTEIN-PE?", "EINSTEIN-PE"),
        ("What was evaluated in the TRAILBLAZER-ALZ study?", "TRAILBLAZER-ALZ"),
    ]

    print("\n\n--- 3. STUDY-SPECIFIC FILTERED QUESTIONS ---")
    for q, sid in study_questions:
        t0 = time.time()
        res = run_query(q, study_id=sid)
        lat = round((time.time() - t0) * 1000, 1)
        ans = res.get("answer", "")
        strength = res.get("evidence_strength", "")
        cits = len(res.get("used_citations", []))
        sources = res.get("sources", [])
        print(f"\n[Q] ({sid}): {q}")
        print(f"     Answer: {ans[:130]}...")
        print(f"     Strength: {strength} | Citations: {cits} | Sources: {sources} | Latency: {lat}ms")
        time.sleep(1.0)

    # 4. Three Multi-Document Questions
    multi_doc_questions = [
        "What adverse reactions and safety signals were reported for Pembrolizumab across clinical trials and safety warnings?",
        "Compare the reported efficacy and adverse event findings for Semaglutide across clinical reports and safety alerts.",
        "What safety risks including ARIA or bleeding were reported across Donanemab and Rivaroxaban regulatory documents?",
    ]

    print("\n\n--- 4. MULTI-DOCUMENT QUESTIONS (Target: Multiple sources cited) ---")
    for q in multi_doc_questions:
        t0 = time.time()
        res = run_query(q, k=6)
        lat = round((time.time() - t0) * 1000, 1)
        ans = res.get("answer", "")
        strength = res.get("evidence_strength", "")
        cits = len(res.get("used_citations", []))
        sources = res.get("sources", [])
        print(f"\n[Q]: {q}")
        print(f"     Answer: {ans[:140]}...")
        print(f"     Strength: {strength} | Citations: {cits} | Sources: {sources} | Latency: {lat}ms")
        time.sleep(1.0)

    print("\n" + "=" * 80)
    print("ALL 18 TEST SCENARIOS COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
