"""
Alfred AI State Schema — The brain of the pipeline.
Every LangGraph node reads and mutates this state.
"""

from __future__ import annotations

from typing import Any, Literal, TypedDict

from pydantic import BaseModel, Field


class ConceptItem(BaseModel):
    """A single extracted concept term with scoring metadata."""

    term: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    difficulty: int = Field(ge=1, le=3)
    color: Literal["green", "yellow", "orange"] = "green"
    explanation: str = ""


class AlfredState(TypedDict, total=False):
    """Full pipeline state flowing through every LangGraph node."""

    # Session
    session_id: str
    user_query: str
    root_question: str  # Always the original first question — never overwritten

    # Answer pipeline
    current_answer: str
    valid: bool
    cleaned_query: str
    reject_reason: str

    # Concepts
    concepts: list[dict[str, Any]]

    # Conversation memory
    conversation_history: list[dict[str, str]]

    # Knowledge tree — nested dict, key=term, value={parent, answer, children}
    knowledge_tree: dict[str, Any]
    explored_terms: list[str]
    current_depth: int
    selected_term: str

    # Hallucination checking
    hallucination_flags: list[str]
    retry_count: int
    last_verdict: str

    # Quiz
    quiz_questions: list[dict[str, Any]]
    quiz_answers: list[dict[str, Any]]
    quiz_score: float

    # Report
    final_report: str

    # File upload context
    file_context: str

    # User preferences for answer customization
    difficulty_level: int       # 1-10, default 5
    technicality_level: int    # 1-10, default 5
    answer_depth: str          # 'brief' | 'moderate' | 'detailed', default 'moderate'
