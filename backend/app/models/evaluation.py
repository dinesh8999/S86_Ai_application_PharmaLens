"""
PharmaLens Evaluation Models
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class QuestionEvalResult(BaseModel):
    id: str
    question: str
    expected_answer: str
    actual_answer: str
    correctness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    grounding_score: float = Field(default=0.0, ge=0.0, le=1.0)
    citation_accuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    overall_score: float = Field(default=0.0, ge=0.0, le=1.0)
    passed: bool = False
    used_citations: list[str] = Field(default_factory=list)
    failure_reason: Optional[str] = None


class EvaluationSummary(BaseModel):
    timestamp: str
    total_questions: int = 0
    passed_questions: int = 0
    failed_questions: int = 0
    avg_correctness: float = 0.0
    avg_grounding: float = 0.0
    avg_citation_accuracy: float = 0.0
    overall_system_score: float = 0.0
    question_results: list[QuestionEvalResult] = Field(default_factory=list)
