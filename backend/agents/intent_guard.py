"""
Intent Guard — Input sanitiser node.
Temperature: 0.0 (pure classification, zero creativity).
VERY LENIENT — accepts misspelled, grammatically incorrect, or informal queries.
Only rejects genuinely harmful or completely empty input.
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "You are a lenient input filter. Your job is to ALLOW almost all queries through. "
    "Users may misspell words, use broken grammar, or type informally — that's fine. "
    "You should try to understand what they mean and clean up the query.\n\n"
    "ONLY reject if the query is:\n"
    "- Genuinely harmful or dangerous (instructions for violence, etc)\n"
    "- Completely meaningless gibberish (random characters with no intent)\n\n"
    "ALWAYS ALLOW:\n"
    "- Misspelled words (e.g. 'karnaaka' → 'Karnataka')\n"
    "- Broken grammar (e.g. 'wat is photosyntesis' → 'What is photosynthesis?')\n"
    "- Short/informal queries (e.g. 'explain gravity')\n"
    "- Vague queries (e.g. 'tell me about it' if there's file context)\n"
    "- Queries about uploaded files (e.g. 'explain this pdf', 'summarize the file')\n\n"
    'Return JSON: {"valid": true, "cleaned_query": "corrected version of their query", "reason": "ok"}. '
    "If you must reject, set valid to false. "
    "Return ONLY valid JSON, no markdown fences."
)


def intent_guard_node(state: AlfredState) -> dict:
    query = state.get("user_query", "").strip()
    file_context = state.get("file_context", "")

    if not query:
        # If there's a file but no query, set a default
        if file_context:
            return {
                "valid": True,
                "cleaned_query": "Explain and summarize the uploaded file",
                "reject_reason": "",
                "user_query": "Explain and summarize the uploaded file",
            }
        return {
            "valid": False,
            "cleaned_query": "",
            "reject_reason": "Empty query",
        }

    # If query mentions a file/pdf and there IS file context, always allow
    file_keywords = ["pdf", "file", "document", "image", "photo", "picture", "upload"]
    if file_context and any(kw in query.lower() for kw in file_keywords):
        cleaned = query
        if len(query.split()) < 5:
            cleaned = f"Explain and summarize the uploaded file. User asked: {query}"
        return {
            "valid": True,
            "cleaned_query": cleaned,
            "reject_reason": "",
            "user_query": cleaned,
        }

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        temperature=0.0,
    )

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # If LLM response can't be parsed, ALLOW the query through
        data = {"valid": True, "cleaned_query": query, "reason": "parse_fallback"}

    return {
        "valid": data.get("valid", True),
        "cleaned_query": data.get("cleaned_query", query),
        "reject_reason": data.get("reason", ""),
        "user_query": data.get("cleaned_query", query),
    }
