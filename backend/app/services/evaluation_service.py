"""
PharmaLens Evaluation Service
Executes automated RAG benchmark evaluation suite across test research questions.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# pyrefly: ignore [missing-import]
from backend.app.core.config import OUTPUTS_DIR
# pyrefly: ignore [missing-import]
from backend.app.models.evaluation import EvaluationSummary, QuestionEvalResult

logger = logging.getLogger(__name__)

EVAL_RESULTS_FILE = OUTPUTS_DIR / "evaluation_results.json"
EVAL_SUMMARY_MD = OUTPUTS_DIR / "evaluation_summary.md"

# Benchmark benchmark evaluation questions
BENCHMARK_QUESTIONS = [
    {
        "id": "eval-001",
        "question": "What primary endpoint was evaluated in Study 001?",
        "expected_answer": "Change in HbA1c from baseline at Week 26.",
        "expected_study": "STUDY-001",
    },
    {
        "id": "eval-002",
        "question": "What were the most common adverse events reported in Study 001?",
        "expected_answer": "Nausea, diarrhea, vomiting, and mild hypoglycemia.",
        "expected_study": "STUDY-001",
    },
    {
        "id": "eval-003",
        "question": "What ACR20 response rate was achieved in Study 002 at Week 12?",
        "expected_answer": "68% in treatment arm compared to 31% in placebo arm.",
        "expected_study": "STUDY-002",
    },
    {
        "id": "eval-004",
        "question": "What is the recommended dosage for Drug Z in pediatric patients?",
        "expected_answer": "I could not find sufficient supporting evidence in the available documents.",
        "expected_study": None,
    },
]


def run_evaluation() -> dict[str, Any]:
    """
    Run evaluation suite and generate scores for Correctness, Grounding, and Citation Accuracy.
    """
    # Import RAG service inside function to prevent circular imports
    # pyrefly: ignore [missing-import]
    from backend.app.services.rag_service import answer_with_citations

    question_results: list[QuestionEvalResult] = []
    total_correctness = 0.0
    total_grounding = 0.0
    total_citation = 0.0
    passed_cnt = 0

    for item in BENCHMARK_QUESTIONS:
        qid = item["id"]
        q = item["question"]
        expected = item["expected_answer"]

        try:
            res = answer_with_citations(question=q, k=4)
            actual_answer = res.get("answer", "")
            used_cites = [c.source for c in res.get("used_citations", [])]

            # Metric evaluation logic
            if "could not find sufficient supporting evidence" in expected.lower():
                if "could not find sufficient" in actual_answer.lower() or "don't have enough" in actual_answer.lower():
                    correctness = 1.0
                    grounding = 1.0
                    citation_acc = 1.0
                else:
                    correctness = 0.2
                    grounding = 0.4
                    citation_acc = 0.0
            else:
                # Check keyword overlap
                kw_matches = sum(1 for word in expected.split() if len(word) > 4 and word.lower() in actual_answer.lower())
                correctness = min(1.0, round(0.5 + (kw_matches * 0.15), 2))
                grounding = 0.95 if used_cites else 0.40
                citation_acc = 1.0 if len(used_cites) > 0 else 0.50

            overall = round((correctness * 0.4) + (grounding * 0.4) + (citation_acc * 0.2), 2)
            passed = overall >= 0.75
            if passed:
                passed_cnt += 1

            failure_reason = None if passed else "Answer score below 0.75 threshold or missed key expected findings."

            q_res = QuestionEvalResult(
                id=qid,
                question=q,
                expected_answer=expected,
                actual_answer=actual_answer,
                correctness_score=correctness,
                grounding_score=grounding,
                citation_accuracy=citation_acc,
                overall_score=overall,
                passed=passed,
                used_citations=used_cites,
                failure_reason=failure_reason,
            )
            question_results.append(q_res)

            total_correctness += correctness
            total_grounding += grounding
            total_citation += citation_acc

        except Exception as err:
            logger.error(f"Error evaluating question {qid}: {err}")
            q_res = QuestionEvalResult(
                id=qid,
                question=q,
                expected_answer=expected,
                actual_answer=f"Error: {err}",
                correctness_score=0.0,
                grounding_score=0.0,
                citation_accuracy=0.0,
                overall_score=0.0,
                passed=False,
                failure_reason=str(err),
            )
            question_results.append(q_res)

    total_n = max(len(BENCHMARK_QUESTIONS), 1)
    avg_corr = round(total_correctness / total_n, 2)
    avg_ground = round(total_grounding / total_n, 2)
    avg_cite = round(total_citation / total_n, 2)
    overall_sys = round((avg_corr * 0.4) + (avg_ground * 0.4) + (avg_cite * 0.2), 2)

    summary_obj = EvaluationSummary(
        timestamp=datetime.now(timezone.utc).isoformat(),
        total_questions=len(BENCHMARK_QUESTIONS),
        passed_questions=passed_cnt,
        failed_questions=len(BENCHMARK_QUESTIONS) - passed_cnt,
        avg_correctness=avg_corr,
        avg_grounding=avg_ground,
        avg_citation_accuracy=avg_cite,
        overall_system_score=overall_sys,
        question_results=question_results,
    )

    out_dict = summary_obj.model_dump()

    try:
        with open(EVAL_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(out_dict, f, indent=2)

        # Generate markdown summary
        md_lines = [
            "# PharmaLens RAG Evaluation Summary",
            f"**Timestamp**: {summary_obj.timestamp}",
            f"**Total Questions Evaluated**: {summary_obj.total_questions}",
            f"**Passed**: {summary_obj.passed_questions} | **Failed**: {summary_obj.failed_questions}",
            "",
            "## System Metrics",
            f"- **Correctness**: {avg_corr * 100:.1f}%",
            f"- **Grounding Score**: {avg_ground * 100:.1f}%",
            f"- **Citation Accuracy**: {avg_cite * 100:.1f}%",
            f"- **Overall System Score**: {overall_sys * 100:.1f}%",
            "",
            "## Question Failure Breakdown",
        ]
        for qr in question_results:
            status = "PASS" if qr.passed else "FAIL"
            md_lines.append(f"### [{status}] {qr.id}: {qr.question}")
            md_lines.append(f"- **Expected**: {qr.expected_answer}")
            md_lines.append(f"- **Actual**: {qr.actual_answer}")
            if qr.failure_reason:
                md_lines.append(f"- **Reason**: {qr.failure_reason}")
            md_lines.append("")

        with open(EVAL_SUMMARY_MD, "w", encoding="utf-8") as f:
            f.write("\n".join(md_lines))

    except Exception as err:
        logger.error(f"Error saving evaluation outputs: {err}")

    return out_dict
