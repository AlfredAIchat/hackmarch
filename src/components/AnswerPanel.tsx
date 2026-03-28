'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore, ConceptItem, ConversationMessage } from '@/store/sessionStore';

// ── Colour helpers ──────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#4ade80' },
    yellow: { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#facc15' },
    orange: { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fb923c' },
};

// ── Shared "explore term" function ──────────────────────────────────────────
function useExploreTermHandler() {
    const store = useSessionStore();

    return useCallback(async (term: string) => {
        if (store.isLoading || !store.sessionId) return;

        store.setLoading(true);
        store.resetPipelineNodes();
        store.addUserMessage(`Tell me about "${term}"`);
        store.addTimelineEntry({ type: 'term', text: term, depth: store.currentDepth + 1, timestamp: Date.now() });

        // Broadcast reset to pipeline page
        try {
            localStorage.setItem('alfred_pipeline_state', JSON.stringify({
                reset: true, ts: Date.now(),
            }));
        } catch { }

        try {
            const resp = await fetch('/api/select-term', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: store.sessionId, selected_term: term }),
            });

            const reader = resp.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) return;

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const evt = JSON.parse(line.slice(6));
                        switch (evt.type) {
                            case 'node_activated':
                                store.updatePipelineNode(evt.data.node, evt.data.status);
                                // Broadcast to pipeline page via localStorage
                                try {
                                    localStorage.setItem('alfred_pipeline_state', JSON.stringify({
                                        nodes: useSessionStore.getState().pipelineNodes,
                                        sessionId: useSessionStore.getState().sessionId,
                                        depth: useSessionStore.getState().currentDepth,
                                        query: `Exploring: ${term}`,
                                        ts: Date.now(),
                                    }));
                                } catch { }
                                break;
                            case 'answer_ready':
                                store.addAssistantMessage(evt.data.answer, [], evt.data.depth ?? store.currentDepth + 1);
                                break;
                            case 'concepts_ready':
                                store.addConceptsToLastMessage(evt.data.concepts);
                                break;
                            case 'tree_update':
                                store.updateTree(evt.data.tree);
                                break;
                        }
                    } catch { }
                }
            }
        } catch (err: any) {
            store.setError(err.message);
        } finally {
            store.setLoading(false);
        }
    }, [store]);
}

// ── Concept Pill ─────────────────────────────────────────────────────────────
function ConceptPill({ concept, onExplore }: { concept: ConceptItem; onExplore: (term: string) => void }) {
    const isLoading = useSessionStore((s) => s.isLoading);
    // Dynamic color based on relevance_score
    const score = concept.relevance_score ?? 0.5;
    let colors;
    if (score >= 0.8) colors = { bg: 'rgba(34,197,94,0.15)', border: '#22c55e50', text: '#4ade80' };
    else if (score >= 0.5) colors = { bg: 'rgba(6,182,212,0.15)', border: '#06b6d450', text: '#22d3ee' };
    else colors = { bg: 'rgba(168,85,247,0.15)', border: '#a855f750', text: '#c084fc' };

    return (
        <button
            onClick={() => onExplore(concept.term)}
            disabled={isLoading}
            style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
        transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer
        disabled:opacity-50 disabled:cursor-wait"
            title={`Explore: ${concept.term} (relevance: ${Math.round(score * 100)}%)`}
        >
            <span className="text-[9px] opacity-60">→</span>
            {concept.term}
            <span className="text-[8px] opacity-40 ml-0.5">{Math.round(score * 100)}%</span>
        </button>
    );
}

// ── Inline clickable bold renderer ───────────────────────────────────────────
function makeStrongRenderer(
    conceptTerms: Set<string>,
    onExplore: (term: string) => void,
    isLoading: boolean
) {
    return function StrongNode({ children }: { children?: React.ReactNode }) {
        const text = String(children ?? '');

        // ALL bold text is clickable — explore any bolded term
        return (
            <button
                onClick={() => onExplore(text)}
                disabled={isLoading}
                className="text-cyan-300 font-bold underline decoration-dotted underline-offset-2
          hover:text-cyan-200 hover:bg-cyan-500/10 rounded px-0.5 cursor-pointer
          disabled:opacity-50 disabled:cursor-wait transition-colors"
                title={`Click to explore: ${text}`}
            >
                {children}
            </button>
        );
    };
}

// ── User bubble ──────────────────────────────────────────────────────────────
function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end mb-4">
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm
        bg-gradient-to-r from-cyan-600/30 to-purple-600/30
        border border-cyan-500/20 text-gray-200 text-sm leading-relaxed">
                {content}
            </div>
        </div>
    );
}

// ── Assistant bubble ─────────────────────────────────────────────────────────
function AssistantBubble({ message, onExplore }: { message: ConversationMessage; onExplore: (term: string) => void }) {
    const isLoading = useSessionStore((s) => s.isLoading);
    const concepts = message.concepts || [];

    // Build a set of concept term names for deduplication / inline matching
    const conceptTermSet = new Set(concepts.map((c) => c.term?.toLowerCase()));

    // Pills: deduplicate — only show concepts NOT already highlighted inline
    // We detect inline terms by scanning the raw markdown for **term** patterns
    const boldTermsInText = new Set<string>();
    const boldRegex = /\*\*(.+?)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = boldRegex.exec(message.content)) !== null) {
        boldTermsInText.add(m[1].toLowerCase());
    }
    const pillConcepts = concepts.filter((c) => {
        const tl = (c.term ?? '').toLowerCase();
        return !boldTermsInText.has(tl) && ![...boldTermsInText].some(bt => tl.includes(bt) || bt.includes(tl));
    }).sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0)).slice(0, 5);

    const strongRenderer = makeStrongRenderer(
        new Set(concepts.map((c) => (c.term ?? '').toLowerCase())),
        onExplore,
        isLoading
    );

    return (
        <div className="flex justify-start mb-5">
            <div className="max-w-[90%]">
                {/* Depth badge */}
                {message.depth !== undefined && (
                    <div className="mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold
              bg-purple-500/20 border border-purple-500/30 text-purple-400">
                            depth {message.depth}
                        </span>
                    </div>
                )}

                {/* Answer bubble with rendered markdown */}
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm
          bg-gray-800/60 border border-gray-700/50 text-gray-200
          prose prose-invert prose-sm max-w-none
          prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5
          prose-strong:text-cyan-300 prose-em:text-purple-300
          prose-li:marker:text-gray-500">
                    <ReactMarkdown
                        components={{
                            strong: strongRenderer as any,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* Concept pills — only non-duplicate ones */}
                {pillConcepts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-gray-600">Also explore:</span>
                        {pillConcepts.map((c, i) => (
                            <ConceptPill key={`${c.term}-${i}`} concept={c} onExplore={onExplore} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main panel ───────────────────────────────────────────────────────────────
export default function AnswerPanel() {
    const { conversationMessages, currentDepth, isLoading, error } = useSessionStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const exploreHandler = useExploreTermHandler();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversationMessages]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800/60 shrink-0">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Conversation
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600">Depth {currentDepth}</span>
                    <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${Math.min((currentDepth / 10) * 100, 100)}%`,
                                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
                {error && (
                    <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {conversationMessages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="text-5xl mb-4">🧠</div>
                        <h3 className="text-xl font-bold text-gray-300 mb-3">
                            Alfred AI — Your Learning Companion
                        </h3>
                        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                            Ask any question. Get a clear analogy and bullet points.
                            Click any <span className="text-cyan-300 underline decoration-dotted">highlighted term</span> or
                            pill to dive deeper — like a never-ending conversation with a brilliant friend.
                        </p>
                    </div>
                )}

                {conversationMessages.map((msg, i) =>
                    msg.role === 'user' ? (
                        <UserBubble key={i} content={msg.content} />
                    ) : (
                        <AssistantBubble key={i} message={msg} onExplore={exploreHandler} />
                    )
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 px-2 py-3">
                        <div className="flex gap-1">
                            {[0, 150, 300].map((delay) => (
                                <div
                                    key={delay}
                                    className="w-2 h-2 rounded-full animate-bounce"
                                    style={{
                                        animationDelay: `${delay}ms`,
                                        background: delay === 0 ? '#06b6d4' : delay === 150 ? '#8b5cf6' : '#ec4899',
                                    }}
                                />
                            ))}
                        </div>
                        <span className="text-gray-600 text-xs">Thinking…</span>
                    </div>
                )}
            </div>
        </div>
    );
}
