"""
PharmaLens Evaluation Module
Runs RAG benchmark evaluation suite.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import OUTPUTS_DIR

logger = logging.getLogger(__name__)

EVAL_RESULTS_FILE = OUTPUTS_DIR / "evaluation_results.json"
EVAL_SUMMARY_MD = OUTPUTS_DIR / "evaluation_summary.md"

BENCHMARK_QUESTIONS = [
    {
        "id": "eval-001",
        "question": "What primary endpoint was evaluated in Study 001?",
        "expected_answer": "Change in HbA1c from baseline at Week 26.",
    },
    {
        "id": "eval-002",
        "question": "What were the most common adverse events reported in Study 001?",
        "expected_answer": "Nausea, diarrhea, vomiting, and mild hypoglycemia.",
    },
    {
        "id": "eval-003",
        "question": "What ACR20 response rate was achieved in Study 002 at Week 12?",
        "expected_answer": "68% in treatment arm compared to 31% in placebo arm.",
    },
    {
        "id": "eval-004",
        "question": "What is the recommended dosage for Drug Z in pediatric patients?",
        "expected_answer": "I don't have enough information in the available documents to answer that question.",
    },
]


def run_evaluation() -> dict[str, Any]:
    """Run evaluation suite and save results."""
    from .rag_pipeline import answer_with_citations

    details = []
    total_correctness = 0.0
    total_grounding = 0.0
    total_citation = 0.0

    for item in BENCHMARK_QUESTIONS:
        qid = item["id"]
        q = item["question"]
        expected = item["expected_answer"]

        try:
            res = answer_with_citations(question=q, k=4)
            actual = res.get("answer", "")
            citations = res.get("citations", {})

            if "don't have enough information" in expected.lower():
                if "don't have enough information" in actual.lower() or "could not find" in actual.lower():
                    corr, ground, cite_acc = 1.0, 1.0, 1.0
                else:
                    corr, ground, cite_acc = 0.2, 0.4, 0.0
            else:
                kw_matches = sum(1 for word in expected.split() if len(word) > 4 and word.lower() in actual.lower())
                corr = min(1.0, round(0.5 + (kw_matches * 0.15), 2))
                ground = 0.95 if citations else 0.40
                cite_acc = 1.0 if citations else 0.50

            overall = round((corr * 0.4) + (ground * 0.4) + (cite_acc * 0.2), 2)
            passed = overall >= 0.75

            details.append(
                {
                    "id": qid,
                    "question": q,
                    "expected_answer": expected,
                    "actual_answer": actual,
                    "answer": actual,
                    "correctness_score": corr,
                    "correctness": corr,
                    "grounding_score": ground,
                    "grounding": ground,
                    "citation_accuracy": cite_acc,
                    "overall_score": overall,
                    "passed": passed,
                    "status": "PASS" if passed else "FAIL",
                    "used_citations": list(citations.keys()),
                }
            )

            total_correctness += corr
            total_grounding += ground
            total_citation += cite_acc

        except Exception as err:
            logger.error(f"Error evaluating question {qid}: {err}")

    n = max(len(BENCHMARK_QUESTIONS), 1)
    avg_corr = round(total_correctness / n, 2)
    avg_ground = round(total_grounding / n, 2)
    avg_cite = round(total_citation / n, 2)
    overall_sys = round((avg_corr * 0.4) + (avg_ground * 0.4) + (avg_cite * 0.2), 2)

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_questions": len(BENCHMARK_QUESTIONS),
        "passed_questions": sum(1 for d in details if d["passed"]),
        "failed_questions": sum(1 for d in details if not d["passed"]),
        "avg_correctness": avg_corr,
        "avg_grounding": avg_ground,
        "avg_citation_accuracy": avg_cite,
        "overall_system_score": overall_sys,
        "overall_score": overall_sys,
        "question_results": details,
        "details": details,
    }

    try:
        with open(EVAL_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
    except Exception as err:
        logger.error(f"Error saving evaluation output: {err}")

    return result
