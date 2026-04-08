'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useSessionStore, ConceptItem, PipelineNode } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { startSession, selectTerm, SSEEventHandler } from '@/lib/api';
import KnowledgeTree, { TreeNode } from '@/components/KnowledgeTree';
import PipelineView, { PipelineStep } from '@/components/PipelineView';
import QuizModal from '@/components/QuizModal';
import SettingsPanel from '@/components/SettingsPanel';
import VoiceInput from '@/components/VoiceInput';
import { motion } from 'framer-motion';

/* ─────── Tab identifiers ─────── */
type RightTab = 'tree' | 'pipeline';

/* ─────── Tree adapter — converts store tree to component tree ─────── */
function toTreeNode(data: any): TreeNode | null {
    if (!data) return null;
    const cleanedLabel = String(data.name || 'Root')
        .replace(/_[a-f0-9]{8}$/i, '')
        .trim();
    return {
        id: data.name || 'root',
        label: cleanedLabel || 'Root',
        status: data.must_learn ? 'must-learn' : data.depth === -1 ? 'active' :
            data.color === 'green' ? 'explored' : 'suggested',
        relevance: data.relevance_score || 0.5,
        depth: data.depth ?? 0,
        children: (data.children || []).map((c: any) => toTreeNode(c)).filter(Boolean) as TreeNode[],
    };
}

/* ─────── Pipeline adapter ─────── */
function toPipelineSteps(nodes: PipelineNode[]): PipelineStep[] {
    return nodes.map(n => ({
        id: n.id,
        label: n.label,
        status: n.status === 'running' ? 'active' : n.status as PipelineStep['status'],
        duration: n.duration,
    }));
}

/* ─────── Concept pill styling ─────── */
function pillClass(color: string, mustLearn?: boolean) {
    if (mustLearn) return 'concept-pill concept-pill--must-learn';
    if (color === 'green') return 'concept-pill concept-pill--green';
    if (color === 'yellow') return 'concept-pill concept-pill--yellow';
    if (color === 'blue') return 'concept-pill concept-pill--blue';
    return 'concept-pill concept-pill--orange';
}

/* ══════════════════════════════════════════
   Main Dashboard Page
   ══════════════════════════════════════════ */
export default function HomePage() {
    const router = useRouter();
    const store = useSessionStore();
    const userStore = useUserStore();

    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState('');
    const [rightTab, setRightTab] = useState<RightTab>('tree');
    const [showSettings, setShowSettings] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Auth guard */
    useEffect(() => {
        setMounted(true);
        userStore.loadFromStorage();
    }, []);

    useEffect(() => {
        if (mounted && !userStore.isLoggedIn) {
            router.push('/login');
        }
    }, [mounted, userStore.isLoggedIn, router]);

    /* Auto-scroll chat */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [store.conversationMessages]);

    /* Focus input */
    useEffect(() => {
        if (!store.isProcessing && mounted) {
            inputRef.current?.focus();
        }
    }, [store.isProcessing, mounted]);

    useEffect(() => {
        if (!mounted) return;
        const sync = () => {
            const compact = window.innerWidth < 1120;
            setIsCompact(compact);
            if (compact) {
                setShowRightPanel(false);
            } else {
                setShowRightPanel(true);
            }
        };
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, [mounted]);

    /* ─────── SSE Event Handler ─────── */
    const handleSSE: SSEEventHandler = useCallback((event: string, data: any) => {
        switch (event) {
            // ── Session lifecycle ──
            case 'session_started':
                if (data.session_id) store.setSessionId(data.session_id);
                break;

            // ── Pipeline node status (backend canonical events) ──
            case 'node_activated': {
                const node = data.node as string;
                const status = data.status as string;
                if (!node) break;
                if (status === 'active') {
                    store.setPipelineNodeStatus(node, 'running');
                } else if (status === 'complete') {
                    store.setPipelineNodeStatus(node, 'done');
                } else if (status === 'error') {
                    store.setPipelineNodeStatus(node, 'error');
                }
                break;
            }

            // ── Legacy / alternative event names (keep for safety) ──
            case 'pipeline_update':
            case 'agent_start':
                if (data.agent) store.setPipelineNodeStatus(data.agent, 'running');
                break;
            case 'agent_done':
            case 'pipeline_done':
                if (data.agent) store.setPipelineNodeStatus(data.agent, 'done');
                break;
            case 'agent_error':
                if (data.agent) store.setPipelineNodeStatus(data.agent, 'error');
                break;

            // ── Answer (backend canonical) ──
            case 'answer_ready': {
                const answer = data.answer || '';
                const depth = data.depth ?? store.currentDepth;
                if (answer) {
                    store.addAssistantMessage(answer, [], depth);
                    if (data.depth != null) store.setCurrentDepth(data.depth);
                }
                break;
            }

            // ── Concepts (backend canonical) ──
            case 'concepts_ready': {
                const concepts: ConceptItem[] = (data.concepts || []).map((c: any) => ({
                    term: c.term || c.name || String(c),
                    relevance_score: c.relevance_score ?? 0.5,
                    difficulty: c.difficulty ?? 3,
                    color: c.color || (c.relevance_score >= 0.8 ? 'orange' : c.relevance_score >= 0.5 ? 'yellow' : 'green'),
                    must_learn: c.must_learn ?? false,
                    why_important: c.why_important || '',
                }));
                if (concepts.length > 0) {
                    // Patch concepts onto the last assistant message (don't append a new one)
                    store.patchLastAssistantConcepts(concepts);
                }
                break;
            }

            // ── Legacy answer formats ──
            case 'answer':
            case 'final_answer': {
                const answer = data.answer || data.text || (typeof data === 'string' ? data : '');
                const concepts: ConceptItem[] = (data.concepts || data.extracted_concepts || []).map((c: any) => ({
                    term: c.term || c.name || c,
                    relevance_score: c.relevance_score || c.relevance || 0.5,
                    difficulty: c.difficulty || 3,
                    color: c.color || (c.relevance_score >= 0.8 ? 'orange' : c.relevance_score >= 0.5 ? 'yellow' : 'green'),
                    must_learn: c.must_learn || false,
                    why_important: c.why_important || '',
                }));
                const depth = data.depth ?? store.currentDepth;
                if (answer) store.addAssistantMessage(answer, concepts, depth);
                break;
            }

            // ── Legacy concept formats ──
            case 'concepts':
            case 'extracted_concepts': {
                const concepts: ConceptItem[] = (data.concepts || data || []).map((c: any) => ({
                    term: c.term || c.name || c,
                    relevance_score: c.relevance_score || 0.5,
                    difficulty: c.difficulty || 3,
                    color: c.color || 'green',
                    must_learn: c.must_learn || false,
                    why_important: c.why_important || '',
                }));
                if (concepts.length > 0) store.setLatestConcepts(concepts);
                break;
            }

            // ── Tree ──
            case 'tree_update':
            case 'knowledge_tree':
                if (data.tree || data) store.updateTree(data.tree || data);
                break;

            // ── Depth ──
            case 'depth_update':
                if (data.depth != null) store.setCurrentDepth(data.depth);
                break;

            // ── Rejection ──
            case 'rejected':
                store.setError(data.reason || 'Query was rejected');
                break;

            // ── Done / errors ──
            case 'done':
            case 'complete':
            case 'stream_end':
                store.setProcessing(false);
                break;

            case 'error':
                store.setError(data.message || data.error || 'An error occurred');
                store.setProcessing(false);
                break;
        }
    }, [store]);

    /* ─────── Submit question ─────── */
    const handleSubmit = useCallback(async (text?: string) => {
        const q = (text || query).trim();
        if (!q || store.isProcessing) return;

        setQuery('');
        store.setError(null);
        store.addUserMessage(q);
        store.resetPipeline();
        store.setProcessing(true);
        setRightTab('pipeline');
        setShowRightPanel(true);

        try {
            // Scale 1-5 slider → 1-10 backend scale
            await startSession({
                query: q,
                session_id: store.sessionId || `s_${Date.now()}`,
                difficulty_level: Math.round(store.difficultyLevel * 2) - 1,
                technicality_level: Math.round(store.technicalityLevel * 2) - 1,
                answer_depth: store.answerDepth,
            }, handleSSE);
        } catch (err: any) {
            store.setError(err.message || 'Failed to connect');
        } finally {
            store.setProcessing(false);
            setTimeout(() => { setRightTab('tree'); setShowRightPanel(true); }, 500);
        }
    }, [query, store, handleSSE]);

    /* ─────── Explore concept ─────── */
    const exploreConcept = useCallback(async (term: string) => {
        if (store.isProcessing) return;
        store.addExploredTerm(term);
        store.addUserMessage(`Explain: ${term}`);
        store.resetPipeline();
        store.setProcessing(true);
        setRightTab('pipeline');
        setShowRightPanel(true);

        try {
            await selectTerm({
                session_id: store.sessionId,
                term,
                difficulty_level: Math.round(store.difficultyLevel * 2) - 1,
                technicality_level: Math.round(store.technicalityLevel * 2) - 1,
                answer_depth: store.answerDepth,
            }, handleSSE);
        } catch (err: any) {
            store.setError(err.message || 'Failed to explore concept');
        } finally {
            store.setProcessing(false);
            setTimeout(() => { setRightTab('tree'); setShowRightPanel(true); }, 500);
        }
    }, [store, handleSSE]);

    /* ─────── Logout ─────── */
    const handleLogout = () => {
        userStore.logout();
        store.resetSession();
        router.push('/login');
    };

    /* ─────── Settings update ─────── */
    const updateSettings = (s: { difficulty: number; technicality: number; answerDepth: 'brief' | 'moderate' | 'detailed' }) => {
        store.setDifficultyLevel(s.difficulty);
        store.setTechnicalityLevel(s.technicality);
        store.setAnswerDepth(s.answerDepth);
    };

    if (!mounted) return null;

    const treeNode = toTreeNode(store.treeData);
    const exploredConcepts = store.exploredTerms;
    const pipelineSteps = toPipelineSteps(store.pipelineNodes);
    const activePipelineStep = store.pipelineNodes.find((n) => n.status === 'running');
    const isRateLimitError = (store.error || '').toLowerCase().includes('rate limit');

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'radial-gradient(circle at 12% 8%, rgba(14,165,164,0.10), transparent 30%), radial-gradient(circle at 88% 90%, rgba(37,99,235,0.12), transparent 32%), linear-gradient(180deg, #F8FAFC 0%, #EEF3FA 100%)',
            fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            overflow: 'hidden',
        }}>

            {/* ═══════ Top Navigation Bar ═══════ */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                height: '52px',
                flexShrink: 0,
                borderBottom: '1px solid #E2E8F0',
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>A</span>
                    </div>
                    <div>
                        <div className="gradient-text" style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2 }}>
                            Alfred AI
                        </div>
                        <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500 }}>
                            Recursive Learning Engine
                        </div>
                    </div>
                </div>

                {/* Center stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#6366F1' }}>
                            D{store.currentDepth}
                        </span>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span style={{ fontWeight: 600, color: '#64748B' }}>
                            {exploredConcepts.length} explored
                        </span>
                    </div>
                    {store.isProcessing && (
                        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="pulse-dot" />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#6366F1', whiteSpace: 'nowrap' }}>
                                {activePipelineStep ? `${activePipelineStep.label}...` : 'Processing...'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Toggle right panel (Tree/Pipeline) */}
                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px',
                            fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0',
                            background: showRightPanel ? '#EEF2FF' : 'transparent',
                            color: showRightPanel ? '#6366F1' : '#64748B',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {isCompact ? 'Panels' : 'Tree'}
                    </button>
                    <button
                        onClick={() => setShowQuiz(true)}
                        disabled={exploredConcepts.length === 0}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px',
                            fontWeight: 600, cursor: exploredConcepts.length === 0 ? 'not-allowed' : 'pointer',
                            border: '1px solid #E2E8F0', background: 'transparent',
                            color: '#64748B', opacity: exploredConcepts.length === 0 ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        📝 Quiz
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px',
                            fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0',
                            background: 'transparent', color: '#64748B',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        ⚙️
                    </button>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', background: 'transparent', color: '#94A3B8',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16,17 21,12 16,7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* ═══════ Main Content Area ═══════ */}
            <div style={{
                flex: 1,
                display: 'flex',
                minHeight: 0,
                overflow: 'hidden',
            }}>

                {/* ════ LEFT PANEL: Chat ════ */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    borderRight: showRightPanel ? '1px solid #E2E8F0' : 'none',
                }}>
                    {/* Chat messages area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                    }}>
                        {store.conversationMessages.length === 0 ? (
                            /* ── Empty state ── */
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', height: '100%', gap: '20px',
                            }}>
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    style={{ position: 'relative' }}
                                >
                                    <div style={{
                                        width: '72px', height: '72px', borderRadius: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #0EA5A4, #2563EB)',
                                        boxShadow: '0 16px 50px rgba(37,99,235,0.3)',
                                    }}>
                                        <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>A</span>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                                        What would you like to learn?
                                    </h2>
                                    <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '420px', lineHeight: 1.6 }}>
                                        Ask any question and Alfred will break it down into explorable concepts,
                                        building a knowledge tree as you go deeper.
                                    </p>
                                </motion.div>
                                {/* Quick starters */}
                                <motion.div 
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.1, delayChildren: 0.5 }
                                        }
                                    }}
                                    style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '480px', marginTop: '10px' }}
                                >
                                    {[
                                        'How do neural networks learn?',
                                        'Explain quantum entanglement',
                                        'What is blockchain consensus?',
                                        'How does DNA replication work?',
                                    ].map((q) => (
                                        <motion.button 
                                            key={q}
                                            variants={{
                                                hidden: { opacity: 0, y: 10, scale: 0.95 },
                                                visible: { opacity: 1, y: 0, scale: 1 }
                                            }}
                                            whileHover={{ scale: 1.05, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { setQuery(q); handleSubmit(q); }}
                                            style={{
                                                padding: '10px 16px', borderRadius: '12px', fontSize: '13px',
                                                fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0',
                                                background: '#FFFFFF', color: '#64748B',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            {q}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </motion.div>
                        ) : (
                            /* ── Messages ── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {store.conversationMessages.map((msg, i) => (
                                    <div key={i} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 40, 200)}ms`, animationFillMode: 'both' }}>
                                        {msg.role === 'user' ? (
                                            /* User message */
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{
                                                    maxWidth: '80%', padding: '10px 16px',
                                                    borderRadius: '16px 16px 4px 16px', fontSize: '13px',
                                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                    color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Assistant message */
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, marginTop: '2px',
                                                    background: '#EEF2FF', border: '1px solid #C7D2FE',
                                                }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1' }}>A</span>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* Depth badge */}
                                                    <div style={{ marginBottom: '6px' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
                                                            fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                                                            background: '#EEF2FF', color: '#6366F1',
                                                        }}>
                                                            Depth {msg.depth}
                                                        </span>
                                                    </div>
                                                    {/* Markdown content */}
                                                    <div className="prose-light" style={{ fontSize: '13px' }}>
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                    {/* Concept pills */}
                                                    {msg.concepts && msg.concepts.length > 0 && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <p style={{
                                                                fontSize: '10px', fontWeight: 700,
                                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                color: '#94A3B8', marginBottom: '6px',
                                                            }}>
                                                                Explore further:
                                                            </p>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {msg.concepts.map((c, ci) => {
                                                                    const isExplored = store.exploredTerms.includes(c.term);
                                                                    return (
                                                                        <button key={ci}
                                                                            onClick={() => exploreConcept(c.term)}
                                                                            disabled={store.isProcessing || isExplored}
                                                                            className={pillClass(c.color, c.must_learn)}
                                                                            style={{
                                                                                animation: `pill-enter 0.3s ease-out ${ci * 50}ms both`,
                                                                                opacity: isExplored ? 0.5 : 1,
                                                                            }}
                                                                            title={c.why_important || `Relevance: ${(c.relevance_score * 100).toFixed(0)}%`}
                                                                        >
                                                                            {c.must_learn && <span style={{ fontSize: '10px' }}>🔥</span>}
                                                                            {c.term}
                                                                            {isExplored && <span style={{ fontSize: '10px' }}>✓</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {store.isProcessing && (
                                    <div className="animate-fade-in" style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, background: '#EEF2FF', border: '1px solid #C7D2FE',
                                        }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1' }}>A</span>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '10px 16px', borderRadius: '16px',
                                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        }}>
                                            {[0, 1, 2].map(i => (
                                                <div key={i} style={{
                                                    width: '7px', height: '7px', borderRadius: '50%',
                                                    background: '#6366F1',
                                                    animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                                                }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {store.error && (
                                    <div className="animate-slide-up" style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 14px', borderRadius: '12px',
                                        background: isRateLimitError ? '#FFF7ED' : '#FEF2F2',
                                        border: isRateLimitError ? '1px solid #FED7AA' : '1px solid #FECACA',
                                    }}>
                                        <span>⚠️</span>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: isRateLimitError ? '#9A3412' : '#991B1B',
                                            flex: 1,
                                        }}>
                                            {store.error}
                                        </span>
                                        <button onClick={() => store.setError(null)}
                                            style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* ── Input Bar ── */}
                    <div style={{
                        flexShrink: 0,
                        padding: '10px 16px',
                        borderTop: '1px solid #E2E8F0',
                        background: 'rgba(255,255,255,0.95)',
                    }}>
                        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <VoiceInput onTranscript={(t) => setQuery(t)} disabled={store.isProcessing} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={store.conversationMessages.length === 0
                                    ? "Ask anything to begin learning…"
                                    : "Ask a follow-up or explore a concept…"}
                                disabled={store.isProcessing}
                                className="input-field"
                                style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
                            />
                            <button type="submit"
                                disabled={!query.trim() || store.isProcessing}
                                className="btn-primary"
                                style={{
                                    width: '38px', height: '38px', padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '10px', flexShrink: 0,
                                }}
                            >
                                {store.isProcessing ? (
                                    <div style={{
                                        width: '14px', height: '14px',
                                        border: '2px solid white', borderTopColor: 'transparent',
                                        borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite',
                                    }} />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22,2 15,22 11,13 2,9" />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ════ RIGHT PANEL: Tree / Pipeline (Toggleable) ════ */}
                {showRightPanel && (
                    <div style={{
                        width: isCompact ? '100%' : 'clamp(340px, 34vw, 460px)',
                        maxWidth: isCompact ? '100%' : '40vw',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#FFFFFF',
                        animation: 'slide-in-right 0.25s ease-out forwards',
                        position: isCompact ? 'absolute' : 'relative',
                        right: isCompact ? 0 : undefined,
                        top: isCompact ? 52 : undefined,
                        bottom: isCompact ? 0 : undefined,
                        zIndex: isCompact ? 25 : undefined,
                        boxShadow: isCompact ? '-16px 0 35px rgba(15,23,42,0.12)' : undefined,
                    }}>
                        {/* Tab bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '0 10px', height: '38px', flexShrink: 0,
                            borderBottom: '1px solid #E2E8F0', background: '#FAFBFD',
                        }}>
                            {(['tree', 'pipeline'] as RightTab[]).map(tab => {
                                const active = rightTab === tab;
                                return (
                                    <button key={tab}
                                        onClick={() => setRightTab(tab)}
                                        className={`tab-btn ${active ? 'tab-btn--active' : ''}`}
                                        style={{
                                            padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
                                            fontWeight: 600, cursor: 'pointer', border: 'none',
                                            color: active ? '#6366F1' : '#94A3B8',
                                            background: active ? '#EEF2FF' : 'transparent',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {tab === 'tree' ? '🌳 Tree' : '⚡ Pipeline'}
                                        {tab === 'pipeline' && store.isProcessing && (
                                            <span style={{
                                                marginLeft: '5px', width: '5px', height: '5px',
                                                borderRadius: '50%', display: 'inline-block',
                                                background: '#6366F1', verticalAlign: 'middle',
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                            {/* Close panel */}
                            <button onClick={() => setShowRightPanel(false)}
                                style={{
                                    marginLeft: 'auto', width: '24px', height: '24px',
                                    borderRadius: '6px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', border: 'none', background: 'transparent',
                                    color: '#94A3B8', cursor: 'pointer', fontSize: '14px',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Panel content */}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            {rightTab === 'tree' ? (
                                <KnowledgeTree
                                    data={treeNode}
                                    onNodeClick={(_, label) => exploreConcept(label)}
                                    className="h-full"
                                />
                            ) : (
                                <PipelineView steps={pipelineSteps} className="h-full" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ Modals ═══════ */}
            {showQuiz && (
                <QuizModal
                    sessionId={store.sessionId}
                    concepts={exploredConcepts}
                    onClose={() => setShowQuiz(false)}
                />
            )}
            {showSettings && (
                <SettingsPanel
                    settings={{
                        difficulty: store.difficultyLevel,
                        technicality: store.technicalityLevel,
                        answerDepth: store.answerDepth,
                    }}
                    onUpdate={updateSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
