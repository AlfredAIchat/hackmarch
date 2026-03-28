'use client';

import React, { useCallback } from 'react';

/* ─────── Types ─────── */
interface SessionSettings {
    difficulty: number;
    technicality: number;
    answerDepth: 'brief' | 'moderate' | 'detailed';
}

interface Props {
    settings: SessionSettings;
    onUpdate: (settings: SessionSettings) => void;
    onClose: () => void;
}

/* ─────── Constants ─────── */
const DEPTH_OPTIONS: { value: SessionSettings['answerDepth']; label: string; description: string; icon: string }[] = [
    { value: 'brief', label: 'Brief', description: 'Quick, concise answers', icon: '⚡' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced explanations', icon: '📖' },
    { value: 'detailed', label: 'Detailed', description: 'Deep, comprehensive answers', icon: '🔬' },
];

const DIFFICULTY_LABELS = ['Beginner', 'Easy', 'Moderate', 'Advanced', 'Expert'];
const TECH_LABELS = ['Simple', 'Basic', 'Intermediate', 'Technical', 'Academic'];

export default function SettingsPanel({ settings, onUpdate, onClose }: Props) {
    const update = useCallback((partial: Partial<SessionSettings>) => {
        onUpdate({ ...settings, ...partial });
    }, [settings, onUpdate]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="relative w-full max-w-md mx-4 animate-scale-in"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                    maxHeight: '90vh',
                    overflow: 'auto',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Learning Settings</h2>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>Customize your AI learning experience</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
                        style={{ color: '#94A3B8' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-6">
                    {/* ─── Difficulty ─── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🎯</span>
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                                    Difficulty
                                </label>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: '#EEF2FF', color: '#6366F1' }}>
                                {DIFFICULTY_LABELS[settings.difficulty - 1] || 'Moderate'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1} max={5} step={1}
                            value={settings.difficulty}
                            onChange={e => update({ difficulty: +e.target.value })}
                            className="premium-slider"
                        />
                        <div className="flex justify-between mt-1.5">
                            {DIFFICULTY_LABELS.map((l, i) => (
                                <span key={i} className="text-[9px] font-medium"
                                    style={{ color: settings.difficulty === i + 1 ? '#6366F1' : '#CBD5E1' }}>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ─── Technicality ─── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🔧</span>
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                                    Technicality
                                </label>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                                {TECH_LABELS[settings.technicality - 1] || 'Intermediate'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1} max={5} step={1}
                            value={settings.technicality}
                            onChange={e => update({ technicality: +e.target.value })}
                            className="premium-slider"
                        />
                        <div className="flex justify-between mt-1.5">
                            {TECH_LABELS.map((l, i) => (
                                <span key={i} className="text-[9px] font-medium"
                                    style={{ color: settings.technicality === i + 1 ? '#8B5CF6' : '#CBD5E1' }}>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ─── Answer Depth ─── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm">📏</span>
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                                Answer Depth
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {DEPTH_OPTIONS.map(opt => {
                                const isActive = settings.answerDepth === opt.value;
                                return (
                                    <button key={opt.value}
                                        onClick={() => update({ answerDepth: opt.value })}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all"
                                        style={{
                                            background: isActive ? '#EEF2FF' : '#F8FAFC',
                                            border: `1.5px solid ${isActive ? '#6366F1' : '#E2E8F0'}`,
                                            color: isActive ? '#4338CA' : '#64748B',
                                            boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                                        }}
                                    >
                                        <span className="text-lg">{opt.icon}</span>
                                        <span className="text-xs font-bold">{opt.label}</span>
                                        <span className="text-[9px]" style={{ color: isActive ? '#6366F1' : '#94A3B8' }}>
                                            {opt.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── Current Config Summary ─── */}
                    <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
                            Current Configuration
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: '#64748B' }}>AI Response Style</span>
                                <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                                    {settings.difficulty >= 4 ? 'Expert, ' : settings.difficulty >= 2 ? 'Approachable, ' : 'Beginner-friendly, '}
                                    {settings.answerDepth}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: '#64748B' }}>Vocabulary Level</span>
                                <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                                    {TECH_LABELS[settings.technicality - 1]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <button onClick={onClose} className="btn-primary w-full py-3">
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
}
