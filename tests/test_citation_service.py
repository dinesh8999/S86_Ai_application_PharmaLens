import unittest
# pyrefly: ignore [missing-import]
from backend.app.services.citation_service import extract_used_citations

class TestCitationService(unittest.TestCase):
    def test_extract_used_citations(self):
        answer = "Pembrolizumab showed significant PFS improvement [1] and reduced mortality [2]."
        citation_map = {
            "[1]": {
                "source": "STUDY_014_Report.pdf",
                "study_id": "STUDY-014",
                "chunk_id": "chk-001",
                "page": 3,
                "section": "Section 9",
                "score": 0.89,
                "text": "PFS was 5.5 months in Pembrolizumab arm vs 2.2 months in chemotherapy control."
            },
            "[2]": {
                "source": "KEYNOTE_006_Report.pdf",
                "study_id": "KEYNOTE-006",
                "chunk_id": "chk-002",
                "page": 2,
                "section": "Section 8",
                "score": 0.82,
                "text": "5-year overall survival was 38.7% for Pembrolizumab."
            }
        }
        used = extract_used_citations(answer, citation_map)
        self.assertEqual(len(used), 2)
        self.assertEqual(used[0]["source"], "STUDY_014_Report.pdf")
        self.assertEqual(used[0]["page"], 3)
        self.assertEqual(used[1]["study_id"], "KEYNOTE-006")

if __name__ == "__main__":
    unittest.main()
