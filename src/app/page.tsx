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
        body: JSON.stringify({ query, session_id: store.sessionId || undefined }),
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
    <main className="h-screen w-screen bg-[#0a0a14] text-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`shrink-0 border-r border-gray-800/60 transition-all duration-300 overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0'}`}
      >
        <ChatSidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 border-b border-gray-800/40 flex items-center justify-between px-4 shrink-0
          bg-[#0a0a14]/80 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600
                flex items-center justify-center text-[10px] font-bold shadow-sm shadow-cyan-500/20">
                A
              </div>
              <span className="text-sm font-semibold text-gray-300">Alfred AI</span>
            </div>

            {store.currentDepth > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono
                bg-purple-500/10 border border-purple-500/20 text-purple-400">
                depth {store.currentDepth}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Knowledge tree toggle */}
            <button
              onClick={() => setShowTree(!showTree)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg
                border transition-all duration-200
                ${showTree
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-gray-300'
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Tree
              {treeNodeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[9px] font-mono">
                  {treeNodeCount}
                </span>
              )}
            </button>

            {store.sessionId && (
              <>
                <button
                  onClick={() => store.setShowQuiz(true)}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50
                    text-gray-400 rounded-lg hover:border-purple-500/50 hover:text-purple-400
                    transition-all"
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
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50
                    text-gray-400 rounded-lg hover:border-cyan-500/50 hover:text-cyan-400
                    transition-all"
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <AnswerPanel />
            </div>

            {/* Input area — centered like Claude */}
            <div className="shrink-0 border-t border-gray-800/30 bg-[#0a0a14]">
              <div className="max-w-3xl mx-auto px-4 py-3">
                <form onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/60
                    rounded-2xl px-3 py-1 focus-within:border-cyan-500/30 focus-within:ring-1
                    focus-within:ring-cyan-500/20 transition-all">
                    {/* File upload button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={store.isLoading || isUploading}
                      className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10
                        disabled:opacity-30 transition-all"
                      title="Upload file (PDF, image, text)"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        ? 'Ask any knowledge question…'
                        : 'Ask a follow-up or new question…'
                      }
                      disabled={store.isLoading}
                      className="flex-1 px-2 py-2.5 bg-transparent text-sm text-gray-200
                        placeholder-gray-600 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={store.isLoading || !queryInput.trim()}
                      className="p-2 rounded-xl text-gray-500
                        hover:text-cyan-400 hover:bg-cyan-500/10
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all"
                    >
                      {store.isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19V5m0 0l-7 7m7-7l7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Uploaded file pill */}
                  {uploadedFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                        bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {uploadedFile.name}
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </form>
                <p className="text-center text-[10px] text-gray-700 mt-2">
                  Alfred AI uses Mistral AI. Click highlighted concepts to explore deeper.
                </p>
              </div>
            </div>
          </div>

          {/* Knowledge tree panel (toggleable) */}
          {showTree && (
            <div className="w-80 shrink-0 border-l border-gray-800/40 overflow-hidden
              animate-in slide-in-from-right">
              <KnowledgeTree />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuizModal />
      <ReportView />
    </main>
  );
}
