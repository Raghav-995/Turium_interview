import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AskQuestionProps {
  onAsk: (question: string) => void;
  isLoading: boolean;
  hasItems: boolean;
}

export const AskQuestion: React.FC<AskQuestionProps> = ({ onAsk, isLoading, hasItems }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onAsk(query.trim());
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <Search size={18} color="#10b981" />
        Ask Questions Over Saved Content
      </h2>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
        Semantic vector search retrieves the most relevant chunks across your inbox, then an LLM synthesizes a grounded answer with verifiable source citations.
      </p>

      <form onSubmit={handleSubmit} className="query-box">
        <input
          type="text"
          className="query-input"
          placeholder={hasItems ? "Ask anything about your saved notes and URLs..." : "Add some notes or URLs first to query them..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!hasItems || isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-query"
          disabled={!query.trim() || !hasItems || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </>
          ) : (
            'Ask RAG'
          )}
        </button>
      </form>
    </div>
  );
};
