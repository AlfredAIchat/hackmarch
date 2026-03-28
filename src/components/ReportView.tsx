'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore } from '@/store/sessionStore';

export default function ReportView() {
    const { showReport, setShowReport, report } = useSessionStore();

    if (!showReport || !report) return null;

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
                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                            📊
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Learning Report</h2>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>
                                Your personalized learning summary
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white no-print transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                            }}
                        >
                            📥 Export PDF
                        </button>
                        <button
                            onClick={() => setShowReport(false)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors no-print"
                            style={{ color: '#94A3B8', background: '#F3F5F9' }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Report body */}
                <div
                    id="report-printable"
                    className="flex-1 overflow-y-auto p-8 prose-light prose prose-sm max-w-none"
                >
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
