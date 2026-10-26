import React, { useState } from 'react';
import { Layers, FileText, Globe, ExternalLink, Trash2, Clock, Eye, Search, UploadCloud } from 'lucide-react';
import type { SavedItem } from '../types';

interface SavedItemsListProps {
  items: SavedItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onInspectChunks: (item: SavedItem) => void;
}

export const SavedItemsList: React.FC<SavedItemsListProps> = ({
  items,
  isLoading,
  onDelete,
  onInspectChunks,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.raw_content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.source_type === filterType;
    return matchesSearch && matchesFilter;
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <Layers size={18} color="#8b5cf6" />
          Saved Inbox Items ({items.length})
        </h2>
      </div>

      {/* Filter and Search Bar */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          <div className="search-box-mini">
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Filter saved items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-mini"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['all', 'note', 'url', 'file'].map((type) => (
              <button
                key={type}
                type="button"
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'All' : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">Loading your inbox...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          {items.length === 0
            ? 'No items saved yet. Add a note, URL, or upload a document above!'
            : 'No items match your filter.'}
        </div>
      ) : (
        <div className="items-list">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-title">{item.title}</span>
                <span className={`source-badge ${item.source_type}`}>
                  {item.source_type === 'note' ? (
                    <>
                      <FileText size={10} /> Note
                    </>
                  ) : item.source_type === 'url' ? (
                    <>
                      <Globe size={10} /> URL
                    </>
                  ) : (
                    <>
                      <UploadCloud size={10} /> File
                    </>
                  )}
                </span>
              </div>

              <p className="item-preview">{item.raw_content}</p>

              <div className="item-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> {formatDate(item.created_at)}
                  </span>
                  
                  {/* Clickable Chunk Inspector Badge */}
                  <button
                    type="button"
                    className="btn-inspect-chunks"
                    onClick={() => onInspectChunks(item)}
                    title="Inspect chunks and embeddings for this document"
                  >
                    <Eye size={10} />
                    <span>{item.chunk_count} {item.chunk_count === 1 ? 'chunk' : 'chunks'}</span>
                  </button>

                  {item.url && item.source_type === 'url' && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={10} /> link
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
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f43f5e')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
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
