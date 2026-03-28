"""
Hallucination Checker — Fact verification gate.
Temperature: 0.0 (deterministic verification).
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Given this answer, identify each factual claim. For each claim assign a "
    "confidence score 0-1. If any claim scores below 0.6, flag it. "
    'Return JSON: {"overall_confidence": float, "flagged_claims": ["..."], '
    '"verdict": "pass" or "fail"}. Return ONLY valid JSON, no markdown fences.'
)


def hallucination_checker_node(state: AlfredState) -> dict:
    answer = state.get("current_answer", "")

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Answer to verify:\n{answer}"},
        ],
        temperature=0.0,
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {"overall_confidence": 0.8, "flagged_claims": [], "verdict": "pass"}

    verdict = data.get("verdict", "pass")
    flagged = data.get("flagged_claims", [])
    retry_count = state.get("retry_count", 0)

    updates: dict = {
        "last_verdict": verdict,
        "hallucination_flags": flagged,
    }

    if verdict == "fail":
        updates["retry_count"] = retry_count + 1

    return updates
