import React from 'react';
import { BookOpen, ExternalLink, X } from 'lucide-react';
import type { Citation } from '../types';

interface CitedSourcesPanelProps {
  citations: Citation[];
  highlightedChunkId: string | null;
  onClose?: () => void;
}

export const CitedSourcesPanel: React.FC<CitedSourcesPanelProps> = ({
  citations,
  highlightedChunkId,
  onClose,
}) => {
  if (citations.length === 0) return null;

  return (
    <div className="card citations-panel">
      <div className="citations-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <BookOpen size={16} color="#8b5cf6" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
              Cited Source Snippets ({citations.length})
            </h3>
          </div>

          {onClose && (
            <button
              type="button"
              className="btn-close-citations"
              onClick={onClose}
              title="Close citations panel"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          Click source pills in answers to highlight snippets
        </span>
      </div>

      <div className="citations-scroll-list">
        {citations.map((cite, idx) => {
          const isHighlighted = highlightedChunkId === cite.chunk_id;
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

              {cite.url && cite.url.startsWith('http') ? (
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
              ) : cite.url ? (
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                  📄 {cite.url}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
