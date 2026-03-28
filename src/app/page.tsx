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
        body: JSON.stringify({
          session_id: store.sessionId,
          selected_term: term,
          difficulty_level: store.difficultyLevel,
          technicality_level: store.technicalityLevel,
          answer_depth: store.answerDepth,
        }),
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
        body: JSON.stringify({
          query,
          session_id: store.sessionId || undefined,
          difficulty_level: store.difficultyLevel,
          technicality_level: store.technicalityLevel,
          answer_depth: store.answerDepth,
        }),
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
    <main className="h-screen w-screen flex overflow-hidden" style={{ background: '#FAFBFD' }}>
      {/* ─── Sidebar ─── */}
      <div
        className={`shrink-0 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0'}`}
        style={{ borderRight: sidebarOpen ? '1px solid #E2E8F0' : 'none' }}
      >
        <ChatSidebar />
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-5 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl transition-all"
              style={{ color: '#94A3B8' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }}>
                A
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: '#0F172A' }}>Alfred AI</span>
                <span className="text-[10px] block -mt-0.5" style={{ color: '#94A3B8' }}>Recursive Learning Engine</span>
              </div>
            </div>

            {/* Depth badge */}
            {store.currentDepth > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <span className="text-[11px] font-bold" style={{ color: '#6366F1' }}>
                  Depth {store.currentDepth}
                </span>
                <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: '#C7D2FE' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min((store.currentDepth / 10) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
              style={{ background: '#F3F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
            >
              ⚙️ Settings
            </button>

            {/* Pipeline toggle */}
            <button
              onClick={() => setRightPanel(rightPanel === 'pipeline' ? 'none' : 'pipeline')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
              style={{
                background: rightPanel === 'pipeline' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#F3F5F9',
                color: rightPanel === 'pipeline' ? '#fff' : '#475569',
                border: rightPanel === 'pipeline' ? 'none' : '1px solid #E2E8F0',
                boxShadow: rightPanel === 'pipeline' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              ⚡ Pipeline
            </button>

            {/* Tree toggle */}
            <button
              onClick={() => setRightPanel(rightPanel === 'tree' ? 'none' : 'tree')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
              style={{
                background: rightPanel === 'tree' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#F3F5F9',
                color: rightPanel === 'tree' ? '#fff' : '#475569',
                border: rightPanel === 'tree' ? 'none' : '1px solid #E2E8F0',
                boxShadow: rightPanel === 'tree' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              🧠 Tree
              {treeNodeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    background: rightPanel === 'tree' ? 'rgba(255,255,255,0.2)' : '#EEF2FF',
                    color: rightPanel === 'tree' ? '#fff' : '#6366F1',
                  }}>
                  {treeNodeCount}
                </span>
              )}
            </button>

            {store.sessionId && (
              <>
                <button
                  onClick={() => store.setShowQuiz(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
                  style={{ background: '#F3F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
                >
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
                  className="px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
                  style={{ background: '#F3F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
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
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#FAFBFD' }}>
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
            <div className="shrink-0 p-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5 transition-all"
                    style={{ background: '#FFFFFF', border: '2px solid #E2E8F0' }}>
                    {/* File upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={store.isLoading || isUploading}
                      className="p-2 rounded-xl transition-all disabled:opacity-30"
                      style={{ color: '#94A3B8' }}
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
                      style={{ color: '#0F172A' }}
                    />

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={store.isLoading || !queryInput.trim()}
                      className="p-2.5 rounded-xl text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                      }}
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
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#6366F1' }}>
                        📎 {uploadedFile.name}
                        <button onClick={() => setUploadedFile(null)} style={{ color: '#94A3B8' }}>×</button>
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
              style={{ borderLeft: '1px solid #E2E8F0', background: '#FFFFFF' }}
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
