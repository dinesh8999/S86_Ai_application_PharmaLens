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
        self.assertGreater(len(docs), 0)

    def test_documents_summary(self):
        response = self.client.get("/api/documents/summary")
        self.assertEqual(response.status_code, 200)
        summary = response.json()
        self.assertIn("total_documents", summary)
        self.assertGreaterEqual(summary["total_documents"], 50)

    def test_studies_endpoint(self):
        response = self.client.get("/api/studies")
        self.assertEqual(response.status_code, 200)
        studies = response.json()
        self.assertIsInstance(studies, list)
        self.assertGreaterEqual(len(studies), 15)

if __name__ == "__main__":
    unittest.main()
