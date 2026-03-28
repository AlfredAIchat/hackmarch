'use client';

import React from 'react';
import { useSessionStore } from '@/store/sessionStore';

interface SettingsPanelProps {
    show: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ show, onClose }: SettingsPanelProps) {
    const {
        difficultyLevel,
        technicalityLevel,
        answerDepth,
        setDifficultyLevel,
        setTechnicalityLevel,
        setAnswerDepth,
    } = useSessionStore();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div
                className="w-full max-w-md mx-4 animate-slide-up"
                style={{
                    background: 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    padding: '24px',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                            ⚙️
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Answer Settings</h2>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>Customize AI responses</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#94A3B8', background: '#F3F5F9' }}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Difficulty Level */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                                Difficulty Level
                            </span>
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}
                            >
                                {difficultyLevel}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={difficultyLevel}
                            onChange={(e) => setDifficultyLevel(Number(e.target.value))}
                            className="w-full"
                            style={{
                                background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${(difficultyLevel - 1) * 11.11}%, #E2E8F0 ${(difficultyLevel - 1) * 11.11}%, #E2E8F0 100%)`
                            }}
                        />
                        <div className="flex justify-between text-[10px] font-medium" style={{ color: '#94A3B8' }}>
                            <span>Easy</span>
                            <span>Challenging</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                            {difficultyLevel <= 3
                                ? '📚 Simple concepts and everyday analogies'
                                : difficultyLevel <= 6
                                    ? '🎯 Balanced foundational and advanced concepts'
                                    : '🚀 Advanced concepts that push your knowledge boundaries'}
                        </p>
                    </div>

                    {/* Technicality Level */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                                Technicality Level
                            </span>
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#F5F3FF', color: '#8B5CF6', border: '1px solid #DDD6FE' }}
                            >
                                {technicalityLevel}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={technicalityLevel}
                            onChange={(e) => setTechnicalityLevel(Number(e.target.value))}
                            className="w-full"
                            style={{
                                background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(technicalityLevel - 1) * 11.11}%, #E2E8F0 ${(technicalityLevel - 1) * 11.11}%, #E2E8F0 100%)`
                            }}
                        />
                        <div className="flex justify-between text-[10px] font-medium" style={{ color: '#94A3B8' }}>
                            <span>Plain Language</span>
                            <span>Technical</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                            {technicalityLevel <= 3
                                ? '💬 Everyday language, minimal jargon'
                                : technicalityLevel <= 6
                                    ? '⚙️ Balanced practical and technical terms'
                                    : '🔬 Precise technical language and domain terminology'}
                        </p>
                    </div>

                    {/* Answer Depth */}
                    <div className="space-y-3">
                        <span className="text-sm font-semibold block" style={{ color: '#0F172A' }}>
                            Answer Depth
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                            {(['brief', 'moderate', 'detailed'] as const).map((depth) => (
                                <button
                                    key={depth}
                                    onClick={() => setAnswerDepth(depth)}
                                    className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize"
                                    style={{
                                        background: answerDepth === depth
                                            ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                            : '#F3F5F9',
                                        color: answerDepth === depth ? '#fff' : '#475569',
                                        border: `1.5px solid ${answerDepth === depth ? 'transparent' : '#E2E8F0'}`,
                                        boxShadow: answerDepth === depth ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                                    }}
                                >
                                    {depth}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                            {answerDepth === 'brief'
                                ? '⚡ Quick, concise answers (2-3 bullet points)'
                                : answerDepth === 'moderate'
                                    ? '📖 Balanced explanations (3-4 bullet points)'
                                    : '📚 Comprehensive deep-dives (5-6 bullet points with examples)'}
                        </p>
                    </div>

                    {/* Pro tip */}
                    <div className="p-4 rounded-xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                        <p className="text-xs leading-relaxed" style={{ color: '#4338CA' }}>
                            💡 <strong>Pro tip:</strong> Set difficulty to 7+ and answers will include new terms you haven't explored yet, encouraging deeper discovery!
                        </p>
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                        }}
                    >
                        Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
