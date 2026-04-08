'use client';

import { create } from 'zustand';

/* ─────── Types ─────── */

export interface ConceptItem {
    term: string;
    relevance_score: number;
    difficulty: number;
    color: 'green' | 'yellow' | 'orange';
    tier?: string;
    explanation?: string;
    must_learn?: boolean;
    why_important?: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    concepts: ConceptItem[];
    depth: number;
    timestamp: number;
}

export interface PipelineNode {
    id: string;
    label: string;
    status: 'idle' | 'running' | 'done' | 'error';
    startedAt?: number;
    duration?: number;
}

export interface TimelineEntry {
    type: 'query' | 'concept';
    text: string;
    depth: number;
}

export interface TreeNodeData {
    name: string;
    depth: number;
    answer?: string;
    color?: string;
    must_learn?: boolean;
    relevance_score?: number;
    children: TreeNodeData[];
}

/* ─────── Pipeline definition ─────── */

const DEFAULT_PIPELINE: PipelineNode[] = [
    { id: 'intent_guard', label: 'Intent Guard', status: 'idle' },
    { id: 'context_builder', label: 'Context Builder', status: 'idle' },
    { id: 'answer_agent', label: 'Answer Agent', status: 'idle' },
    { id: 'hallucination_checker', label: 'Hallucination Check', status: 'idle' },
    { id: 'concept_extractor', label: 'Concept Extractor', status: 'idle' },
    { id: 'concept_validator', label: 'Concept Validator', status: 'idle' },
    { id: 'user_gate', label: 'Tree Builder', status: 'idle' },
];

/* ─────── Store Interface ─────── */

interface SessionState {
    // Session
    sessionId: string;
    isProcessing: boolean;
    error: string | null;

    // Conversation
    conversationMessages: ConversationMessage[];
    currentDepth: number;

    // Concepts & Dedup
    latestConcepts: ConceptItem[];
    exploredTerms: string[];
    allSeenConceptTerms: Set<string>; // Global dedup set (case-insensitive)

    // Pipeline
    pipelineNodes: PipelineNode[];

    // Knowledge Tree
    rawTree: Record<string, any>;
    treeData: TreeNodeData | null;
    selectedTreeNode: string | null;

    // Quiz
    quizQuestions: any[];
    quizScore: number | null;
    quizError: string | null;
    showQuiz: boolean;

    // Report
    report: string | null;
    showReport: boolean;

    // Timeline
    timeline: TimelineEntry[];

    // User preferences
    difficultyLevel: number;
    technicalityLevel: number;
    answerDepth: 'brief' | 'moderate' | 'detailed';

    // Actions
    setSessionId: (id: string) => void;
    setProcessing: (val: boolean) => void;
    setError: (err: string | null) => void;
    addUserMessage: (content: string) => void;
    addAssistantMessage: (content: string, concepts: ConceptItem[], depth: number) => void;
    setCurrentDepth: (d: number) => void;
    setLatestConcepts: (c: ConceptItem[]) => void;
    addExploredTerm: (term: string) => void;
    setPipelineNodeStatus: (id: string, status: PipelineNode['status']) => void;
    resetPipeline: () => void;
    updateTree: (rawTree: Record<string, any>) => void;
    setSelectedTreeNode: (name: string | null) => void;
    setQuizQuestions: (q: any[]) => void;
    setQuizScore: (s: number | null) => void;
    setQuizError: (e: string | null) => void;
    setShowQuiz: (v: boolean) => void;
    setReport: (r: string | null) => void;
    setShowReport: (v: boolean) => void;
    addTimelineEntry: (entry: TimelineEntry) => void;
    setDifficultyLevel: (l: number) => void;
    setTechnicalityLevel: (l: number) => void;
    setAnswerDepth: (d: 'brief' | 'moderate' | 'detailed') => void;
    patchLastAssistantConcepts: (concepts: ConceptItem[]) => void;
    resetSession: () => void;
}

/* ─────── Tree Builder ─────── */

function buildTreeData(rawTree: Record<string, any>): TreeNodeData | null {
    if (!rawTree || Object.keys(rawTree).length === 0) return null;

    // Support nested tree payloads ({ name, children: [...] }) in addition to adjacency maps.
    if (typeof rawTree === 'object' && !Array.isArray(rawTree) && 'name' in rawTree && 'children' in rawTree) {
        const normalize = (node: any): TreeNodeData => ({
            name: node?.name || 'Node',
            depth: node?.depth ?? 0,
            answer: node?.answer || '',
            color: node?.color || 'green',
            must_learn: node?.must_learn || false,
            relevance_score: node?.relevance_score || 0.5,
            children: Array.isArray(node?.children) ? node.children.map(normalize) : [],
        });
        return normalize(rawTree);
    }

    // Find root(s): nodes with no parent or parent not in tree
    const roots: string[] = [];
    for (const [key, node] of Object.entries(rawTree)) {
        const parent = node.parent;
        if (!parent || !rawTree[parent]) {
            roots.push(key);
        }
    }

    if (roots.length === 0) {
        // Fallback: use the first key as root
        roots.push(Object.keys(rawTree)[0]);
    }

    function buildNode(key: string, visited: Set<string>): TreeNodeData {
        if (visited.has(key)) {
            return { name: key, depth: 0, children: [] };
        }
        visited.add(key);

        const node = rawTree[key] || {};
        const childKeys: string[] = node.children || [];

        // Build children, but only if they exist in the tree AND haven't been visited
        const children: TreeNodeData[] = childKeys
            .filter((ck: string) => rawTree[ck] && !visited.has(ck))
            .map((ck: string) => buildNode(ck, visited));

        return {
            name: key,
            depth: node.depth ?? 0,
            answer: node.answer || '',
            color: node.color || 'green',
            must_learn: node.must_learn || false,
            relevance_score: node.relevance_score || 0.5,
            children,
        };
    }

    if (roots.length === 1) {
        return buildNode(roots[0], new Set());
    }

    // Multiple roots: create a virtual root
    const visited = new Set<string>();
    return {
        name: 'Alfred AI',
        depth: -1,
        children: roots.map(r => buildNode(r, visited)),
    };
}

/* ─────── Store ─────── */

export const useSessionStore = create<SessionState>((set, get) => ({
    // Initial state
    sessionId: '',
    isProcessing: false,
    error: null,
    conversationMessages: [],
    currentDepth: 0,
    latestConcepts: [],
    exploredTerms: [],
    allSeenConceptTerms: new Set<string>(),
    pipelineNodes: DEFAULT_PIPELINE.map(n => ({ ...n })),
    rawTree: {},
    treeData: null,
    selectedTreeNode: null,
    quizQuestions: [],
    quizScore: null,
    quizError: null,
    showQuiz: false,
    report: null,
    showReport: false,
    timeline: [],
    difficultyLevel: 3,
    technicalityLevel: 3,
    answerDepth: 'moderate',

    // Actions
    setSessionId: (id) => set({ sessionId: id }),
    setProcessing: (val) => set({ isProcessing: val }),
    setError: (err) => set({ error: err }),

    addUserMessage: (content) => {
        set((s) => ({
            conversationMessages: [
                ...s.conversationMessages,
                { role: 'user', content, concepts: [], depth: s.currentDepth, timestamp: Date.now() },
            ],
        }));
    },

    addAssistantMessage: (content, concepts, depth) => {
        const state = get();
        const seenTerms = new Set(state.allSeenConceptTerms);

        // Deduplicate concepts against ALL previously seen concepts
        const dedupedConcepts = concepts.filter((c) => {
            const lower = c.term.toLowerCase().trim();
            if (seenTerms.has(lower)) return false;
            // Also check against explored terms
            if (state.exploredTerms.some(t => t.toLowerCase() === lower)) return false;
            seenTerms.add(lower);
            return true;
        });

        set({
            conversationMessages: [
                ...state.conversationMessages,
                { role: 'assistant', content, concepts: dedupedConcepts, depth, timestamp: Date.now() },
            ],
            latestConcepts: dedupedConcepts,
            allSeenConceptTerms: seenTerms,
            currentDepth: depth,
        });
    },

    setCurrentDepth: (d) => set({ currentDepth: d }),
    setLatestConcepts: (c) => set({ latestConcepts: c }),

    addExploredTerm: (term) => {
        const state = get();
        const lower = term.toLowerCase().trim();
        if (state.exploredTerms.some(t => t.toLowerCase() === lower)) return;
        const seenTerms = new Set(state.allSeenConceptTerms);
        seenTerms.add(lower);
        set({
            exploredTerms: [...state.exploredTerms, term],
            allSeenConceptTerms: seenTerms,
        });
    },

    setPipelineNodeStatus: (id, status) => {
        set((s) => {
            const now = Date.now();
            return {
                pipelineNodes: s.pipelineNodes.map((n) => {
                    if (n.id !== id) return n;

                    if (status === 'running') {
                        return {
                            ...n,
                            status,
                            startedAt: n.startedAt || now,
                            duration: n.duration,
                        };
                    }

                    if ((status === 'done' || status === 'error') && n.startedAt) {
                        return {
                            ...n,
                            status,
                            duration: Math.max(0, now - n.startedAt),
                        };
                    }

                    return { ...n, status };
                }),
            };
        });
    },

    resetPipeline: () => {
        set({
            pipelineNodes: DEFAULT_PIPELINE.map(n => ({
                ...n,
                status: 'idle' as const,
                startedAt: undefined,
                duration: undefined,
            })),
        });
    },

    updateTree: (rawTree) => {
        const treeData = buildTreeData(rawTree);
        set({ rawTree, treeData });
    },

    setSelectedTreeNode: (name) => set({ selectedTreeNode: name }),

    setQuizQuestions: (q) => set({ quizQuestions: q }),
    setQuizScore: (s) => set({ quizScore: s }),
    setQuizError: (e) => set({ quizError: e }),
    setShowQuiz: (v) => set({ showQuiz: v }),

    setReport: (r) => set({ report: r }),
    setShowReport: (v) => set({ showReport: v }),

    addTimelineEntry: (entry) => {
        set((s) => ({ timeline: [...s.timeline, entry] }));
    },

    setDifficultyLevel: (l) => set({ difficultyLevel: l }),
    setTechnicalityLevel: (l) => set({ technicalityLevel: l }),
    setAnswerDepth: (d) => set({ answerDepth: d }),

    patchLastAssistantConcepts: (concepts) => {
        const state = get();
        const msgs = state.conversationMessages;
        const lastIdx = msgs.map(m => m.role).lastIndexOf('assistant');
        if (lastIdx === -1) {
            // No assistant message yet — just store as latestConcepts
            set({ latestConcepts: concepts });
            return;
        }
        const seenTerms = new Set(state.allSeenConceptTerms);
        const dedupedConcepts = concepts.filter((c) => {
            const lower = c.term.toLowerCase().trim();
            if (seenTerms.has(lower)) return false;
            if (state.exploredTerms.some(t => t.toLowerCase() === lower)) return false;
            seenTerms.add(lower);
            return true;
        });
        const updated = msgs.map((m, i) =>
            i === lastIdx ? { ...m, concepts: dedupedConcepts } : m
        );
        set({
            conversationMessages: updated,
            latestConcepts: dedupedConcepts,
            allSeenConceptTerms: seenTerms,
        });
    },

    resetSession: () => set({
        sessionId: '',
        isProcessing: false,
        error: null,
        conversationMessages: [],
        currentDepth: 0,
        latestConcepts: [],
        exploredTerms: [],
        allSeenConceptTerms: new Set<string>(),
        pipelineNodes: DEFAULT_PIPELINE.map(n => ({ ...n })),
        rawTree: {},
        treeData: null,
        selectedTreeNode: null,
        quizQuestions: [],
        quizScore: null,
        quizError: null,
        showQuiz: false,
        report: null,
        showReport: false,
        timeline: [],
    }),
}));
