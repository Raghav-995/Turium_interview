import React, { useState } from 'react';
import { ArrowUp, Loader2, Sliders, Sparkles, X, RotateCcw } from 'lucide-react';

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

  const isTuned = topK !== 4 || threshold !== 0.2;

  const quickChips = [
    'FastAPI features',
    'Who is Raghav?',
    'Fundamentals of ML',
    'Google login page info',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryText.trim() || !hasItems || isLoading) return;
    onAsk(queryText.trim(), topK, threshold);
    setQueryText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectChip = (chip: string) => {
    if (!hasItems || isLoading) return;
    onAsk(chip, topK, threshold);
  };

  const handleResetTuning = () => {
    setTopK(4);
    setThreshold(0.2);
  };

  return (
    <div className="chat-bottom-bar">
      {/* Expandable RAG Tuning Drawer */}
      {showSettings && (
        <div className="bottom-tuning-drawer">
          <div className="tuning-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={13} color="#60a5fa" />
              <strong style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>RAG Retrieval Tuning</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isTuned && (
                <button
                  type="button"
                  className="btn-tuning-reset"
                  onClick={handleResetTuning}
                  title="Reset to default settings (k=4, θ=20%)"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                className="btn-tuning-close"
                onClick={() => setShowSettings(false)}
                title="Close tuning panel"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="tuning-sliders-grid">
            <div className="tuning-slider-item">
              <div className="tuning-slider-labels">
                <span className="slider-name">Top-K Chunks</span>
                <strong className="slider-val" style={{ color: '#60a5fa' }}>{topK} chunks</strong>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="range-input"
              />
              <span className="slider-desc">Number of top semantic chunks fed into the LLM context.</span>
            </div>

            <div className="tuning-slider-item">
              <div className="tuning-slider-labels">
                <span className="slider-name">Similarity Threshold</span>
                <strong className="slider-val" style={{ color: '#10b981' }}>{Math.round(threshold * 100)}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="range-input"
              />
              <span className="slider-desc">Minimum cosine similarity score required for chunk inclusion.</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Chips Row (Floating right above the prompt bar) */}
      {hasItems && (
        <div className="quick-chips-bar">
          <span className="quick-chips-label">
            <Sparkles size={11} color="#60a5fa" />
            Quick:
          </span>
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="quick-chip-pill"
              onClick={() => handleSelectChip(chip)}
              disabled={isLoading}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ChatGPT / Gemini Style Prompt Input Bar */}
      <form onSubmit={handleSubmit} className="chat-prompt-form">
        <div className={`chat-prompt-box ${!hasItems ? 'disabled' : ''}`}>
          {/* Tuning Drawer Trigger Button */}
          <button
            type="button"
            className={`btn-tuning-toggle ${showSettings ? 'active' : ''} ${isTuned ? 'has-override' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title={`RAG Hyperparameters: Top-K=${topK}, Min-Threshold=${Math.round(threshold * 100)}%`}
          >
            <Sliders size={15} />
            {isTuned && <span className="tuning-override-dot" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="chat-prompt-input"
            placeholder={
              hasItems
                ? 'Ask anything across your saved notes and URLs... (Press Enter)'
                : 'Add notes or URLs first to query your knowledge inbox...'
            }
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!hasItems || isLoading}
          />

          {/* Clear text button */}
          {queryText && (
            <button
              type="button"
              className="btn-clear-input"
              onClick={() => setQueryText('')}
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          {/* Circular Send Button (ChatGPT/Gemini style) */}
          <button
            type="submit"
            className="btn-send-prompt"
            disabled={!queryText.trim() || !hasItems || isLoading}
            title={isLoading ? 'Searching...' : 'Send message (Enter)'}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* Muted Sub-caption Disclaimer */}
        <div className="prompt-disclaimer">
          <span>Grounded with <strong>Gemini 3.5 Flash</strong> & <strong>In-Process Vector Store</strong> • Citations link directly to source chunks</span>
        </div>
      </form>
    </div>
  );
};
