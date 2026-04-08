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
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8"
            style={{
                background: 'radial-gradient(circle at 9% 14%, rgba(14,165,164,0.20), transparent 35%), radial-gradient(circle at 89% 82%, rgba(37,99,235,0.18), transparent 40%), linear-gradient(160deg, #F8FAFC, #EAF0FF)',
            }}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 left-[8%] w-[420px] h-[420px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(14,165,164,0.14), transparent)' }} />
                <div className="absolute -bottom-20 right-[8%] w-[440px] h-[440px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.16), transparent)' }} />
            </div>

            <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-5">
                <section className="glass-card-elevated p-8 md:p-10" style={{ minHeight: 420 }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                        style={{ background: 'linear-gradient(135deg, #0EA5A4, #2563EB)', boxShadow: '0 14px 30px rgba(37,99,235,0.28)' }}>
                        <span className="text-2xl font-black text-white">A</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3" style={{ color: '#0F172A' }}>
                        Learn Anything,
                        <span className="block" style={{ color: '#2563EB' }}>Layer by Layer.</span>
                    </h1>
                    <p className="text-sm md:text-base mb-7" style={{ color: '#475569', lineHeight: 1.65 }}>
                        Alfred turns each answer into a visual knowledge journey with explorable concepts,
                        recursive depth, and an interactive learning tree.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl p-3" style={{ background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
                            <div className="text-lg font-bold" style={{ color: '#2563EB' }}>Live</div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#64748B' }}>Pipeline</div>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
                            <div className="text-lg font-bold" style={{ color: '#0F766E' }}>Smart</div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#64748B' }}>Concept Tree</div>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                            <div className="text-lg font-bold" style={{ color: '#C2410C' }}>Deep</div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#64748B' }}>Exploration</div>
                        </div>
                    </div>
                </section>

                <section className="glass-card-elevated p-8 md:p-10 flex flex-col justify-center" style={{ minHeight: 420 }}>
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#64748B' }}>Get Started</p>
                        <h2 className="text-2xl font-bold mt-2" style={{ color: '#0F172A' }}>Create your learning profile</h2>
                        <p className="text-sm mt-2" style={{ color: '#64748B' }}>Just your name. Everything else stays local in your browser.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Mohammed"
                                autoFocus
                                className="input-field"
                                maxLength={40}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="btn-primary w-full py-3 text-sm"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Entering...
                                </div>
                            ) : (
                                'Enter Alfred'
                            )}
                        </button>
                    </form>

                    <p className="text-xs mt-5" style={{ color: '#64748B' }}>
                        By continuing, you start a private local session with saved progress on this device.
                    </p>
                </section>
            </div>
        </div>
    );
}
