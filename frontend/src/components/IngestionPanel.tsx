import React, { useState, useRef } from 'react';
import {
  FileText,
  Globe,
  Plus,
  Loader2,
  UploadCloud,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { IngestRequest } from '../types';

interface IngestionPanelProps {
  onIngest: (payload: IngestRequest) => Promise<any>;
  onUploadFile: (file: File) => Promise<any>;
  isLoading: boolean;
  onSuccess?: () => void;
  onViewSavedItems?: () => void;
  savedItemsCount?: number;
}

export const IngestionPanel: React.FC<IngestionPanelProps> = ({
  onIngest,
  onUploadFile,
  isLoading,
  onSuccess,
  onViewSavedItems,
  savedItemsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'url' | 'file'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setLocalError('Please choose a file to upload (.pdf, .txt, .md).');
          return;
        }
        const res = await onUploadFile(selectedFile);
        setSuccessMessage(`File indexed into ${res.chunk_count} chunks!`);
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

      // Automatically replace Ingest Knowledge div with Saved Items list after 750ms
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 750);
      } else {
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Operation failed');
    }
  };

  return (
    <div className="card ingestion-panel-card">
      {/* Card Header */}
      <div className="ingestion-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <PlusCircle size={16} color="#3b82f6" />
          <h2 className="card-title" style={{ margin: 0, fontSize: '0.95rem' }}>
            Ingest Knowledge
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-sample"
            onClick={handleLoadSample}
            disabled={activeTab === 'file'}
            style={{ visibility: activeTab === 'file' ? 'hidden' : 'visible' }}
            title="Load demo sample for instant testing"
          >
            <Sparkles size={11} color="#60a5fa" />
            <span>Load Demo</span>
          </button>

          {onViewSavedItems && (
            <button
              type="button"
              className="btn-outline-mini"
              onClick={onViewSavedItems}
              title="View your saved items list"
            >
              <Layers size={11} color="#8b5cf6" />
              <span>Saved Items ({savedItemsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container ingestion-tab-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('note');
            setLocalError(null);
            setSuccessMessage(null);
          }}
        >
          <FileText size={12} />
          <span>Plain Note</span>
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
          <Globe size={12} />
          <span>Web URL</span>
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
          <UploadCloud size={12} />
          <span>Upload Doc</span>
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="ingestion-form">
        <div className="ingestion-tab-content">
          {activeTab === 'file' ? (
            <div
              className="file-drop-area-compact"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={24} color="#3b82f6" />
              <p className="file-drop-title">
                {selectedFile ? selectedFile.name : 'Choose a file (.pdf, .txt, .md)'}
              </p>
              <span className="file-drop-subtitle">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB ready to index`
                  : 'Automatic text extraction & vector embeddings'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setLocalError(null);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-browse-file"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {selectedFile ? 'Change File' : 'Browse File'}
              </button>
            </div>
          ) : (
            <div className="tab-inputs-wrapper">
              <div className="form-group-compact">
                <label className="form-label-compact">Title (Optional)</label>
                <input
                  type="text"
                  className="form-input form-input-compact"
                  placeholder={
                    activeTab === 'note'
                      ? 'e.g., Python Architecture Notes'
                      : 'Auto-extracted from webpage'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {activeTab === 'note' ? (
                <div className="form-group-compact">
                  <label className="form-label-compact">Note Content *</label>
                  <textarea
                    className="form-textarea form-textarea-compact"
                    placeholder="Paste or write thoughts, meeting notes, documentation snippets..."
                    required
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group-compact">
                  <label className="form-label-compact">Web URL *</label>
                  <input
                    type="text"
                    className="form-input form-input-compact"
                    placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <span className="url-tip-compact">
                    Public URLs only (login-gated sites return auth pages).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-submit-ingest"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Processing & Chunking...</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>
                {activeTab === 'note'
                  ? 'Save Note'
                  : activeTab === 'url'
                  ? 'Fetch & Index URL'
                  : 'Upload & Index File'}
              </span>
            </>
          )}
        </button>

        {/* Reserved Status / Feedback Slot */}
        <div className="ingestion-status-slot">
          {localError && (
            <div className="ingestion-status-msg error">
              <AlertCircle size={12} />
              <span>{localError}</span>
            </div>
          )}
          {successMessage && (
            <div className="ingestion-status-msg success">
              <span>✓ {successMessage}</span>
              {onViewSavedItems && (
                <button
                  type="button"
                  className="btn-inline-link"
                  onClick={onViewSavedItems}
                  title="View item in saved items list"
                >
                  <span>Go to Items</span>
                  <ArrowRight size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
