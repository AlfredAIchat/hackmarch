"""
Concept Extractor — Term extraction node.
Temperature: 0.1 (very low for consistent extraction).
Extracts ONLY essential concepts with must-learn scoring.
Deduplicates against already explored terms.
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Extract ONLY 2-3 of the MOST IMPORTANT conceptual terms from this answer. "
    "These should be terms that are ESSENTIAL for deep understanding - terms a learner "
    "absolutely MUST know to truly grasp the topic.\n\n"
    "RULES:\n"
    "1. Maximum 3 terms - only the most critical ones\n"
    "2. NO common words, articles, or prepositions\n"
    "3. Prioritize terms that unlock deeper understanding\n"
    "4. Each term should represent a significant concept\n\n"
    "For each term return JSON with:\n"
    '- "term": string (the concept name)\n'
    '- "relevance_score": float 0-1 (centrality to understanding)\n'
    '- "must_learn": boolean (true if this is CRITICAL knowledge the user MUST NOT skip)\n'
    '- "difficulty": int 1-3 (1=foundational, 2=intermediate, 3=advanced)\n'
    '- "why_important": string (1 sentence explaining why this matters)\n\n'
    "Return ONLY a JSON array, no markdown fences."
)


def concept_extractor_node(state: AlfredState) -> dict:
    answer = state.get("current_answer", "")
    explored_terms = state.get("explored_terms", [])

    # Create exclusion prompt for already explored terms
    exclusion_note = ""
    if explored_terms:
        exclusion_note = (
            f"\n\nIMPORTANT: Do NOT extract these already-explored terms: "
            f"{', '.join(explored_terms[-10:])}. Find NEW concepts instead."
        )

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + exclusion_note},
            {"role": "user", "content": answer},
        ],
        temperature=0.1,
    )

    try:
        # Handle potential markdown fencing
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        concepts = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        concepts = []

    if not isinstance(concepts, list):
        concepts = []

    # Post-process: deduplicate and limit
    seen_terms = set(t.lower() for t in explored_terms)
    filtered_concepts = []

    for c in concepts:
        if not isinstance(c, dict):
            continue
        term = c.get("term", "").strip()
        if not term:
            continue
        # Skip if already explored
        if term.lower() in seen_terms:
            continue
        # Skip very short or common terms
        if len(term) < 3 or term.lower() in {"the", "and", "for", "but", "this", "that", "with"}:
            continue

        # Ensure must_learn field exists
        c.setdefault("must_learn", c.get("relevance_score", 0.5) >= 0.8)
        c.setdefault("why_important", "")
        c.setdefault("difficulty", 2)

        seen_terms.add(term.lower())
        filtered_concepts.append(c)

    # Limit to top 3 by relevance
    filtered_concepts.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    filtered_concepts = filtered_concepts[:3]

    return {"concepts": filtered_concepts}
