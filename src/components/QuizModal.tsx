'use client';

import React, { useState, useMemo, useCallback } from 'react';

/* ─────── Types ─────── */
interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct: number;
    concept?: string;
    explanation?: string;
}

interface QuizResult {
    score: number;
    total: number;
    feedback?: string;
    details?: { questionId: string; correct: boolean; correctAnswer: number; userAnswer: number }[];
}

interface Props {
    sessionId: string;
    concepts: string[];
    onClose: () => void;
}

/* ─────── API helpers ─────── */
async function fetchQuiz(sessionId: string): Promise<QuizQuestion[]> {
    try {
        const res = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error('Failed to generate quiz');
        const data = await res.json();
        return data.questions || [];
    } catch {
        return [];
    }
}

async function submitQuiz(sessionId: string, answers: Record<string, number>): Promise<QuizResult | null> {
    try {
        const res = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, answers }),
        });
        if (!res.ok) throw new Error('Failed to submit quiz');
        return await res.json();
    } catch {
        return null;
    }
}

/* ─────── Component ─────── */
export default function QuizModal({ sessionId, concepts, onClose }: Props) {
    const [phase, setPhase] = useState<'intro' | 'loading' | 'quiz' | 'result'>('intro');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    const currentQ = questions[currentIdx];
    const totalAnswered = Object.keys(answers).length;

    /* Start quiz */
    const startQuiz = useCallback(async () => {
        setPhase('loading');
        const qs = await fetchQuiz(sessionId);
        if (qs.length > 0) {
            setQuestions(qs);
            setPhase('quiz');
        } else {
            // Generate fallback questions from concepts
            const fallback: QuizQuestion[] = concepts.slice(0, 5).map((c, i) => ({
                id: `q${i}`,
                question: `Which of the following best describes "${c}"?`,
                options: [
                    `${c} is a fundamental concept in this domain`,
                    `${c} is unrelated to the topic`,
                    `${c} is a deprecated methodology`,
                    `${c} only applies to advanced scenarios`,
                ],
                correct: 0,
                concept: c,
                explanation: `"${c}" is a core concept that was explored in your learning session.`,
            }));
            setQuestions(fallback.length > 0 ? fallback : []);
            setPhase(fallback.length > 0 ? 'quiz' : 'intro');
        }
    }, [sessionId, concepts]);

    /* Select answer */
    const selectAnswer = (optIdx: number) => {
        if (showFeedback) return;
        setSelectedOption(optIdx);
        setShowFeedback(true);
        setAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
    };

    /* Next question */
    const nextQuestion = () => {
        setSelectedOption(null);
        setShowFeedback(false);
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            finishQuiz();
        }
    };

    /* Finish */
    const finishQuiz = async () => {
        setPhase('loading');
        const res = await submitQuiz(sessionId, answers);
        if (res) {
            setResult(res);
        } else {
            // Calculate locally
            let score = 0;
            questions.forEach(q => {
                if (answers[q.id] === q.correct) score++;
            });
            setResult({ score, total: questions.length });
        }
        setPhase('result');
    };

    /* Score helpers */
    const scorePercent = result ? Math.round((result.score / result.total) * 100) : 0;
    const scoreGrade = useMemo(() => {
        if (!result) return { label: '', color: '', emoji: '' };
        if (scorePercent >= 90) return { label: 'Outstanding!', color: '#10B981', emoji: '🏆' };
        if (scorePercent >= 70) return { label: 'Great Job!', color: '#6366F1', emoji: '🎉' };
        if (scorePercent >= 50) return { label: 'Good Effort', color: '#F59E0B', emoji: '💪' };
        return { label: 'Keep Learning', color: '#EF4444', emoji: '📚' };
    }, [result, scorePercent]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="relative w-full max-w-lg mx-4 animate-scale-in"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                }}
            >
                {/* Close button */}
                <button onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center z-10 transition-all hover:bg-gray-100"
                    style={{ color: '#94A3B8' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* ─── Intro Phase ─── */}
                {phase === 'intro' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
                            <span className="text-3xl">📝</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Knowledge Check</h2>
                        <p className="text-sm mb-1" style={{ color: '#64748B' }}>
                            Test your understanding of the concepts you&apos;ve explored
                        </p>
                        <p className="text-xs mb-6" style={{ color: '#94A3B8' }}>
                            {concepts.length} concept{concepts.length !== 1 ? 's' : ''} available for testing
                        </p>

                        {/* Concept preview */}
                        {concepts.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1.5 mb-6 max-h-20 overflow-hidden">
                                {concepts.slice(0, 12).map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                                        style={{ background: '#F1F5F9', color: '#64748B' }}>
                                        {c}
                                    </span>
                                ))}
                                {concepts.length > 12 && (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                                        +{concepts.length - 12} more
                                    </span>
                                )}
                            </div>
                        )}

                        <button onClick={startQuiz} className="btn-primary w-full py-3"
                            disabled={concepts.length === 0}>
                            {concepts.length > 0 ? 'Start Quiz' : 'No concepts to quiz on yet'}
                        </button>
                    </div>
                )}

                {/* ─── Loading Phase ─── */}
                {phase === 'loading' && (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-t-transparent animate-spin"
                            style={{ borderColor: '#E2E8F0', borderTopColor: 'transparent', borderWidth: '3px', background: 'transparent' }}>
                            <div className="w-full h-full rounded-full border-3 border-t-transparent animate-spin"
                                style={{ borderColor: '#6366F1', borderTopColor: 'transparent', borderWidth: '2px', animationDirection: 'reverse', animationDuration: '0.6s' }} />
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#475569' }}>
                            {totalAnswered > 0 ? 'Evaluating your answers…' : 'Generating questions…'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                            {totalAnswered > 0 ? 'AI is analyzing your performance' : 'AI is crafting personalized questions'}
                        </p>
                    </div>
                )}

                {/* ─── Quiz Phase ─── */}
                {phase === 'quiz' && currentQ && (
                    <div className="flex flex-col">
                        {/* Progress header */}
                        <div className="px-6 pt-5 pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                                    Question {currentIdx + 1} of {questions.length}
                                </span>
                                {currentQ.concept && (
                                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                                        {currentQ.concept}
                                    </span>
                                )}
                            </div>
                            <div className="progress-bar" style={{ height: '3px' }}>
                                <div className="progress-bar-fill"
                                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                            </div>
                        </div>

                        {/* Question */}
                        <div className="px-6 py-3">
                            <h3 className="text-base font-bold leading-relaxed" style={{ color: '#0F172A' }}>
                                {currentQ.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="px-6 pb-3 space-y-2">
                            {currentQ.options.map((opt, i) => {
                                const isSelected = selectedOption === i;
                                const isCorrect = i === currentQ.correct;
                                const showAsCorrect = showFeedback && isCorrect;
                                const showAsWrong = showFeedback && isSelected && !isCorrect;

                                let bg = '#F8FAFC';
                                let border = '#E2E8F0';
                                let textCol = '#475569';
                                let indicator = String.fromCharCode(65 + i);
                                let indicatorBg = '#E2E8F0';
                                let indicatorColor = '#64748B';

                                if (showAsCorrect) {
                                    bg = '#ECFDF5'; border = '#10B981'; textCol = '#065F46';
                                    indicator = '✓'; indicatorBg = '#10B981'; indicatorColor = '#fff';
                                } else if (showAsWrong) {
                                    bg = '#FEF2F2'; border = '#EF4444'; textCol = '#991B1B';
                                    indicator = '✕'; indicatorBg = '#EF4444'; indicatorColor = '#fff';
                                } else if (isSelected) {
                                    bg = '#EEF2FF'; border = '#6366F1'; textCol = '#4338CA';
                                    indicatorBg = '#6366F1'; indicatorColor = '#fff';
                                }

                                return (
                                    <button key={i}
                                        onClick={() => selectAnswer(i)}
                                        disabled={showFeedback}
                                        className={`quiz-option w-full flex items-center gap-3 p-3.5 rounded-xl text-left
                                            ${showAsCorrect ? 'quiz-option--correct' : ''}
                                            ${showAsWrong ? 'quiz-option--wrong' : ''}`}
                                        style={{
                                            background: bg,
                                            border: `1.5px solid ${border}`,
                                            color: textCol,
                                            cursor: showFeedback ? 'default' : 'pointer',
                                        }}
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{ background: indicatorBg, color: indicatorColor }}>
                                            {indicator}
                                        </div>
                                        <span className="text-sm font-medium flex-1">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {showFeedback && currentQ.explanation && (
                            <div className="mx-6 mb-3 p-3 rounded-xl animate-slide-up"
                                style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                                    <span className="font-bold" style={{ color: '#475569' }}>💡 Explanation: </span>
                                    {currentQ.explanation}
                                </p>
                            </div>
                        )}

                        {/* Next button */}
                        {showFeedback && (
                            <div className="px-6 pb-5">
                                <button onClick={nextQuestion} className="btn-primary w-full py-3">
                                    {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Result Phase ─── */}
                {phase === 'result' && result && (
                    <div className="p-8 text-center">
                        {/* Celebration */}
                        {scorePercent >= 70 && (
                            <div className="relative h-8 mb-2">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="confetti-piece"
                                        style={{
                                            left: `${10 + Math.random() * 80}%`,
                                            background: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5],
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: `${1 + Math.random()}s`,
                                        }} />
                                ))}
                            </div>
                        )}

                        {/* Score circle */}
                        <div className="score-circle inline-flex flex-col items-center justify-center w-28 h-28 rounded-full mb-5"
                            style={{
                                background: `conic-gradient(${scoreGrade.color} ${scorePercent * 3.6}deg, #F1F5F9 0deg)`,
                                padding: '4px',
                            }}>
                            <div className="w-full h-full rounded-full flex flex-col items-center justify-center"
                                style={{ background: 'white' }}>
                                <span className="text-3xl font-black" style={{ color: scoreGrade.color }}>
                                    {result.score}
                                </span>
                                <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
                                    of {result.total}
                                </span>
                            </div>
                        </div>

                        <div className="text-lg mb-1">{scoreGrade.emoji}</div>
                        <h2 className="text-xl font-bold mb-1" style={{ color: scoreGrade.color }}>
                            {scoreGrade.label}
                        </h2>
                        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                            You scored {scorePercent}% on this knowledge check
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="stat-card">
                                <div className="text-lg font-bold" style={{ color: '#10B981' }}>{result.score}</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>Correct</div>
                            </div>
                            <div className="stat-card">
                                <div className="text-lg font-bold" style={{ color: '#EF4444' }}>{result.total - result.score}</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>Wrong</div>
                            </div>
                            <div className="stat-card">
                                <div className="text-lg font-bold" style={{ color: '#6366F1' }}>{scorePercent}%</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>Score</div>
                            </div>
                        </div>

                        {result.feedback && (
                            <p className="text-xs mb-5 p-3 rounded-xl" style={{ background: '#F1F5F9', color: '#64748B' }}>
                                {result.feedback}
                            </p>
                        )}

                        <button onClick={onClose} className="btn-primary w-full py-3">
                            Continue Learning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
