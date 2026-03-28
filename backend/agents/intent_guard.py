"""
Intent Guard — Input sanitiser node.
Temperature: 0.0 (pure classification, zero creativity).
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "You are an input sanitiser. Determine if the user's question is a genuine "
    "knowledge question. Return JSON: {\"valid\": bool, \"cleaned_query\": str, \"reason\": str}. "
    "If the query contains harmful content, is completely off-topic, or is empty, set valid to false. "
    "Return ONLY valid JSON, no markdown fences."
)


def intent_guard_node(state: AlfredState) -> dict:
    query = state.get("user_query", "").strip()

    if not query:
        return {
            "valid": False,
            "cleaned_query": "",
            "reject_reason": "Empty query",
        }

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        temperature=0.0,
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {"valid": True, "cleaned_query": query, "reason": "parse_fallback"}

    return {
        "valid": data.get("valid", True),
        "cleaned_query": data.get("cleaned_query", query),
        "reject_reason": data.get("reason", ""),
        "user_query": data.get("cleaned_query", query),
    }
