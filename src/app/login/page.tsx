'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import { 
    BrainCircuit, 
    Network, 
    Zap, 
    ChevronRight, 
    Layers, 
    Lightbulb, 
    ArrowRight, 
    Sparkles, 
    GitCommitHorizontal, 
    Focus
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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">ALFRED</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
                        <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
                        <a href="#recursive-engine" className="hover:text-slate-900 transition-colors">Recursive Engine</a>
                        <a href="#technology" className="hover:text-slate-900 transition-colors">Technology</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Artistic background blobs - repositioned and resized to avoid clipping layouts */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none hidden md:block translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none hidden md:block -translate-x-1/3 translate-y-1/4" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                    <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
                        
                        {/* Left Side: Copy */}
                        <div className="lg:col-span-7 flex flex-col items-start xl:pr-12 text-left">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8 text-blue-700"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">The Future of Learning</span>
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="text-5xl sm:text-6xl lg:text-[4.5rem] font-black text-slate-900 tracking-tight leading-[1.05] mb-8"
                            >
                                Stop Reading.<br />
                                Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Understanding.</span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed"
                            >
                                Alfred is a revolutionary <strong>recursive understanding engine</strong>. We transform complex topics into interactive visual graphs, revealing the fundamental layers behind every concept.
                            </motion.p>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center gap-6"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" /></div>
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="user" /></div>
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" alt="user" /></div>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-600">
                                        Join <span className="text-blue-600">early adopters</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Side: Enhanced Form Card with explicit deep layout structure (Fix for overlap) */}
                        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                                className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative group shrink-0"
                            >
                                {/* Decorative top bar */}
                                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400" />
                                
                                <div className="px-8 py-10 sm:px-12 sm:pt-14 sm:pb-12 flex flex-col gap-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Initialize Workspace</h3>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                            Enter a display name to begin your private session. Your progress lives locally on your device.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                                        <div className="flex flex-col gap-2 w-full">
                                            <label htmlFor="displayName" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                                Display Name
                                            </label>
                                            <input
                                                id="displayName"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="E.g., John Doe"
                                                className="w-full h-16 box-border px-5 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-lg font-semibold rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/10"
                                                maxLength={40}
                                                required
                                                autoComplete="off"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isLoading}
                                            className="relative w-full h-16 shrink-0 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-900/20 overflow-hidden group/btn flex items-center justify-center"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin z-10" />
                                            ) : (
                                                <span className="flex items-center gap-2 z-10 transition-transform">
                                                    Enter Alfred
                                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                </div>
                                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 mt-auto flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Zap className="w-3.5 h-3.5" />
                                        100% Local Processing Engine
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Navigation Anchor Space Fix */}
            <div id="how-it-works" className="h-20" />

            {/* Feature Section 1: The Problem & Solution */}
            <section className="pb-24 pt-10 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">The End of the Endless Scroll.</h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Traditional chatbots bury you in dense blocks of text. Alfred reframes interaction visually—transforming how knowledge is mapped, delivered, and understood.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Box 1 */}
                        <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-slate-200">
                                <Layers className="w-7 h-7 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">The Text Problem</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Reading long AI-generated paragraphs demands immense cognitive load, making it painful to see how independent concepts connect contextually.</p>
                        </div>
                        
                        {/* Box 2 */}
                        <div className="bg-blue-50 p-10 rounded-[2rem] border border-blue-100 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-bl-[100px] -z-0 opacity-50" />
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20 flex items-center justify-center mb-8 relative z-10">
                                <Network className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-4 relative z-10">Visual Knowledge Graphs</h3>
                            <p className="text-blue-700 leading-relaxed font-medium relative z-10">We map the foundational architecture of any topic into interactive node trees. You instantly see the big picture mapped out logically.</p>
                        </div>

                        {/* Box 3 */}
                        <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-slate-200">
                                <Focus className="w-7 h-7 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Zero Into Context</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Stop hunting for facts inside monolithic essays. Our agentic pipeline extracts core entities so you can grasp the crux immediately.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div id="recursive-engine" className="h-20 bg-slate-50" />

            {/* Feature Section 2: Recursive Engine */}
            <section className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            {/* Abstract Graphic representation of recursive nodes */}
                            <div className="aspect-square bg-white rounded-[3rem] border border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm">
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
                                
                                <div className="relative z-10">
                                    {/* Center Node */}
                                    <motion.div 
                                        animate={{ y: [0, -10, 0] }} 
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center border-[3px] border-blue-500 relative z-20"
                                    >
                                        <span className="font-bold text-slate-800 text-sm">Quantum</span>
                                    </motion.div>
                                    
                                    {/* Satellite Nodes */}
                                    <motion.div 
                                        animate={{ y: [0, 8, 0] }} 
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="absolute -top-20 -left-16 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-indigo-200"
                                    >
                                        <span className="font-bold text-slate-600 text-xs">Superpos.</span>
                                    </motion.div>
                                    
                                    <motion.div 
                                        animate={{ y: [0, -8, 0] }} 
                                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                        className="absolute -bottom-16 -right-12 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-teal-200"
                                    >
                                        <span className="font-bold text-slate-600 text-xs">Entangl.</span>
                                    </motion.div>

                                    {/* Lines SVG */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible', zIndex: 10 }}>
                                        <path d="M0,0 L-64,-80" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                                        <path d="M0,0 L48,64" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-10 tracking-tight">The <span className="text-blue-600">Recursive Engine</span>,<br/>Explained.</h2>
                            <div className="space-y-10">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-900 font-black text-lg">1</div>
                                    <div className="pt-2">
                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Start Broad</h4>
                                        <p className="text-slate-500 font-medium leading-relaxed">Ask a complex overarching question, like "How do rockets work?". Alfred parses it and breaks it down into immediate, comprehensible pillars like Thrust, Propellant, and Aerodynamics.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-900 font-black text-lg">2</div>
                                    <div className="pt-2">
                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Click to Dive Deeper</h4>
                                        <p className="text-slate-500 font-medium leading-relaxed">You encounter a node you need more context on, e.g., "Propellant". Click it. Alfred's system autonomously triggers a new targeted search, extrapolating the concepts exclusive to Propellant.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-900 font-black text-lg">3</div>
                                    <div className="pt-2">
                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Infinite Granularity</h4>
                                        <p className="text-slate-500 font-medium leading-relaxed">You can continue this recursively forever until you hit the atomic level of understanding. We build the conceptual tree live as you learn.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div id="technology" className="h-20 bg-slate-900" />

            {/* Feature Section 3: The Architecture */}
            <section className="py-24 bg-slate-900 text-white border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 mb-8 text-slate-300"
                        >
                            <BrainCircuit className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Multi-Agent Workflow</span>
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">An Autonomous Logic Pipeline.</h2>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Under the hood, Alfred isn't just generating single-pass text. It operates an intricate, multi-agent AI architecture processing, vetting, and routing your queries.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                            <GitCommitHorizontal className="w-8 h-8 text-blue-400 mb-6" />
                            <h4 className="font-bold text-lg mb-3 text-white">1. Intent Guard</h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">We intercept your query to classify intent securely, ensuring the most optimized agent triggers the response.</p>
                        </div>
                        <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                            <Layers className="w-8 h-8 text-indigo-400 mb-6" />
                            <h4 className="font-bold text-lg mb-3 text-white">2. Intelligence Parsing</h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">Instead of hallucinating essays, the engine extracts structured entities directly into strict, validated JSON formats.</p>
                        </div>
                        <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                            <Network className="w-8 h-8 text-teal-400 mb-6" />
                            <h4 className="font-bold text-lg mb-3 text-white">3. Network Validation</h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">We aggressively ensure the internal logic maps flawlessly to a visual hierarchy before rendering the UI components.</p>
                        </div>
                        <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                            <BrainCircuit className="w-8 h-8 text-purple-400 mb-6" />
                            <h4 className="font-bold text-lg mb-3 text-white">4. Graph Delivery</h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">The vetted payload streams directly to our graphics engine, expanding your session dynamically without latency.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 py-16 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <BrainCircuit className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-black text-white tracking-tight">ALFRED</span>
                        </div>
                        <div className="flex gap-6 text-sm font-semibold text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-slate-500 font-medium text-sm">
                        <p>&copy; {new Date().getFullYear()} Alfred Recursive Learning Engine. All rights reserved.</p>
                        <p className="mt-2 md:mt-0">Built with precision.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
