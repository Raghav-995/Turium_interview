import React, { useState } from 'react';
import { FileText, Globe, Plus, Loader2 } from 'lucide-react';
import type { IngestRequest } from '../types';


interface IngestionPanelProps {
  onIngest: (payload: IngestRequest) => Promise<any>;
  isLoading: boolean;
}

export const IngestionPanel: React.FC<IngestionPanelProps> = ({ onIngest, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'note' | 'url'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      if (activeTab === 'note') {
        if (!content.trim()) return;
        const res = await onIngest({
          source_type: 'note',
          title: title.trim() || undefined,
          content: content.trim(),
        });
        setSuccessMessage(`Note saved! Indexed into ${res.chunk_count} chunks.`);
        setContent('');
        setTitle('');
      } else {
        if (!url.trim()) return;
        const res = await onIngest({
          source_type: 'url',
          title: title.trim() || undefined,
          url: url.trim(),
        });
        setSuccessMessage(`URL ingested! Indexed into ${res.chunk_count} chunks.`);
        setUrl('');
        setTitle('');
      }

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      // Error handled by parent hook
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <Plus size={18} color="#3b82f6" />
        Ingest Knowledge
      </h2>

      {/* Tabs */}
      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('note');
            setSuccessMessage(null);
          }}
        >
          <FileText size={15} />
          Plain Note
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('url');
            setSuccessMessage(null);
          }}
        >
          <Globe size={15} />
          Web URL
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder={activeTab === 'note' ? "e.g., Python GIL Notes" : "Leave blank to auto-extract title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {activeTab === 'note' ? (
          <div className="form-group">
            <label className="form-label">Note Content *</label>
            <textarea
              className="form-textarea"
              placeholder="Paste or write thoughts, meeting notes, documentation snippets..."
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Web URL *</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        )}

        {successMessage && (
          <div style={{ color: '#10b981', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
            ✓ {successMessage}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Ingesting & Chunking...
            </>
          ) : (
            <>
              <Plus size={16} />
              {activeTab === 'note' ? 'Save Note' : 'Fetch & Index URL'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
