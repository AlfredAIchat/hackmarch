"""
Answer Evaluator — Quiz scoring node.
Temperature: 0.0 (deterministic evaluation).
"""

import json
from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Given this quiz question, the correct answer, and the user's chosen answer, "
    'return JSON: {"is_correct": bool, "explanation": str, "concept_reinforced": str}. '
    "Return ONLY valid JSON, no markdown fences."
)


def answer_evaluator_node(state: AlfredState) -> dict:
    questions = state.get("quiz_questions", [])
    answers = state.get("quiz_answers", [])
    results: list[dict] = []
    correct_count = 0

    for i, q in enumerate(questions):
        user_answer = answers[i] if i < len(answers) else -1
        correct_idx = q.get("correct_index", 0)
        options = q.get("options", [])

        user_text = options[user_answer] if 0 <= user_answer < len(options) else "No answer"
        correct_text = options[correct_idx] if 0 <= correct_idx < len(options) else "Unknown"

        raw = chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Question: {q.get('question', '')}\n"
                        f"Correct answer: {correct_text}\n"
                        f"User's answer: {user_text}"
                    ),
                },
            ],
            temperature=0.0,
        )

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            result = {
                "is_correct": user_answer == correct_idx,
                "explanation": "Could not parse evaluation.",
                "concept_reinforced": q.get("concept", ""),
            }

        if result.get("is_correct"):
            correct_count += 1
        results.append(result)

    score = (correct_count / len(questions) * 100) if questions else 0.0

    return {
        "quiz_score": score,
        "quiz_answers": results,
    }
