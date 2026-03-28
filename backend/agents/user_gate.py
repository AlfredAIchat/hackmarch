"""
User Gate — Interrupt node for user term selection.
Updates the knowledge tree with PROPER branching structure.
Handles both term clicks AND typed follow-up questions.
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

    # Determine the key for this node
    term_key = selected if selected else query[:60]

    # Find the parent — for BOTH selected terms AND typed follow-up questions
    explored = list(state.get("explored_terms", []))
    
    if selected:
        # User clicked a concept pill — parent is the last explored term
        parent = explored[-1] if explored else None
    elif depth > 0 and explored:
        # User typed a follow-up question at depth > 0 — parent is the last explored term
        parent = explored[-1]
    else:
        # First question (depth 0) — no parent (this is a root node)
        parent = None

    child_terms = [c.get("term", "") for c in concepts if isinstance(c, dict)]

    if term_key not in tree:
        tree[term_key] = {
            "parent": parent,
            "answer": answer[:200],  # Truncate answer for tree storage
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
