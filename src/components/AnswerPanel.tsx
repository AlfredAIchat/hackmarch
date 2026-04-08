'use client';

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore, ConceptItem, ConversationMessage } from '@/store/sessionStore';

/* ─────── Concept Pill ─────── */
function ConceptPill({ concept, onClick, delay }: {
    concept: ConceptItem;
    onClick: () => void;
    delay: number;
}) {
    const colorClass = concept.must_learn ? 'concept-pill--must-learn' :
        concept.color === 'green' ? 'concept-pill--green' :
        concept.color === 'yellow' ? 'concept-pill--yellow' :
        'concept-pill--orange';

    return (
        <div className="tooltip-wrapper inline-block"
            style={{ animation: `pill-enter 0.3s ${delay}ms var(--ease-spring) forwards`, opacity: 0 }}>
            <button
                onClick={onClick}
                className={`concept-pill ${colorClass}`}
            >
                {concept.must_learn && <span className="text-xs">🔥</span>}
                {concept.term}
                {concept.relevance_score >= 0.7 && !concept.must_learn && (
                    <span className="text-[10px] opacity-60">★</span>
                )}
            </button>
            {concept.why_important && (
                <div className="tooltip-content">
                    {concept.why_important}
                    {concept.tier && (
                        <span className="block mt-1 opacity-70 text-[10px]">{concept.tier} concept</span>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────── Message Bubble ─────── */
function MessageBubble({ msg, onConceptClick }: {
    msg: ConversationMessage;
    onConceptClick: (term: string) => void;
}) {
    const isUser = msg.role === 'user';

    if (isUser) {
        return (
            <div className="flex justify-end mb-4 animate-slide-up">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm font-medium text-white"
                    style={{
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                    }}>
                    {msg.content}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-5 animate-slide-up">
            {/* Depth badge */}
            {msg.depth > 0 && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                        Depth {msg.depth}
                    </span>
                </div>
            )}

            {/* Answer content */}
            <div className="rounded-2xl rounded-tl-md px-5 py-4"
                style={{
                    background: '#FAFBFD',
                    border: '1px solid #E2E8F0',
                }}>
                <div className="prose-light text-sm">
                    <ReactMarkdown
                        components={{
                            strong: ({ children }) => {
                                const text = String(children);
                                return (
                                    <strong
                                        onClick={() => onConceptClick(text)}
                                        className="cursor-pointer"
                                        style={{ color: '#6366F1', fontWeight: 700 }}
                                    >
                                        {children}
                                    </strong>
                                );
                            },
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Concept Pills */}
            {msg.concepts && msg.concepts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pl-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest py-1 mr-1"
                        style={{ color: '#94A3B8' }}>
                        Explore →
                    </span>
                    {msg.concepts.map((c, i) => (
                        <ConceptPill
                            key={c.term}
                            concept={c}
                            onClick={() => onConceptClick(c.term)}
                            delay={i * 80}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────── Empty State ─────── */
function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                }}>
                <span className="text-3xl">🧠</span>
            </div>
            <div className="text-center">
                <h3 className="text-base font-bold mb-1" style={{ color: '#0F172A' }}>
                    Ask anything to start
                </h3>
                <p className="text-xs leading-relaxed max-w-[260px]" style={{ color: '#94A3B8' }}>
                    Type a question below. Alfred will explain it and extract
                    key concepts for you to explore deeper.
                </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Quantum Computing', 'Machine Learning', 'Blockchain'].map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                        style={{ background: '#F3F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─────── Loading Indicator ─────── */
function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-3 mb-4 pl-1 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tl-md"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                        <div key={d} className="w-2 h-2 rounded-full"
                            style={{
                                background: '#6366F1',
                                animation: `pulse-ring 1.2s ${d}ms ease-in-out infinite`,
                            }} />
                    ))}
                </div>
                <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                    Thinking…
                </span>
            </div>
        </div>
    );
}

/* ─────── Main Panel ─────── */
export default function AnswerPanel({ onConceptClick }: {
    onConceptClick: (term: string) => void;
}) {
    const { conversationMessages, isProcessing } = useSessionStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [conversationMessages, isProcessing]);

    if (conversationMessages.length === 0 && !isProcessing) {
        return <EmptyState />;
    }

    return (
        <div ref={containerRef} className="h-full overflow-y-auto px-5 py-4">
            {conversationMessages.map((msg, i) => (
                <MessageBubble
                    key={i}
                    msg={msg}
                    onConceptClick={onConceptClick}
                />
            ))}
            {isProcessing && <ThinkingIndicator />}
        </div>
    );
}
