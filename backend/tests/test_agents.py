"""
Comprehensive test suite for RUE backend agents and pipeline.
Run with: PYTHONPATH=$(pwd) backend/venv/bin/python -m pytest backend/tests/ -v
"""

import json
import pytest
import sys
import os

# Ensure the project root is in the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


# ──────────────────────────────────────────────
# 1. State Schema Tests
# ──────────────────────────────────────────────

class TestStateSchema:
    def test_concept_item_creation(self):
        from backend.state import ConceptItem
        item = ConceptItem(
            term="photosynthesis",
            relevance_score=0.85,
            difficulty=2,
            color="green",
            explanation="Process by which plants convert sunlight to energy.",
        )
        assert item.term == "photosynthesis"
        assert item.relevance_score == 0.85
        assert item.color == "green"

    def test_concept_item_validation(self):
        from backend.state import ConceptItem
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            ConceptItem(
                term="x",
                relevance_score=1.5,  # Out of 0-1 range — should fail
                difficulty=4,          # Out of 1-3 range — should fail
                color="green",
                explanation="test",
            )


# ──────────────────────────────────────────────
# 2. Concept Validator Tests (pure Python, no LLM)
# ──────────────────────────────────────────────

class TestConceptValidator:
    def test_deduplication(self):
        from backend.agents.concept_validator import concept_validator_node
        state = {
            "concepts": [
                {"term": "neural network", "relevance_score": 0.9, "difficulty": 2, "explanation": "..."},
                {"term": "Neural Network", "relevance_score": 0.7, "difficulty": 2, "explanation": "..."},
            ],
            "explored_terms": [],
        }
        result = concept_validator_node(state)
        terms = [c["term"] for c in result["concepts"]]
        # Should deduplicate case-insensitively, keeping first occurrence
        assert len(terms) == 1

    def test_cycle_prevention(self):
        from backend.agents.concept_validator import concept_validator_node
        state = {
            "concepts": [
                {"term": "chlorophyll", "relevance_score": 0.8, "difficulty": 2, "explanation": "..."},
                {"term": "photosynthesis", "relevance_score": 0.9, "difficulty": 3, "explanation": "..."},
            ],
            "explored_terms": ["chlorophyll"],
        }
        result = concept_validator_node(state)
        terms = [c["term"] for c in result["concepts"]]
        assert "chlorophyll" not in terms
        assert "photosynthesis" in terms

    def test_short_term_filtering(self):
        from backend.agents.concept_validator import concept_validator_node
        state = {
            "concepts": [
                {"term": "AI", "relevance_score": 0.9, "difficulty": 1, "explanation": "..."},
                {"term": "machine learning", "relevance_score": 0.8, "difficulty": 2, "explanation": "..."},
            ],
            "explored_terms": [],
        }
        result = concept_validator_node(state)
        terms = [c["term"] for c in result["concepts"]]
        assert "AI" not in terms  # Too short (< 4 chars)
        assert "machine learning" in terms

    def test_color_assignment(self):
        from backend.agents.concept_validator import concept_validator_node
        state = {
            "concepts": [
                {"term": "backpropagation", "relevance_score": 0.8, "difficulty": 3, "explanation": "..."},
                {"term": "gradient descent", "relevance_score": 0.5, "difficulty": 2, "explanation": "..."},
                {"term": "cost function", "relevance_score": 0.3, "difficulty": 1, "explanation": "..."},
            ],
            "explored_terms": [],
        }
        result = concept_validator_node(state)
        colors = {c["term"]: c["color"] for c in result["concepts"]}
        assert colors["backpropagation"] == "green"    # score >= 0.7
        assert colors["gradient descent"] == "yellow"  # 0.4 <= score < 0.7
        assert colors["cost function"] == "orange"     # score < 0.4

    def test_cap_at_six(self):
        from backend.agents.concept_validator import concept_validator_node
        concepts = [
            {"term": f"concept-{i:02d}-term", "relevance_score": 0.9 - i * 0.05, "difficulty": 2, "explanation": "..."}
            for i in range(10)
        ]
        state = {"concepts": concepts, "explored_terms": []}
        result = concept_validator_node(state)
        assert len(result["concepts"]) <= 6


# ──────────────────────────────────────────────
# 3. Depth Guard Tests
# ──────────────────────────────────────────────

class TestDepthGuard:
    def test_always_passes(self):
        """Depth guard no longer limits — user controls when to stop."""
        from backend.agents.depth_guard import depth_guard_node
        state = {"current_depth": 10, "explored_terms": ["a", "b", "c"]}
        result = depth_guard_node(state)
        assert result == {}  # Passthrough

    def test_zero_depth(self):
        from backend.agents.depth_guard import depth_guard_node
        state = {"current_depth": 0}
        result = depth_guard_node(state)
        assert result == {}


# ──────────────────────────────────────────────
# 4. Context Builder Tests
# ──────────────────────────────────────────────

class TestContextBuilder:
    def test_builds_ancestor_chain(self):
        from backend.agents.context_builder import context_builder_node
        state = {
            "selected_term": "gradient",
            "knowledge_tree": {
                "neural network": {"parent": None, "answer": "A ML model...", "children": ["backpropagation"]},
                "backpropagation": {"parent": "neural network", "answer": "Training algorithm...", "children": ["gradient"]},
                "gradient": {"parent": "backpropagation", "answer": "", "children": []},
            },
            "current_depth": 2,
            "explored_terms": ["neural network", "backpropagation"],
            "user_query": "Tell me about gradient",
        }
        result = context_builder_node(state)
        query = result.get("user_query", "")
        # The enriched prompt should reference ancestors
        assert "gradient" in query.lower()
        assert "backpropagation" in query.lower()
        assert "neural network" in query.lower()

    def test_handles_empty_tree(self):
        from backend.agents.context_builder import context_builder_node
        state = {
            "selected_term": "test",
            "knowledge_tree": {},
            "current_depth": 0,
            "explored_terms": [],
            "user_query": "What is test?",
        }
        result = context_builder_node(state)
        assert "user_query" in result
        assert result["current_depth"] == 1

    def test_increments_depth(self):
        from backend.agents.context_builder import context_builder_node
        state = {
            "selected_term": "gravity",
            "knowledge_tree": {},
            "current_depth": 3,
            "explored_terms": [],
            "user_query": "What is gravity?",
        }
        result = context_builder_node(state)
        assert result["current_depth"] == 4
        assert "gravity" in result["explored_terms"]


# ──────────────────────────────────────────────
# 5. User Gate Tests
# ──────────────────────────────────────────────

class TestUserGate:
    def test_adds_node_to_tree(self):
        from backend.agents.user_gate import user_gate_node
        state = {
            "user_query": "What is quantum computing?",
            "current_answer": "QC uses qubits...",
            "concepts": [
                {"term": "qubit"},
                {"term": "superposition"},
            ],
            "knowledge_tree": {},
            "current_depth": 0,
            "selected_term": "",
            "explored_terms": [],
        }
        result = user_gate_node(state)
        tree = result["knowledge_tree"]
        assert "What is quantum computing?" in tree
        node = tree["What is quantum computing?"]
        assert "qubit" in node["children"]
        assert "superposition" in node["children"]

    def test_branching_structure(self):
        """When a term is selected, it should set proper parent."""
        from backend.agents.user_gate import user_gate_node
        state = {
            "user_query": "What is qubit?",
            "current_answer": "A qubit is...",
            "concepts": [{"term": "entanglement"}, {"term": "decoherence"}],
            "knowledge_tree": {
                "quantum computing": {
                    "parent": None,
                    "answer": "QC...",
                    "children": ["qubit"],
                    "depth": 0,
                },
            },
            "current_depth": 1,
            "selected_term": "qubit",
            "explored_terms": ["quantum computing"],
        }
        result = user_gate_node(state)
        tree = result["knowledge_tree"]
        assert "qubit" in tree
        assert tree["qubit"]["parent"] == "quantum computing"
        assert "entanglement" in tree["qubit"]["children"]


# ──────────────────────────────────────────────
# 6. Graph Compilation Tests
# ──────────────────────────────────────────────

class TestGraphCompilation:
    def test_graph_compiles(self):
        from backend.graph import compiled_graph
        assert compiled_graph is not None

    def test_all_nodes_present(self):
        from backend.graph import compiled_graph
        nodes = list(compiled_graph.get_graph().nodes.keys())
        expected = [
            "intent_guard",
            "answer_agent",
            "hallucination_checker",
            "concept_extractor",
            "concept_validator",
            "user_gate",
            "depth_guard",
            "context_builder",
            "quiz_agent",
            "answer_evaluator",
            "report_agent",
        ]
        for name in expected:
            assert name in nodes, f"Missing node: {name}"

    def test_entry_point(self):
        from backend.graph import compiled_graph
        graph = compiled_graph.get_graph()
        # __start__ should connect to intent_guard
        start_edges = [e for e in graph.edges if e[0] == '__start__']
        assert len(start_edges) > 0
        assert start_edges[0][1] == 'intent_guard'


# ──────────────────────────────────────────────
# 7. FastAPI Endpoint Tests
# ──────────────────────────────────────────────

class TestFastAPIEndpoints:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from backend.main import app
        return TestClient(app)

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "Alfred AI Pipeline"

    def test_empty_query_rejected(self, client):
        resp = client.post("/session/start", json={"query": ""})
        assert resp.status_code == 400

    def test_whitespace_query_rejected(self, client):
        resp = client.post("/session/start", json={"query": "   "})
        assert resp.status_code == 400

    def test_session_not_found_select(self, client):
        resp = client.post(
            "/session/select-term",
            json={"session_id": "nonexistent", "selected_term": "test"},
        )
        assert resp.status_code == 404

    def test_session_not_found_quiz(self, client):
        resp = client.post(
            "/session/quiz",
            json={"session_id": "nonexistent"},
        )
        assert resp.status_code == 404

    def test_session_not_found_report(self, client):
        resp = client.get("/session/report/nonexistent")
        assert resp.status_code == 404


# ──────────────────────────────────────────────
# 8. SSE Event Format Tests
# ──────────────────────────────────────────────

class TestSSEFormat:
    def test_sse_event_helper(self):
        from backend.main import _sse_event
        result = _sse_event("test_type", {"key": "value"})
        assert result.startswith("data: ")
        assert result.endswith("\n\n")
        payload = json.loads(result.strip().replace("data: ", ""))
        assert payload["type"] == "test_type"
        assert payload["data"]["key"] == "value"

    def test_sse_session_start_stream(self):
        """Integration test: verify SSE stream produces expected event types."""
        from fastapi.testclient import TestClient
        from backend.main import app
        client = TestClient(app)

        # This will make a real LLM call — skip if no API key
        import os
        if not os.getenv("MISTRAL_API_KEY"):
            pytest.skip("No MISTRAL_API_KEY set")

        resp = client.post(
            "/session/start",
            json={"query": "What is gravity?"},
        )
        assert resp.status_code == 200

        # Parse SSE events
        event_types = []
        for line in resp.text.split("\n\n"):
            if line.startswith("data: "):
                try:
                    payload = json.loads(line[6:])
                    event_types.append(payload.get("type"))
                except json.JSONDecodeError:
                    pass

        assert "session_started" in event_types
        assert "node_activated" in event_types
