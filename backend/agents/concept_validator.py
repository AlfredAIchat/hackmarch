"""
Concept Validator — Pure Python logic (no LLM call).
Deduplicates, filters cycles, assigns importance tier + color, caps at 4.
Passes through must_learn + why_important from extractor.
"""

from backend.state import AlfredState


def concept_validator_node(state: AlfredState) -> dict:
    raw_concepts: list[dict] = list(state.get("concepts", []))
    explored: list[str] = list(state.get("explored_terms", []))

    explored_lower = {t.lower() for t in explored}
    seen: set[str] = set()
    filtered: list[dict] = []

    for c in raw_concepts:
        term = c.get("term", "").strip()
        term_lower = term.lower()

        # Skip short, duplicate, or already-explored terms
        if len(term) < 4:
            continue
        if term_lower in explored_lower:
            continue
        if term_lower in seen:
            continue

        seen.add(term_lower)

        # Assign color based on relevance_score
        score = float(c.get("relevance_score", 0.5))
        if score >= 0.7:
            color = "green"
        elif score >= 0.4:
            color = "yellow"
        else:
            color = "orange"

        # Difficulty tier labels
        difficulty = int(c.get("difficulty", 2))
        if difficulty == 1:
            tier = "foundation"
        elif difficulty == 2:
            tier = "intermediate"
        else:
            tier = "advanced"

        filtered.append({
            "term": term,
            "relevance_score": score,
            "difficulty": difficulty,
            "tier": tier,
            "color": color,
            "explanation": c.get("explanation", ""),
            "must_learn": bool(c.get("must_learn", score >= 0.8)),
            "why_important": c.get("why_important", ""),
        })

    # Sort by relevance descending, cap at 4
    filtered.sort(key=lambda x: x["relevance_score"], reverse=True)
    filtered = filtered[:4]

    return {"concepts": filtered}
