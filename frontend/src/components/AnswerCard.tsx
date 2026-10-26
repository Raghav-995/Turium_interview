import React, { useState } from 'react';
import { Sparkles, BookOpen, ExternalLink, Copy, Check } from 'lucide-react';
import type { QueryResponse } from '../types';

interface AnswerCardProps {
  result: QueryResponse;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ result }) => {
  const [highlightedChunk, setHighlightedChunk] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCitationClick = (chunkId: string) => {
    setHighlightedChunk(chunkId);
    const element = document.getElementById(`citation-card-${chunkId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Parse [Source X] tags in the answer and make them interactive
  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[Source\s*\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[Source\s*(\d+)\]/i);
      if (match) {
        const sourceIndex = parseInt(match[1], 10) - 1;
        const matchingCitation = result.citations[sourceIndex];
        return (
          <span
            key={index}
            className="citation-pill"
            onClick={() => {
              if (matchingCitation) {
                handleCitationClick(matchingCitation.chunk_id);
              }
            }}
            title={matchingCitation ? `View source chunk from: ${matchingCitation.item_title}` : undefined}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="answer-box">
      <div className="answer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#3b82f6" />
          <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>Grounded Answer</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Model: <code style={{ color: '#93c5fa', fontWeight: 600 }}>{result.llm_provider}</code>
          </span>
          <button
            type="button"
            className="btn-copy"
            onClick={handleCopyAnswer}
            title="Copy answer to clipboard"
          >
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="answer-text">
        {renderFormattedAnswer(result.answer)}
      </div>

      {result.citations.length > 0 && (
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={15} color="#8b5cf6" />
              <strong style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Cited Source Snippets ({result.citations.length})
              </strong>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Click pills above to jump to chunk
            </span>
          </div>

          <div className="citations-list">
            {result.citations.map((cite, idx) => {
              const isHighlighted = highlightedChunk === cite.chunk_id;
              return (
                <div
                  key={cite.chunk_id}
                  id={`citation-card-${cite.chunk_id}`}
                  className={`citation-card ${isHighlighted ? 'highlighted' : ''}`}
                >
                  <div className="citation-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                      <span className="citation-pill" style={{ margin: 0 }}>
                        Source {idx + 1}
                      </span>
                      <span className="citation-title" title={cite.item_title}>
                        {cite.item_title}
                      </span>
                    </div>
                    <span className="similarity-badge">
                      {Math.round(cite.similarity_score * 100)}% match
                    </span>
                  </div>

                  <p className="citation-snippet">{cite.snippet}</p>

                  {cite.url && (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        color: '#60a5fa',
                        marginTop: '0.2rem',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={10} /> Visit URL
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
