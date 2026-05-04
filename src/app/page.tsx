'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Network, NotebookPen, Mic, Link as LinkIcon,
  Users, Search, Target, ShieldCheck, Lightbulb, CheckCircle,
  Puzzle, TreeDeciduous, MessageSquare, Trophy, ArrowRight, Rocket,
  UserCircle2, UserSquare2, Star
} from 'lucide-react';

const FEATURES = [
  { icon: <Brain />, title: 'Recursive Deep Learning', desc: 'Explore any concept infinitely deeper. Click terms to branch into new knowledge paths.', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { icon: <Zap />, title: '11-Agent AI Pipeline', desc: 'Intent guard, answer gen, hallucination check — all running in concert.', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { icon: <Network />, title: 'Knowledge Tree Viz', desc: 'Watch your learning journey grow as a beautiful interactive tree in real-time.', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { icon: <NotebookPen />, title: 'Adaptive Quizzes', desc: 'Auto-generated assessments from explored concepts with instant scoring.', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { icon: <Mic />, title: 'Voice Input', desc: 'Speak your questions naturally — powered by Sarvam AI speech-to-text.', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { icon: <LinkIcon />, title: 'Concept Linking', desc: 'Clickable concepts in every answer let you explore deeper without losing context.', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
];

const TESTIMONIALS = [
  { name: 'Dr. Sarah Chen', role: 'AI Research Lead, Stanford', avatar: <UserCircle2 size={24} />, text: 'Alfred completely transformed how I explore new research domains. The recursive depth is unlike anything I\'ve seen.' },
  { name: 'Marcus Williams', role: 'Senior Engineer, Google', avatar: <UserSquare2 size={24} />, text: 'The 11-agent pipeline is genius. Every answer is fact-checked and concept extraction is remarkably accurate.' },
  { name: 'Priya Sharma', role: 'PhD Student, MIT', avatar: <UserCircle2 size={24} />, text: 'I used Alfred for my thesis research — it saved me hundreds of hours by connecting concepts I would have missed.' },
  { name: 'James Rodriguez', role: 'CTO, NeuralPath', avatar: <UserSquare2 size={24} />, text: 'We integrated Alfred into our team\'s learning workflow. Onboarding time dropped by 60%.' },
  { name: 'Dr. Emily Watson', role: 'Professor, Oxford', avatar: <UserCircle2 size={24} />, text: 'The knowledge tree visualization is beautiful. Students can finally see how concepts relate to each other.' },
  { name: 'Alex Kim', role: 'Data Scientist, Meta', avatar: <UserSquare2 size={24} />, text: 'Best learning tool I\'ve ever used. The quiz generation from explored concepts is incredibly smart.' },
];

const STATS = [
  { value: '50K+', label: 'Active Learners', icon: <Users size={28} /> },
  { value: '2M+', label: 'Concepts Explored', icon: <Search size={28} /> },
  { value: '99.2%', label: 'Accuracy Rate', icon: <Target size={28} /> },
  { value: '<3s', label: 'Avg Response', icon: <Zap size={28} /> },
];

const PIPELINE_STEPS = [
  { agent: 'Intent Guard', desc: 'Validates & classifies your query', color: '#4F46E5', icon: <ShieldCheck size={20} /> },
  { agent: 'Answer Agent', desc: 'Generates comprehensive response', color: '#7C3AED', icon: <Lightbulb size={20} /> },
  { agent: 'Hallucination Check', desc: 'Fact-checks every claim', color: '#EC4899', icon: <CheckCircle size={20} /> },
  { agent: 'Concept Extractor', desc: 'Identifies key explorable terms', color: '#06B6D4', icon: <Puzzle size={20} /> },
  { agent: 'Knowledge Builder', desc: 'Builds your learning tree', color: '#10B981', icon: <TreeDeciduous size={20} /> },
];

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="l-section-heading">
      <span className="l-eyebrow">{eyebrow}</span>
      <h2 className="l-section-title">{title}</h2>
      <p className="l-section-subtitle">{subtitle}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activePipeline, setActivePipeline] = useState(-1);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Auto-advance testimonial carousel
  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(p => (p + 1) % Math.ceil(TESTIMONIALS.length / 3)), 4000);
    return () => clearInterval(t);
  }, []);

  // Pipeline animation loop
  useEffect(() => {
    let i = -1;
    const t = setInterval(() => {
      i = i >= PIPELINE_STEPS.length ? -1 : i + 1;
      setActivePipeline(i);
    }, 1200);
    return () => clearInterval(t);
  }, []);

  const goSignUp = () => router.push('/dashboard');

  return (
    <div className="l-root">
      {/* ═══ BACKGROUND BLOBS ═══ */}
      <div className="l-bg-blobs">
        <div className="l-blob l-blob-1" />
        <div className="l-blob l-blob-2" />
        <div className="l-blob l-blob-3" />
        <div className="l-blob l-blob-4" />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className={`l-nav ${scrolled ? 'l-nav--scrolled' : ''}`}>
        <div className="l-nav-inner">
          <div className="l-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="l-logo">A</div>
            <div>
              <div className="l-logo-text">Alfred AI</div>
              <div className="l-logo-sub">Recursive Learning Engine</div>
            </div>
          </div>
          <div className="l-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Reviews</a>
          </div>
          <div className="l-nav-actions">
            <button onClick={goSignUp} className="l-btn-outline">Log In</button>
            <button onClick={goSignUp} className="l-btn-solid">
              Sign Up Free <Rocket size={16} className="inline ml-1" />
            </button>
          </div>
          {/* Mobile menu button */}
          <button className="l-mobile-menu" onClick={goSignUp}>
            Sign Up <Rocket size={16} className="inline ml-1" />
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="l-hero">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="l-hero-content">
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }} className="l-hero-badge">
            <span className="l-badge-pulse" /> <span>Powered by 11 AI Agents</span> <ArrowRight size={16} />
          </motion.div>

          <h1 className="l-hero-h1">
            Learn <span className="l-grad-text l-grad-blue">Anything</span>.<br />
            Explore <span className="l-grad-text l-grad-purple">Everything</span>.
          </h1>

          <p className="l-hero-p">
            Alfred AI breaks down complex topics into explorable knowledge trees using a multi-agent AI pipeline.
            Click on any concept to dive deeper — <strong>infinitely</strong>.
          </p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="l-hero-ctas">
            <button onClick={goSignUp} className="l-btn-hero">
              Start Exploring Free
              <ArrowRight size={20} />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="l-btn-hero-outline">
              See How It Works
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Demo Card */}
        <motion.div initial={{ opacity: 0, y: 80, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.3, duration: 0.9, type: 'spring' }} className="l-hero-demo-wrap">
          <div className="l-demo-card">
            <div className="l-demo-topbar">
              <div className="l-demo-dots"><span className="l-dot l-dot-r" /><span className="l-dot l-dot-y" /><span className="l-dot l-dot-g" /></div>
              <span className="l-demo-title">Alfred AI — Live Pipeline</span>
              <div style={{ width: '52px' }} />
            </div>
            <div className="l-demo-body">
              <div className="l-demo-q">
                <span className="l-demo-arrow"><ArrowRight size={18} /></span>
                <span>How do neural networks learn?</span>
                <span className="l-demo-send"><ArrowRight size={14} /></span>
              </div>
              <div className="l-pipeline-list">
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={i} className={`l-pipeline-item ${activePipeline === i ? 'l-pipeline-item--active' : ''} ${activePipeline > i ? 'l-pipeline-item--done' : ''}`}>
                    <span className="l-pipeline-emoji flex items-center justify-center text-slate-700">{s.icon}</span>
                    <div className="l-pipeline-info">
                      <div className="l-pipeline-name">{s.agent}</div>
                      <div className="l-pipeline-desc">{s.desc}</div>
                    </div>
                    <div className="l-pipeline-status flex items-center justify-center text-emerald-500">
                      {activePipeline > i ? <CheckCircle size={16} /> : activePipeline === i ? <span className="l-spinner" /> : ''}
                    </div>
                    {activePipeline === i && <div className="l-pipeline-bar" style={{ background: s.color }} />}
                  </div>
                ))}
              </div>
              <div className="l-demo-concepts-row">
                {['Backpropagation', 'Gradient Descent', 'Loss Function', 'Activation Fn'].map((c, i) => (
                  <span key={i} className="l-demo-pill">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="l-stats-row">
          {STATS.map((s, i) => (
            <div key={i} className="l-stat-card">
              <span className="l-stat-icon flex justify-center text-indigo-500 mb-2">{s.icon}</span>
              <span className="l-stat-val">{s.value}</span>
              <span className="l-stat-lbl">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="l-section">
        <SectionHeading eyebrow="✨ CAPABILITIES" title="Everything You Need to Learn Smarter" subtitle="A complete AI-powered learning ecosystem built for the deeply curious." />
        <div className="l-features-grid">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.08, duration: 0.5 }} className="l-feature-card">
              <div className="l-feature-icon" style={{ background: f.gradient }}>{f.icon}</div>
              <h3 className="l-feature-title">{f.title}</h3>
              <p className="l-feature-desc">{f.desc}</p>
              <div className="l-feature-glow" style={{ background: f.gradient }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="l-section l-section--colored">
        <SectionHeading eyebrow="🔄 THE PIPELINE" title="How Alfred Thinks" subtitle="Every question flows through 11 specialized AI agents for maximum accuracy." />
        <div className="l-how-grid">
          {[
            { step: '01', title: 'Ask Anything', desc: 'Type or speak your question. Alfred ensures it\'s answerable and safe.', icon: <MessageSquare size={36} />, color: '#4F46E5' },
            { step: '02', title: 'AI Pipeline Fires', desc: '11 agents work in parallel — generating, checking, and extracting.', icon: <Zap size={36} />, color: '#7C3AED' },
            { step: '03', title: 'Explore Deeper', desc: 'Click highlighted concepts to branch deeper into knowledge.', icon: <Network size={36} />, color: '#06B6D4' },
            { step: '04', title: 'Test Yourself', desc: 'Take AI-generated quizzes to solidify your understanding.', icon: <Trophy size={36} />, color: '#F59E0B' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6, type: 'spring' }} className="l-how-card">
              <div className="l-how-num" style={{ color: s.color }}>{s.step}</div>
              <div className="l-how-emoji flex justify-center text-slate-800 mb-4">{s.icon}</div>
              <h3 className="l-how-title">{s.title}</h3>
              <p className="l-how-desc">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="l-section">
        <SectionHeading eyebrow="💬 REVIEWS" title="Loved by Learners Worldwide" subtitle="Join thousands of researchers, engineers, and students who learn smarter." />
        <div className="l-carousel-wrap">
          <AnimatePresence mode="wait">
            <motion.div key={carouselIdx} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} transition={{ duration: 0.45, type: 'spring', stiffness: 200 }} className="l-testi-row">
              {TESTIMONIALS.slice(carouselIdx * 3, carouselIdx * 3 + 3).map((t, i) => (
                <div key={`${carouselIdx}-${i}`} className="l-testi-card">
                  <div className="l-testi-stars flex text-yellow-400 gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill="currentColor" />)}
                  </div>
                  <p className="l-testi-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="l-testi-author">
                    <div className="l-testi-avatar text-indigo-500">{t.avatar}</div>
                    <div>
                      <div className="l-testi-name">{t.name}</div>
                      <div className="l-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="l-carousel-dots">
            {[0, 1].map(idx => (
              <button key={idx} onClick={() => setCarouselIdx(idx)} className={`l-dot-btn ${carouselIdx === idx ? 'l-dot-btn--active' : ''}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="l-cta-section">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, type: 'spring' }} className="l-cta-card">
          <div className="l-cta-glow" />
          <h2 className="l-cta-title">Ready to Learn Without Limits?</h2>
          <p className="l-cta-sub">Join 50,000+ learners exploring knowledge infinitely deep with AI-powered recursive understanding.</p>
          <button onClick={goSignUp} className="l-btn-cta">
            Get Started Free — It&apos;s Instant <Rocket size={20} className="ml-2" />
          </button>
          <p className="l-cta-note">No credit card required · Free forever</p>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="l-footer-brand">
            <div className="l-logo l-logo--sm">A</div>
            <span className="l-footer-name">Alfred AI</span>
          </div>
          <p className="l-footer-copy">© 2024 Alfred AI · Made with ❤️ for curious minds</p>
          <div className="l-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="https://github.com/AlfredAIchat/hackmarch" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
