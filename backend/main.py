"""
FastAPI server with SSE streaming for the Alfred AI pipeline.
"""

from __future__ import annotations

import json
import uuid
import asyncio
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from backend.graph import compiled_graph, build_graph, memory
from backend.agents.intent_guard import intent_guard_node
from backend.agents.answer_agent import answer_agent_node
from backend.agents.hallucination_checker import hallucination_checker_node
from backend.agents.concept_extractor import concept_extractor_node
from backend.agents.concept_validator import concept_validator_node
from backend.agents.context_builder import context_builder_node
from backend.agents.user_gate import user_gate_node
from backend.agents.quiz_agent import quiz_agent_node
from backend.agents.answer_evaluator import answer_evaluator_node
from backend.agents.report_agent import report_agent_node

app = FastAPI(title="Alfred AI Pipeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for state snapshots
sessions: dict[str, dict[str, Any]] = {}


class StartRequest(BaseModel):
    query: str
    session_id: str | None = None


class SelectTermRequest(BaseModel):
    session_id: str
    selected_term: str


class QuizSubmitRequest(BaseModel):
    session_id: str
    answers: list[int]


# ---------------------------------------------------------------------------
# SSE Helpers
# ---------------------------------------------------------------------------

def _sse_event(event_type: str, data: Any) -> str:
    payload = json.dumps({"type": event_type, "data": data})
    return f"data: {payload}\n\n"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/session/start")
async def start_session(req: StartRequest):
    session_id = req.session_id or str(uuid.uuid4())
    query = req.query.strip()

    if not query:
        raise HTTPException(400, "Query cannot be empty")

    initial_state = {
        "session_id": session_id,
        "user_query": query,
        "root_question": query,  # Preserved forever
        "current_answer": "",
        "concepts": [],
        "conversation_history": [],
        "knowledge_tree": {},
        "explored_terms": [],
        "current_depth": 0,
        "selected_term": "",
        "hallucination_flags": [],
        "retry_count": 0,
        "last_verdict": "",
        "quiz_questions": [],
        "quiz_answers": [],
        "quiz_score": 0.0,
        "final_report": "",
        "valid": True,
        "cleaned_query": query,
        "reject_reason": "",
    }

    config = {"configurable": {"thread_id": session_id}}

    async def event_stream():
        nonlocal initial_state
        yield _sse_event("session_started", {"session_id": session_id})

        try:
            loop = asyncio.get_event_loop()
            state = initial_state

            # 1. Intent Guard
            yield _sse_event("node_activated", {"node": "intent_guard", "status": "active"})
            r = await loop.run_in_executor(None, lambda: intent_guard_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "intent_guard", "status": "complete"})

            if not state.get("valid", True):
                yield _sse_event("rejected", {
                    "reason": state.get("reject_reason", "Invalid query"),
                })
                sessions[session_id] = dict(state)
                yield _sse_event("done", {"session_id": session_id})
                return

            # 2. Answer Agent
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "active"})
            r = await loop.run_in_executor(None, lambda: answer_agent_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "complete"})

            # 3. Hallucination Checker
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "active"})
            r = await loop.run_in_executor(None, lambda: hallucination_checker_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "complete"})

            # 4. Concept Extractor
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "active"})
            r = await loop.run_in_executor(None, lambda: concept_extractor_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "complete"})

            # 5. Concept Validator
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "active"})
            r = await loop.run_in_executor(None, lambda: concept_validator_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "complete"})

            # 6. User Gate
            yield _sse_event("node_activated", {"node": "user_gate", "status": "active"})
            r = await loop.run_in_executor(None, lambda: user_gate_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "user_gate", "status": "complete"})

            # Persist
            sessions[session_id] = dict(state)

            yield _sse_event("answer_ready", {
                "answer": state.get("current_answer", ""),
                "conversation_history": state.get("conversation_history", []),
                "depth": state.get("current_depth", 0),
            })
            yield _sse_event("concepts_ready", {
                "concepts": state.get("concepts", []),
            })
            yield _sse_event("tree_update", {
                "tree": state.get("knowledge_tree", {}),
            })

            yield _sse_event("done", {"session_id": session_id})

        except Exception as e:
            yield _sse_event("error", {"message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-Id": session_id,
        },
    )


@app.post("/session/select-term")
async def select_term(req: SelectTermRequest):
    session_id = req.session_id
    selected_term = req.selected_term.strip()

    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    prev_state = sessions[session_id]

    # Build the resume state
    state = dict(prev_state)
    state["selected_term"] = selected_term
    state["retry_count"] = 0
    state["last_verdict"] = ""
    state["valid"] = True  # Skip intent guard rejection on term clicks

    async def event_stream():
        nonlocal state
        try:
            loop = asyncio.get_event_loop()

            # 1. Context Builder — builds the query with root context
            yield _sse_event("node_activated", {"node": "context_builder", "status": "active"})
            ctx_result = await loop.run_in_executor(None, lambda: context_builder_node(state))
            state.update(ctx_result)
            yield _sse_event("node_activated", {"node": "context_builder", "status": "complete"})

            # 2. Answer Agent — generates the answer
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "active"})
            ans_result = await loop.run_in_executor(None, lambda: answer_agent_node(state))
            state.update(ans_result)
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "complete"})

            # 3. Hallucination Checker
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "active"})
            hal_result = await loop.run_in_executor(None, lambda: hallucination_checker_node(state))
            state.update(hal_result)
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "complete"})

            # 4. Concept Extractor
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "active"})
            ext_result = await loop.run_in_executor(None, lambda: concept_extractor_node(state))
            state.update(ext_result)
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "complete"})

            # 5. Concept Validator
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "active"})
            val_result = await loop.run_in_executor(None, lambda: concept_validator_node(state))
            state.update(val_result)
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "complete"})

            # 6. User Gate — updates knowledge tree
            yield _sse_event("node_activated", {"node": "user_gate", "status": "active"})
            gate_result = await loop.run_in_executor(None, lambda: user_gate_node(state))
            state.update(gate_result)
            yield _sse_event("node_activated", {"node": "user_gate", "status": "complete"})

            # Persist updated state
            sessions[session_id] = dict(state)

            # Stream results
            yield _sse_event("answer_ready", {
                "answer": state.get("current_answer", ""),
                "conversation_history": state.get("conversation_history", []),
                "depth": state.get("current_depth", 0),
            })
            yield _sse_event("concepts_ready", {
                "concepts": state.get("concepts", []),
            })
            yield _sse_event("tree_update", {
                "tree": state.get("knowledge_tree", {}),
            })
            yield _sse_event("done", {"session_id": session_id})

        except Exception as e:
            yield _sse_event("error", {"message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.post("/session/quiz")
async def trigger_quiz(req: dict):
    session_id = req.get("session_id", "")
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    state = sessions[session_id]
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: quiz_agent_node(state))
    state.update(result)
    sessions[session_id] = state

    return {"quiz_questions": state.get("quiz_questions", [])}


@app.post("/session/submit-quiz")
async def submit_quiz(req: QuizSubmitRequest):
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")

    state = sessions[req.session_id]
    state["quiz_answers"] = req.answers

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: answer_evaluator_node(state))
    state.update(result)
    sessions[req.session_id] = state

    # quiz_answers holds the evaluated results after answer_evaluator runs
    return {
        "quiz_score": state.get("quiz_score", 0),
        "results": state.get("quiz_answers", []),  # answer_evaluator writes results here
    }


@app.get("/session/report/{session_id}")
async def get_report(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    state = sessions[session_id]

    if not state.get("final_report"):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: report_agent_node(state))
        state.update(result)
        sessions[session_id] = state

    return {"report": state.get("final_report", "")}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Alfred AI Pipeline"}
