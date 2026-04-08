'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { gsap } from 'gsap';
import { BrainCircuit, Zap, Network, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const { isLoggedIn, login, loadFromStorage } = useUserStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const mainRef = useRef<HTMLDivElement>(null);
    const orb1Ref = useRef<HTMLDivElement>(null);
    const orb2Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (mounted && isLoggedIn) {
            router.push('/');
        }
    }, [mounted, isLoggedIn, router]);

    // Complex GSAP Parallax & Animation
    useEffect(() => {
        if (!mounted || !mainRef.current || !orb1Ref.current || !orb2Ref.current) return;
        
        const ctx = gsap.context(() => {
            // Background idle floating
            gsap.to(orb1Ref.current, {
                x: 'random(-50, 50)',
                y: 'random(-50, 50)',
                scale: 'random(0.9, 1.1)',
                duration: 'random(4, 8)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            gsap.to(orb2Ref.current, {
                x: 'random(-50, 50)',
                y: 'random(-50, 50)',
                scale: 'random(0.9, 1.1)',
                duration: 'random(4, 8)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 2
            });

            // Smooth pointer tracking for parallax
            const handleMouseMove = (e: MouseEvent) => {
                const x = (e.clientX / window.innerWidth - 0.5);
                const y = (e.clientY / window.innerHeight - 0.5);
                
                gsap.to(orb1Ref.current, {
                    x: -x * 80,
                    y: -y * 80,
                    duration: 2,
                    ease: "power3.out"
                });
                gsap.to(orb2Ref.current, {
                    x: x * 100,
                    y: y * 100,
                    duration: 2,
                    ease: "power3.out"
                });
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }, mainRef);

        return () => ctx.revert();
    }, [mounted]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        
        // Page exit animation
        if(mainRef.current) {
            gsap.to(mainRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.6,
                ease: "power3.inOut",
                onComplete: () => {
                    const username = name.trim().toLowerCase().replace(/\s+/g, '_');
                    login(username, name.trim());
                    router.push('/');
                }
            });
        }
    };

    if (!mounted) return null;

    return (
        <div ref={mainRef} className="min-h-screen relative w-full bg-[#FAFAFA] overflow-hidden selection:bg-blue-200 flex flex-col justify-between">
            
            {/* --- Premium Grid Background & Parallax Orbs --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0" style={{ 
                    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)', 
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                    opacity: 0.4 
                }} />
                <div 
                    ref={orb1Ref}
                    className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-[140px] opacity-20"
                />
                <div 
                    ref={orb2Ref}
                    className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-[140px] opacity-20"
                />
            </div>

            {/* --- Top Navigation --- */}
            <nav className="relative z-50 w-full px-6 md:px-12 py-8 flex items-center justify-between">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex items-center gap-3"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">ALFRED</span>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hidden md:flex gap-8 text-sm font-bold text-slate-500"
                >
                    <span className="cursor-pointer hover:text-slate-900 transition-colors">Platform</span>
                    <span className="cursor-pointer hover:text-slate-900 transition-colors">Methodology</span>
                    <span className="cursor-pointer hover:text-slate-900 transition-colors">Pricing</span>
                </motion.div>
            </nav>

            {/* --- Main Content Split --- */}
            <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 my-auto grid lg:grid-cols-2 gap-16 lg:gap-8 items-center pb-20">
                
                {/* Left: Hero Copy & Product Selling Points */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col max-lg:items-center max-lg:text-center mt-10 md:mt-0"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8 max-lg:mx-auto">
                        <Zap className="w-4 h-4 text-blue-600" fill="currentColor" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Version 2.0 is Live</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                        Learn anything,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500">
                            Layer by layer.
                        </span>
                    </h1>
                    
                    <p className="text-[17px] sm:text-xl text-slate-500 mb-12 max-w-[500px] leading-relaxed font-medium">
                        Alfred is the world's first recursive learning engine. See how concepts connect naturally through interactive visual graphs instead of endless text.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 w-full max-w-lg max-lg:text-left">
                        <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                                <Network className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Visual Graphs</h3>
                                <p className="text-sm text-slate-500 leading-normal font-medium">Watch ideas branch out dynamically as you ask targeted questions.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                                <BrainCircuit className="w-6 h-6 text-teal-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Deep Recursion</h3>
                                <p className="text-sm text-slate-500 leading-normal font-medium">Click any concept to zoom in and expand its fundamental layers.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right: The Login Form Card */}
                <motion.div 
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex justify-center lg:justify-end"
                >
                    <div className="w-full max-w-[460px] bg-white/90 backdrop-blur-3xl p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative">
                        {/* Decorative top edge */}
                        <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 rounded-t-[2rem]" />
                        
                        <div className="mb-8 pt-2">
                            <h2 className="text-[28px] font-black text-slate-900 tracking-tight">Initialize Workspace</h2>
                            <p className="text-slate-500 text-[15px] mt-2 font-medium">Your progress is saved securely on your device.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label htmlFor="displayName" className="block text-[12px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                    Display Name
                                </label>
                                {/* Strictly controlled CSS to prevent overlap bugs */}
                                <div className="relative block">
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="block w-full h-[64px] px-5 bg-slate-50 text-slate-900 placeholder:text-slate-300 text-lg font-bold border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 max-h-[64px] overflow-hidden focus:bg-white transition-all shadow-inner"
                                        maxLength={40}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim() || isLoading}
                                className="group relative block w-full h-[64px] bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold text-[17px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] outline-none focus:ring-4 focus:ring-slate-900/20 overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative flex items-center justify-center gap-2 w-full h-full">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Enter Alfred
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                100% Local & Private Processing
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
            
            {/* Added for spacing at bottom if needed */}
            <div className="h-10"></div>
        </div>
    );
}
