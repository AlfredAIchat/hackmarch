'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';

export default function QuizModal() {
    const {
        showQuiz,
        setShowQuiz,
        quizQuestions,
        quizScore,
        quizResults,
        sessionId,
        setQuizQuestions,
        setQuizScore,
        setQuizResults,
    } = useSessionStore();

    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
    const [flipped, setFlipped] = useState<Record<number, boolean>>({});

    if (!showQuiz) return null;

    const loadQuiz = async () => {
        setIsLoadingQuiz(true);
        try {
            const resp = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId }),
            });
            const data = await resp.json();
            setQuizQuestions(data.quiz_questions || []);
            setCurrentQ(0);
            setSelectedAnswers({});
            setSubmitted(false);
            setFlipped({});
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const submitQuiz = async () => {
        const answers = quizQuestions.map((_, i) => selectedAnswers[i] ?? -1);
        try {
            const resp = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, answers }),
            });
            const data = await resp.json();
            setQuizScore(data.quiz_score ?? 0);
            setQuizResults(data.results || []);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        }
    };

    const q = quizQuestions[currentQ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Knowledge Quiz</h2>
                    <button
                        onClick={() => setShowQuiz(false)}
                        className="text-gray-400 hover:text-white transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* No questions loaded yet */}
                {quizQuestions.length === 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                        <p className="text-gray-400 mb-4">
                            Generate a quiz based on the concepts you've explored.
                        </p>
                        <button
                            onClick={loadQuiz}
                            disabled={isLoadingQuiz}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600
                text-white rounded-xl font-semibold hover:shadow-lg
                hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                        >
                            {isLoadingQuiz ? 'Generating…' : 'Generate Quiz'}
                        </button>
                    </div>
                )}

                {/* Question card */}
                {q && !submitted && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        {/* Progress */}
                        <div className="px-6 pt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Question {currentQ + 1} of {quizQuestions.length}
                            </span>
                            <span className="text-xs text-cyan-400">{q.concept}</span>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-200 font-medium mb-4">{q.question}</p>

                            <div className="space-y-2">
                                {q.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            setSelectedAnswers((prev) => ({ ...prev, [currentQ]: i }))
                                        }
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm
                      ${selectedAnswers[currentQ] === i
                                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                                                : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="font-mono text-xs text-gray-500 mr-2">
                                            {String.fromCharCode(65 + i)}.
                                        </span>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav */}
                        <div className="px-6 pb-4 flex justify-between">
                            <button
                                onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                                disabled={currentQ === 0}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                ← Previous
                            </button>
                            {currentQ < quizQuestions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQ((p) => p + 1)}
                                    className="px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={submitQuiz}
                                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600
                    text-white rounded-lg text-sm font-semibold
                    disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                                >
                                    Submit
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Results */}
                {submitted && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                        <div className="text-center">
                            <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                                {quizScore?.toFixed(0)}%
                            </div>
                            <p className="text-gray-400 text-sm">Quiz Score</p>
                        </div>

                        {quizQuestions.map((q, i) => {
                            const result = quizResults[i];
                            const isCorrect = result?.is_correct;
                            return (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl border ${isCorrect
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-red-500/30 bg-red-500/5'
                                        }`}
                                >
                                    <p className="text-sm text-gray-300 mb-1">{q.question}</p>
                                    <p className="text-xs text-gray-500">
                                        {isCorrect ? '✓ Correct' : '✗ Incorrect'} —{' '}
                                        {result?.explanation || ''}
                                    </p>
                                </div>
                            );
                        })}

                        <button
                            onClick={() => setShowQuiz(false)}
                            className="w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-xl
                hover:bg-gray-700 transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
