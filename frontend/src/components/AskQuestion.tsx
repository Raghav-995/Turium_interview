import React, { useState } from 'react';
import { Search, Loader2, Sliders, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface AskQuestionProps {
  onAsk: (question: string, topK?: number, threshold?: number) => void;
  isLoading: boolean;
  hasItems: boolean;
}

export const AskQuestion: React.FC<AskQuestionProps> = ({ onAsk, isLoading, hasItems }) => {
  const [queryText, setQueryText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [topK, setTopK] = useState(4);
  const [threshold, setThreshold] = useState(0.2);

  const suggestedQueries = [
    'What is FastAPI and what are its features?',
    'Who is Raghav?',
    'Explain the fundamentals of machine learning.',
    'What instructions does the Google login page provide?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || isLoading) return;
    onAsk(queryText.trim(), topK, threshold);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQueryText(suggestion);
    if (!isLoading) {
      onAsk(suggestion, topK, threshold);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <Search size={18} color="#10b981" />
          Ask Questions Over Saved Content
        </h2>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="btn-outline-mini"
          title="Adjust RAG hyperparameters (Top-K, threshold)"
        >
          <Sliders size={12} />
          <span>RAG Tuning</span>
          {showSettings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '1rem' }}>
        Semantic vector search retrieves the top relevant chunks across your inbox, then an LLM synthesizes a grounded answer with verifiable source citations.
      </p>

      {/* Advanced Tuning Settings Drawer */}
      {showSettings && (
        <div className="tuning-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#cbd5e1' }}>Top-K Retrieved Chunks</span>
                <strong style={{ color: '#60a5fa' }}>{topK} chunks</strong>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#cbd5e1' }}>Min Similarity Threshold</span>
                <strong style={{ color: '#10b981' }}>{Math.round(threshold * 100)}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="query-box">
        <input
          type="text"
          className="query-input"
          placeholder={
            hasItems
              ? 'Ask anything across your saved notes and URLs...'
              : 'Add some notes or URLs first to query them...'
          }
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          disabled={!hasItems || isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-query"
          disabled={!queryText.trim() || !hasItems || isLoading}
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

      {/* Suggested Query Chips */}
      {hasItems && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Sparkles size={11} color="#60a5fa" /> Try asking:
          </span>
          {suggestedQueries.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="suggestion-chip"
              onClick={() => handleSelectSuggestion(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
