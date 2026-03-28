"""
Concept Validator — Pure Python logic (no LLM call).
Deduplicates, filters cycles, assigns colors, caps at 6.
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

        filtered.append({
            "term": term,
            "relevance_score": score,
            "difficulty": int(c.get("difficulty", 2)),
            "color": color,
            "explanation": c.get("explanation", ""),
        })

    # Sort by relevance descending, cap at 6
    filtered.sort(key=lambda x: x["relevance_score"], reverse=True)
    filtered = filtered[:6]

    return {"concepts": filtered}
