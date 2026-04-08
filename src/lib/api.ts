/**
 * Alfred AI — API Client
 * All communication with the backend flows through Next.js API routes
 * which proxy to the FastAPI backend.
 *
 * Backend SSE format:  data: {"type": "<event>", "data": {<payload>}}\n\n
 */

const API_BASE = '/api';

/* ─────── Types ─────── */

export interface StartSessionParams {
    query: string;
    session_id: string;
    difficulty_level?: number;
    technicality_level?: number;
    answer_depth?: string;
    file_context?: string;
}

export interface SelectTermParams {
    session_id: string;
    term: string;
    difficulty_level?: number;
    technicality_level?: number;
    answer_depth?: string;
}

export interface QuizRequestParams {
    session_id: string;
    explored_terms?: string[];
}

export interface QuizSubmitParams {
    session_id: string;
    answers: number[];
}

/* ─────── SSE Stream Helpers ─────── */

export type SSEEventHandler = (event: string, data: any) => void;

/**
 * Parse and stream SSE events from the backend.
 * Backend sends: data: {"type": "event_name", "data": { ... }}\n\n
 * We unwrap the envelope and call onEvent(type, innerData).
 */
async function streamSSE(url: string, body: object, onEvent: SSEEventHandler): Promise<void> {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const errorText = await resp.text().catch(() => 'Unknown error');
        throw new Error(`API error ${resp.status}: ${errorText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const raw = line.slice(5).trim();
                if (!raw) continue;
                try {
                    const parsed = JSON.parse(raw);
                    // Backend wraps events in {"type": "...", "data": {...}}
                    if (parsed && typeof parsed.type === 'string') {
                        onEvent(parsed.type, parsed.data || parsed);
                    } else {
                        onEvent('message', parsed);
                    }
                } catch {
                    // Non-JSON data, pass as raw string
                    onEvent('message', raw);
                }
            }
        }
    }
}

/* ─────── API Functions ─────── */

export async function startSession(params: StartSessionParams, onEvent: SSEEventHandler): Promise<void> {
    return streamSSE(`${API_BASE}/session`, params, onEvent);
}

export async function selectTerm(params: SelectTermParams, onEvent: SSEEventHandler): Promise<void> {
    // Map frontend field names to backend field names
    const body = {
        session_id: params.session_id,
        selected_term: params.term,
        difficulty_level: params.difficulty_level,
        technicality_level: params.technicality_level,
        answer_depth: params.answer_depth,
    };
    return streamSSE(`${API_BASE}/select-term`, body, onEvent);
}

export async function requestQuiz(params: QuizRequestParams): Promise<{ questions: any[]; error?: string }> {
    const resp = await fetch(`${API_BASE}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await resp.json();
    if (!resp.ok) {
        return { questions: [], error: data.error || 'Failed to generate quiz' };
    }
    const questions = data.quiz_questions || data.questions || [];
    return { questions, error: data.error };
}

export async function submitQuiz(params: QuizSubmitParams): Promise<{ score: number; results: any[]; error?: string }> {
    const resp = await fetch(`${API_BASE}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await resp.json();
    if (!resp.ok) {
        return { score: 0, results: [], error: data.error || 'Failed to submit quiz' };
    }
    return {
        score: data.quiz_score ?? data.score ?? 0,
        results: data.quiz_answers ?? data.results ?? [],
        error: data.error,
    };
}

export async function uploadFile(file: File, sessionId?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('session_id', sessionId);
    const resp = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!resp.ok) throw new Error('Upload failed');
    return resp.json();
}
