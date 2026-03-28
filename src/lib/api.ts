/**
 * Alfred AI Frontend API Contract
 * ─────────────────────────
 * All backend endpoints are defined here. If you change the backend URL structure,
 * update ONLY this file — the rest of the frontend will automatically use the new URLs.
 *
 * How to change frontend without breaking backend:
 * 1. All API calls in page.tsx, AnswerPanel.tsx, QuizModal.tsx, ReportView.tsx
 *    should import from here instead of hardcoding URLs.
 * 2. The Next.js API routes in /src/app/api/ proxy to BACKEND_BASE_URL below.
 * 3. To point to a different backend, change BACKEND_BASE_URL in .env.local:
 *    NEXT_PUBLIC_BACKEND_URL=http://your-backend.com
 */

const BACKEND_BASE_URL =
    (typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000')
        : process.env.BACKEND_URL ?? 'http://localhost:8000');

// ── Endpoint constants ──────────────────────────────────────────────────────

export const ENDPOINTS = {
    /** POST — start a new session and stream SSE events */
    SESSION_START: `${BACKEND_BASE_URL}/session/start`,
    /** POST — select a concept term and stream SSE events */
    SELECT_TERM: `${BACKEND_BASE_URL}/session/select-term`,
    /** POST — generate quiz questions for the session */
    QUIZ_GENERATE: `${BACKEND_BASE_URL}/session/quiz`,
    /** POST — submit quiz answers and get scored results */
    QUIZ_SUBMIT: `${BACKEND_BASE_URL}/session/submit-quiz`,
    /** GET  — generate and return a session learning report */
    REPORT: (sessionId: string) => `${BACKEND_BASE_URL}/session/report/${sessionId}`,
    /** POST — transcribe voice audio (Sarvam AI) */
    VOICE_TRANSCRIBE: `${BACKEND_BASE_URL}/voice/transcribe`,
    /** GET  — backend health check */
    HEALTH: `${BACKEND_BASE_URL}/health`,
} as const;

// ── Next.js proxy routes (avoid CORS in production) ──────────────────────────

export const PROXY = {
    /** POST — proxied session start SSE stream */
    SESSION: '/api/session',
    /** POST — proxied select-term SSE stream */
    SELECT_TERM: '/api/select-term',
    /** POST — proxied quiz generate + submit */
    QUIZ: '/api/quiz',
    /** POST — proxied voice transcription */
    VOICE: '/api/voice',
} as const;

// ── SSE Event types ───────────────────────────────────────────────────────────

export interface SSEEvent {
    type:
    | 'session_started'
    | 'node_activated'
    | 'answer_ready'
    | 'concepts_ready'
    | 'tree_update'
    | 'quiz_ready'
    | 'report_ready'
    | 'rejected'
    | 'error';
    data: Record<string, any>;
}

// ── Request types ──────────────────────────────────────────────────────────

export interface SessionStartRequest {
    query: string;
    session_id?: string;
}

export interface SelectTermRequest {
    session_id: string;
    selected_term: string;
}

export interface QuizGenerateRequest {
    session_id: string;
}

export interface QuizSubmitRequest {
    session_id: string;
    answers: number[];
}

// ── Response types ──────────────────────────────────────────────────────────

export interface QuizGenerateResponse {
    quiz_questions: Array<{
        question: string;
        options: string[];
        correct_index: number;
        concept: string;
    }>;
}

export interface QuizSubmitResponse {
    quiz_score: number;
    results: Array<{
        is_correct: boolean;
        explanation: string;
        concept_reinforced: string;
    }>;
}

export interface ReportResponse {
    report: string;
}

// ── Helper to parse SSE streams ─────────────────────────────────────────────

export async function* parseSSEStream(
    response: Response
): AsyncGenerator<SSEEvent> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
                yield JSON.parse(line.slice(6)) as SSEEvent;
            } catch {
                // Skip malformed events
            }
        }
    }
}
