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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 bg-gray-900/95 border border-gray-800 rounded-2xl p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Answer Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">
                            Difficulty Level
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                            {difficultyLevel}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer
                            accent-cyan-500 hover:accent-cyan-400 transition-all"
                        style={{
                            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(difficultyLevel - 1) * 11.11}%, #1f2937 ${(difficultyLevel - 1) * 11.11}%, #1f2937 100%)`
                        }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Easy</span>
                        <span>Challenging</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {difficultyLevel <= 3
                            ? '📚 Simple concepts and everyday analogies'
                            : difficultyLevel <= 6
                                ? '🎯 Balanced foundational and advanced concepts'
                                : '🚀 Advanced concepts that push your knowledge boundaries'}
                    </p>
                </div>

                {/* Technicality Level */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">
                            Technicality Level
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-500/20 border border-purple-500/30 text-purple-400">
                            {technicalityLevel}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={technicalityLevel}
                        onChange={(e) => setTechnicalityLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer
                            accent-purple-500 hover:accent-purple-400 transition-all"
                        style={{
                            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(technicalityLevel - 1) * 11.11}%, #1f2937 ${(technicalityLevel - 1) * 11.11}%, #1f2937 100%)`
                        }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Plain Language</span>
                        <span>Technical</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {technicalityLevel <= 3
                            ? '💬 Everyday language, minimal jargon'
                            : technicalityLevel <= 6
                                ? '⚙️ Balanced practical and technical terms'
                                : '🔬 Precise technical language and domain-specific terminology'}
                    </p>
                </div>

                {/* Answer Depth */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 block">
                        Answer Depth
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['brief', 'moderate', 'detailed'] as const).map((depth) => (
                            <button
                                key={depth}
                                onClick={() => setAnswerDepth(depth)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize
                                    ${answerDepth === depth
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border border-transparent'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {depth}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {answerDepth === 'brief'
                            ? '⚡ Quick, concise answers (2-3 bullet points)'
                            : answerDepth === 'moderate'
                                ? '📖 Balanced explanations (3-4 bullet points)'
                                : '📚 Comprehensive deep-dives (5-6 bullet points with examples)'}
                    </p>
                </div>

                {/* Info Box */}
                <div className="px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <p className="text-xs text-cyan-400/80 leading-relaxed">
                        💡 <strong>Pro tip:</strong> Set difficulty to 7+ and answers will include new terms you haven't explored yet, encouraging deeper discovery!
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-xl
                        hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                    Apply Settings
                </button>
            </div>
        </div>
    );
}
