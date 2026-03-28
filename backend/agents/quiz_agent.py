"""
Quiz Agent — MCQ generation node.
Temperature: 0.4 (slightly creative for varied questions).
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Based on these explored concepts, generate exactly 3 multiple choice questions. "
    "Each must test understanding, not recall. Each must have 4 options with exactly "
    "one correct answer. Return a JSON array where each item has: "
    '"question" (str), "options" (list of 4 strings), "correct_index" (int 0-3), '
    '"concept" (str — which concept this tests). '
    "Return ONLY valid JSON, no markdown fences."
)


def quiz_agent_node(state: AlfredState) -> dict:
    explored = state.get("explored_terms", [])
    concepts = state.get("concepts", [])

    term_list = explored if explored else [c.get("term", "") for c in concepts]

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Concepts: {', '.join(term_list)}"},
        ],
        temperature=0.4,
    )

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        questions = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        questions = []

    return {"quiz_questions": questions}
