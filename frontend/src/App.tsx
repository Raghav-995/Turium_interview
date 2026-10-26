import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
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

  const activeProvider = queryResult?.llm_provider || 'Ready';
  const hasCitations = queryResult && queryResult.citations.length > 0;

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
    const element = document.getElementById(`citation-card-${chunkId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
            <AlertCircle size={18} color="#f43f5e" />
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

      {/* Responsive Grid: Expands to 3 columns when citations exist on wide screens */}
      <div className={`main-grid ${hasCitations ? 'has-citations' : ''}`}>
        {/* Left Column: Ingestion & Saved Items Feed */}
        <section className="grid-col-left">
          <IngestionPanel
            onIngest={ingest}
            onUploadFile={uploadFile}
            isLoading={ingesting}
          />
          <SavedItemsList
            items={items}
            isLoading={loading}
            onDelete={deleteItem}
            onInspectChunks={(item) => setInspectingItem(item)}
          />
        </section>

        {/* Center Column: Q&A Chat Stream (Up Side) & Fixed Bottom Input (ChatGPT/Gemini Style) */}
        <section className="grid-col-center">
          <ChatConversation
            messages={messages}
            hasItems={items.length > 0}
            onSelectPrompt={(prompt) => handleAsk(prompt)}
            onCitationClick={handleCitationClick}
            onClearHistory={handleClearChat}
          />
          <AskQuestion
            onAsk={handleAsk}
            isLoading={querying}
            hasItems={items.length > 0}
          />
        </section>

        {/* Right Column: Dedicated Cited Sources Panel */}
        {hasCitations && (
          <section className="grid-col-right">
            <CitedSourcesPanel
              citations={queryResult.citations}
              highlightedChunkId={highlightedChunkId}
            />
          </section>
        )}
      </div>

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
