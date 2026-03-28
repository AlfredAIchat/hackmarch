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
        <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
            bg-gradient-to-br from-cyan-500 to-purple-600 shadow-2xl shadow-cyan-500/20 mb-4">
                        <span className="text-2xl font-black text-white">R</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Alfred AI
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Recursive Understanding Engine
                    </p>
                </div>

                {/* Login card */}
                <div className="bg-[#0d0d1a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-200 mb-1">Welcome back</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Enter your name to access your learning history
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Shakira"
                                autoFocus
                                className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-xl
                  text-gray-200 placeholder-gray-600 text-sm
                  focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
                  transition-all duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600
                text-white font-semibold rounded-xl text-sm
                hover:shadow-lg hover:shadow-cyan-500/25
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.98]"
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

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-cyan-400 font-bold text-lg">∞</div>
                                <div className="text-gray-600 text-[10px] uppercase tracking-wider">Depth</div>
                            </div>
                            <div>
                                <div className="text-purple-400 font-bold text-lg">11</div>
                                <div className="text-gray-600 text-[10px] uppercase tracking-wider">Agents</div>
                            </div>
                            <div>
                                <div className="text-pink-400 font-bold text-lg">AI</div>
                                <div className="text-gray-600 text-[10px] uppercase tracking-wider">Powered</div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-700 text-xs mt-6">
                    Your data stays in your browser. No account needed.
                </p>
            </div>
        </div>
    );
}
