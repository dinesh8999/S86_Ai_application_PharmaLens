"""
PharmaLens Monitoring & Usage Tracking Module
Calculates token costs, logs query requests, and aggregates usage statistics.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import OUTPUTS_DIR

logger = logging.getLogger(__name__)

REQUEST_LOG_FILE = OUTPUTS_DIR / "rag_requests.jsonl"
USAGE_REPORT_FILE = OUTPUTS_DIR / "usage_report.json"

INPUT_COST_PER_MILLION = 0.075
OUTPUT_COST_PER_MILLION = 0.30


def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    """Calculate estimated API cost in USD based on token counts."""
    input_cost = (input_tokens / 1_000_000.0) * INPUT_COST_PER_MILLION
    output_cost = (output_tokens / 1_000_000.0) * OUTPUT_COST_PER_MILLION
    return round(input_cost + output_cost, 6)


def log_request(
    request_id: str,
    question: str,
    answer: str,
    sources: list[str],
    cache_hit: bool,
    input_tokens: int,
    output_tokens: int,
    latency_ms: float,
) -> None:
    """Log request record into JSONL log file."""
    try:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
            "question": question,
            "answer_preview": answer[:200] + "..." if len(answer) > 200 else answer,
            "sources": sources,
            "cache_hit": cache_hit,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "estimated_cost": calculate_cost(input_tokens, output_tokens),
            "latency_ms": round(latency_ms, 2),
        }
        with open(REQUEST_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as err:
        logger.error(f"Failed logging request: {err}")


def update_usage_report() -> dict[str, Any]:
    """Parse JSONL log file and return aggregated usage summary."""
    total_queries = 0
    cached_queries = 0
    total_input_tokens = 0
    total_output_tokens = 0
    latencies: list[float] = []

    if REQUEST_LOG_FILE.exists():
        try:
            with open(REQUEST_LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    rec = json.loads(line)
                    total_queries += 1
                    if rec.get("cache_hit"):
                        cached_queries += 1
                    total_input_tokens += rec.get("input_tokens", 0)
                    total_output_tokens += rec.get("output_tokens", 0)
                    latencies.append(rec.get("latency_ms", 0.0))
        except Exception as err:
            logger.error(f"Error reading log file: {err}")

    cache_hit_rate = round((cached_queries / max(total_queries, 1)) * 100, 1)
    avg_latency = round(sum(latencies) / max(len(latencies), 1), 2)
    total_cost = calculate_cost(total_input_tokens, total_output_tokens)

    report = {
        "total_queries": total_queries,
        "total_requests": total_queries,
        "cached_queries": cached_queries,
        "cache_hits": cached_queries,
        "cache_misses": max(total_queries - cached_queries, 0),
        "cache_hit_rate_percent": cache_hit_rate,
        "cache_hit_rate": round(cache_hit_rate / 100.0, 2),
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_tokens": total_input_tokens + total_output_tokens,
        "estimated_cost_usd": total_cost,
        "total_estimated_cost": total_cost,
        "avg_latency_ms": avg_latency,
        "average_latency_ms": avg_latency,
        "llm_requests": max(total_queries - cached_queries, 0),
        "embedding_requests": max(total_queries - cached_queries, 0),
        "errors": 0,
    }

    try:
        with open(USAGE_REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
    except Exception as err:
        logger.error(f"Error writing usage report: {err}")

    return report
