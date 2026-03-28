"""
Quiz Agent — MCQ generation node.
Temperature: 0.4 (slightly creative for varied questions).
Uses conversation history for better quiz context.
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Based on the learning conversation below, generate exactly 3 multiple choice questions. "
    "Each must test UNDERSTANDING, not just recall. Each must have 4 options with exactly "
    "one correct answer. Return a JSON array where each item has: "
    '"question" (str), "options" (list of 4 strings), "correct_index" (int 0-3), '
    '"concept" (str — which concept this tests). '
    "Return ONLY valid JSON, no markdown fences, no explanation."
)


def quiz_agent_node(state: AlfredState) -> dict:
    explored = state.get("explored_terms", [])
    concepts = state.get("concepts", [])
    history = state.get("conversation_history", [])
    current_answer = state.get("current_answer", "")

    # Build a context summary for the quiz
    term_list = explored if explored else [c.get("term", "") for c in concepts if isinstance(c, dict)]
    
    # Use conversation history to give the quiz generator context
    context_parts = []
    if term_list:
        context_parts.append(f"Key concepts explored: {', '.join(term_list)}")
    
    # Include recent answers for context (last 3 exchanges max)
    for msg in history[-6:]:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "assistant" and content:
            context_parts.append(f"Answer given: {content[:300]}")
    
    # Fallback: if no history, use current_answer
    if not context_parts and current_answer:
        context_parts.append(f"Answer: {current_answer[:500]}")
    
    if not context_parts:
        return {"quiz_questions": []}

    user_msg = "\n".join(context_parts)

    raw = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.4,
    )

    try:
        cleaned = raw.strip()
        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        # Sometimes the LLM wraps in ```json
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        questions = json.loads(cleaned)
        # Validate structure
        if not isinstance(questions, list):
            questions = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            # Ensure required fields exist
            q.setdefault("question", "")
            q.setdefault("options", [])
            q.setdefault("correct_index", 0)
            q.setdefault("concept", "")
    except (json.JSONDecodeError, IndexError, ValueError):
        questions = []

    return {"quiz_questions": questions}
