<p align="center">
  <img src="https://img.shields.io/badge/Alfred_AI-Recursive_Understanding_Engine-06b6d4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjwvc3ZnPg==" alt="Alfred AI">
</p>

<h1 align="center">🧠 Alfred AI</h1>
<h3 align="center">Your Intelligent Learning Companion</h3>

<p align="center">
  <strong>A multi-agent AI system that turns any question into a recursive, interactive knowledge exploration.</strong><br>
  Ask anything → get a clear explanation → click any concept → dive deeper → build a knowledge tree.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangGraph-Multi_Agent-8B5CF6?style=flat-square" alt="LangGraph">
  <img src="https://img.shields.io/badge/Mistral_AI-LLM-FF6B35?style=flat-square" alt="Mistral AI">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python" alt="Python">
</p>

---

## ✨ What is Alfred AI?

Alfred AI is a **recursive understanding engine** — a learning companion that doesn't just answer your question, it helps you build deep understanding by letting you explore any concept mentioned in the answer.

**How it works:**
1. 🎤 **Ask anything** (type or use voice input)
2. 🧠 **Get a clear, structured explanation** with highlighted key concepts
3. 🔗 **Click any highlighted term** to explore it deeper
4. 🌳 **Build a knowledge tree** as you explore — Alfred never forgets your original question
5. 📝 **Take a quiz** to test your understanding
6. 📊 **View the live pipeline** — watch 11 AI agents work in real-time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Chat UI  │  │Knowledge │  │ Pipeline │  │   Quiz   │    │
│  │          │  │   Tree   │  │   View   │  │  Modal   │    │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │              src/lib/api.ts (API Contract)           │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Next.js API Routes (Proxy Layer)           │   │
│  │  /api/session  /api/select-term  /api/quiz  /api/voice│   │
│  └────────────────────────┬─────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │ SSE Streaming
┌───────────────────────────┼──────────────────────────────────┐
│                    BACKEND (FastAPI + LangGraph)              │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────────┐   │
│  │              11 Agent Pipeline (LangGraph)             │   │
│  │                                                        │   │
│  │  Intent Guard → Answer Agent → Hallucination Checker   │   │
│  │       ↓                                                │   │
│  │  Concept Extractor → Concept Validator → User Gate     │   │
│  │       ↓                                                │   │
│  │  Depth Guard → Context Builder → (loop back)           │   │
│  │       ↓                                                │   │
│  │  Quiz Agent → Answer Evaluator                         │   │
│  │  Report Agent                                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  State: AlfredState (TypedDict) — root_question, tree, etc.  │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.9+**
- A **Mistral AI** API key ([get one free](https://console.mistral.ai/))
- *(Optional)* A **Sarvam AI** API key for voice input

### 1. Clone & Install

```bash
git clone https://github.com/AlfredAIchat/hackmarch.git
cd hackmarch

# Frontend
npm install

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

```bash
# Create backend/.env
cat > backend/.env << EOF
MISTRAL_API_KEY=your_mistral_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
EOF

# Create .env.local (frontend)
cat > .env.local << EOF
MISTRAL_API_KEY=your_mistral_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
BACKEND_URL=http://localhost:8000
EOF
```

### 3. Run

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 8000)
PYTHONPATH=$(pwd) backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  
Open [http://localhost:3000/pipeline](http://localhost:3000/pipeline) in a second tab to see live agent animations.

---

## 🧩 Key Features

| Feature | Description |
|---------|-------------|
| **Recursive Exploration** | Click any highlighted concept to dive deeper. Alfred builds a knowledge tree as you explore. |
| **Context Persistence** | Your original question is preserved at every depth level. Answers connect back to what you've already learned. |
| **11-Agent Pipeline** | Intent guard, answer generator, hallucination checker, concept extractor, validator, and more — all visible in real-time. |
| **Live Pipeline View** | Navigate to `/pipeline` to watch agents light up as they process your query. Edges animate cyan → green. |
| **Relevance-Scored Concepts** | Concept pills are color-coded by relevance: 🟢 green (≥80%), 🔵 cyan (≥50%), 🟣 purple (<50%). |
| **Adaptive Quiz** | Test your understanding with auto-generated quizzes. Get instant scoring and explanations. |
| **Voice Input** | Click the microphone and speak. Uses Sarvam AI for speech-to-text transcription. |
| **Knowledge Tree** | Toggle the sidebar to see your full exploration tree with parent-child relationships. |

---

## 📁 Project Structure

```
alfred/
├── src/                        # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx            # Main chat page
│   │   ├── login/page.tsx      # Login page
│   │   ├── pipeline/page.tsx   # Live pipeline visualization
│   │   └── api/                # API proxy routes
│   │       ├── session/route.ts
│   │       ├── select-term/route.ts
│   │       ├── quiz/route.ts
│   │       └── voice/route.ts
│   ├── components/
│   │   ├── AnswerPanel.tsx     # Chat bubbles with clickable concepts
│   │   ├── PipelineView.tsx    # ReactFlow pipeline visualization
│   │   ├── ChatSidebar.tsx     # Sidebar with history & stats
│   │   ├── KnowledgeTree.tsx   # Interactive knowledge tree
│   │   ├── QuizModal.tsx       # Quiz UI
│   │   └── VoiceInput.tsx      # Microphone input
│   ├── store/
│   │   ├── sessionStore.ts     # Zustand state management
│   │   └── userStore.ts        # User state
│   └── lib/
│       └── api.ts              # ⚡ API Contract — all endpoints defined here
│
├── backend/                    # Backend (FastAPI + LangGraph)
│   ├── main.py                 # FastAPI server with SSE streaming
│   ├── graph.py                # LangGraph pipeline definition
│   ├── state.py                # AlfredState schema
│   ├── llm.py                  # Mistral AI chat wrapper
│   ├── agents/                 # 11 agent node functions
│   │   ├── intent_guard.py
│   │   ├── answer_agent.py
│   │   ├── hallucination_checker.py
│   │   ├── concept_extractor.py
│   │   ├── concept_validator.py
│   │   ├── context_builder.py
│   │   ├── depth_guard.py
│   │   ├── user_gate.py
│   │   ├── quiz_agent.py
│   │   ├── answer_evaluator.py
│   │   └── report_agent.py
│   ├── tests/
│   │   └── test_agents.py      # 25 unit tests
│   └── requirements.txt
│
├── .env.local                  # Frontend env (gitignored)
├── backend/.env                # Backend env (gitignored)
└── README.md
```

---

## 🔌 Frontend API Contract

All backend endpoints are defined in **`src/lib/api.ts`**. This is the single source of truth for the frontend-backend contract.

**If you change the frontend, the backend won't break.** If you change the backend URL structure, update only `api.ts`.

```typescript
import { ENDPOINTS, PROXY } from '@/lib/api';

// Direct backend calls (for server-side)
ENDPOINTS.SESSION_START      // POST /session/start
ENDPOINTS.SELECT_TERM        // POST /session/select-term
ENDPOINTS.QUIZ_GENERATE      // POST /session/quiz
ENDPOINTS.QUIZ_SUBMIT        // POST /session/submit-quiz
ENDPOINTS.REPORT(sessionId)  // GET  /session/report/:id
ENDPOINTS.VOICE_TRANSCRIBE   // POST /voice/transcribe

// Proxy routes (for client-side, avoids CORS)
PROXY.SESSION                // /api/session
PROXY.SELECT_TERM            // /api/select-term
PROXY.QUIZ                   // /api/quiz
PROXY.VOICE                  // /api/voice
```

---

## 🧪 Testing

```bash
# Backend unit tests (25 tests)
PYTHONPATH=$(pwd) python -m pytest backend/tests/test_agents.py -v

# Frontend build check
npm run build
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript, React, Zustand, ReactFlow, react-markdown |
| **Backend** | FastAPI, Python 3.9+, LangGraph, SSE Streaming |
| **LLM** | Mistral AI (mistral-medium-latest) |
| **Voice** | Sarvam AI (speech-to-text) |
| **State** | In-memory sessions with LangGraph checkpointing |
| **Styling** | Tailwind CSS with custom dark theme |

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the love of learning</strong><br>
  <sub>Alfred AI — Because every question deserves a deeper answer.</sub>
</p>
