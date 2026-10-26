import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useKnowledgeInbox } from './hooks/useKnowledgeInbox';
import { Header } from './components/Header';
import { IngestionPanel } from './components/IngestionPanel';
import { SavedItemsList } from './components/SavedItemsList';
import { AskQuestion } from './components/AskQuestion';
import { AnswerCard } from './components/AnswerCard';

export const App: React.FC = () => {
  const {
    items,
    loading,
    ingesting,
    querying,
    error,
    queryResult,
    setError,
    ingest,
    query,
    deleteItem,
  } = useKnowledgeInbox();

  const activeProvider = queryResult?.llm_provider || 'Ready';

  return (
    <div className="app-container">
      <Header provider={activeProvider} />

      {error && (
        <div className="alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="main-grid">
        {/* Left Column: Ingestion & Saved Items Feed */}
        <section>
          <IngestionPanel onIngest={ingest} isLoading={ingesting} />
          <SavedItemsList items={items} isLoading={loading} onDelete={deleteItem} />
        </section>

        {/* Right Column: Q&A Interface & Citations */}
        <section>
          <AskQuestion onAsk={query} isLoading={querying} hasItems={items.length > 0} />
          {queryResult && <AnswerCard result={queryResult} />}
        </section>
      </div>
    </div>
  );
};

export default App;
