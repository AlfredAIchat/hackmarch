'use client';

import { create } from 'zustand';

export interface ConceptItem {
  term: string;
  relevance_score: number;
  difficulty: number;
  tier?: string;
  color: 'green' | 'yellow' | 'orange';
  explanation?: string;
  must_learn?: boolean;
  why_important?: string;
}

export interface PipelineNode {
  id: string;
  label: string;
  status: 'idle' | 'active' | 'complete' | 'error';
}

export interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNode[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  concept: string;
}

export interface TimelineEntry {
  type: 'query' | 'term';
  text: string;
  depth: number;
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  concepts?: ConceptItem[];
  depth?: number;
}

interface SessionState {
  // Session
  sessionId: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // Conversation (full history displayed as chat)
  conversationMessages: ConversationMessage[];
  currentDepth: number;

  // Latest concepts (for the most recent answer)
  latestConcepts: ConceptItem[];

  // Explored terms (all terms the user has clicked)
  exploredTerms: string[];

  // Pipeline
  pipelineNodes: PipelineNode[];

  // Tree
  treeData: TreeNode | null;
  rawTree: Record<string, any>;

  // Timeline
  timeline: TimelineEntry[];

  // Quiz
  quizQuestions: QuizQuestion[];
  quizScore: number | null;
  quizResults: any[];
  showQuiz: boolean;

  // Report
  report: string;
  showReport: boolean;

  // User Preferences (for answer customization)
  difficultyLevel: number;      // 1-10, default 5
  technicalityLevel: number;    // 1-10, default 5
  answerDepth: 'brief' | 'moderate' | 'detailed';  // default 'moderate'

  // Actions
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentDepth: (depth: number) => void;
  addUserMessage: (text: string) => void;
  addAssistantMessage: (content: string, concepts: ConceptItem[], depth: number) => void;
  addConceptsToLastMessage: (concepts: ConceptItem[]) => void;
  addExploredTerm: (term: string) => void;
  updatePipelineNode: (nodeId: string, status: PipelineNode['status']) => void;
  resetPipelineNodes: () => void;
  updateTree: (tree: Record<string, any>) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  setQuizScore: (score: number) => void;
  setQuizResults: (results: any[]) => void;
  setShowQuiz: (show: boolean) => void;
  submitQuiz: (answers: number[]) => Promise<void>;
  setReport: (report: string) => void;
  setShowReport: (show: boolean) => void;
  setDifficultyLevel: (level: number) => void;
  setTechnicalityLevel: (level: number) => void;
  setAnswerDepth: (depth: 'brief' | 'moderate' | 'detailed') => void;
  resetSession: () => void;
}

const DEFAULT_PIPELINE_NODES: PipelineNode[] = [
  { id: 'intent_guard', label: 'Intent Guard', status: 'idle' },
  { id: 'answer_agent', label: 'Answer Agent', status: 'idle' },
  { id: 'hallucination_checker', label: 'Hallucination Checker', status: 'idle' },
  { id: 'concept_extractor', label: 'Concept Extractor', status: 'idle' },
  { id: 'concept_validator', label: 'Concept Validator', status: 'idle' },
  { id: 'user_gate', label: 'User Gate', status: 'idle' },
  { id: 'depth_guard', label: 'Depth Guard', status: 'idle' },
  { id: 'context_builder', label: 'Context Builder', status: 'idle' },
  { id: 'quiz_agent', label: 'Quiz Agent', status: 'idle' },
  { id: 'answer_evaluator', label: 'Answer Evaluator', status: 'idle' },
  { id: 'report_agent', label: 'Report Agent', status: 'idle' },
];

function buildTreeFromRaw(raw: Record<string, any>): TreeNode | null {
  if (!raw || Object.keys(raw).length === 0) return null;

  // Find ALL root nodes (nodes with no parent or parent not in tree)
  const rootKeys: string[] = [];
  for (const [key, val] of Object.entries(raw)) {
    if (!val.parent || !(val.parent in raw)) {
      rootKeys.push(key);
    }
  }

  // Fallback if no roots found (shouldn't happen, but safety first)
  if (rootKeys.length === 0) {
    rootKeys.push(Object.keys(raw)[0]);
  }

  const visited = new Set<string>();

  function buildNode(key: string, isExplored: boolean = true): TreeNode {
    visited.add(key);
    const node = raw[key] || {};

    // Include both explored and unexplored children
    const children: TreeNode[] = [];

    // Add explored children (exist in raw tree)
    for (const childKey of (node.children || [])) {
      if (!visited.has(childKey)) {
        if (childKey in raw) {
          children.push(buildNode(childKey, true));
        } else {
          // Unexplored child - add as placeholder
          children.push({
            name: childKey.length > 30 ? childKey.substring(0, 27) + '…' : childKey,
            attributes: {
              depth: String((node.depth ?? 0) + 1),
              fullName: childKey,
              explored: 'false',
            },
          });
        }
      }
    }

    const shortName = key.length > 30 ? key.substring(0, 27) + '…' : key;

    return {
      name: shortName,
      attributes: {
        depth: String(node.depth ?? 0),
        fullName: key,
        explored: isExplored ? 'true' : 'false',
      },
      children: children.length > 0 ? children : undefined,
    };
  }

  // If multiple roots, create a virtual "Knowledge Map" root
  if (rootKeys.length > 1) {
    const rootChildren = rootKeys.map(key => buildNode(key));
    return {
      name: 'Knowledge Map',
      attributes: {
        depth: '-1',
        fullName: 'Knowledge Map',
        explored: 'true',
        virtual: 'true',
      },
      children: rootChildren,
    };
  }

  // Single root - build normally
  return buildNode(rootKeys[0]);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: '',
  isLoading: false,
  isStreaming: false,
  error: null,
  conversationMessages: [],
  currentDepth: 0,
  latestConcepts: [],
  exploredTerms: [],
  pipelineNodes: [...DEFAULT_PIPELINE_NODES],
  treeData: null,
  rawTree: {},
  timeline: [],
  quizQuestions: [],
  quizScore: null,
  quizResults: [],
  showQuiz: false,
  report: '',
  showReport: false,

  // User preferences with defaults
  difficultyLevel: 5,
  technicalityLevel: 5,
  answerDepth: 'moderate',

  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  setCurrentDepth: (depth) => set({ currentDepth: depth }),

  addUserMessage: (text) =>
    set((state) => ({
      conversationMessages: [
        ...state.conversationMessages,
        { role: 'user' as const, content: text },
      ],
    })),

  addAssistantMessage: (content, concepts, depth) =>
    set((state) => ({
      conversationMessages: [
        ...state.conversationMessages,
        { role: 'assistant' as const, content, concepts, depth },
      ],
      currentDepth: depth,
    })),

  addConceptsToLastMessage: (concepts: ConceptItem[]) =>
    set((state) => {
      const msgs = [...state.conversationMessages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], concepts };
      }
      return { conversationMessages: msgs, latestConcepts: concepts };
    }),

  addExploredTerm: (term: string) =>
    set((state) => {
      const lower = term.toLowerCase();
      if (state.exploredTerms.some(t => t.toLowerCase() === lower)) {
        return state; // Already explored — no-op (prevents duplication)
      }
      return { exploredTerms: [...state.exploredTerms, term] };
    }),

  updatePipelineNode: (nodeId, status) =>
    set((state) => ({
      pipelineNodes: state.pipelineNodes.map((n) =>
        n.id === nodeId ? { ...n, status } : n
      ),
    })),

  resetPipelineNodes: () =>
    set({
      pipelineNodes: DEFAULT_PIPELINE_NODES.map((n) => ({
        ...n,
        status: 'idle' as const,
      })),
    }),

  updateTree: (tree) =>
    set({
      rawTree: tree,
      treeData: buildTreeFromRaw(tree),
    }),

  addTimelineEntry: (entry) =>
    set((state) => ({ timeline: [...state.timeline, entry] })),

  setQuizQuestions: (questions) => set({ quizQuestions: questions }),
  setQuizScore: (score) => set({ quizScore: score }),
  setQuizResults: (results) => set({ quizResults: results }),
  setShowQuiz: (show) => set({ showQuiz: show }),

  submitQuiz: async (answers: number[]) => {
    const state = get();
    if (!state.sessionId) return;
    try {
      const resp = await fetch(
        `${typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000') : 'http://localhost:8000'}/session/submit-quiz`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: state.sessionId, answers }),
        }
      );
      const data = await resp.json();
      set({
        quizScore: data.quiz_score ?? 0,
        quizResults: data.results ?? [],
      });
    } catch (err) {
      console.error('Quiz submit error:', err);
    }
  },

  setReport: (report) => set({ report }),
  setShowReport: (show) => set({ showReport: show }),

  setDifficultyLevel: (level) => set({ difficultyLevel: Math.max(1, Math.min(10, level)) }),
  setTechnicalityLevel: (level) => set({ technicalityLevel: Math.max(1, Math.min(10, level)) }),
  setAnswerDepth: (depth) => set({ answerDepth: depth }),

  resetSession: () =>
    set({
      sessionId: '',
      isLoading: false,
      isStreaming: false,
      error: null,
      conversationMessages: [],
      currentDepth: 0,
      latestConcepts: [],
      exploredTerms: [],
      pipelineNodes: [...DEFAULT_PIPELINE_NODES],
      treeData: null,
      rawTree: {},
      timeline: [],
      quizQuestions: [],
      quizScore: null,
      quizResults: [],
      showQuiz: false,
      report: '',
      showReport: false,
      // Keep user preferences on reset
    }),
}));
