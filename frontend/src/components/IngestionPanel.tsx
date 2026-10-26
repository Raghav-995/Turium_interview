import React, { useState } from 'react';
import { FileText, Globe, Plus, Loader2, UploadCloud, Sparkles, AlertCircle } from 'lucide-react';
import type { IngestRequest } from '../types';

interface IngestionPanelProps {
  onIngest: (payload: IngestRequest) => Promise<any>;
  onUploadFile: (file: File) => Promise<any>;
  isLoading: boolean;
}

export const IngestionPanel: React.FC<IngestionPanelProps> = ({
  onIngest,
  onUploadFile,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'url' | 'file'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoadSample = () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (activeTab === 'note') {
      setTitle('FastAPI Architecture Notes');
      setContent(
        'FastAPI is built on Starlette and Pydantic. It provides automatic interactive OpenAPI docs, high performance async endpoints, dependency injection, and strict type safety across Python 3.8+.'
      );
    } else if (activeTab === 'url') {
      setTitle('Google AI Studio Quickstart');
      setUrl('https://ai.google.dev/gemini-api/docs/ai-studio-quickstart');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setLocalError(null);

    try {
      if (activeTab === 'file') {
        if (!selectedFile) {
          setLocalError('Please select a file to upload (.pdf, .txt, .md).');
          return;
        }
        const res = await onUploadFile(selectedFile);
        setSuccessMessage(`File "${res.title}" indexed into ${res.chunk_count} chunks!`);
        setSelectedFile(null);
      } else if (activeTab === 'note') {
        if (!content.trim()) {
          setLocalError('Note content cannot be empty.');
          return;
        }
        const res = await onIngest({
          source_type: 'note',
          title: title.trim() || undefined,
          content: content.trim(),
        });
        setSuccessMessage(`Note saved! Indexed into ${res.chunk_count} chunks.`);
        setContent('');
        setTitle('');
      } else {
        if (!url.trim()) {
          setLocalError('Please enter a web URL.');
          return;
        }
        const res = await onIngest({
          source_type: 'url',
          title: title.trim() || undefined,
          url: url.trim(),
        });
        setSuccessMessage(`URL indexed! Extracted ${res.chunk_count} chunks.`);
        setUrl('');
        setTitle('');
      }

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setLocalError(err.message || 'Operation failed');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <Plus size={18} color="#3b82f6" />
          Ingest Knowledge
        </h2>
        {activeTab !== 'file' && (
          <button
            type="button"
            className="btn-sample"
            onClick={handleLoadSample}
            title="Load demo sample for instant testing"
          >
            <Sparkles size={11} color="#60a5fa" />
            <span>Load Demo</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('note');
            setLocalError(null);
            setSuccessMessage(null);
          }}
        >
          <FileText size={14} />
          Plain Note
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('url');
            setLocalError(null);
            setSuccessMessage(null);
          }}
        >
          <Globe size={14} />
          Web URL
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('file');
            setLocalError(null);
            setSuccessMessage(null);
          }}
        >
          <UploadCloud size={14} />
          Upload Doc
        </button>
      </div>

      {localError && (
        <div className="alert-error" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={15} />
            <span>{localError}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div style={{ color: '#10b981', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {activeTab === 'file' ? (
          <div className="form-group">
            <label className="form-label">Upload PDF, Markdown, or Text File *</label>
            <div className="file-drop-area">
              <UploadCloud size={28} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                {selectedFile ? selectedFile.name : 'Choose a file (.pdf, .txt, .md)'}
              </p>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Text is extracted, chunked, and embedded automatically.
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setLocalError(null);
                  }
                }}
                style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Title (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={activeTab === 'note' ? 'e.g., Python Architecture' : 'Auto-extracted from webpage title'}
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
                  type="text"
                  className="form-input"
                  placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Tip: Provide public URLs. Sites requiring login (like Google Accounts) will only return their sign-in page.
                </span>
              </div>
            )}
          </>
        )}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing & Chunking...
            </>
          ) : (
            <>
              <Plus size={16} />
              {activeTab === 'note'
                ? 'Save Note'
                : activeTab === 'url'
                ? 'Fetch & Index URL'
                : 'Upload & Index File'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
