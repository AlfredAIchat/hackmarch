'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BrainCircuit,
    Focus,
    GitCommitHorizontal,
    Layers,
    Network,
    Sparkles,
    Zap,
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const { isLoggedIn, login, loadFromStorage } = useUserStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (mounted && isLoggedIn) {
            router.push('/');
        }
    }, [mounted, isLoggedIn, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        
        // Simulating a tiny delay for a smooth transition before pushing
        setTimeout(() => {
            const username = name.trim().toLowerCase().replace(/\s+/g, '_');
            login(username, name.trim());
            router.push('/');
        }, 600);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[linear-gradient(140deg,#f8fafc_0%,#eef5ff_45%,#ecfeff_100%)] text-slate-900 overflow-x-hidden">
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/70">
                <div className="max-w-7xl mx-auto h-20 px-5 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight">ALFRED</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
                        <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
                        <a href="#recursive-engine" className="hover:text-slate-900 transition-colors">Recursive Engine</a>
                        <a href="#technology" className="hover:text-slate-900 transition-colors">Technology</a>
                    </nav>
                </div>
            </header>

            <section className="relative py-16 md:py-20 lg:py-24">
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto px-5 md:px-8 relative">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                        <div className="lg:col-span-7 xl:pr-8">
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 mb-7"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-[0.14em]">Recursive Understanding Engine</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight"
                            >
                                Learn hard topics by
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500">seeing how concepts connect.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl"
                            >
                                Alfred converts a question into an interactive graph of core concepts, then lets you recursively drill deeper until real understanding clicks.
                            </motion.p>
                        </div>

                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="w-full max-w-xl mx-auto lg:ml-auto rounded-3xl bg-white border border-slate-200 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden"
                            >
                                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500" />
                                <div className="p-7 md:p-9">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">Start Your Session</h2>
                                    <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
                                        Create a local profile and begin building your concept map.
                                    </p>

                                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                                        <div className="space-y-2">
                                            <label htmlFor="displayName" className="text-xs font-bold tracking-[0.13em] uppercase text-slate-500">
                                                Display Name
                                            </label>
                                            <input
                                                id="displayName"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                className="w-full h-14 md:h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                maxLength={40}
                                                required
                                                autoComplete="off"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isLoading}
                                            className="w-full h-14 md:h-16 rounded-2xl bg-slate-900 text-white font-bold text-lg inline-flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-55 disabled:hover:bg-slate-900 transition-all"
                                        >
                                            {isLoading ? 'Initializing...' : 'Enter Alfred'}
                                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </div>

                                <div className="px-6 md:px-9 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] md:text-xs tracking-[0.12em] uppercase font-bold text-slate-500">
                                    <Zap className="w-3.5 h-3.5" />
                                    Private local-first learning session
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="py-20 md:py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-5 md:px-8">
                    <div className="max-w-3xl">
                        <h3 className="text-3xl md:text-5xl font-black tracking-tight">How it works</h3>
                        <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                            Every query moves through a visual-first pipeline that extracts concepts, validates relationships, and returns a map you can actually navigate.
                        </p>
                    </div>

                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5">
                                <Layers className="w-6 h-6 text-slate-700" />
                            </div>
                            <h4 className="text-xl font-bold">1. Parse the question</h4>
                            <p className="mt-3 text-slate-600">The engine identifies core entities instead of writing generic long-form answers.</p>
                        </div>
                        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-7">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-5">
                                <Network className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-blue-900">2. Build a concept graph</h4>
                            <p className="mt-3 text-blue-800">Concepts are mapped into a hierarchy, so the structure behind the topic is instantly visible.</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5">
                                <Focus className="w-6 h-6 text-slate-700" />
                            </div>
                            <h4 className="text-xl font-bold">3. Recurse into depth</h4>
                            <p className="mt-3 text-slate-600">Click any node to expand deeper layers until the idea becomes intuitive and complete.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="recursive-engine" className="py-20 md:py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-10 items-center">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
                        <h3 className="text-3xl md:text-4xl font-black tracking-tight">Why a Recursive Engine?</h3>
                        <p className="mt-4 text-slate-600 leading-relaxed text-lg">
                            Because understanding is layered. Alfred treats learning like expanding concentric circles, not dumping text.
                        </p>
                        <ul className="mt-8 space-y-5">
                            <li className="flex gap-4">
                                <span className="mt-1 inline-flex w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold items-center justify-center">1</span>
                                <p className="text-slate-700">Start broad to establish context and reduce confusion.</p>
                            </li>
                            <li className="flex gap-4">
                                <span className="mt-1 inline-flex w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold items-center justify-center">2</span>
                                <p className="text-slate-700">Dive where you need clarity using targeted node expansion.</p>
                            </li>
                            <li className="flex gap-4">
                                <span className="mt-1 inline-flex w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-sm font-bold items-center justify-center">3</span>
                                <p className="text-slate-700">Build a persistent mental model rather than memorizing fragments.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-[2rem] bg-slate-900 border border-slate-800 p-8 md:p-10 text-white">
                        <h4 className="text-2xl md:text-3xl font-black tracking-tight">System Pipeline</h4>
                        <p className="mt-3 text-slate-300">A specialized agent chain executes every question before rendering the graph.</p>
                        <div className="mt-8 grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                                <GitCommitHorizontal className="w-5 h-5 text-blue-400 mb-3" />
                                <p className="font-bold">Intent Guard</p>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                                <Layers className="w-5 h-5 text-indigo-400 mb-3" />
                                <p className="font-bold">Entity Extraction</p>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                                <Network className="w-5 h-5 text-teal-400 mb-3" />
                                <p className="font-bold">Graph Validation</p>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                                <BrainCircuit className="w-5 h-5 text-cyan-400 mb-3" />
                                <p className="font-bold">Structured Delivery</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="technology" className="py-20 md:py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-5 md:px-8 text-center">
                    <h3 className="text-3xl md:text-5xl font-black tracking-tight">Built for serious learners</h3>
                    <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        From one question to full mastery, Alfred turns complexity into a navigable map of knowledge.
                    </p>
                    <div className="mt-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-10 max-w-4xl mx-auto">
                        <p className="text-xl md:text-2xl font-bold">Understand faster. Retain longer. Think in systems, not snippets.</p>
                    </div>
                </div>
            </section>

            <footer className="bg-slate-950 py-12 text-slate-400">
                <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <p>© {new Date().getFullYear()} Alfred Recursive Learning Engine</p>
                    <p>Designed for clarity and depth.</p>
                </div>
            </footer>
        </div>
    );
}
