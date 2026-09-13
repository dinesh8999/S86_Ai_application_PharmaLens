"""
PharmaLens Monitoring & Usage Tracking Module
Records request logs in JSONL format, calculates token usage & cost, and generates usage summaries.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any
from backend.src.config import OUTPUTS_DIR

logger = logging.getLogger(__name__)

REQUEST_LOG_FILE = OUTPUTS_DIR / "rag_requests.jsonl"
USAGE_REPORT_FILE = OUTPUTS_DIR / "usage_report.json"

# Cost rates (per token, estimated for Gemini Flash API)
INPUT_TOKEN_RATE = 0.00000015
OUTPUT_TOKEN_RATE = 0.0000006


def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    """Calculate estimated API cost in USD."""
    return round((input_tokens * INPUT_TOKEN_RATE) + (output_tokens * OUTPUT_TOKEN_RATE), 6)


def log_request(
    request_id: str,
    question: str,
    answer: str,
    sources: list[str],
    cache_hit: bool,
    input_tokens: int,
    output_tokens: int,
    latency_ms: float,
    error: str | None = None,
) -> dict[str, Any]:
    """
    Log a RAG request to outputs/rag_requests.jsonl and update usage metrics.
    """
    cost = calculate_cost(input_tokens, output_tokens)
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id,
        "question": question,
        "answer_preview": answer[:150] + ("..." if len(answer) > 150 else ""),
        "sources": sources,
        "cache_hit": cache_hit,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "estimated_cost": cost,
        "latency_ms": round(latency_ms, 2),
        "error": error,
    }

    try:
        with open(REQUEST_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as err:
        logger.error(f"Failed writing to request log file: {err}")

    # Re-calculate and write summary usage report
    update_usage_report()
    return log_entry


def update_usage_report() -> dict[str, Any]:
    """
    Read all logs from rag_requests.jsonl and compile an aggregated usage report.
    Saves report to outputs/usage_report.json.
    """
    if not REQUEST_LOG_FILE.exists():
        empty_report = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "cache_hit_rate": 0.0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_estimated_cost": 0.0,
            "average_latency_ms": 0.0,
            "errors": 0,
        }
        with open(USAGE_REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(empty_report, f, indent=4)
        return empty_report

    total_requests = 0
    cache_hits = 0
    cache_misses = 0
    total_input = 0
    total_output = 0
    total_cost = 0.0
    total_latency = 0.0
    errors = 0

    try:
        with open(REQUEST_LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line.strip())
                total_requests += 1
                if data.get("cache_hit"):
                    cache_hits += 1
                else:
                    cache_misses += 1
                total_input += data.get("input_tokens", 0)
                total_output += data.get("output_tokens", 0)
                total_cost += data.get("estimated_cost", 0.0)
                total_latency += data.get("latency_ms", 0.0)
                if data.get("error"):
                    errors += 1
    except Exception as err:
        logger.error(f"Error reading request log: {err}")

    hit_rate = round(cache_hits / total_requests, 4) if total_requests > 0 else 0.0
    avg_latency = round(total_latency / total_requests, 2) if total_requests > 0 else 0.0

    report = {
        "total_requests": total_requests,
        "cache_hits": cache_hits,
        "cache_misses": cache_misses,
        "cache_hit_rate": hit_rate,
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_estimated_cost": round(total_cost, 6),
        "average_latency_ms": avg_latency,
        "errors": errors,
    }

    try:
        with open(USAGE_REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=4)
    except Exception as err:
        logger.error(f"Error saving usage report: {err}")

    return report
