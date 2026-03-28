"""
Answer Agent — Knowledge explainer node.
Temperature: 0.5 (creative but grounded).
Generates varied, context-aware explanations with depth-adaptive length.
MINIMUM: Always at least 3 lines of clear explanation.
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

# Depth-specific length instructions
DEPTH_INSTRUCTIONS = {
    0: "Give a clear explanation: 3-4 short bullet points, each 1 sentence. Use simple language. Bold key terms.",
    1: "Be concise but clear: 3 bullet points, each 1 sentence. Use simple words. Bold key terms.",
    2: "Keep it brief: 3 short bullet points. One sentence each. Bold key terms for clicking.",
    3: "Brief but informative: 3 short bullet points. Maximum 1 sentence each. Bold key terms.",
}


def _get_length_instruction(depth: int) -> str:
    if depth <= 0:
        return DEPTH_INSTRUCTIONS[0]
    elif depth == 1:
        return DEPTH_INSTRUCTIONS[1]
    elif depth == 2:
        return DEPTH_INSTRUCTIONS[2]
    else:
        return DEPTH_INSTRUCTIONS[3]


def answer_agent_node(state: AlfredState) -> dict:
    history = list(state.get("conversation_history", []))
    query = state.get("user_query", "")
    depth = state.get("current_depth", 0)
    explored = state.get("explored_terms", [])
    file_context = state.get("file_context", "")

    # Build system prompt with depth-specific length instruction
    length_rule = _get_length_instruction(depth)
    system = f"{SYSTEM_PROMPT}\n\nLENGTH RULE: {length_rule}"

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
