'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BrainCircuit,
    CheckCircle,
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
        
        setTimeout(() => {
            const username = name.trim().toLowerCase().replace(/\s+/g, '_');
            login(username, name.trim());
            router.push('/');
        }, 600);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden scroll-smooth">
            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-black tracking-tight">ALFRED</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-12 text-sm font-semibold">
                        <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition">How It Works</a>
                        <a href="#why-recursive" className="text-slate-600 hover:text-slate-900 transition">Why Recursive</a>
                        <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col gap-8"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="inline-flex items-center gap-2 w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Revolutionary Learning Platform
                                </div>
                                
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                                    Understand any topic
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500">
                                        by seeing the connections
                                    </span>
                                </h1>
                            </div>

                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-md">
                                ALFRED converts your questions into interactive visual concept maps. Learn recursively, drill deeper on demand, and build real understanding instead of memorizing fragments.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <a href="#session" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition">
                                    Start Learning
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold hover:border-slate-300 hover:bg-slate-50 transition">
                                    Learn More
                                </a>
                            </div>

                            <div className="flex items-center gap-6 pt-4">
                                <div>
                                    <div className="text-2xl font-black text-slate-900">100%</div>
                                    <div className="text-sm text-slate-600">Private & Local</div>
                                </div>
                                <div className="w-px h-12 bg-slate-200" />
                                <div>
                                    <div className="text-2xl font-black text-slate-900">AI-Powered</div>
                                    <div className="text-sm text-slate-600">Agent Pipeline</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Signup Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-2xl" />
                            
                            <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500" />
                                
                                <div className="p-8 md:p-10">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">Begin Your Journey</h2>
                                    <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                                        Create a free profile and start exploring any topic you'd like to master.
                                    </p>

                                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                        <div className="space-y-2.5">
                                            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Your Name
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Sarah Chen"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                maxLength={40}
                                                required
                                                autoComplete="off"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isLoading}
                                            className="w-full px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-all"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Initializing
                                                </>
                                            ) : (
                                                <>
                                                    Enter ALFRED
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <Zap className="w-3.5 h-3.5" />
                                        No credit card required
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-28 bg-slate-50 border-t border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">How ALFRED Works</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            A revolutionary approach to understanding: visual concept mapping powered by intelligent agent reasoning.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-slate-200 p-8"
                        >
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black mb-3">Ask a Question</h3>
                            <p className="text-slate-600">
                                Type any question about a topic you want to understand, from quantum physics to medieval history.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-slate-200 p-8"
                        >
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-6">
                                <Network className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black mb-3">Get Concept Map</h3>
                            <p className="text-slate-600">
                                Our AI agent pipeline extracts core concepts and builds an interactive visual graph automatically.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-slate-200 p-8"
                        >
                            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-6">
                                <Layers className="w-6 h-6 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-black mb-3">Recurse Deeper</h3>
                            <p className="text-slate-600">
                                Click any node to expand and drill into its foundational concepts. Learn layer by layer.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Recursive */}
            <section id="why-recursive" className="py-28 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                                Why Recursive Understanding Actually Works
                            </h2>
                            
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Traditional learning buries you in monolithic text blocks. Our recursive engine builds understanding in layers, starting broad and drilling into depth exactly where you need clarity.
                            </p>

                            <div className="space-y-4 pt-6">
                                <div className="flex gap-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">See Real Relationships</h4>
                                        <p className="text-slate-600">Concepts map visually so you understand how everything connects.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">Control Your Pace</h4>
                                        <p className="text-slate-600">Expand any layer on demand—no cognitive overload from forced depth.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">Retain Longer</h4>
                                        <p className="text-slate-600">Systems thinking builds mental models, not fragmented memorization.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">100% Private</h4>
                                        <p className="text-slate-600">Your learning data stays on your device. No tracking, no sharing.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-8 md:p-10"
                        >
                            <h3 className="text-2xl font-black mb-6">Intelligent Pipeline</h3>
                            <div className="space-y-3">
                                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                                    <p className="font-bold text-slate-900">Intent Guard</p>
                                    <p className="text-sm text-slate-600 mt-1">Interprets your question intent accurately.</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                                    <p className="font-bold text-slate-900">Entity Extraction</p>
                                    <p className="text-sm text-slate-600 mt-1">Identifies core concepts and relationships.</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900">Graph Validation</p>
                                    <p className="text-sm text-slate-600 mt-1">Ensures logical coherence and completeness.</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border-l-4 border-teal-500">
                                    <p className="font-bold text-slate-900">Visual Delivery</p>
                                    <p className="text-sm text-slate-600 mt-1">Renders an interactive, navigable map.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-28 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Built for Learning Excellence</h2>
                        <p className="text-lg text-slate-600">
                            Every feature designed to transform how you understand complex topics.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: BrainCircuit,
                                title: 'AI-Powered Analysis',
                                description: 'Multi-agent reasoning extracts and validates concepts with semantic precision.'
                            },
                            {
                                icon: Network,
                                title: 'Interactive Graphs',
                                description: 'Drag, explore, and zoom into concept relationships dynamically rendered.'
                            },
                            {
                                icon: Focus,
                                title: 'Recursive Drilldown',
                                description: 'Infinite depth—expand any concept layer by layer until mastery.'
                            },
                            {
                                icon: Zap,
                                title: 'Instant Generation',
                                description: 'Question to visual map in milliseconds using streaming inference.'
                            },
                            {
                                icon: Layers,
                                title: 'Knowledge Persistence',
                                description: 'Sessions saved locally—your learning history stays entirely private.'
                            },
                            {
                                icon: GitCommitHorizontal,
                                title: 'Version Tracking',
                                description: 'Track concept evolution and refinements across learning sessions.'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                            >
                                <feature.icon className="w-7 h-7 text-blue-600 mb-4" />
                                <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                                <p className="text-slate-600 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="session" className="py-28 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
                        <div className="relative px-8 py-16 md:px-12 md:py-24">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                            
                            <div className="relative z-10 text-center max-w-2xl mx-auto">
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                                    Ready to Learn Smarter?
                                </h2>
                                <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                                    Start building interactive concept maps today. No credit card required. Your learning, your data, your pace.
                                </p>
                                <a href="#session" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition">
                                    Start Free Today
                                    <ArrowRight className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <BrainCircuit className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-black text-white">ALFRED</span>
                            </div>
                            <p className="text-sm">Recursive learning engine.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 text-sm">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                                <li><a href="#why-recursive" className="hover:text-white transition">Methodology</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 text-sm">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 text-sm">Connect</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
                        <p>&copy; {new Date().getFullYear()} ALFRED. All rights reserved.</p>
                        <p>Designed and built with precision.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
