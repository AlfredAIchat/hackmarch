'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore, type ConceptItem } from '@/store/sessionStore';

/* ─────── Concept Pill ─────── */
function ConceptPill({
    concept,
    onClick,
    explored,
}: {
    concept: ConceptItem;
    onClick: (term: string) => void;
    explored: boolean;
}) {
    const tierClass =
        concept.relevance_score >= 0.7
            ? 'tier-critical'
            : concept.relevance_score >= 0.4
                ? 'tier-important'
                : 'tier-useful';

    const mustLearn = concept.must_learn && !explored;
    const difficultyIcon =
        concept.difficulty === 1 ? '🟢' : concept.difficulty === 2 ? '🔵' : '🟣';
    const tierLabel =
        concept.tier || (concept.difficulty === 1 ? 'Foundation' : concept.difficulty === 2 ? 'Intermediate' : 'Advanced');

    return (
        <div className="tooltip-container inline-block">
            <button
                onClick={() => !explored && onClick(concept.term)}
                disabled={explored}
                className={`concept-pill ${tierClass} ${mustLearn ? 'must-learn' : ''} ${explored ? 'explored' : ''}`}
            >
                <span className="text-xs">{difficultyIcon}</span>
                <span>{concept.term}</span>
                {mustLearn && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff' }}>
                        !
                    </span>
                )}
                {explored && <span className="text-[10px] opacity-60">✓</span>}
            </button>
            {concept.why_important && !explored && (
                <div className="tooltip">
                    <div className="font-semibold mb-1 text-xs" style={{ color: '#A5B4FC' }}>
                        {mustLearn ? '⚡ Must Learn' : '💡 Why it matters'}
                    </div>
                    {concept.why_important}
                    <div className="mt-1 text-[10px] opacity-60">
                        {tierLabel} • Score: {Math.round(concept.relevance_score * 100)}%
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────── User Bubble ─────── */
function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end mb-6 animate-slide-up">
            <div
                className="max-w-[75%] px-5 py-3 rounded-2xl rounded-br-md text-sm font-medium text-white"
                style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                }}
            >
                {content}
            </div>
        </div>
    );
}

/* ─────── Assistant Bubble ─────── */
function AssistantBubble({
    content,
    concepts,
    onConceptClick,
    exploredTerms,
    isLatest,
}: {
    content: string;
    concepts: ConceptItem[];
    onConceptClick: (term: string) => void;
    exploredTerms: string[];
    isLatest: boolean;
}) {
    const exploredSet = new Set(exploredTerms.map((t) => t.toLowerCase()));

    // Split into must-learn and other
    const mustLearnConcepts = concepts.filter(c => c.must_learn && !exploredSet.has(c.term.toLowerCase()));
    const otherConcepts = concepts.filter(c => !c.must_learn || exploredSet.has(c.term.toLowerCase()));

    return (
        <div className="flex justify-start mb-6 animate-slide-up">
            <div className="max-w-[85%]">
                <div className="flex items-start gap-3">
                    <div
                        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                        A
                    </div>
                    <div
                        className="glass-card px-5 py-4"
                        style={{ borderRadius: '16px 16px 16px 4px' }}
                    >
                        {/* Markdown content */}
                        <div className="prose-light text-sm leading-relaxed">
                            <ReactMarkdown
                                components={{
                                    strong: ({ children }) => {
                                        const text = String(children);
                                        const matchedConcept = concepts.find(
                                            (c) => c.term.toLowerCase() === text.toLowerCase()
                                        );
                                        if (matchedConcept) {
                                            const isExplored = exploredSet.has(text.toLowerCase());
                                            const scoreColor =
                                                matchedConcept.relevance_score >= 0.7
                                                    ? '#6366F1'
                                                    : matchedConcept.relevance_score >= 0.4
                                                        ? '#10B981'
                                                        : '#F59E0B';
                                            return (
                                                <span
                                                    style={{
                                                        color: scoreColor,
                                                        fontWeight: 700,
                                                        textDecoration: isExplored ? 'line-through' : 'none',
                                                        opacity: isExplored ? 0.5 : 1,
                                                        cursor: isExplored ? 'default' : 'pointer',
                                                        borderBottom: isExplored ? 'none' : `2px solid ${scoreColor}30`,
                                                        paddingBottom: '1px',
                                                    }}
                                                    onClick={() => !isExplored && onConceptClick(matchedConcept.term)}
                                                >
                                                    {children}
                                                    {matchedConcept.must_learn && !isExplored && (
                                                        <span style={{
                                                            fontSize: '9px',
                                                            verticalAlign: 'super',
                                                            marginLeft: '2px',
                                                            color: '#6366F1',
                                                        }}>★</span>
                                                    )}
                                                </span>
                                            );
                                        }
                                        return <strong style={{ color: '#0F172A', fontWeight: 700 }}>{children}</strong>;
                                    },
                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1 list-disc">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1 list-decimal">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>

                        {/* Concept Pills */}
                        {concepts.length > 0 && isLatest && (
                            <div className="mt-5 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                                {mustLearnConcepts.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold" style={{ color: '#6366F1' }}>
                                                ⚡ Must Learn
                                            </span>
                                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #6366F120, transparent)' }} />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {mustLearnConcepts.map((c, i) => (
                                                <ConceptPill
                                                    key={`ml-${i}`}
                                                    concept={c}
                                                    onClick={onConceptClick}
                                                    explored={exploredSet.has(c.term.toLowerCase())}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {otherConcepts.length > 0 && (
                                    <div>
                                        {mustLearnConcepts.length > 0 && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                                                    Explore Further
                                                </span>
                                                <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {otherConcepts.map((c, i) => (
                                                <ConceptPill
                                                    key={`oc-${i}`}
                                                    concept={c}
                                                    onClick={onConceptClick}
                                                    explored={exploredSet.has(c.term.toLowerCase())}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────── Main Panel ─────── */
export default function AnswerPanel({
    onConceptClick,
}: {
    onConceptClick: (term: string) => void;
}) {
    const { conversationMessages, exploredTerms, isStreaming } = useSessionStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationMessages, isStreaming]);

    if (conversationMessages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                            border: '2px solid #C7D2FE',
                        }}>
                        <span className="text-4xl">🧠</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>
                        Start Your Learning Journey
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: '#94A3B8' }}>
                        Ask any question and Alfred AI will create a personalized learning path.
                        Click on <span style={{ color: '#6366F1', fontWeight: 600 }}>highlighted concepts</span> to dive deeper.
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {['🔬 How does DNA replication work?',
                            '🌌 What is quantum entanglement?',
                            '🧮 Explain neural networks'].map((q, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-full text-xs font-medium"
                                style={{ background: '#F3F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                                {q}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
            {conversationMessages.map((msg, idx) =>
                msg.role === 'user' ? (
                    <UserBubble key={`u-${idx}`} content={msg.content} />
                ) : (
                    <AssistantBubble
                        key={`a-${idx}`}
                        content={msg.content}
                        concepts={msg.concepts || []}
                        onConceptClick={onConceptClick}
                        exploredTerms={exploredTerms}
                        isLatest={idx === conversationMessages.length - 1}
                    />
                )
            )}

            {/* Streaming indicator */}
            {isStreaming && (
                <div className="flex justify-start mb-6 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div
                            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                        >
                            A
                        </div>
                        <div className="glass-card px-5 py-4 flex items-center gap-2" style={{ borderRadius: '16px 16px 16px 4px' }}>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: '#6366F1',
                                            animation: `flowPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                                Alfred is thinking...
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
