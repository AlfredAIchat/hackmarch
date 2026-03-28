'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';

export default function QuizModal() {
    const {
        quizQuestions,
        showQuiz,
        setShowQuiz,
        submitQuiz,
        quizScore,
        isStreaming,
    } = useSessionStore();

    const [answers, setAnswers] = useState<number[]>([]);
    const [submitted, setSubmitted] = useState(false);

    if (!showQuiz || !quizQuestions?.length) return null;

    const handleSelect = (qIdx: number, optIdx: number) => {
        if (submitted) return;
        const next = [...answers];
        next[qIdx] = optIdx;
        setAnswers(next);
    };

    const handleSubmit = async () => {
        if (answers.length < quizQuestions.length) return;
        await submitQuiz(answers);
        setSubmitted(true);
    };

    const handleClose = () => {
        setShowQuiz(false);
        setSubmitted(false);
        setAnswers([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div
                className="w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-slide-up"
                style={{
                    background: 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E2E8F0' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                            🧪
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Knowledge Check</h2>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>
                                Test your understanding of explored concepts
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#94A3B8', background: '#F3F5F9' }}
                    >
                        ×
                    </button>
                </div>

                {/* Score Banner */}
                {submitted && quizScore !== null && (
                    <div
                        className="mx-6 mt-4 p-4 rounded-xl text-center"
                        style={{
                            background: quizScore >= 70
                                ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
                                : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                            border: `1px solid ${quizScore >= 70 ? '#A7F3D0' : '#FCD34D'}`,
                        }}
                    >
                        <div className="text-3xl font-black" style={{ color: quizScore >= 70 ? '#059669' : '#D97706' }}>
                            {Math.round(quizScore)}%
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: quizScore >= 70 ? '#065F46' : '#92400E' }}>
                            {quizScore >= 90 ? '🏆 Outstanding!' : quizScore >= 70 ? '✅ Great job!' : '📚 Keep exploring!'}
                        </p>
                    </div>
                )}

                {/* Questions */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {quizQuestions.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="glass-card p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <span
                                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                                >
                                    {qIdx + 1}
                                </span>
                                <p className="text-sm font-semibold leading-relaxed" style={{ color: '#0F172A' }}>
                                    {q.question}
                                </p>
                            </div>

                            <div className="space-y-2 ml-10">
                                {q.options.map((opt: string, oIdx: number) => {
                                    const isSelected = answers[qIdx] === oIdx;
                                    const isCorrect = submitted && oIdx === q.correct_index;
                                    const isWrong = submitted && isSelected && oIdx !== q.correct_index;

                                    let bg = '#F3F5F9';
                                    let borderC = '#E2E8F0';
                                    let textC = '#0F172A';

                                    if (isCorrect) {
                                        bg = '#ECFDF5';
                                        borderC = '#A7F3D0';
                                        textC = '#065F46';
                                    } else if (isWrong) {
                                        bg = '#FEF2F2';
                                        borderC = '#FECACA';
                                        textC = '#991B1B';
                                    } else if (isSelected) {
                                        bg = '#EEF2FF';
                                        borderC = '#A5B4FC';
                                        textC = '#4338CA';
                                    }

                                    return (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleSelect(qIdx, oIdx)}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                                            style={{ background: bg, border: `1.5px solid ${borderC}`, color: textC }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold"
                                                    style={{
                                                        background: isSelected ? borderC : '#E2E8F0',
                                                        color: isSelected ? textC : '#94A3B8',
                                                    }}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {opt}
                                                {isCorrect && ' ✓'}
                                                {isWrong && ' ✗'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Concept tag */}
                            {q.concept && (
                                <div className="mt-3 ml-10">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                        style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
                                        {q.concept}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t" style={{ borderColor: '#E2E8F0' }}>
                    {!submitted ? (
                        <button
                            onClick={handleSubmit}
                            disabled={answers.length < quizQuestions.length || isStreaming}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                            style={{
                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                            }}
                        >
                            Submit Answers
                        </button>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: '#F3F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
