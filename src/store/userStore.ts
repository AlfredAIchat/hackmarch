'use client';

import { create } from 'zustand';

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
    updateStats: (concepts: number, quizScore: number | null) => void;
}

const STORAGE_KEY = 'rue_user_data';

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
