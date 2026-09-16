import unittest
# pyrefly: ignore [missing-import]
from backend.app.core.config import get_settings, DATA_DIR, UPLOADS_DIR

class TestConfig(unittest.TestCase):
    def test_settings_keys(self):
        settings = get_settings()
        self.assertIn("chat_model", settings)
        self.assertIn("embed_model", settings)
        self.assertIn("qdrant_url", settings)
        self.assertIn("qdrant_collection", settings)

    def test_directories_exist(self):
        self.assertTrue(DATA_DIR.exists())
        self.assertTrue(UPLOADS_DIR.exists())

if __name__ == "__main__":
    unittest.main()
