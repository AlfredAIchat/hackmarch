'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function LoginPage() {
    const router = useRouter();
    const { isLoggedIn, login, loadFromStorage } = useUserStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (mounted && isLoggedIn) {
            router.push('/');
        }
    }, [mounted, isLoggedIn, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        const username = name.trim().toLowerCase().replace(/\s+/g, '_');
        login(username, name.trim());
        setTimeout(() => router.push('/'), 300);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: 'radial-gradient(circle at 12% 12%, rgba(14,165,164,0.16), transparent 34%), radial-gradient(circle at 88% 78%, rgba(37,99,235,0.14), transparent 38%), linear-gradient(155deg, #F8FAFC, #EEF4FF)',
            }}>
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent)' }} />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{
                                background: 'linear-gradient(135deg, #0EA5A4, #2563EB)',
                                boxShadow: '0 10px 28px rgba(37,99,235,0.3)',
                        }}>
                        <span className="text-2xl font-black text-white">A</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span style={{
                            background: 'linear-gradient(135deg, #0EA5A4, #2563EB)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Alfred AI
                        </span>
                    </h1>
                    <p className="text-sm" style={{ color: '#475569' }}>
                        Recursive Understanding Engine
                    </p>
                </div>

                {/* Login card */}
                <div className="glass-card-elevated p-8">
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>Welcome</h2>
                    <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                        Enter your name to access your learning history
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ color: '#475569' }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Alex"
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all duration-200"
                                style={{
                                    background: '#FFFFFF',
                                    border: '2px solid #CBD5E1',
                                    color: '#0F172A',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="w-full py-3 text-white font-bold rounded-xl text-sm
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200 active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #0EA5A4, #2563EB)',
                                boxShadow: '0 8px 18px rgba(37,99,235,0.28)',
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Entering…
                                </div>
                            ) : (
                                'Start Learning'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E2E8F0' }}>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-lg font-bold" style={{ color: '#0EA5A4' }}>∞</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold"
                                    style={{ color: '#64748B' }}>Depth</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold" style={{ color: '#2563EB' }}>11</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold"
                                    style={{ color: '#64748B' }}>Agents</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold" style={{ color: '#10B981' }}>AI</div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold"
                                    style={{ color: '#64748B' }}>Powered</div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: '#475569' }}>
                    Your data stays in your browser. No account needed.
                </p>
            </div>
        </div>
    );
}
