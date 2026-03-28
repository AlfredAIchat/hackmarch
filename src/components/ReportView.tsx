'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore } from '@/store/sessionStore';

export default function ReportView() {
    const { showReport, setShowReport, report } = useSessionStore();

    if (!showReport || !report) return null;

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Learning Report</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600
                text-white rounded-lg text-sm font-semibold
                hover:shadow-lg hover:shadow-cyan-500/25 transition-all print:hidden"
                        >
                            📥 Download PDF
                        </button>
                        <button
                            onClick={() => setShowReport(false)}
                            className="text-gray-400 hover:text-white transition-colors text-2xl print:hidden"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div
                    id="report-printable"
                    className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800
            rounded-2xl p-8 prose prose-invert prose-sm max-w-none"
                >
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
