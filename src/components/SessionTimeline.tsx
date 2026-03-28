'use client';

import React from 'react';
import { useSessionStore } from '@/store/sessionStore';

export default function SessionTimeline() {
    const timeline = useSessionStore((s) => s.timeline);

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Journey
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {timeline.length === 0 ? (
                    <p className="text-xs text-gray-600 italic">
                        Your learning journey will appear here…
                    </p>
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-gray-800" />

                        <div className="space-y-3">
                            {timeline.map((entry, i) => {
                                const isQuery = entry.type === 'query';
                                return (
                                    <div key={i} className="flex items-start gap-3 relative">
                                        {/* Dot */}
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 text-xs
                        ${isQuery
                                                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                                                    : 'bg-purple-500/20 border border-purple-500 text-purple-400'
                                                }`}
                                        >
                                            {isQuery ? '?' : entry.depth}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 pt-0.5">
                                            <p
                                                className={`text-xs leading-relaxed ${isQuery ? 'text-gray-300' : 'text-gray-400'
                                                    }`}
                                            >
                                                {entry.text.length > 60
                                                    ? entry.text.substring(0, 57) + '…'
                                                    : entry.text}
                                            </p>
                                            {!isQuery && (
                                                <span className="text-[10px] text-gray-600">
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
