import React, { useState, useEffect } from 'react';
import { X, Layers, Loader2 } from 'lucide-react';
import type { ChunkInfo, SavedItem } from '../types';


interface ChunkInspectorModalProps {
  item: SavedItem | null;
  onClose: () => void;
  fetchChunks: (itemId: string) => Promise<ChunkInfo[]>;
}

export const ChunkInspectorModal: React.FC<ChunkInspectorModalProps> = ({
  item,
  onClose,
  fetchChunks,
}) => {
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setError(null);
    fetchChunks(item.id)
      .then((data) => setChunks(data))
      .catch((err) => setError(err.message || 'Failed to load chunks'))
      .finally(() => setLoading(false));
  }, [item, fetchChunks]);

  if (!item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
              <Layers size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Chunk Inspector</h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Inspect semantic chunks, boundary splits, and overlap for: <strong>{item.title}</strong>
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
            <span className={`source-badge ${item.source_type}`}>
              {item.source_type.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Total Chunks: <strong style={{ color: '#f8fafc' }}>{chunks.length}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Raw Document Length: <strong style={{ color: '#f8fafc' }}>{item.raw_content.length} chars</strong>
            </span>
          </div>

          {loading ? (
            <div className="empty-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} className="animate-spin" />
              Loading chunk vector data...
            </div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '480px', overflowY: 'auto' }}>
              {chunks.map((chunk) => (
                <div key={chunk.id} className="item-card" style={{ background: '#0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa' }}>
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {chunk.char_count} chars • ~{Math.round(chunk.char_count / 4)} tokens
                    </span>
                  </div>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      lineHeight: 1.6,
                      color: '#cbd5e1',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.6rem',
                      borderRadius: '6px',
                    }}
                  >
                    {chunk.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
