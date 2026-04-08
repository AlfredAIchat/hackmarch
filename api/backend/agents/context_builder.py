"""
Context Builder — Walks up the knowledge tree to build rich ancestor-chain prompts.
Includes previous answer summaries so the LLM can reference what was already discussed.
No LLM call — pure Python tree traversal.
"""

from backend.state import AlfredState


def _get_ancestor_chain(tree: dict, term: str) -> list[str]:
    """Walk up from term to root, returning [root, ..., parent, term]."""
    chain: list[str] = [term]
    current = term
    visited: set[str] = {term}
    while current in tree:
        parent = tree[current].get("parent")
        if not parent or parent in visited:
            break
        chain.append(parent)
        visited.add(parent)
        current = parent
    chain.reverse()
    return chain


def _build_journey_summary(tree: dict, explored: list[str]) -> str:
    """Build a brief summary of what was already learned from the tree."""
    summaries = []
    for term in explored[-5:]:  # Last 5 terms to keep context window manageable
        node = tree.get(term, {})
        answer = node.get("answer", "")
        if answer:
            # Take just the first 120 chars of each previous answer
            short = answer[:120].rsplit(" ", 1)[0] + "..."
            summaries.append(f"- {term}: {short}")
    return "\n".join(summaries)


def context_builder_node(state: AlfredState) -> dict:
    selected = state.get("selected_term", "")
    tree = state.get("knowledge_tree", {})

    # Always use root_question — never the overwritten user_query
    root_question = state.get("root_question") or state.get("user_query", "")
    explored = list(state.get("explored_terms", []))
    depth = state.get("current_depth", 0)

    if not selected:
        return {"user_query": root_question, "root_question": root_question}

    chain = _get_ancestor_chain(tree, selected)

    # Build journey summary from previous explorations
    journey = _build_journey_summary(tree, explored)

    # Build rich context prompt
    parts = [f'The learner originally asked: "{root_question}".']

    if len(chain) > 1:
        path_desc = " → ".join(chain)
        parts.append(f"Their exploration path: {path_desc}.")

    if journey:
        parts.append(f"Here's what they've learned so far:\n{journey}")

    parts.append(
        f"\nNow explain '{selected}' in a way that connects to everything above. "
        f"Reference their previous exploration. Don't repeat what was already said — "
        f"build on it. This is depth {depth + 1} of their learning journey."
    )

    context = "\n".join(parts)

    # Update explored terms
    if selected not in explored:
        explored.append(selected)

    return {
        "user_query": context,
        "root_question": root_question,  # Always preserve original
        "explored_terms": explored,
        "current_depth": depth + 1,
    }
