import React from 'react';
import { Layers, FileText, Globe, ExternalLink, Trash2, Clock } from 'lucide-react';
import type { SavedItem } from '../types';


interface SavedItemsListProps {
  items: SavedItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export const SavedItemsList: React.FC<SavedItemsListProps> = ({ items, isLoading, onDelete }) => {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h2 className="card-title">
        <Layers size={18} color="#8b5cf6" />
        Saved Inbox Items ({items.length})
      </h2>

      {isLoading ? (
        <div className="empty-state">Loading your inbox...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          No items saved yet.<br />Add a text note or paste a URL above!
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-title">{item.title}</span>
                <span className={`source-badge ${item.source_type}`}>
                  {item.source_type === 'note' ? (
                    <>
                      <FileText size={10} /> Note
                    </>
                  ) : (
                    <>
                      <Globe size={10} /> URL
                    </>
                  )}
                </span>
              </div>

              <p className="item-preview">{item.raw_content}</p>

              <div className="item-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> {formatDate(item.created_at)}
                  </span>
                  <span>• {item.chunk_count} {item.chunk_count === 1 ? 'chunk' : 'chunks'}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <ExternalLink size={11} /> link
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '0.2rem',
                  }}
                  title="Delete item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
