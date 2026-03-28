"""
Answer Agent — Knowledge explainer node.
Temperature: 0.5 (creative but grounded).
Generates varied, context-aware explanations.
"""

from backend.state import AlfredState
from backend.llm import chat

SYSTEM_PROMPT = (
    "You are a brilliant teacher having a real conversation with a curious learner. "
    "Your goal is to build understanding progressively — each answer should connect to "
    "what they've already learned.\n\n"
    "RULES:\n"
    "1. VARY your format every time. Do NOT repeat the same structure. Mix these styles:\n"
    "   - Start with a surprising fact, then explain why\n"
    "   - Use a story or scenario to illustrate the concept\n"
    "   - Compare and contrast with something they already explored\n"
    "   - Ask a rhetorical question, then answer it\n"
    "   - Use a 'what if' thought experiment\n"
    "2. Use 3-5 bullet points with • markers, each 1-2 sentences.\n"
    "3. Bold the most important terms using **term** markdown.\n"
    "4. ALWAYS reference what they previously explored when relevant — "
    "e.g. 'Remember when we talked about X? This connects because...'\n"
    "5. Use simple, conversational language — like a smart friend explaining over coffee.\n"
    "6. End with ONE fresh insight or connection they probably didn't expect.\n"
    "7. NEVER start with 'Think of X like Y' — find a different, creative opening.\n"
    "8. If this is a deeper exploration of something mentioned before, explicitly say "
    "'Earlier we mentioned X — let's unpack that...'\n\n"
    "IMPORTANT: Every answer must feel unique. If the user is exploring depth 3+, "
    "reference the journey so far and how this new concept fits into the bigger picture."
)


def answer_agent_node(state: AlfredState) -> dict:
    history = list(state.get("conversation_history", []))
    query = state.get("user_query", "")
    depth = state.get("current_depth", 0)
    explored = state.get("explored_terms", [])

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include conversation history so the LLM knows what was already discussed
    messages.extend(history)

    # Build the user message with additional context signals
    user_msg = query
    if depth > 0 and explored:
        user_msg += (
            f"\n\n[Context: We are at depth {depth}. "
            f"Previously explored: {', '.join(explored)}. "
            f"Make sure your answer connects to this learning journey "
            f"and references what we discussed before.]"
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
