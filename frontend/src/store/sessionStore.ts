'use client';

import { create } from 'zustand';

export interface ConceptItem {
  term: string;
  relevance_score: number;
  difficulty: number;
  color: 'green' | 'yellow' | 'orange';
  explanation: string;
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
  error: string | null;

  // Conversation (full history displayed as chat)
  conversationMessages: ConversationMessage[];
  currentDepth: number;

  // Latest concepts (for the most recent answer)
  latestConcepts: ConceptItem[];

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

  // Actions
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentDepth: (depth: number) => void;
  addUserMessage: (text: string) => void;
  addAssistantMessage: (content: string, concepts: ConceptItem[], depth: number) => void;
  addConceptsToLastMessage: (concepts: ConceptItem[]) => void;
  updatePipelineNode: (nodeId: string, status: PipelineNode['status']) => void;
  resetPipelineNodes: () => void;
  updateTree: (tree: Record<string, any>) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  setQuizScore: (score: number) => void;
  setQuizResults: (results: any[]) => void;
  setShowQuiz: (show: boolean) => void;
  setReport: (report: string) => void;
  setShowReport: (show: boolean) => void;
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

  // Find root (node with no parent or parent not in tree)
  let rootKey: string | null = null;
  for (const [key, val] of Object.entries(raw)) {
    if (!val.parent || !(val.parent in raw)) {
      rootKey = key;
      break;
    }
  }
  if (!rootKey) rootKey = Object.keys(raw)[0];

  const visited = new Set<string>();

  function buildNode(key: string): TreeNode {
    visited.add(key);
    const node = raw[key] || {};
    const children: TreeNode[] = (node.children || [])
      .filter((c: string) => c in raw && !visited.has(c))
      .map((c: string) => buildNode(c));

    const shortName = key.length > 30 ? key.substring(0, 27) + '…' : key;

    return {
      name: shortName,
      attributes: {
        depth: String(node.depth ?? 0),
        fullName: key,
      },
      children: children.length > 0 ? children : undefined,
    };
  }

  return buildNode(rootKey);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: '',
  isLoading: false,
  error: null,
  conversationMessages: [],
  currentDepth: 0,
  latestConcepts: [],
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

  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
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
      return { conversationMessages: msgs };
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
  setReport: (report) => set({ report }),
  setShowReport: (show) => set({ showReport: show }),

  resetSession: () =>
    set({
      sessionId: '',
      isLoading: false,
      error: null,
      conversationMessages: [],
      currentDepth: 0,
      latestConcepts: [],
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
    }),
}));
