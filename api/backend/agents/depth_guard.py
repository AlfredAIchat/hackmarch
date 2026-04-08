"""
Depth Guard — No longer enforces a hard limit.
The user can explore as deep as they want.
This node just tracks depth for display purposes.
"""

from backend.state import AlfredState


def depth_guard_node(state: AlfredState) -> dict:
    """Passthrough — always allows deeper exploration."""
    return {}
