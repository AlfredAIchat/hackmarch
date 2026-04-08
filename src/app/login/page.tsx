'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { gsap } from 'gsap';

export default function LoginPage() {
    const router = useRouter();
    const { isLoggedIn, login, loadFromStorage } = useUserStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const bgRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    
    // Abstract elements for parallax
    const floatersRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setMounted(true);
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (mounted && isLoggedIn) {
            router.push('/');
        }
    }, [mounted, isLoggedIn, router]);

    // Parallax GSAP animation
    useEffect(() => {
        if (!mounted || !bgRef.current) return;
        
        let ctx = gsap.context(() => {
            // Initial entrance
            gsap.fromTo(heroRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.1 });
            gsap.fromTo(formRef.current, { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.7)", delay: 0.3 });

            // Animate abstract floaters
            floatersRef.current.forEach((el, index) => {
                if (el) {
                    gsap.fromTo(el, 
                        { opacity: 0, scale: 0.8 }, 
                        { opacity: 1, scale: 1, duration: 2, ease: "power2.out", delay: index * 0.15 }
                    );
                    
                    gsap.to(el, {
                        y: "random(-20, 20)",
                        x: "random(-20, 20)",
                        rotation: "random(-15, 15)",
                        duration: "random(4, 7)",
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut"
                    });
                }
            });

            // Parallax on mouse move
            const handleMouseMove = (e: MouseEvent) => {
                const x = (e.clientX / window.innerWidth - 0.5);
                const y = (e.clientY / window.innerHeight - 0.5);
                
                floatersRef.current.forEach((el, i) => {
                    if (el) {
                        const depth = (i + 1) * 30; // parallax factor
                        gsap.to(el, {
                            x: -x * depth,
                            y: -y * depth,
                            duration: 1.5,
                            ease: "power2.out"
                        });
                    }
                });
                
                if (formRef.current) {
                    gsap.to(formRef.current, {
                        x: x * 10,
                        y: y * 10,
                        rotateY: x * 5,
                        rotateX: -y * 5,
                        duration: 1,
                        ease: "power2.out"
                    });
                }
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
            };
        }, bgRef);

        return () => ctx.revert();
    }, [mounted]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        
        // Exit animation
        gsap.to(bgRef.current, { 
            opacity: 0, 
            scale: 1.05, 
            duration: 0.8, 
            ease: "power3.inOut", 
            onComplete: () => {
                const username = name.trim().toLowerCase().replace(/\s+/g, '_');
                login(username, name.trim());
                router.push('/');
            }
        });
    };

    if (!mounted) return null;

    return (
        <div ref={bgRef} className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-800 overflow-hidden relative perspective-1000">
            
            {/* GSAP Parallax Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
                <div 
                    ref={el => { floatersRef.current[0] = el; }} 
                    className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full mix-blend-multiply blur-3xl opacity-60 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(14,165,164,0.3), transparent 70%)' }} 
                />
                <div 
                    ref={el => { floatersRef.current[1] = el; }} 
                    className="absolute bottom-[10%] right-[10%] w-[45vw] h-[45vw] rounded-full mix-blend-multiply blur-3xl opacity-60 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.3), transparent 70%)' }} 
                />
                 <div 
                    ref={el => { floatersRef.current[2] = el; }} 
                    className="absolute top-[30%] right-[30%] w-[25vw] h-[25vw] rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.3), transparent 70%)' }} 
                />
            </div>

            {/* Content Container */}
            <div className="z-10 w-full max-w-7xl px-6 grid md:grid-cols-2 gap-12 lg:gap-20 items-center justify-between" style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Left Side: Hero Message */}
                <div ref={heroRef} className="flex flex-col justify-center max-md:text-center max-md:mt-16">
                    <div className="inline-flex items-center space-x-3 mb-8 max-md:mx-auto">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #0EA5A4, #2563EB)' }}>
                            <span className="text-xl font-bold text-white">A</span>
                        </div>
                        <span className="text-lg font-bold tracking-widest text-[#0F172A] uppercase">Alfred AI</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-[#0F172A] leading-[1.1]">
                        Exploration, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Accelerated.</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl md:leading-relaxed font-medium">
                        World-class visual learning engine that reconstructs information layer by layer natively within your browser. 
                    </p>
                </div>

                {/* Right Side: Interactive Login Card */}
                <div className="flex justify-center w-full" style={{ transformStyle: 'preserve-3d' }}>
                    <div 
                        ref={formRef} 
                        className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-10 lg:p-12 border border-white/80 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
                    >
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl font-bold text-[#0F172A]">Initialize Workspace</h2>
                            <p className="text-sm text-slate-500 mt-3 font-medium">Personalized for a localized knowledge journey.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Creator"
                                    autoFocus
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-lg font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
                                    maxLength={40}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim() || isLoading}
                                className="group relative w-full h-[64px] flex items-center justify-center rounded-2xl overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-500" />
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
                                <span className="relative text-white font-bold tracking-wide text-lg flex items-center">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Enter Alfred
                                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
