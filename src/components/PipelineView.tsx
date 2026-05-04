'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────── Types ─────── */
export interface PipelineStep {
    id: string;
    label: string;
    status: 'idle' | 'active' | 'done' | 'error';
    detail?: string;
    duration?: number;
}

interface Props {
    steps: PipelineStep[];
    className?: string;
}

/* ─────── Icons ─────── */
const ICONS: Record<string, string> = {
    'intent_guard': '🛡️',
    'context_builder': '📚',
    'answer_agent': '🧠',
    'hallucination_checker': '🔍',
    'concept_extractor': '💡',
    'concept_validator': '✅',
    'tree_builder': '🌳',
    'difficulty_adapter': '⚙️',
    'deduplicator': '🧹',
    'relevance_scorer': '📊',
    'quiz_generator': '📝',
};

const STATUS_COLORS = {
    idle: { bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', dot: '#CBD5E1' },
    active: { bg: '#EFF6FF', border: '#2563EB', text: '#1E40AF', dot: '#2563EB' },
    done: { bg: '#ECFDF5', border: '#10B981', text: '#065F46', dot: '#10B981' },
    error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', dot: '#EF4444' },
};

export default function PipelineView({ steps, className }: Props) {
    const progress = useMemo(() => {
        if (steps.length === 0) return 0;
        const done = steps.filter(s => s.status === 'done').length;
        const active = steps.filter(s => s.status === 'active').length;
        return Math.round(((done + active * 0.5) / steps.length) * 100);
    }, [steps]);

    const activeStep = steps.find(s => s.status === 'active');
    const isComplete = steps.length > 0 && steps.every(s => s.status === 'done');
    const hasError = steps.some(s => s.status === 'error');

    if (steps.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-full gap-4 ${className}`}>
                <div className="empty-illustration">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        {/* Pipeline illustration */}
                        <rect x="35" y="10" width="30" height="16" rx="4" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />
                        <rect x="35" y="34" width="30" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                        <rect x="35" y="58" width="30" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                        <rect x="35" y="82" width="30" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="50" y1="26" x2="50" y2="34" stroke="#CBD5E1" strokeWidth="1.5" />
                        <line x1="50" y1="50" x2="50" y2="58" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="50" y1="74" x2="50" y2="82" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: '#475569' }}>Agent Pipeline</p>
                    <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>11—agent pipeline awaiting input</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
                <div className="flex items-center gap-2">
                    {isComplete ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                    ) : hasError ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#FEF2F2' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </div>
                    ) : (
                        <div className="pulse-dot" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
                        {isComplete ? 'Complete' : hasError ? 'Error' : activeStep ? activeStep.label : 'Processing'}
                    </span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#6366F1' }}>{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3">
                <div className="progress-bar" style={{ height: '5px' }}>
                    <div className="progress-bar-fill" style={{
                        width: `${progress}%`,
                        background: isComplete ? '#10B981' : hasError ? '#EF4444' : undefined,
                    }} />
                </div>
            </div>

            {/* Steps list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="relative pl-4">
                    {/* Connecting line */}
                    <div className="absolute left-[26px] top-0 bottom-0 w-[2px]" style={{
                        background: `linear-gradient(180deg, ${isComplete ? '#10B981' : '#2563EB'} 0%, ${hasError ? '#EF4444' : '#60A5FA'} 50%, rgba(226, 232, 240, 0.4) 100%)`,
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                    }} />

                    <AnimatePresence>
                    {steps.map((step, i) => {
                        const colors = STATUS_COLORS[step.status];
                        const icon = Object.entries(ICONS).find(([k]) => step.id.includes(k))?.[1] || '●';

                        return (
                            <motion.div 
                                key={step.id}
                                className="relative flex items-center gap-4"
                                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    marginBottom: i < steps.length - 1 ? '16px' : 0,
                                }}
                            >
                                {/* Node dot */}
                                <div className="relative z-10 flex-shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center text-xs"
                                    style={{
                                        background: colors.bg,
                                        border: `2px solid ${colors.border}`,
                                        boxShadow: step.status === 'active' ? `0 0 20px rgba(37,99,235,0.5), inset 0 0 10px rgba(37,99,235,0.2)` : undefined,
                                        transform: step.status === 'active' ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                >
                                    {step.status === 'active' ? (
                                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2563EB', borderTopColor: 'transparent' }} />
                                    ) : step.status === 'done' ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                    ) : step.status === 'error' ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full" style={{ background: '#CBD5E1' }} />
                                    )}
                                </div>

                                {/* Step content - Glassmorphic Card */}
                                <div className="flex-1 min-w-0 py-2 px-4 rounded-[16px] backdrop-blur-md transition-all duration-300"
                                     style={{
                                        background: step.status === 'active' ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(96,165,250,0.08))' : 'rgba(255,255,255,0.6)',
                                        border: `1px solid ${step.status === 'active' ? 'rgba(37,99,235,0.2)' : 'rgba(226,232,240,0.6)'}`,
                                        boxShadow: step.status === 'active' ? '0 12px 32px rgba(37,99,235,0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
                                     }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0" style={{ opacity: step.status === 'idle' ? 0.5 : 1 }}>
                                            <span className="text-sm">{icon}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold truncate tracking-wide uppercase" style={{ color: colors.text }}>
                                                    {step.label}
                                                </span>
                                                {step.duration != null && step.status === 'done' && (
                                                    <span className="text-[10px] font-mono ml-auto flex-shrink-0 bg-white px-2 py-0.5 rounded-full border border-emerald-100" style={{ color: '#10B981' }}>
                                                        {(step.duration / 1000).toFixed(1)}s
                                                    </span>
                                                )}
                                            </div>
                                            {step.detail && step.status !== 'idle' && (
                                                <p className="text-[11px] mt-1 font-medium truncate" style={{ color: '#64748B' }}>
                                                    {step.detail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer summary */}
            {isComplete && (
                <div className="px-4 py-3 animate-slide-up" style={{ borderTop: '1px solid #E2E8F0' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: '#10B981' }}>
                            ✓ All {steps.length} agents completed
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: '#94A3B8' }}>
                            {(steps.reduce((acc, s) => acc + (s.duration || 0), 0) / 1000).toFixed(1)}s total
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
