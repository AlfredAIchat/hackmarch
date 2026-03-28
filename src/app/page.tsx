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
    <div className="h-full flex items-center justify-center text-gray-600 text-sm">
      Loading tree…
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const store = useSessionStore();
  const { isLoggedIn, loadFromStorage, profile } = useUserStore();
  const [queryInput, setQueryInput] = useState('');
  const [showTree, setShowTree] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = queryInput.trim();
    if (!query || store.isLoading) return;

    if (!store.sessionId) {
      store.resetSession();
    }

    store.setLoading(true);
    store.setError(null);
    store.addUserMessage(query);
    store.resetPipelineNodes();
    // Broadcast reset to pipeline page (cross-tab)
    try {
      localStorage.setItem('alfred_pipeline_state', JSON.stringify({
        reset: true, ts: Date.now(),
      }));
    } catch { }
    store.addTimelineEntry({
      type: 'query',
      text: query,
      depth: 0,
      timestamp: Date.now(),
    });
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
          const json = line.slice(6);
          try {
            const evt = JSON.parse(json);
            switch (evt.type) {
              case 'session_started':
                store.setSessionId(evt.data.session_id);
                break;
              case 'node_activated':
                store.updatePipelineNode(evt.data.node, evt.data.status);
                // Broadcast to pipeline page via localStorage (cross-tab)
                try {
                  localStorage.setItem('alfred_pipeline_state', JSON.stringify({
                    nodes: useSessionStore.getState().pipelineNodes,
                    sessionId: useSessionStore.getState().sessionId,
                    depth: useSessionStore.getState().currentDepth,
                    query: store.conversationMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
                    ts: Date.now(),
                  }));
                } catch { }
                break;
              case 'answer_ready':
                store.addAssistantMessage(
                  evt.data.answer,
                  [],
                  evt.data.depth ?? 0
                );
                break;
              case 'concepts_ready':
                store.addConceptsToLastMessage(evt.data.concepts);
                break;
              case 'tree_update':
                store.updateTree(evt.data.tree);
                break;
              case 'rejected':
                store.setError(evt.data.reason);
                break;
              case 'error':
                store.setError(evt.data.message);
                break;
            }
          } catch { }
        }
      }
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
      setUploadedFile(null);
      // Auto-save conversation to localStorage
      const sid = useSessionStore.getState().sessionId;
      if (sid) {
        useUserStore.getState().saveConversationData(sid);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (store.sessionId) formData.append('session_id', store.sessionId);
      formData.append('query', queryInput || `Analyze ${file.name}`);

      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();

      if (data.session_id) {
        store.setSessionId(data.session_id);
      }
      setUploadedFile({
        name: data.filename || file.name,
        preview: data.preview || '',
      });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!mounted || !isLoggedIn) return null;

  const treeNodeCount = Object.keys(store.rawTree).length;

  return (
    <main className="h-screen w-screen bg-[#f8fafc] text-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`shrink-0 border-r border-slate-200 transition-all duration-300 overflow-hidden bg-white
          ${sidebarOpen ? 'w-64' : 'w-0'}`}
      >
        <ChatSidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - Premium Header */}
        <header className="h-14 border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0
          bg-white/90 backdrop-blur-lg shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                A
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">Alfred AI</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Learning Engine</span>
              </div>
            </div>

            {store.currentDepth > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <span className="text-[11px] font-semibold text-indigo-600">
                  Depth {store.currentDepth}
                </span>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 depth-progress"
                    style={{ width: `${Math.min((store.currentDepth / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl
                border border-slate-200 bg-white text-slate-600
                hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50
                transition-all shadow-sm"
              title="Adjust difficulty, technicality, and answer depth"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            {/* Knowledge tree toggle */}
            <button
              onClick={() => setShowTree(!showTree)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl
                border transition-all shadow-sm
                ${showTree
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white shadow-indigo-500/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Tree
              {treeNodeCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold
                  ${showTree ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                  {treeNodeCount}
                </span>
              )}
            </button>

            {store.sessionId && (
              <>
                <button
                  onClick={() => store.setShowQuiz(true)}
                  className="px-4 py-2 text-xs font-medium bg-white border border-slate-200
                    text-slate-600 rounded-xl hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50
                    transition-all shadow-sm"
                >
                  Quiz
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
                  className="px-4 py-2 text-xs font-medium bg-white border border-slate-200
                    text-slate-600 rounded-xl hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50
                    transition-all shadow-sm"
                >
                  Report
                </button>
              </>
            )}
          </div>
        </header>

        {/* Chat content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat messages */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            <div className="flex-1 overflow-hidden">
              <AnswerPanel />
            </div>

            {/* Input area — Premium Design */}
            <div className="shrink-0 border-t border-slate-200/80 bg-white p-4">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3 bg-white border-2 border-slate-200
                    rounded-2xl px-4 py-2 focus-within:border-indigo-400 focus-within:shadow-lg
                    focus-within:shadow-indigo-500/10 transition-all">
                    {/* File upload button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={store.isLoading || isUploading}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50
                        disabled:opacity-30 transition-all"
                      title="Upload file (PDF, image, text)"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </button>
                    <VoiceInput
                      onTranscript={(text) => setQueryInput(text)}
                      disabled={store.isLoading}
                    />
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder={store.conversationMessages.length === 0
                        ? 'Ask any question to start learning...'
                        : 'Continue exploring or ask something new...'
                      }
                      disabled={store.isLoading}
                      className="flex-1 px-2 py-2 bg-transparent text-[15px] text-slate-800
                        placeholder-slate-400 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={store.isLoading || !queryInput.trim()}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500
                        text-white shadow-lg shadow-indigo-500/30
                        hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                        disabled:shadow-none transition-all"
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
                    <div className="mt-3 flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-indigo-50 border border-indigo-200 text-sm text-indigo-600 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {uploadedFile.name}
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </form>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Click <span className="text-indigo-500 font-medium">highlighted concepts</span> in answers to explore deeper
                </p>
              </div>
            </div>
          </div>

          {/* Knowledge tree panel (toggleable) - LARGER */}
          {showTree && (
            <div className="w-[450px] shrink-0 border-l border-slate-200 overflow-hidden bg-white
              animate-slide-in-right shadow-xl">
              <KnowledgeTree />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuizModal />
      <ReportView />
      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} />
    </main>
  );
}
