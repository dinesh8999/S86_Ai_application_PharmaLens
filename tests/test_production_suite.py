"""
PharmaLens Production Verification Suite
Executes live integration tests against running backend server:
- Health & Services Status
- Dashboard Aggregations (Knowledge Base scale, RAG Quality, Activity)
- Studies & Documents Registry
- Document Text Inspection
- Role-Based Access Control (Admin vs Researcher)
- RAG Query Execution with Citations & Grounding
- Out-of-Scope Query Refusal (No Hallucination)
"""

import sys
import unittest
import requests

BASE_URL = "http://127.0.0.1:8000/api"

class TestProductionSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            res = requests.get(f"{BASE_URL}/health", timeout=5)
            if res.status_code != 200:
                raise RuntimeError(f"Server returned status {res.status_code}")
        except Exception as err:
            raise RuntimeError(f"Live server not accessible at {BASE_URL}: {err}")

    def test_01_health_check(self):
        res = requests.get(f"{BASE_URL}/health", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_02_dashboard_metrics(self):
        res = requests.get(f"{BASE_URL}/dashboard", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Verify Knowledge Base metrics
        kb = data.get("knowledge_base", {})
        self.assertGreaterEqual(kb.get("total_studies", 0), 14)
        self.assertGreaterEqual(kb.get("total_documents", 0), 21)
        self.assertGreaterEqual(kb.get("total_pages", 0), 200)
        self.assertGreaterEqual(kb.get("total_chunks", 0), 600)

        # Verify RAG quality
        rag = data.get("rag_quality", {})
        self.assertGreaterEqual(rag.get("overall_score", 0), 0.8)
        self.assertGreaterEqual(rag.get("avg_citation_accuracy", 0), 0.9)

        # Verify System status
        status = data.get("system_status", {})
        self.assertEqual(status.get("api"), "Connected")
        self.assertEqual(status.get("qdrant"), "Connected")

    def test_03_studies_registry(self):
        res = requests.get(f"{BASE_URL}/studies", timeout=5)
        self.assertEqual(res.status_code, 200)
        studies = res.json()
        self.assertGreaterEqual(len(studies), 14)

        # Check for key studies
        study_ids = [s.get("study_id") for s in studies]
        self.assertIn("STUDY-001", study_ids)
        self.assertIn("CHECKMATE-067", study_ids)
        self.assertIn("DAPA-HF", study_ids)

    def test_04_document_registry_and_inspection(self):
        res = requests.get(f"{BASE_URL}/documents", timeout=5)
        self.assertEqual(res.status_code, 200)
        docs = res.json()
        self.assertGreaterEqual(len(docs), 21)

        # Inspect specific document details
        doc_name = docs[0].get("document_name")
        doc_res = requests.get(f"{BASE_URL}/documents/{doc_name}", timeout=5)
        self.assertEqual(doc_res.status_code, 200)
        detail = doc_res.json()
        self.assertIn("pages", detail)
        self.assertGreaterEqual(len(detail["pages"]), 1)
        self.assertTrue(len(detail["pages"][0].get("text", "")) > 10)

    def test_05_rbac_protection(self):
        # Researcher token trying to run admin evaluation
        headers_res = {"Authorization": "Bearer dev-token-researcher"}
        r1 = requests.post(f"{BASE_URL}/evaluation/run", headers=headers_res, timeout=5)
        self.assertEqual(r1.status_code, 403)

        # Missing token
        r2 = requests.post(f"{BASE_URL}/evaluation/run", timeout=5)
        self.assertEqual(r2.status_code, 403)

    def test_06_rag_query_grounded_evidence(self):
        payload = {
            "question": "What was evaluated in Study 001?",
            "k": 4,
            "study_id": "STUDY-001",
        }
        res = requests.post(f"{BASE_URL}/query", json=payload, timeout=20)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("answer", data)
        self.assertIn("citations", data)
        self.assertTrue(len(data.get("citations", {})) > 0 or len(data.get("retrieved_chunks", [])) > 0)
        self.assertTrue(len(data.get("answer", "")) > 15)

    def test_07_no_evidence_fallback(self):
        payload = {
            "question": "What is the launch price of the iPhone 16 in London?",
            "k": 4,
        }
        res = requests.post(f"{BASE_URL}/query", json=payload, timeout=20)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        answer = data.get("answer", "").lower()
        # Should strictly refuse when evidence is absent from clinical documents
        self.assertTrue(
            "relevant evidence" in answer or
            "not found" in answer or
            "insufficient" in answer or
            "not provide" in answer or
            "no evidence" in answer or
            "available documents" in answer or
            "enough information" in answer,
            f"Expected refusal or insufficient evidence notice, got: {data.get('answer')}"
        )


if __name__ == "__main__":
    unittest.main()
