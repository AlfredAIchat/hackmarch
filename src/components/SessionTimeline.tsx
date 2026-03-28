'use client';

import React from 'react';
import { useSessionStore } from '@/store/sessionStore';

export default function SessionTimeline() {
    const timeline = useSessionStore((s) => s.timeline);

    return (
        <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
                        🗺️
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                        Journey
                    </h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <span className="text-2xl">📍</span>
                        <p className="text-xs text-center" style={{ color: '#94A3B8', maxWidth: 200 }}>
                            Your learning journey will appear here as you explore
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[11px] top-3 bottom-3 w-px"
                            style={{
                                background: 'linear-gradient(180deg, #6366F1, #8B5CF6, #E2E8F0)',
                            }} />

                        <div className="space-y-3">
                            {timeline.map((entry, i) => {
                                const isQuery = entry.type === 'query';
                                return (
                                    <div key={i} className="flex items-start gap-3 relative animate-slide-up"
                                        style={{ animationDelay: `${i * 50}ms` }}>
                                        {/* Dot */}
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 text-[10px] font-bold"
                                            style={{
                                                background: isQuery ? '#EEF2FF' : '#F5F3FF',
                                                border: `1.5px solid ${isQuery ? '#6366F1' : '#8B5CF6'}`,
                                                color: isQuery ? '#6366F1' : '#8B5CF6',
                                            }}
                                        >
                                            {isQuery ? '?' : entry.depth}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 pt-0.5">
                                            <p className="text-xs leading-relaxed font-medium"
                                                style={{ color: isQuery ? '#0F172A' : '#475569' }}>
                                                {entry.text.length > 60
                                                    ? entry.text.substring(0, 57) + '…'
                                                    : entry.text}
                                            </p>
                                            {!isQuery && (
                                                <span className="text-[9px] font-semibold mt-0.5 inline-block"
                                                    style={{ color: '#94A3B8' }}>
                                                    depth {entry.depth}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
