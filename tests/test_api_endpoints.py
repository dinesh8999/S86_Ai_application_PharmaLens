import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_documents_endpoint(self):
        response = self.client.get("/api/documents")
        self.assertEqual(response.status_code, 200)
        docs = response.json()
        self.assertIsInstance(docs, list)
        self.assertGreaterEqual(len(docs), 20)

    def test_documents_summary(self):
        response = self.client.get("/api/documents/summary")
        self.assertEqual(response.status_code, 200)
        summary = response.json()
        self.assertIn("total_documents", summary)
        self.assertGreaterEqual(summary["total_documents"], 21)
        self.assertGreaterEqual(summary.get("total_pages", 0), 200)
        self.assertGreaterEqual(summary.get("total_chunks", 0), 600)

    def test_studies_endpoint(self):
        response = self.client.get("/api/studies")
        self.assertEqual(response.status_code, 200)
        studies = response.json()
        self.assertIsInstance(studies, list)
        self.assertGreaterEqual(len(studies), 14)

    def test_dashboard_endpoint(self):
        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("knowledge_base", data)
        self.assertIn("rag_quality", data)
        self.assertIn("activity", data)
        self.assertIn("recent_queries", data)
        self.assertIn("system_status", data)
        self.assertGreaterEqual(data["knowledge_base"]["total_studies"], 14)
        self.assertGreaterEqual(data["knowledge_base"]["total_documents"], 21)
        self.assertGreaterEqual(data["knowledge_base"]["total_chunks"], 600)

    def test_evaluation_endpoint(self):
        response = self.client.get("/api/evaluation")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("avg_grounding", data)
        self.assertIn("avg_citation_accuracy", data)
        self.assertIn("overall_system_score", data)

    def test_admin_rbac_protection_on_evaluation_run(self):
        # Researcher token should be rejected with 403 Forbidden
        headers = {"Authorization": "Bearer dev-token-researcher"}
        res = self.client.post("/api/evaluation/run", headers=headers)
        self.assertEqual(res.status_code, 403)

if __name__ == "__main__":
    unittest.main()
