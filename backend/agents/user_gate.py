"""
User Gate — Interrupt node for user term selection.
Updates the knowledge tree with PROPER branching structure.
"""

from backend.state import AlfredState


def user_gate_node(state: AlfredState) -> dict:
    """Update the knowledge tree with the current answer/concepts — branching, not linear."""
    tree = dict(state.get("knowledge_tree", {}))
    query = state.get("user_query", "")
    answer = state.get("current_answer", "")
    concepts = state.get("concepts", [])
    depth = state.get("current_depth", 0)
    selected = state.get("selected_term", "")

    # Determine key and parent
    term_key = selected if selected else query[:60]

    # Find the parent — it's the PREVIOUS selected term (the one that led here)
    explored = list(state.get("explored_terms", []))
    parent = explored[-1] if explored and selected else None

    child_terms = [c.get("term", "") for c in concepts if isinstance(c, dict)]

    if term_key not in tree:
        tree[term_key] = {
            "parent": parent,
            "answer": answer,
            "children": child_terms,
            "depth": depth,
        }
    else:
        # Update children if re-visiting
        existing_children = tree[term_key].get("children", [])
        for c in child_terms:
            if c not in existing_children:
                existing_children.append(c)
        tree[term_key]["children"] = existing_children

    # Also ensure parent knows about this child
    if parent and parent in tree:
        parent_children = tree[parent].get("children", [])
        if term_key not in parent_children:
            parent_children.append(term_key)
        tree[parent]["children"] = parent_children

    return {
        "knowledge_tree": tree,
    }
