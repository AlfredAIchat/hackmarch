'use client';

import { create } from 'zustand';
import { useSessionStore } from './sessionStore';

export interface SavedSession {
    id: string;
    title: string;
    createdAt: number;
    lastUpdatedAt: number;
    depth: number;
    nodesExplored: number;
    quizScore: number | null;
}

export interface UserProfile {
    username: string;
    displayName: string;
    totalSessions: number;
    totalConcepts: number;
    avgQuizScore: number;
    joinedAt: number;
}

interface UserState {
    // Auth
    isLoggedIn: boolean;
    profile: UserProfile | null;

    // Session history
    savedSessions: SavedSession[];

    // Actions
    login: (username: string, displayName: string) => void;
    logout: () => void;
    loadFromStorage: () => void;
    saveSessionToHistory: (session: SavedSession) => void;
    saveConversationData: (sessionId: string) => void;
    loadConversationData: (sessionId: string) => boolean;
    updateStats: (concepts: number, quizScore: number | null) => void;
}

const STORAGE_KEY = 'rue_user_data';
const CONV_KEY_PREFIX = 'alfred_conv_';

function loadData(): { profile: UserProfile | null; sessions: SavedSession[] } {
    if (typeof window === 'undefined') return { profile: null, sessions: [] };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { profile: null, sessions: [] };
        return JSON.parse(raw);
    } catch {
        return { profile: null, sessions: [] };
    }
}

function persistData(profile: UserProfile | null, sessions: SavedSession[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, sessions }));
}

export const useUserStore = create<UserState>((set, get) => ({
    isLoggedIn: false,
    profile: null,
    savedSessions: [],

    login: (username, displayName) => {
        const existing = loadData();
        const profile: UserProfile = existing.profile?.username === username
            ? existing.profile
            : {
                username,
                displayName,
                totalSessions: existing.sessions?.length || 0,
                totalConcepts: 0,
                avgQuizScore: 0,
                joinedAt: existing.profile?.joinedAt || Date.now(),
            };
        persistData(profile, existing.sessions || []);
        set({
            isLoggedIn: true,
            profile,
            savedSessions: existing.sessions || [],
        });
    },

    logout: () => {
        set({ isLoggedIn: false, profile: null, savedSessions: [] });
    },

    loadFromStorage: () => {
        const data = loadData();
        if (data.profile) {
            set({
                isLoggedIn: true,
                profile: data.profile,
                savedSessions: data.sessions || [],
            });
        }
    },

    saveSessionToHistory: (session) => {
        const state = get();
        const sessions = [session, ...state.savedSessions.filter((s) => s.id !== session.id)];
        const profile = state.profile
            ? { ...state.profile, totalSessions: sessions.length }
            : null;
        persistData(profile, sessions);
        set({ savedSessions: sessions, profile });
    },

    // Save full conversation data to localStorage
    saveConversationData: (sessionId: string) => {
        if (typeof window === 'undefined') return;
        const sessionStore = useSessionStore.getState();
        const data = {
            sessionId: sessionStore.sessionId,
            conversationMessages: sessionStore.conversationMessages,
            currentDepth: sessionStore.currentDepth,
            latestConcepts: sessionStore.latestConcepts,
            rawTree: sessionStore.rawTree,
            timeline: sessionStore.timeline,
            difficultyLevel: sessionStore.difficultyLevel,
            technicalityLevel: sessionStore.technicalityLevel,
            answerDepth: sessionStore.answerDepth,
        };
        try {
            localStorage.setItem(CONV_KEY_PREFIX + sessionId, JSON.stringify(data));
        } catch { }
    },

    // Load conversation data from localStorage and restore session
    loadConversationData: (sessionId: string): boolean => {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(CONV_KEY_PREFIX + sessionId);
            if (!raw) return false;
            const data = JSON.parse(raw);

            // Restore into session store
            const sessionStore = useSessionStore.getState();
            sessionStore.resetSession();
            sessionStore.setSessionId(data.sessionId || sessionId);
            sessionStore.setCurrentDepth(data.currentDepth || 0);
            if (data.rawTree) sessionStore.updateTree(data.rawTree);

            if (data.difficultyLevel) sessionStore.setDifficultyLevel(data.difficultyLevel);
            if (data.technicalityLevel) sessionStore.setTechnicalityLevel(data.technicalityLevel);
            if (data.answerDepth) sessionStore.setAnswerDepth(data.answerDepth);

            // Restore conversation messages
            if (data.conversationMessages) {
                for (const msg of data.conversationMessages) {
                    if (msg.role === 'user') {
                        sessionStore.addUserMessage(msg.content);
                    } else if (msg.role === 'assistant') {
                        sessionStore.addAssistantMessage(msg.content, msg.concepts || [], msg.depth || 0);
                    }
                }
            }

            return true;
        } catch {
            return false;
        }
    },

    updateStats: (concepts, quizScore) => {
        const state = get();
        if (!state.profile) return;
        const profile = {
            ...state.profile,
            totalConcepts: state.profile.totalConcepts + concepts,
        };
        if (quizScore !== null) {
            const oldTotal = state.profile.avgQuizScore * state.profile.totalSessions;
            profile.avgQuizScore = (oldTotal + quizScore) / (state.profile.totalSessions || 1);
        }
        persistData(profile, state.savedSessions);
        set({ profile });
    },
}));
