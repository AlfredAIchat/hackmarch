'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import AnswerPanel from '@/components/AnswerPanel';
import ChatSidebar from '@/components/ChatSidebar';
import VoiceInput from '@/components/VoiceInput';
import QuizModal from '@/components/QuizModal';
import ReportView from '@/components/ReportView';
import SettingsPanel from '@/components/SettingsPanel';

const KnowledgeTree = dynamic(() => import('@/components/KnowledgeTree'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
      Loading tree…
    </div>
  ),
});

const PipelineView = dynamic(() => import('@/components/PipelineView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
      Loading pipeline…
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const store = useSessionStore();
  const { isLoggedIn, loadFromStorage, profile } = useUserStore();
  const [queryInput, setQueryInput] = useState('');
  const [rightPanel, setRightPanel] = useState<'none' | 'tree' | 'pipeline'>('none');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; preview: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildRequestPayload = (base: Record<string, any>) => {
    const isEasy = store.difficultyLevel <= 3;
    const effectiveDepth: 'brief' | 'moderate' | 'detailed' = isEasy ? 'brief' : store.answerDepth;
    const effectiveTechnicality = isEasy ? Math.min(store.technicalityLevel, 4) : store.technicalityLevel;

    return {
      ...base,
      difficulty_level: store.difficultyLevel,
      technicality_level: effectiveTechnicality,
      answer_depth: effectiveDepth,
      simplicity: isEasy ? 'simple' : 'default',
    };
  };

  useEffect(() => {
    setMounted(true);
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [mounted, isLoggedIn, router]);

  /* ─────── Concept Click → select-term API ─────── */
  const handleConceptClick = async (term: string) => {
    if (store.isLoading) return;

    // Prevent clicking already-explored terms
    if (store.exploredTerms.some(t => t.toLowerCase() === term.toLowerCase())) {
      return;
    }

    store.addExploredTerm(term);
    store.setLoading(true);
    store.setStreaming(true);
    store.setError(null);
    store.addUserMessage(`Tell me about "${term}"`);
    store.resetPipelineNodes();
    store.addTimelineEntry({
      type: 'term',
      text: term,
      depth: store.currentDepth + 1,
      timestamp: Date.now(),
    });

    try {
      const resp = await fetch('/api/select-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestPayload({
          session_id: store.sessionId,
          selected_term: term,
        })),
      });

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            handleSSEEvent(evt);
          } catch { }
        }
      }
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
      store.setStreaming(false);
      const sid = useSessionStore.getState().sessionId;
      if (sid) useUserStore.getState().saveConversationData(sid);
    }
  };

  /* ─────── SSE Event Handler (shared) ─────── */
  const handleSSEEvent = (evt: any) => {
    switch (evt.type) {
      case 'session_started':
        store.setSessionId(evt.data.session_id);
        break;
      case 'node_activated':
        store.updatePipelineNode(evt.data.node, evt.data.status);
        try {
          localStorage.setItem('alfred_pipeline_state', JSON.stringify({
            nodes: useSessionStore.getState().pipelineNodes,
            sessionId: useSessionStore.getState().sessionId,
            depth: useSessionStore.getState().currentDepth,
            ts: Date.now(),
          }));
        } catch { }
        break;
      case 'answer_ready':
        store.addAssistantMessage(evt.data.answer, [], evt.data.depth ?? 0);
        break;
      case 'concepts_ready':
        store.addConceptsToLastMessage(evt.data.concepts);
        break;
      case 'tree_update':
        store.updateTree(evt.data.tree);
        break;
      case 'quiz_ready':
        store.setQuizQuestions(evt.data.quiz_questions || []);
        break;
      case 'rejected':
        store.setError(evt.data.reason);
        break;
      case 'error':
        store.setError(evt.data.message);
        break;
    }
  };

  /* ─────── Submit Query ─────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = queryInput.trim();
    if (!query || store.isLoading) return;

    if (!store.sessionId) {
      store.resetSession();
    }

    store.setLoading(true);
    store.setStreaming(true);
    store.setError(null);
    store.addUserMessage(query);
    store.resetPipelineNodes();
    try {
      localStorage.setItem('alfred_pipeline_state', JSON.stringify({ reset: true, ts: Date.now() }));
    } catch { }
    store.addTimelineEntry({ type: 'query', text: query, depth: 0, timestamp: Date.now() });
    setQueryInput('');

    try {
      const resp = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestPayload({
          query,
          session_id: store.sessionId || undefined,
        })),
      });

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            handleSSEEvent(evt);
          } catch { }
        }
      }
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
      store.setStreaming(false);
      setUploadedFile(null);
      const sid = useSessionStore.getState().sessionId;
      if (sid) useUserStore.getState().saveConversationData(sid);
    }
  };

  /* ─────── File Upload ─────── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (store.sessionId) formData.append('session_id', store.sessionId);
      formData.append('query', queryInput || `Analyze ${file.name}`);

      const resp = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await resp.json();

      if (data.session_id) store.setSessionId(data.session_id);
      setUploadedFile({ name: data.filename || file.name, preview: data.preview || '' });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!mounted || !isLoggedIn) return null;

  const treeNodeCount = Object.keys(store.rawTree).length;

  return (
    <main className="app-shell">
      <div className="shell-grid" />

      {/* ─── Sidebar ─── */}
      <div
        className={`shrink-0 transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur ${sidebarOpen ? 'w-64' : 'w-0'}`}
        style={{ borderRight: sidebarOpen ? '1px solid var(--border-light)' : 'none' }}
      >
        <ChatSidebar />
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 panel-surface">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost px-3 py-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-sky))', boxShadow: 'var(--shadow-glow-indigo)' }}>
                A
              </div>
              <div>
                <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>Alfred AI</span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Recursive Learning Engine</span>
              </div>
            </div>

            {store.currentDepth > 0 && (
              <div className="chip">
                <span className="text-[11px] font-bold" style={{ color: 'var(--accent-indigo)' }}>
                  Depth {store.currentDepth}
                </span>
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-medium)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min((store.currentDepth / 10) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-sky))',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="btn-ghost text-xs">
              ⚙️ Settings
            </button>

            <button
              onClick={() => setRightPanel(rightPanel === 'pipeline' ? 'none' : 'pipeline')}
              className={`btn-ghost text-xs ${rightPanel === 'pipeline' ? 'bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-sky)] text-white border-none' : ''}`}
              style={rightPanel === 'pipeline' ? { boxShadow: 'var(--shadow-glow-indigo)' } : {}}
            >
              ⚡ Pipeline
            </button>

            <button
              onClick={() => setRightPanel(rightPanel === 'tree' ? 'none' : 'tree')}
              className={`btn-ghost text-xs ${rightPanel === 'tree' ? 'bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-violet)] text-white border-none' : ''}`}
              style={rightPanel === 'tree' ? { boxShadow: 'var(--shadow-glow-indigo)' } : {}}
            >
              🧠 Tree
              {treeNodeCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    background: rightPanel === 'tree' ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                    color: rightPanel === 'tree' ? '#fff' : 'var(--accent-indigo)',
                  }}>
                  {treeNodeCount}
                </span>
              )}
            </button>

            {store.sessionId && (
              <>
                <button onClick={() => store.fetchQuiz()} className="btn-ghost text-xs">
                  🧪 Quiz
                </button>
                <button
                  onClick={async () => {
                    try {
                      const resp = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/session/report/${store.sessionId}`
                      );
                      const data = await resp.json();
                      store.setReport(data.report || '');
                      store.setShowReport(true);
                    } catch { }
                  }}
                  className="btn-ghost text-xs"
                >
                  📊 Report
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden bg-canvas">
            <div className="flex-1 overflow-hidden">
              <AnswerPanel onConceptClick={handleConceptClick} />
            </div>

            {/* Error bar */}
            {store.error && (
              <div className="mx-4 mb-2 px-4 py-2 rounded-xl text-xs font-medium animate-slide-up"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                ⚠️ {store.error}
                <button onClick={() => store.setError(null)} className="ml-2 font-bold">×</button>
              </div>
            )}

            {/* Input bar */}
            <div className="shrink-0 p-4" style={{ background: 'transparent' }}>
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="input-rail">
                    {/* File upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={store.isLoading || isUploading}
                      className="btn-ghost p-2 disabled:opacity-40"
                      style={{ border: 'none', background: 'transparent', boxShadow: 'none', paddingInline: '10px' }}
                      title="Upload file"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 rounded-full animate-spin"
                          style={{ borderColor: '#E2E8F0', borderTopColor: '#6366F1' }} />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </button>

                    {/* Voice input */}
                    <VoiceInput onTranscript={(text) => setQueryInput(text)} disabled={store.isLoading} />

                    {/* Text input */}
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder={store.conversationMessages.length === 0
                        ? 'Ask any question to start learning...'
                        : 'Continue exploring or ask something new...'
                      }
                      disabled={store.isLoading}
                      className="flex-1 px-2 py-2 bg-transparent text-sm focus:outline-none disabled:opacity-50"
                      style={{ color: 'var(--text-primary)' }}
                    />

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={store.isLoading || !queryInput.trim()}
                      className="btn-primary px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {store.isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M12 19V5m0 0l-7 7m7-7l7 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Uploaded file pill */}
                  {uploadedFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="pill-soft inline-flex items-center gap-2">
                        📎 {uploadedFile.name}
                        <button onClick={() => setUploadedFile(null)} style={{ color: 'var(--text-muted)' }}>×</button>
                      </div>
                    </div>
                  )}
                </form>
                <p className="text-center text-[11px] mt-2.5" style={{ color: '#94A3B8' }}>
                  Click <span style={{ color: '#6366F1', fontWeight: 600 }}>highlighted concepts</span> in answers to explore deeper •
                  <span style={{ color: '#6366F1', fontWeight: 600 }}> ★ Must-learn</span> concepts are critical
                </p>
              </div>
            </div>
          </div>

          {/* ─── Right Panel (Tree or Pipeline) ─── */}
          {rightPanel !== 'none' && (
            <div
              className="w-[480px] shrink-0 overflow-hidden animate-slide-up"
              style={{ borderLeft: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.94)' }}
            >
              {rightPanel === 'tree' ? <KnowledgeTree /> : <PipelineView />}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      <QuizModal />
      <ReportView />
      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} />
    </main>
  );
}
