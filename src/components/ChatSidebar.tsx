'use client';

import React from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore, SavedSession } from '@/store/userStore';

export default function ChatSidebar() {
    const { profile, savedSessions, logout, saveConversationData, loadConversationData, saveSessionToHistory } = useUserStore();
    const sessionStore = useSessionStore();

    const handleNewChat = () => {
        // Save current session if it has content
        if (sessionStore.sessionId && sessionStore.conversationMessages.length > 0) {
            const firstMsg = sessionStore.conversationMessages.find((m) => m.role === 'user');
            const saved: SavedSession = {
                id: sessionStore.sessionId,
                title: firstMsg?.content.slice(0, 50) || 'Untitled',
                createdAt: sessionStore.timeline[0]?.timestamp || Date.now(),
                lastUpdatedAt: Date.now(),
                depth: sessionStore.currentDepth,
                nodesExplored: Object.keys(sessionStore.rawTree).length,
                quizScore: sessionStore.quizScore,
            };
            saveSessionToHistory(saved);
            saveConversationData(sessionStore.sessionId);
        }
        sessionStore.resetSession();
    };

    const handleOpenSession = (session: SavedSession) => {
        // Save current session first
        if (sessionStore.sessionId && sessionStore.conversationMessages.length > 0) {
            const firstMsg = sessionStore.conversationMessages.find((m) => m.role === 'user');
            const saved: SavedSession = {
                id: sessionStore.sessionId,
                title: firstMsg?.content.slice(0, 50) || 'Untitled',
                createdAt: sessionStore.timeline[0]?.timestamp || Date.now(),
                lastUpdatedAt: Date.now(),
                depth: sessionStore.currentDepth,
                nodesExplored: Object.keys(sessionStore.rawTree).length,
                quizScore: sessionStore.quizScore,
            };
            saveSessionToHistory(saved);
            saveConversationData(sessionStore.sessionId);
        }

        // Load the clicked session
        const loaded = loadConversationData(session.id);
        if (!loaded) {
            // No saved conversation data — just set session ID
            sessionStore.resetSession();
            sessionStore.setSessionId(session.id);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0a14]">
            {/* New Chat Button */}
            <div className="p-3 shrink-0">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5
            bg-gray-800/50 border border-gray-700/80 rounded-xl
            text-gray-300 text-sm font-medium
            hover:bg-gray-700/50 hover:border-gray-600
            transition-all duration-200 group"
                >
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New conversation
                </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-2">
                {savedSessions.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-gray-600 text-xs">No previous conversations</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <div className="px-3 py-2">
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                                Recent
                            </span>
                        </div>
                        {savedSessions.slice(0, 20).map((session) => {
                            const isActive = sessionStore.sessionId === session.id;
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => handleOpenSession(session)}
                                    className={`w-full text-left px-3 py-2 rounded-lg
                      text-sm truncate transition-all duration-150
                      ${isActive
                                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
                                            : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
                                        }`}
                                >
                                    <div className="truncate text-[13px]">{session.title}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-600">
                                            depth {session.depth}
                                        </span>
                                        <span className="text-[10px] text-gray-700">·</span>
                                        <span className="text-[10px] text-gray-600">
                                            {session.nodesExplored} concepts
                                        </span>
                                        {session.quizScore !== null && (
                                            <>
                                                <span className="text-[10px] text-gray-700">·</span>
                                                <span className="text-[10px] text-cyan-600">
                                                    {Math.round(session.quizScore)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* User profile footer */}
            {profile && (
                <div className="shrink-0 p-3 border-t border-gray-800/60">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1 mb-3">
                        <div className="text-center p-1.5 rounded-lg bg-gray-900/50">
                            <div className="text-cyan-400 font-bold text-sm">{profile.totalSessions}</div>
                            <div className="text-gray-600 text-[9px] uppercase">Sessions</div>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-gray-900/50">
                            <div className="text-purple-400 font-bold text-sm">{profile.totalConcepts}</div>
                            <div className="text-gray-600 text-[9px] uppercase">Learned</div>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-gray-900/50">
                            <div className="text-pink-400 font-bold text-sm">
                                {profile.avgQuizScore > 0 ? `${Math.round(profile.avgQuizScore)}%` : '—'}
                            </div>
                            <div className="text-gray-600 text-[9px] uppercase">Score</div>
                        </div>
                    </div>

                    {/* User info + logout */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600
                flex items-center justify-center text-[11px] font-bold text-white">
                                {profile.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-400 text-xs truncate max-w-[100px]">
                                {profile.displayName}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
