"""
Report Agent — Narrative learning report generator.
Temperature: 0.5 (creative for human-readable summary).
"""

from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "Generate a structured Markdown learning report with sections: "
    "'## What You Learned', '## Concepts Mastered', '## Quiz Performance', "
    "and '## Recommended Next Topics'. "
    "Make it warm, encouraging, and pedagogically useful. "
    "Use the session data provided to personalize the report."
)


def report_agent_node(state: AlfredState) -> dict:
    explored = state.get("explored_terms", [])
    quiz_score = state.get("quiz_score", 0.0)
    depth = state.get("current_depth", 0)
    root_query = state.get("conversation_history", [{}])[0].get("content", "") if state.get("conversation_history") else ""
    tree = state.get("knowledge_tree", {})

    session_summary = (
        f"Root question: {root_query}\n"
        f"Explored terms: {', '.join(explored)}\n"
        f"Max depth reached: {depth}\n"
        f"Quiz score: {quiz_score}%\n"
        f"Knowledge tree nodes: {len(tree)}\n"
    )

    report = chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": session_summary},
        ],
        temperature=0.5,
    )

    return {"final_report": report}
