"""
LangGraph Pipeline — Wires all agent nodes with conditional edges.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from backend.state import AlfredState
from backend.agents.intent_guard import intent_guard_node
from backend.agents.answer_agent import answer_agent_node
from backend.agents.hallucination_checker import hallucination_checker_node
from backend.agents.concept_extractor import concept_extractor_node
from backend.agents.concept_validator import concept_validator_node
from backend.agents.context_builder import context_builder_node
from backend.agents.depth_guard import depth_guard_node
from backend.agents.user_gate import user_gate_node
from backend.agents.quiz_agent import quiz_agent_node
from backend.agents.answer_evaluator import answer_evaluator_node
from backend.agents.report_agent import report_agent_node


def _route_after_intent(state: AlfredState) -> str:
    if state.get("valid", False):
        return "answer_agent"
    return END


def _route_after_hallucination(state: AlfredState) -> str:
    verdict = state.get("last_verdict", "pass")
    retry = state.get("retry_count", 0)
    if verdict == "fail" and retry < 2:
        return "answer_agent"
    return "concept_extractor"


def _route_after_depth(state: AlfredState) -> str:
    # No depth limit — user controls when to stop
    return "context_builder"


def build_graph() -> StateGraph:
    graph = StateGraph(AlfredState)

    # Add all nodes
    graph.add_node("intent_guard", intent_guard_node)
    graph.add_node("answer_agent", answer_agent_node)
    graph.add_node("hallucination_checker", hallucination_checker_node)
    graph.add_node("concept_extractor", concept_extractor_node)
    graph.add_node("concept_validator", concept_validator_node)
    graph.add_node("user_gate", user_gate_node)
    graph.add_node("depth_guard", depth_guard_node)
    graph.add_node("context_builder", context_builder_node)
    graph.add_node("quiz_agent", quiz_agent_node)
    graph.add_node("answer_evaluator", answer_evaluator_node)
    graph.add_node("report_agent", report_agent_node)

    # Entry point
    graph.set_entry_point("intent_guard")

    # Edges
    graph.add_conditional_edges("intent_guard", _route_after_intent)
    graph.add_edge("answer_agent", "hallucination_checker")
    graph.add_conditional_edges("hallucination_checker", _route_after_hallucination)
    graph.add_edge("concept_extractor", "concept_validator")
    graph.add_edge("concept_validator", "user_gate")

    # After user gate — this is the interrupt/resume point
    graph.add_edge("user_gate", END)

    # Resume path: depth_guard → context_builder → answer_agent (recursive)
    graph.add_conditional_edges("depth_guard", _route_after_depth)
    graph.add_edge("context_builder", "answer_agent")

    # Quiz branches
    graph.add_edge("quiz_agent", END)
    graph.add_edge("answer_evaluator", END)

    # Report
    graph.add_edge("report_agent", END)

    return graph


# Pre-compiled graph with checkpointer for session persistence
memory = MemorySaver()
compiled_graph = build_graph().compile(checkpointer=memory)
