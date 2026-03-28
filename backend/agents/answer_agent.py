"""
Answer Agent — Knowledge explainer node.
Temperature: 0.5 (creative but grounded).
Generates varied, context-aware explanations with depth-adaptive length.
MINIMUM: Always at least 3 lines of clear explanation.
Supports user-customizable difficulty, technicality, and answer depth.
"""

from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "You are a brilliant teacher having a real conversation with a curious learner. "
    "Your goal is to build understanding progressively — each answer should connect to "
    "what they've already learned.\n\n"
    "RULES:\n"
    "1. VARY your format every time. Do NOT repeat the same structure.\n"
    "2. Bold the most important terms using **term** markdown — these become clickable.\n"
    "3. ALWAYS reference what they previously explored when relevant.\n"
    "4. Use simple, conversational language — like a smart friend explaining.\n"
    "5. NEVER start with 'Think of X like Y' — find a different, creative opening.\n"
    "6. MINIMUM 3 lines/bullet points of clear explanation, even at deeper depths.\n"
    "7. Use simple words that anyone can understand.\n"
    "8. Bold at least 2-3 key terms so they are clickable for further exploration.\n\n"
    "IMPORTANT: Every answer must feel unique. Reference the journey so far."
)

# Answer depth configurations (affects length, not quality)
DEPTH_AMOUNT_MAP = {
    'brief': {
        0: "2-3 bullet points, 1 sentence each",
        1: "2 bullet points, 1 sentence each",
        2: "2 short bullet points",
        3: "2 short bullet points",
        'deep': "2-3 concise bullet points"  # For depth >= 4
    },
    'moderate': {
        0: "3-4 bullet points",
        1: "3 bullet points",
        2: "3 short bullet points",
        3: "3 short bullet points",
        'deep': "3 bullet points"
    },
    'detailed': {
        0: "5-6 bullet points with sub-points and practical examples",
        1: "4-5 bullet points with examples",
        2: "4 bullet points with details",
        3: "3-4 bullet points with depth",
        'deep': "4-5 bullet points with comprehensive explanations and examples"
    }
}


def _get_difficulty_instruction(level: int) -> str:
    """Generate difficulty-based instruction (1-10 scale)."""
    if level <= 3:
        return (
            "Explain using SIMPLE concepts and everyday analogies. "
            "Avoid advanced ideas. Target audience: Complete beginners."
        )
    elif level <= 6:
        return (
            "Balance foundational concepts with some advanced ideas. "
            "Mix simple and moderately challenging terms. Target audience: Learners with some background."
        )
    else:  # 7-10
        return (
            "Include CHALLENGING concepts beyond their current level. "
            "Introduce 1-2 advanced terms they likely don't know yet to encourage deeper exploration. "
            "Push boundaries and don't oversimplify. Target audience: Advanced learners seeking depth."
        )


def _get_technicality_instruction(level: int) -> str:
    """Generate technicality-based instruction (1-10 scale)."""
    if level <= 3:
        return (
            "Use EVERYDAY language. Avoid jargon and technical terms unless absolutely necessary. "
            "When you must use technical terms, explain them immediately in plain English."
        )
    elif level <= 6:
        return (
            "Balance practical examples with technical accuracy. "
            "Use domain terms but explain them clearly. Mix accessible language with precise terminology."
        )
    else:  # 7-10
        return (
            "Use PRECISE TECHNICAL LANGUAGE, academic terminology, formulas if relevant, "
            "and domain-specific jargon. Assume familiarity with technical concepts."
        )


def _get_length_instruction(depth: int, answer_depth: str) -> str:
    """Get length instruction based on current depth and user's answer_depth preference."""
    depth_config = DEPTH_AMOUNT_MAP.get(answer_depth, DEPTH_AMOUNT_MAP['moderate'])

    if depth <= 0:
        return depth_config[0]
    elif depth == 1:
        return depth_config[1]
    elif depth == 2:
        return depth_config[2]
    elif depth == 3:
        return depth_config[3]
    else:  # depth >= 4
        return depth_config['deep']


def answer_agent_node(state: AlfredState) -> dict:
    history = list(state.get("conversation_history", []))
    query = state.get("user_query", "")
    depth = state.get("current_depth", 0)
    explored = state.get("explored_terms", [])
    file_context = state.get("file_context", "")

    # Get user preferences (with defaults)
    difficulty_level = state.get("difficulty_level", 5)
    technicality_level = state.get("technicality_level", 5)
    answer_depth = state.get("answer_depth", "moderate")

    # Build dynamic system prompt with all customizations
    difficulty_rule = _get_difficulty_instruction(difficulty_level)
    technicality_rule = _get_technicality_instruction(technicality_level)
    length_rule = _get_length_instruction(depth, answer_depth)

    system = (
        f"{SYSTEM_PROMPT}\n\n"
        f"DIFFICULTY LEVEL ({difficulty_level}/10): {difficulty_rule}\n\n"
        f"TECHNICALITY LEVEL ({technicality_level}/10): {technicality_rule}\n\n"
        f"LENGTH RULE: {length_rule}"
    )

    messages = [{"role": "system", "content": system}]

    # Include recent conversation history (last 3 exchanges)
    messages.extend(history[-6:])

    # Build the user message
    user_msg = query

    # If there's file context, prepend it
    if file_context:
        user_msg = (
            f"[UPLOADED FILE CONTENT — the user uploaded a file. Use this content to answer:\n"
            f"{file_context[:4000]}\n"
            f"--- END OF FILE ---]\n\n"
            f"User's question: {query}"
        )

    if depth > 0 and explored:
        user_msg += (
            f"\n\n[Context: Depth {depth}. "
            f"Previously explored: {', '.join(explored[-5:])}. "
            f"Connect to what we discussed. {length_rule}]"
        )

    messages.append({"role": "user", "content": user_msg})

    answer = chat(messages=messages, temperature=0.5)

    # Append to conversation history
    updated_history = list(history)
    updated_history.append({"role": "user", "content": query})
    updated_history.append({"role": "assistant", "content": answer})

    return {
        "current_answer": answer,
        "conversation_history": updated_history,
    }
