"""
Concept Extractor — Term extraction node.
Temperature: 0.1 (very low for consistent extraction).
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "From this answer, identify 3-6 key conceptual terms that a learner might "
    "need explained. Do NOT pick articles, prepositions, or common words. "
    "For each term return JSON with: term (string), relevance_score (float 0-1, "
    "how central is it to understanding the answer), difficulty (int 1=easy 2=medium 3=hard). "
    "Return ONLY a JSON array, no markdown fences."
)


def concept_extractor_node(state: AlfredState) -> dict:
    answer = state.get("current_answer", "")

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": answer},
        ],
        temperature=0.1,
    )

    try:
        # Handle potential markdown fencing
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        concepts = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        concepts = []

    if not isinstance(concepts, list):
        concepts = []

    return {"concepts": concepts}
