import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Globe,
  ExternalLink,
  Trash2,
  Clock,
  Eye,
  Search,
  UploadCloud,
  X,
  PlusCircle,
} from 'lucide-react';
import type { SavedItem } from '../types';

interface SavedItemsListProps {
  items: SavedItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onInspectChunks: (item: SavedItem) => void;
  onIngestClick?: () => void;
}

export const SavedItemsList: React.FC<SavedItemsListProps> = ({
  items,
  isLoading,
  onDelete,
  onInspectChunks,
  onIngestClick,
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
    <div className="card saved-items-card">
      {/* Header */}
      <div className="saved-items-header">
        <h2 className="card-title" style={{ margin: 0, fontSize: '0.95rem' }}>
          <Layers size={17} color="#8b5cf6" />
          <span>Saved Items ({items.length})</span>
        </h2>

        {onIngestClick && (
          <button
            type="button"
            className="btn-primary-mini"
            onClick={onIngestClick}
            title="Ingest a new note, web URL, or document"
          >
            <PlusCircle size={13} />
            <span>+ Ingest Knowledge</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      {items.length > 0 && (
        <div className="saved-items-search-wrap">
          <div className="search-box-mini">
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Search in saved items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-mini"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="btn-clear-search"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="filter-chips-row">
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

      {/* Content */}
      {isLoading ? (
        <div className="empty-state">Loading your inbox...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0.5rem' }}>
              <span>No items saved in your knowledge inbox yet.</span>
              {onIngestClick && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  onClick={onIngestClick}
                >
                  <PlusCircle size={15} />
                  <span>+ Ingest First Note or URL</span>
                </button>
              )}
            </div>
          ) : (
            <span>No items match your filter.</span>
          )}
        </div>
      ) : (
        <div className="items-list">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-title" title={item.title}>
                  {item.title}
                </span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                    <span>
                      {item.chunk_count} {item.chunk_count === 1 ? 'chunk' : 'chunks'}
                    </span>
                  </button>

                  {item.url && item.source_type === 'url' && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="item-link"
                    >
                      <ExternalLink size={10} /> link
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="btn-delete-item"
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
