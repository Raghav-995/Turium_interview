import React, { useState } from 'react';
import {
  AlertCircle,
  X,
  Layers,
  MessageSquare,
  PlusCircle,
  BookOpen,
  Columns,
} from 'lucide-react';
import { useKnowledgeInbox } from './hooks/useKnowledgeInbox';
import { Header } from './components/Header';
import { IngestionPanel } from './components/IngestionPanel';
import { SavedItemsList } from './components/SavedItemsList';
import { AskQuestion } from './components/AskQuestion';
import { ChatConversation, type ChatMessage } from './components/ChatConversation';
import { CitedSourcesPanel } from './components/CitedSourcesPanel';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ChunkInspectorModal } from './components/ChunkInspectorModal';
import type { SavedItem } from './types';

export const App: React.FC = () => {
  const {
    items,
    loading,
    ingesting,
    querying,
    error,
    queryResult,
    setError,
    setQueryResult,
    ingest,
    uploadFile,
    query,
    fetchItemChunks,
    deleteItem,
  } = useKnowledgeInbox();

  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<SavedItem | null>(null);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Left Sidebar State: 'saved' (Saved Items) | 'ingest' (Ingest Knowledge) | 'split' (Both)
  const [leftPanelView, setLeftPanelView] = useState<'saved' | 'ingest' | 'split'>('saved');
  const [mobileTab, setMobileTab] = useState<'chat' | 'inbox' | 'ingest' | 'sources'>('chat');
  const [isCitationsVisible, setIsCitationsVisible] = useState(true);

  const activeProvider = queryResult?.llm_provider || 'Ready';
  const hasCitations = Boolean(queryResult && queryResult.citations && queryResult.citations.length > 0);

  const handleAsk = async (question: string, topK?: number, threshold?: number) => {
    const msgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: msgId, question, isLoading: true, timestamp: timeStr },
    ]);

    try {
      const res = await query(question, topK, threshold);
      if (res) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, result: res, isLoading: false } : m))
        );
        setIsCitationsVisible(true);
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, isLoading: false, error: err.message || 'Query failed' }
            : m
        )
      );
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setQueryResult(null);
  };

  const handleCitationClick = (chunkId: string) => {
    setHighlightedChunkId(chunkId);
    setIsCitationsVisible(true);

    // If on mobile view, switch to sources tab automatically
    if (window.innerWidth <= 860) {
      setMobileTab('sources');
    }

    setTimeout(() => {
      const element = document.getElementById(`citation-card-${chunkId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  };

  return (
    <div className="app-container">
      <Header
        provider={activeProvider}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
      />

      {error && (
        <div className="alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} color="#f43f5e" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.2rem',
            }}
            title="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Responsive Main Layout Grid */}
      <div
        className={`main-grid ${
          hasCitations && isCitationsVisible ? 'has-citations' : ''
        }`}
      >
        {/* Left Column: Ingestion & Saved Items Feed */}
        <section
          className={`grid-col-left ${
            mobileTab !== 'inbox' && mobileTab !== 'ingest' ? 'mobile-hide' : ''
          }`}
        >
          {/* Prominent Tab Switcher: Ingest Knowledge <-> Saved Items <-> Split */}
          <div className="sidebar-tab-switcher hide-on-mobile">
            <button
              type="button"
              className={`sidebar-tab-btn ${leftPanelView === 'ingest' ? 'active' : ''}`}
              onClick={() => setLeftPanelView('ingest')}
              title="Show Ingest Knowledge Form"
            >
              <PlusCircle size={14} />
              <span>Ingest Knowledge</span>
            </button>

            <button
              type="button"
              className={`sidebar-tab-btn ${leftPanelView === 'saved' ? 'active' : ''}`}
              onClick={() => setLeftPanelView('saved')}
              title="View all Saved Items"
            >
              <Layers size={14} />
              <span>Saved Items</span>
              <span className="sidebar-tab-count">{items.length}</span>
            </button>

            <button
              type="button"
              className={`sidebar-tab-btn split-toggle ${leftPanelView === 'split' ? 'active' : ''}`}
              onClick={() => setLeftPanelView('split')}
              title="View both Ingest Knowledge and Saved Items stacked"
            >
              <Columns size={13} />
              <span>Split</span>
            </button>
          </div>

          {/* Ingestion Panel Component: Shown when in 'ingest' or 'split' view */}
          {(leftPanelView === 'ingest' || leftPanelView === 'split' || mobileTab === 'ingest') &&
            mobileTab !== 'inbox' && (
              <IngestionPanel
                onIngest={ingest}
                onUploadFile={uploadFile}
                isLoading={ingesting}
                onSuccess={() => {
                  // After adding, automatically replace Ingest Knowledge div with Saved Items list!
                  setLeftPanelView('saved');
                  if (window.innerWidth <= 860) setMobileTab('inbox');
                }}
                onViewSavedItems={() => {
                  setLeftPanelView('saved');
                  if (window.innerWidth <= 860) setMobileTab('inbox');
                }}
                savedItemsCount={items.length}
              />
            )}

          {/* Saved Items List Component: Shown when in 'saved' or 'split' view */}
          {(leftPanelView === 'saved' || leftPanelView === 'split' || mobileTab === 'inbox') &&
            mobileTab !== 'ingest' && (
              <SavedItemsList
                items={items}
                isLoading={loading}
                onDelete={deleteItem}
                onInspectChunks={(item) => setInspectingItem(item)}
                onIngestClick={() => {
                  // When clicking Ingest Knowledge button, replace Saved Items list with Ingest Knowledge div!
                  setLeftPanelView('ingest');
                  if (window.innerWidth <= 860) setMobileTab('ingest');
                }}
              />
            )}
        </section>

        {/* Center Column: Q&A Chat Stream & Fixed Bottom Input */}
        <section
          className={`grid-col-center ${mobileTab !== 'chat' ? 'mobile-hide' : ''}`}
        >
          <ChatConversation
            messages={messages}
            hasItems={items.length > 0}
            onSelectPrompt={(prompt) => handleAsk(prompt)}
            onCitationClick={handleCitationClick}
            onClearHistory={handleClearChat}
            hasCitations={hasCitations}
            citationCount={queryResult?.citations.length || 0}
            onOpenCitations={() => {
              setIsCitationsVisible(true);
              if (window.innerWidth <= 860) setMobileTab('sources');
            }}
          />
          <AskQuestion
            onAsk={handleAsk}
            isLoading={querying}
            hasItems={items.length > 0}
          />
        </section>

        {/* Right Column: Dedicated Cited Sources Panel */}
        {hasCitations && isCitationsVisible && queryResult && (
          <section
            className={`grid-col-right ${
              mobileTab !== 'sources' ? 'mobile-hide' : ''
            }`}
          >
            <CitedSourcesPanel
              citations={queryResult.citations}
              highlightedChunkId={highlightedChunkId}
              onClose={() => {
                setIsCitationsVisible(false);
                if (mobileTab === 'sources') setMobileTab('chat');
              }}
            />
          </section>
        )}
      </div>

      {/* Responsive Mobile Bottom Navigation Bar (Screens <= 860px) */}
      <nav className="mobile-nav-bar" aria-label="Mobile navigation">
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'inbox' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('inbox');
            setLeftPanelView('saved');
          }}
        >
          <Layers size={18} />
          <span>Saved Items</span>
          {items.length > 0 && (
            <span className="mobile-nav-badge">{items.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'ingest' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('ingest');
            setLeftPanelView('ingest');
          }}
        >
          <PlusCircle size={18} />
          <span>Ingest</span>
        </button>

        {hasCitations && queryResult && (
          <button
            type="button"
            className={`mobile-nav-item ${mobileTab === 'sources' ? 'active' : ''}`}
            onClick={() => setMobileTab('sources')}
          >
            <BookOpen size={18} />
            <span>Sources</span>
            <span className="mobile-nav-badge" style={{ background: '#8b5cf6' }}>
              {queryResult.citations.length}
            </span>
          </button>
        )}
      </nav>

      {/* System Design & Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* Chunk Inspector Modal */}
      <ChunkInspectorModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
        fetchChunks={fetchItemChunks}
      />
    </div>
  );
};

export default App;
