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

    # Check for minimum context requirements
    if not context_parts:
        return {
            "quiz_questions": [],
            "error": "Need more conversation history. Ask more questions and explore concepts first."
        }

    if len(term_list) < 2:
        return {
            "quiz_questions": [],
            "error": "Explore more concepts by clicking on terms in answers to generate a meaningful quiz."
        }

    user_msg = "\n".join(context_parts)

    try:
        raw = chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.4,
        )
    except Exception as e:
        return {
            "quiz_questions": [],
            "error": f"Failed to generate quiz: {str(e)}"
        }

    try:
        cleaned = raw.strip()
        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        # Sometimes the LLM wraps in ```json
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        questions = json.loads(cleaned)

        # Handle cases where LLM wraps the array in an object
        if isinstance(questions, dict):
            if "quiz_questions" in questions:
                questions = questions["quiz_questions"]
            elif "questions" in questions:
                questions = questions["questions"]

        # Validate structure
        if not isinstance(questions, list):
            return {
                "quiz_questions": [],
                "error": "Quiz generation failed. Please try again."
            }

        # Validate each question has required fields
        valid_questions = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            # Ensure required fields exist
            q.setdefault("question", "")
            q.setdefault("options", [])
            q.setdefault("correct_index", 0)
            q.setdefault("concept", "")

            # Only include questions with actual content
            if q["question"] and len(q["options"]) >= 4:
                valid_questions.append(q)

        if not valid_questions:
            return {
                "quiz_questions": [],
                "error": "Could not generate valid quiz questions. Try exploring more concepts."
            }

        return {"quiz_questions": valid_questions}

    except (json.JSONDecodeError, IndexError, ValueError) as e:
        return {
            "quiz_questions": [],
            "error": "Quiz generation failed due to formatting issues. Please try again."
        }
