'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSessionStore } from '@/store/sessionStore';

const PipelineView = dynamic(() => import('@/components/PipelineView'), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            Loading pipeline visualization…
        </div>
    ),
});

export default function PipelinePage() {
    const store = useSessionStore();
    const [mounted, setMounted] = useState(false);
    const [liveSessionId, setLiveSessionId] = useState('');
    const [liveDepth, setLiveDepth] = useState(0);
    const [liveQuery, setLiveQuery] = useState('');
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);

        // Poll localStorage for pipeline updates broadcast by the chat page (cross-tab sync)
        const poll = () => {
            try {
                const raw = localStorage.getItem('alfred_pipeline_state');
                if (!raw) return;
                const data = JSON.parse(raw);
                // Only apply if data is recent (within last 30 seconds)
                if (Date.now() - data.ts > 30000) return;

                // Apply node statuses to our local store
                if (data.nodes) {
                    data.nodes.forEach((n: { id: string; status: 'idle' | 'active' | 'complete' | 'error' }) => {
                        store.updatePipelineNode(n.id, n.status);
                    });
                }
                if (data.sessionId) setLiveSessionId(data.sessionId);
                if (data.depth !== undefined) setLiveDepth(data.depth);
                if (data.query) setLiveQuery(data.query);
            } catch { }
        };

        poll(); // initial
        pollRef.current = setInterval(poll, 400);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    if (!mounted) return null;

    const activeNodes = store.pipelineNodes.filter((n) => n.status === 'active').length;
    const completeNodes = store.pipelineNodes.filter((n) => n.status === 'complete').length;
    const totalNodes = store.pipelineNodes.length;

    return (
        <main className="h-screen w-screen bg-[#050510] text-gray-100 flex flex-col overflow-hidden">
            {/* Dramatic header */}
            <header className="h-16 border-b border-gray-800/40 flex items-center justify-between px-8 shrink-0
        bg-gradient-to-r from-[#050510] via-[#0a0a1a] to-[#050510]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600
            flex items-center justify-center text-lg font-black shadow-lg shadow-cyan-500/30
            animate-pulse">
                        A
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400
                bg-clip-text text-transparent">
                                Alfred AI Live Pipeline
                            </span>
                        </h1>
                        <p className="text-gray-600 text-xs">
                            Multi-Agent LangGraph Execution · Real-Time · 11 Nodes
                        </p>
                    </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-6">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${activeNodes > 0
                            ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse'
                            : liveSessionId
                                ? 'bg-cyan-400 shadow-lg shadow-cyan-400/30'
                                : 'bg-gray-600'
                            }`} />
                        <span className="text-xs font-mono text-gray-400">
                            {activeNodes > 0 ? 'PROCESSING' : liveSessionId ? 'READY' : 'WAITING'}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${totalNodes > 0 ? (completeNodes / totalNodes) * 100 : 0}%`,
                                    background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899)',
                                }}
                            />
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                            {completeNodes}/{totalNodes}
                        </span>
                    </div>

                    {/* Session info */}
                    {liveSessionId && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/60 border border-gray-800
              rounded-lg">
                            <span className="text-[10px] text-gray-500">SESSION</span>
                            <span className="text-xs font-mono text-cyan-400">
                                {liveSessionId.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-gray-700">·</span>
                            <span className="text-xs font-mono text-purple-400">
                                depth {liveDepth}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* Full-screen pipeline */}
            <div className="flex-1 overflow-hidden relative">
                <PipelineView />

                {/* Floating info cards */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
                    {/* Current query */}
                    {liveQuery && (
                        <div className="bg-gray-900/90 backdrop-blur-lg border border-gray-800/60
              rounded-xl px-4 py-3 max-w-md pointer-events-auto">
                            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Current Query</span>
                            <p className="text-sm text-gray-300 mt-1 truncate">{liveQuery}</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="bg-gray-900/90 backdrop-blur-lg border border-gray-800/60
            rounded-xl px-4 py-3 pointer-events-auto">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Node Status</span>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
                                <span className="text-[10px] text-gray-500">Idle</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400/50 animate-pulse" />
                                <span className="text-[10px] text-gray-500">Active</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-400/50" />
                                <span className="text-[10px] text-gray-500">Complete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="h-10 border-t border-gray-800/30 flex items-center justify-center
        bg-[#050510] text-gray-700 text-[10px] font-mono tracking-wider">
                LANGGRAPH · MISTRAL AI · FASTAPI · NEXT.JS · REAL-TIME SSE STREAMING
            </div>
        </main>
    );
}
