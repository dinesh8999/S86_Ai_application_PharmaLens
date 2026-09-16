"""
PharmaLens Citations & Grounded Generation Module
Handles context assembly, citation mapping, and grounded prompt construction.
"""

from __future__ import annotations

import logging
from typing import Any
from .config import get_settings
from .embeddings import get_llm_client

logger = logging.getLogger(__name__)


def assemble_context(chunks: list[dict[str, Any]]) -> str:
    """
    Assemble retrieved vector chunks into structured context with explicit citation numbers.
    """
    if not chunks:
        return ""

    context_blocks = []
    for idx, chunk in enumerate(chunks, start=1):
        source = chunk.get("source", "Unknown Document")
        chunk_id = chunk.get("chunk_id", f"chunk-{idx}")
        text = chunk.get("text", "").strip()
        study_id = chunk.get("study_id", "N/A")
        page = chunk.get("page")
        section = chunk.get("section")

        meta_str = f"Source: {source} | Study ID: {study_id}"
        if section:
            meta_str += f" | Section: {section}"
        if page:
            meta_str += f" | Page: {page}"

        block = f"[{idx}]\n{meta_str}\nChunk ID: {chunk_id}\n\n{text}"
        context_blocks.append(block)

    return "\n\n---\n\n".join(context_blocks)


def build_citation_map(chunks: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """
    Build a citation mapping dictionary from citation key (e.g. '[1]') to full metadata.
    """
    citation_map = {}
    for idx, chunk in enumerate(chunks, start=1):
        key = f"[{idx}]"
        citation_map[key] = {
            "source": chunk.get("source", "Unknown"),
            "chunk_id": chunk.get("chunk_id", f"chunk-{idx}"),
            "chunk_index": chunk.get("chunk_index", idx),
            "study_id": chunk.get("study_id", "N/A"),
            "section": chunk.get("section"),
            "page": chunk.get("page"),
            "score": chunk.get("score", 0.0),
            "text": chunk.get("text", ""),
        }
    return citation_map


def build_grounded_system_prompt() -> str:
    """
    Construct system prompt enforcing strict RAG grounding rules.
    """
    return (
        "You are PharmaLens, an expert AI Clinical Research Assistant.\n"
        "Your duty is to answer pharmaceutical research questions using ONLY the provided research context.\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. Do not use outside knowledge or make assumptions beyond the provided context.\n"
        "2. ALWAYS cite factual claims using citation markers such as [1], [2] at the end of the statement corresponding to context block numbers.\n"
        "3. Only use citation markers that exist in the provided context.\n"
        "4. Do NOT invent citations or fabricate facts.\n"
        "5. If the provided context does not contain enough information to answer the question accurately, respond ONLY with:\n"
        "   \"I don't have enough information in the available documents to answer that question.\""
    )


def generate_cited_answer(question: str, context: str) -> tuple[str, int, int]:
    """
    Generate grounded AI answer using OpenAI client pointing to Gemini endpoint.
    Returns (answer_text, input_tokens, output_tokens).
    """
    if not context.strip():
        return (
            "I don't have enough information in the available documents to answer that question.",
            0,
            0,
        )

    settings = get_settings()
    chat_model = settings["chat_model"]
    client = get_llm_client()

    user_prompt = f"RELEVANT RESEARCH CONTEXT:\n{context}\n\nRESEARCH QUESTION: {question}\n\nGROUNDED ANSWER WITH CITATIONS ([1], [2]):"

    preferred_models = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", chat_model]
    models_to_try = []
    for m in preferred_models:
        if m and m not in models_to_try:
            models_to_try.append(m)

    last_err = None
    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": build_grounded_system_prompt()},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                timeout=15.0,
            )
            answer = response.choices[0].message.content or ""
            
            input_tokens = getattr(response.usage, "prompt_tokens", len(user_prompt) // 4)
            output_tokens = getattr(response.usage, "completion_tokens", len(answer) // 4)
            
            return answer.strip(), input_tokens, output_tokens
        except Exception as err:
            logger.warning(f"Error calling {model_name}: {err}. Trying next model...")
            last_err = err

    logger.error(f"All LLM models failed: {last_err}")
    return (
        "PharmaLens could not generate the answer. Please try again.",
        0,
        0,
    )
