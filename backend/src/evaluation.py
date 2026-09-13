"""
PharmaLens Evaluation Module
Evaluates RAG correctness, grounding, and citation accuracy against benchmark test sets.
Generates evaluation_results.json and evaluation_summary.md inside outputs/.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any
from backend.src.config import OUTPUTS_DIR, DATA_DIR
from backend.src.rag_pipeline import answer_with_citations, clear_cache
from backend.src.ingestion import seed_sample_clinical_documents

logger = logging.getLogger(__name__)

EVAL_RESULTS_FILE = OUTPUTS_DIR / "evaluation_results.json"
EVAL_SUMMARY_FILE = OUTPUTS_DIR / "evaluation_summary.md"


def get_default_evaluation_dataset() -> list[dict[str, Any]]:
    """Return benchmark evaluation question dataset."""
    return [
        {
            "question": "What did Study 001 evaluate?",
            "expected_points": ["safety", "efficacy", "Drug X", "adult patients", "moderate disease"],
            "expected_sources": ["Study_001_Clinical_Report.txt"],
        },
        {
            "question": "What was the primary endpoint of Study 001?",
            "expected_points": ["primary endpoint", "change in disease severity", "twelve weeks"],
            "expected_sources": ["Study_001_Clinical_Report.txt"],
        },
        {
            "question": "What was the most common adverse event in Study 001?",
            "expected_points": ["transient headache", "8.5%", "placebo"],
            "expected_sources": ["Study_001_Clinical_Report.txt"],
        },
        {
            "question": "What are the contraindications for Drug X?",
            "expected_points": ["severe hepatic impairment", "hypersensitivity"],
            "expected_sources": ["Drug_X_Safety_Bulletin.txt"],
        },
        {
            "question": "What are the inclusion criteria for Study 002?",
            "expected_points": ["aged 18 to 65", "refractory disease severity"],
            "expected_sources": ["Clinical_Trial_Protocol_002.txt"],
        },
        {
            "question": "What is the recommended dosage of Drug Z for pediatric cancer?",
            "expected_points": [],  # Out of domain question -> testing fallback!
            "expected_sources": [],
            "should_fallback": True,
        },
    ]


def evaluate_correctness(answer: str, expected_points: list[str], should_fallback: bool = False) -> float:
    """
    Compute correctness score based on matched expected key points.
    If expected to fallback and answered with fallback phrase -> 1.0 score.
    """
    if should_fallback:
        if "don't have enough information" in answer.lower():
            return 1.0
        return 0.0

    if not expected_points:
        return 1.0

    answer_lower = answer.lower()
    matched = sum(1 for pt in expected_points if pt.lower() in answer_lower)
    return round(matched / len(expected_points), 2)


def evaluate_grounding(answer: str, chunks: list[dict[str, Any]]) -> float:
    """
    Compute grounding score: checks if answer claims are supported by retrieved context.
    """
    if not chunks:
        if "don't have enough information" in answer.lower():
            return 1.0
        return 0.0

    combined_context = " ".join([c.get("text", "") for c in chunks]).lower()
    
    # Extract non-trivial sentence tokens from answer
    words = [w.lower() for w in re.findall(r"\b[a-zA-Z]{4,}\b", answer) if w.lower() not in ["with", "that", "this", "from", "were", "have", "been"]]
    if not words:
        return 1.0

    supported_count = sum(1 for w in words if w in combined_context)
    return round(min(1.0, supported_count / len(words)), 2)


def evaluate_citation_accuracy(answer: str, citations: dict[str, Any], expected_sources: list[str]) -> float:
    """
    Compute citation accuracy score:
    - Verifies citation markers exist in answer text
    - Verifies citation keys map to valid retrieved metadata
    - Verifies citation source matches expected sources
    """
    if "don't have enough information" in answer.lower():
        return 1.0 if not citations else 0.0

    markers = re.findall(r"\[\d+\]", answer)
    if not markers:
        return 0.0

    valid_markers = 0
    for marker in markers:
        if marker in citations:
            cit = citations[marker]
            source = cit.get("source", "")
            if expected_sources:
                if any(exp.lower() in source.lower() for exp in expected_sources):
                    valid_markers += 1
                else:
                    valid_markers += 0.5
            else:
                valid_markers += 1

    return round(min(1.0, valid_markers / len(markers)), 2)


def run_evaluation() -> dict[str, Any]:
    """
    Run full evaluation pipeline on dataset and save outputs.
    """
    # Ensure sample documents are indexed
    seed_sample_clinical_documents()

    dataset = get_default_evaluation_dataset()
    eval_items = []

    total_correctness = 0.0
    total_grounding = 0.0
    total_citation = 0.0
    failures = []

    for idx, item in enumerate(dataset, start=1):
        q = item["question"]
        exp_pts = item.get("expected_points", [])
        exp_srcs = item.get("expected_sources", [])
        should_fb = item.get("should_fallback", False)

        res = answer_with_citations(q, k=4)
        answer = res["answer"]
        citations = res.get("citations", {})
        chunks = res.get("chunks", [])

        c_score = evaluate_correctness(answer, exp_pts, should_fallback=should_fb)
        g_score = evaluate_grounding(answer, chunks)
        a_score = evaluate_citation_accuracy(answer, citations, exp_srcs)
        
        q_overall = round((c_score * 0.40) + (g_score * 0.35) + (a_score * 0.25), 2)

        status = "PASS" if q_overall >= 0.70 else "FAIL"
        if status == "FAIL":
            failures.append({
                "question": q,
                "answer": answer,
                "overall_score": q_overall,
            })

        total_correctness += c_score
        total_grounding += g_score
        total_citation += a_score

        eval_items.append({
            "id": idx,
            "question": q,
            "answer": answer,
            "citations": citations,
            "correctness": c_score,
            "grounding": g_score,
            "citation_accuracy": a_score,
            "overall_score": q_overall,
            "status": status,
        })

    num_questions = len(dataset)
    avg_correctness = round(total_correctness / num_questions, 2)
    avg_grounding = round(total_grounding / num_questions, 2)
    avg_citation_accuracy = round(total_citation / num_questions, 2)
    overall_score = round((avg_correctness * 0.40) + (avg_grounding * 0.35) + (avg_citation_accuracy * 0.25), 2)

    eval_result = {
        "questions": num_questions,
        "avg_correctness": avg_correctness,
        "avg_grounding": avg_grounding,
        "avg_citation_accuracy": avg_citation_accuracy,
        "overall_score": overall_score,
        "failures": failures,
        "details": eval_items,
    }

    # Save to json
    try:
        with open(EVAL_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(eval_result, f, indent=4)
    except Exception as err:
        logger.error(f"Failed writing evaluation results: {err}")

    # Generate Markdown Summary
    generate_markdown_summary(eval_result)

    return eval_result


def generate_markdown_summary(eval_result: dict[str, Any]) -> None:
    """Generate evaluation_summary.md artifact."""
    md_content = f"""# PharmaLens RAG Evaluation Summary

**Overall System Score**: {eval_result['overall_score'] * 100:.1f}%

## Performance Metrics Breakdown

| Metric | Score | Status |
| :--- | :---: | :---: |
| **Correctness** | {eval_result['avg_correctness']:.2f} | {"PASS" if eval_result['avg_correctness'] >= 0.8 else "WARN"} |
| **Grounding** | {eval_result['avg_grounding']:.2f} | {"PASS" if eval_result['avg_grounding'] >= 0.8 else "WARN"} |
| **Citation Accuracy** | {eval_result['avg_citation_accuracy']:.2f} | {"PASS" if eval_result['avg_citation_accuracy'] >= 0.8 else "WARN"} |

## Evaluation Details

- **Total Test Cases**: {eval_result['questions']}
- **Failed Cases**: {len(eval_result['failures'])}

### Benchmark Questions Breakdown
"""

    for item in eval_result.get("details", []):
        md_content += f"""
#### Question {item['id']}: {item['question']}
- **Status**: `{item['status']}`
- **Correctness**: `{item['correctness']:.2f}` | **Grounding**: `{item['grounding']:.2f}` | **Citation Accuracy**: `{item['citation_accuracy']:.2f}`
- **Answer Preview**: {item['answer']}
"""

    try:
        with open(EVAL_SUMMARY_FILE, "w", encoding="utf-8") as f:
            f.write(md_content)
    except Exception as err:
        logger.error(f"Failed writing evaluation markdown summary: {err}")
