'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════
   Constants & Data
   ═══════════════════════════════════════════ */

const FEATURES = [
  { icon: '🧠', title: 'Recursive Deep Learning', desc: 'Explore any concept infinitely deeper. Click on terms to branch into new knowledge paths while maintaining context.' },
  { icon: '⚡', title: '11-Agent AI Pipeline', desc: 'Powered by a LangGraph multi-agent system — intent guard, answer gen, hallucination check, and more.' },
  { icon: '🌳', title: 'Knowledge Tree Viz', desc: 'Watch your learning journey grow as an interactive knowledge tree in real-time.' },
  { icon: '📝', title: 'Adaptive Quizzes', desc: 'Auto-generated assessments from explored concepts with instant scoring and explanations.' },
  { icon: '🎤', title: 'Voice Input', desc: 'Speak your questions naturally — powered by Sarvam AI speech-to-text.' },
  { icon: '🔗', title: 'Concept Linking', desc: 'Clickable concepts in every answer let you explore deeper without losing your original context.' },
];

const TESTIMONIALS = [
  { name: 'Dr. Sarah Chen', role: 'AI Research Lead, Stanford', avatar: '👩‍🔬', text: 'Alfred completely transformed how I explore new research domains. The recursive depth is unlike anything I\'ve seen.', rating: 5 },
  { name: 'Marcus Williams', role: 'Senior Engineer, Google', avatar: '👨‍💻', text: 'The 11-agent pipeline is genius. Every answer is fact-checked and the concept extraction is remarkably accurate.', rating: 5 },
  { name: 'Priya Sharma', role: 'PhD Student, MIT', avatar: '👩‍🎓', text: 'I used Alfred for my thesis research — it saved me hundreds of hours by connecting concepts I would have missed.', rating: 5 },
  { name: 'James Rodriguez', role: 'CTO, NeuralPath', avatar: '👨‍💼', text: 'We integrated Alfred into our team\'s learning workflow. Onboarding time dropped by 60%.', rating: 5 },
  { name: 'Dr. Emily Watson', role: 'Professor, Oxford', avatar: '👩‍🏫', text: 'The knowledge tree visualization is beautiful. Students can finally see how concepts relate to each other.', rating: 5 },
  { name: 'Alex Kim', role: 'Data Scientist, Meta', avatar: '🧑‍💻', text: 'Best learning tool I\'ve ever used. The quiz generation from explored concepts is incredibly smart.', rating: 5 },
];

const STATS = [
  { value: '50K+', label: 'Active Learners' },
  { value: '2M+', label: 'Concepts Explored' },
  { value: '99.2%', label: 'Accuracy Rate' },
  { value: '<3s', label: 'Avg Response' },
];

const PIPELINE_STEPS = [
  { agent: 'Intent Guard', desc: 'Validates and classifies your query', color: '#3B82F6' },
  { agent: 'Answer Agent', desc: 'Generates comprehensive response', color: '#6366F1' },
  { agent: 'Hallucination Check', desc: 'Fact-checks every claim', color: '#8B5CF6' },
  { agent: 'Concept Extractor', desc: 'Identifies key explorable terms', color: '#06B6D4' },
  { agent: 'Knowledge Builder', desc: 'Builds your learning tree', color: '#10B981' },
];

/* ═══════════════════════════════════════════
   Reusable Components
   ═══════════════════════════════════════════ */

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: '60px' }}>
      <span className="landing-eyebrow">{eyebrow}</span>
      <h2 className="landing-section-title">{title}</h2>
      <p className="landing-section-subtitle">{subtitle}</p>
    </motion.div>
  );
}

function TestimonialCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      className="landing-testimonial-card"
    >
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
        {[...Array(t.rating)].map((_, j) => <span key={j} style={{ fontSize: '14px' }}>⭐</span>)}
      </div>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#334155', marginBottom: '20px', fontStyle: 'italic' }}>"{t.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #DBEAFE, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{t.avatar}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{t.name}</div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Main Landing Page
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-advance testimonial carousel
  useEffect(() => {
    const timer = setInterval(() => setCarouselIdx(prev => (prev + 1) % Math.ceil(TESTIMONIALS.length / 3)), 5000);
    return () => clearInterval(timer);
  }, []);

  const goToLogin = () => router.push('/login');

  return (
    <div className="landing-root">
      {/* ══════ Floating Orbs Background ══════ */}
      <div className="landing-orbs">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      {/* ══════ Navigation ══════ */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="landing-logo-icon"><span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>A</span></div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Alfred AI</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Recursive Learning Engine</div>
            </div>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={goToLogin} className="landing-btn-ghost">Log In</button>
            <button onClick={goToLogin} className="landing-btn-primary">Get Started Free →</button>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="landing-hero">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="landing-hero-content">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="landing-hero-badge">
            <span className="landing-badge-dot" />
            Powered by 11 AI Agents
          </motion.div>

          <h1 className="landing-hero-title">
            Learn <span className="landing-gradient-text">Anything</span>.<br />
            Explore <span className="landing-gradient-text">Everything</span>.
          </h1>

          <p className="landing-hero-subtitle">
            Alfred AI uses a multi-agent pipeline to break down complex topics into explorable knowledge trees.
            Click on any concept to dive deeper — infinitely.
          </p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goToLogin} className="landing-btn-hero">
              Start Exploring Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="landing-btn-hero-ghost">
              See How It Works
            </button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }} className="landing-stats-bar">
            {STATS.map((s, i) => (
              <div key={i} className="landing-stat">
                <div className="landing-stat-value">{s.value}</div>
                <div className="landing-stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Visual — Animated Pipeline Preview */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="landing-hero-visual">
          <div className="landing-demo-card">
            <div className="landing-demo-header">
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FCA5A5' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FCD34D' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6EE7B7' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Alfred AI — Live Pipeline</span>
            </div>
            <div className="landing-demo-body">
              <div className="landing-demo-question">
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>→</span> How do neural networks learn?
              </div>
              <div className="landing-pipeline-flow">
                {PIPELINE_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.3, duration: 0.4 }}
                    className="landing-pipeline-step"
                  >
                    <div className="landing-pipeline-dot" style={{ background: step.color }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{step.agent}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{step.desc}</div>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 1.2 + i * 0.3, duration: 0.6 }}
                      style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: step.color, borderRadius: '2px', opacity: 0.5 }}
                    />
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} className="landing-demo-concepts">
                {['Backpropagation', 'Gradient Descent', 'Loss Function', 'Activation Functions'].map((c, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.2 + i * 0.15 }} className="landing-concept-pill">{c}</motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════ FEATURES ══════ */}
      <section id="features" className="landing-section">
        <SectionTitle eyebrow="✨ CAPABILITIES" title="Everything You Need to Learn Smarter" subtitle="A complete AI-powered learning ecosystem that adapts to your curiosity." />
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(59,130,246,0.12)' }}
              className="landing-feature-card"
            >
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how-it-works" className="landing-section landing-section--alt">
        <SectionTitle eyebrow="🔄 PIPELINE" title="How Alfred Thinks" subtitle="Every question flows through 11 specialized AI agents for maximum accuracy and depth." />
        <div className="landing-how-grid">
          {[
            { step: '01', title: 'Ask Anything', desc: 'Type or speak your question. Alfred\'s Intent Guard ensures it\'s answerable and safe.', icon: '💬' },
            { step: '02', title: 'AI Pipeline Activates', desc: '11 agents process in parallel — generating, fact-checking, and extracting concepts.', icon: '⚡' },
            { step: '03', title: 'Explore Deeper', desc: 'Click highlighted concepts to branch deeper. Your knowledge tree grows in real-time.', icon: '🌳' },
            { step: '04', title: 'Test & Validate', desc: 'Take AI-generated quizzes to solidify your understanding with instant feedback.', icon: '🏆' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="landing-how-card"
            >
              <div className="landing-how-step">{s.step}</div>
              <div className="landing-how-icon">{s.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section id="testimonials" className="landing-section">
        <SectionTitle eyebrow="💬 TESTIMONIALS" title="Loved by Learners Worldwide" subtitle="Join thousands of researchers, engineers, and students who learn smarter with Alfred." />
        <div className="landing-carousel-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIdx}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5 }}
              className="landing-testimonials-row"
            >
              {TESTIMONIALS.slice(carouselIdx * 3, carouselIdx * 3 + 3).map((t, i) => (
                <TestimonialCard key={`${carouselIdx}-${i}`} t={t} i={i} />
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="landing-carousel-dots">
            {[0, 1].map(idx => (
              <button key={idx} onClick={() => setCarouselIdx(idx)} className={`landing-carousel-dot ${carouselIdx === idx ? 'landing-carousel-dot--active' : ''}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="landing-cta-section">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="landing-cta-card">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.2 }}>
            Ready to Learn Without Limits?
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', maxWidth: '500px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Join 50,000+ learners exploring knowledge infinitely deep with AI-powered recursive understanding.
          </p>
          <button onClick={goToLogin} className="landing-btn-cta">
            Get Started Free — It's Instant
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>
          </button>
        </motion.div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="landing-logo-icon"><span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>A</span></div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#334155' }}>Alfred AI</span>
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>© 2024 Alfred AI. All rights reserved. Made with ❤️ for curious minds.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>Terms</a>
            <a href="https://github.com/AlfredAIchat/hackmarch" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
