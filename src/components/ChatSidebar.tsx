'use client';

import React, { useMemo } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';

/* ─────── Progress Ring (inline SVG) ─────── */
function ProgressRing({ value, max, size = 48, strokeWidth = 4 }: {
    value: number; max: number; size?: number; strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = max > 0 ? Math.min(value / max, 1) : 0;
    const offset = circumference * (1 - percent);

    return (
        <svg width={size} height={size} className="progress-ring">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="url(#sidebarProgressGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
            />
            <defs>
                <linearGradient id="sidebarProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
            </defs>
            <text
                x="50%" y="50%" textAnchor="middle" dy="4"
                style={{ fontSize: '12px', fontWeight: 800, fill: '#0F172A', fontFamily: 'Inter' }}
            >
                {Math.round(percent * 100)}%
            </text>
        </svg>
    );
}

/* ─────── Main Component (inline panel, not modal) ─────── */
export default function ChatSidebar() {
    const {
        exploredTerms,
        currentDepth,
        conversationMessages,
    } = useSessionStore();
    const { profile, savedSessions, isLoggedIn, loadConversationData } = useUserStore();

    const handleLoadSession = (sessionId: string) => {
        loadConversationData(sessionId);
    };

    const totalConceptsEncountered = useMemo(() => {
        let count = 0;
        conversationMessages.forEach((m: any) => {
            if (m.concepts) count += m.concepts.length;
        });
        return Math.max(count, 1);
    }, [conversationMessages]);

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white/90 backdrop-blur">
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white"
                        style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-sky))', boxShadow: 'var(--shadow-glow-indigo)' }}
                    >
                        {isLoggedIn && profile ? profile.displayName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {isLoggedIn && profile ? profile.displayName : 'Alfred AI'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {isLoggedIn && profile ? `${profile.totalSessions} sessions` : 'Learning Engine'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Session Stats */}
            <div className="p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                    Session
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {/* Progress Ring */}
                    <div className="subtle-card p-3 flex flex-col items-center">
                        <ProgressRing value={exploredTerms.length} max={totalConceptsEncountered} />
                        <p className="text-[10px] font-semibold mt-1.5" style={{ color: 'var(--text-muted)' }}>Explored</p>
                    </div>
                    {/* Depth */}
                    <div className="subtle-card p-3 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black" style={{ color: 'var(--accent-indigo)' }}>{currentDepth}</div>
                        <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Depth</p>
                    </div>
                </div>
            </div>

            {/* Explored Concepts */}
            {exploredTerms.length > 0 && (
                <div className="px-4 pb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                        Explored ({exploredTerms.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {exploredTerms.map((term, i) => (
                            <span
                                key={i}
                                className="pill-soft text-[10px] font-semibold"
                            >
                                ✓ {term}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Past Sessions */}
            {savedSessions.length > 0 && (
                <div className="px-4 pb-3 flex-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                        History
                    </h3>
                    <div className="space-y-1.5">
                        {savedSessions.slice(0, 8).map((s) => (
                            <div
                                key={s.id}
                                className="subtle-card px-3 py-2 cursor-pointer hover:shadow-md transition"
                                onClick={() => handleLoadSession(s.id)}
                            >
                                <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {s.title}
                                </p>
                                <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Depth {s.depth} • {s.nodesExplored} concepts
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
