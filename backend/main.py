"""
FastAPI server with SSE streaming for the Alfred AI pipeline.
"""

from __future__ import annotations

import io
import json
import uuid
import asyncio
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
from backend.llm import chat

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
# Relatedness check — determines if a new query continues the current topic
# ---------------------------------------------------------------------------

def _check_relatedness(query: str, state: dict) -> bool:
    """Ask the LLM if the new query is related to the ongoing conversation."""
    root = state.get("root_question", "")
    explored = state.get("explored_terms", [])
    last_answer = state.get("current_answer", "")

    if not root and not explored:
        return False

    context = f"Original question: {root}\n"
    if explored:
        context += f"Topics explored so far: {', '.join(explored[-8:])}\n"
    if last_answer:
        context += f"Last answer snippet: {last_answer[:200]}\n"

    prompt = (
        f"{context}\n"
        f"New user query: {query}\n\n"
        "Is this new query related to the ongoing conversation (same general topic, "
        "a follow-up, or asking about something mentioned in the answers)? "
        'Reply with ONLY "yes" or "no".'
    )

    try:
        result = chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        return result.strip().lower().startswith("yes")
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/session/start")
async def start_session(req: StartRequest):
    session_id = req.session_id or str(uuid.uuid4())
    query = req.query.strip()

    if not query:
        raise HTTPException(400, "Query cannot be empty")

    # Check if this is a follow-up question to an existing session
    existing_state = sessions.get(session_id)
    is_continuation = False

    if existing_state and existing_state.get("root_question"):
        # Check if the new query is related to the ongoing topic
        loop = asyncio.get_event_loop()
        is_related = await loop.run_in_executor(
            None, lambda: _check_relatedness(query, existing_state)
        )

        if is_related:
            is_continuation = True
            # Continue from existing state — increment depth
            state = dict(existing_state)
            state["user_query"] = query
            state["current_depth"] = state.get("current_depth", 0) + 1
            state["selected_term"] = ""
            state["file_context"] = state.get("file_context", "")
        else:
            # Completely new topic — reset everything
            state = _make_fresh_state(session_id, query)
    else:
        # First question in this session
        state = _make_fresh_state(session_id, query)

    config = {"configurable": {"thread_id": session_id}}

    async def event_stream():
        nonlocal state
        yield _sse_event("session_started", {
            "session_id": session_id,
            "is_continuation": is_continuation,
        })

        try:
            loop = asyncio.get_event_loop()

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

            # 2. Context Builder (if continuation)
            if is_continuation:
                yield _sse_event("node_activated", {"node": "context_builder", "status": "active"})
                r = await loop.run_in_executor(None, lambda: context_builder_node(state))
                state.update(r)
                yield _sse_event("node_activated", {"node": "context_builder", "status": "complete"})

            # 3. Answer Agent
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "active"})
            r = await loop.run_in_executor(None, lambda: answer_agent_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "answer_agent", "status": "complete"})

            # 4. Hallucination Checker
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "active"})
            r = await loop.run_in_executor(None, lambda: hallucination_checker_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "hallucination_checker", "status": "complete"})

            # 5. Concept Extractor
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "active"})
            r = await loop.run_in_executor(None, lambda: concept_extractor_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "concept_extractor", "status": "complete"})

            # 6. Concept Validator
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "active"})
            r = await loop.run_in_executor(None, lambda: concept_validator_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "concept_validator", "status": "complete"})

            # 7. User Gate
            yield _sse_event("node_activated", {"node": "user_gate", "status": "active"})
            r = await loop.run_in_executor(None, lambda: user_gate_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "user_gate", "status": "complete"})

            # Add to explored terms
            explored = list(state.get("explored_terms", []))
            short_query = query[:60]
            if short_query not in explored:
                explored.append(short_query)
            state["explored_terms"] = explored

            # Persist
            sessions[session_id] = dict(state)

            yield _sse_event("answer_ready", {
                "answer": state.get("current_answer", ""),
                "conversation_history": state.get("conversation_history", []),
                "depth": state.get("current_depth", 0),
                "is_continuation": is_continuation,
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


def _make_fresh_state(session_id: str, query: str) -> dict:
    """Create a fresh initial state for a new session/topic."""
    return {
        "session_id": session_id,
        "user_query": query,
        "root_question": query,
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
        "file_context": "",
    }


@app.post("/session/select-term")
async def select_term(req: SelectTermRequest):
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")

    state = dict(sessions[req.session_id])

    state["selected_term"] = req.selected_term
    state["user_query"] = req.selected_term
    state["current_depth"] = state.get("current_depth", 0) + 1
    session_id = req.session_id

    async def event_stream():
        nonlocal state
        try:
            loop = asyncio.get_event_loop()

            # 1. Context Builder
            yield _sse_event("node_activated", {"node": "context_builder", "status": "active"})
            r = await loop.run_in_executor(None, lambda: context_builder_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "context_builder", "status": "complete"})

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

            # 6. User Gate (updates knowledge tree)
            yield _sse_event("node_activated", {"node": "user_gate", "status": "active"})
            r = await loop.run_in_executor(None, lambda: user_gate_node(state))
            state.update(r)
            yield _sse_event("node_activated", {"node": "user_gate", "status": "complete"})

            # Track explored terms
            explored = list(state.get("explored_terms", []))
            if req.selected_term not in explored:
                explored.append(req.selected_term)
            state["explored_terms"] = explored

            # Persist
            sessions[session_id] = dict(state)

            yield _sse_event("answer_ready", {
                "answer": state.get("current_answer", ""),
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
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: quiz_agent_node(state))
        state.update(result)
        sessions[session_id] = state
    except Exception as e:
        return {"quiz_questions": [], "error": str(e)}

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

    return {
        "quiz_score": state.get("quiz_score", 0),
        "results": state.get("quiz_answers", []),
    }


# ---------------------------------------------------------------------------
# File Upload Endpoint
# ---------------------------------------------------------------------------

@app.post("/session/upload")
async def upload_file(
    file: UploadFile = File(...),
    session_id: str = Form(""),
    query: str = Form(""),
):
    """Handle file upload — extract text from PDF, images, or text files."""
    content_bytes = await file.read()
    extracted_text = ""
    filename = file.filename or "unknown"

    # Get or create session
    if session_id and session_id in sessions:
        state = sessions[session_id]
    else:
        session_id = session_id or str(uuid.uuid4())
        state = _make_fresh_state(session_id, query or f"Analyze {filename}")

    # Extract text based on file type
    if filename.lower().endswith(".pdf"):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            pages = []
            for page in reader.pages[:20]:  # Max 20 pages
                text = page.extract_text()
                if text:
                    pages.append(text)
            extracted_text = "\n\n".join(pages)
        except ImportError:
            extracted_text = "[PDF parsing requires PyPDF2. Install with: pip install PyPDF2]"
        except Exception as e:
            extracted_text = f"[Error reading PDF: {str(e)}]"

    elif filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        import base64
        b64 = base64.b64encode(content_bytes).decode()
        # Use LLM to describe the image
        try:
            description = chat(
                messages=[{
                    "role": "user",
                    "content": f"Describe this image in detail. The image is base64 encoded: data:image/{filename.split('.')[-1]};base64,{b64[:1000]}... [truncated for context]"
                }],
                temperature=0.3,
            )
            extracted_text = f"[Image: {filename}]\n{description}"
        except Exception:
            extracted_text = f"[Image uploaded: {filename} — image analysis not available]"

    elif filename.lower().endswith((".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".html", ".css")):
        try:
            extracted_text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = content_bytes.decode("latin-1")

    else:
        try:
            extracted_text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = f"[Binary file uploaded: {filename} — cannot extract text]"

    # Truncate to avoid token limits
    if len(extracted_text) > 5000:
        extracted_text = extracted_text[:5000] + "\n\n[... content truncated for brevity ...]"

    # Store in session
    state["file_context"] = extracted_text
    if query:
        state["user_query"] = query
    sessions[session_id] = state

    return {
        "session_id": session_id,
        "filename": filename,
        "extracted_length": len(extracted_text),
        "preview": extracted_text[:300],
    }


@app.get("/session/report/{session_id}")
async def get_report(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    state = sessions[session_id]
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: report_agent_node(state))
    state.update(result)
    sessions[session_id] = state

    return {"report": state.get("final_report", "")}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Alfred AI Pipeline"}
