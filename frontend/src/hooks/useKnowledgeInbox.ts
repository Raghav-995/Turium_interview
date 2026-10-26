import { useState, useEffect, useCallback } from 'react';
import type { ChunkInfo, IngestRequest, IngestResponse, QueryResponse, SavedItem } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function formatApiError(errorData: any, fallback: string): string {
  if (!errorData) return fallback;
  if (typeof errorData === 'string') return errorData;

  // FastAPI HTTPException detail
  const detail = errorData.detail;
  if (typeof detail === 'string') return detail;

  // FastAPI Pydantic validation error array
  if (Array.isArray(detail)) {
    const messages = detail.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err.msg) {
        // Strip common Pydantic prefixes
        return err.msg.replace(/^Value error,\s*/i, '');
      }
      return JSON.stringify(err);
    });
    return messages.filter(Boolean).join(' • ');
  }

  if (errorData.message) return String(errorData.message);
  return fallback;
}

export function useKnowledgeInbox() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [querying, setQuerying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  // Fetch all saved items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/items`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errJson, `Failed to load items (${res.status})`));
      }
      const data: SavedItem[] = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching saved items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Ingest note or URL
  const ingest = async (payload: IngestRequest): Promise<IngestResponse> => {
    setIngesting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const userMsg = formatApiError(errorData, `Ingestion failed (${res.status})`);
        throw new Error(userMsg);
      }

      const created: IngestResponse = await res.json();
      await fetchItems();
      return created;
    } catch (err: any) {
      const friendlyMsg = err.message || 'Failed to ingest content';
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setIngesting(false);
    }
  };

  // Upload document file (.pdf, .txt, .md)
  const uploadFile = async (file: File): Promise<IngestResponse> => {
    setIngesting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errorData, `File upload failed (${res.status})`));
      }

      const created: IngestResponse = await res.json();
      await fetchItems();
      return created;
    } catch (err: any) {
      const friendlyMsg = err.message || 'Failed to upload document';
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setIngesting(false);
    }
  };

  // Submit query for RAG answer
  const query = async (question: string, topK: number = 4, threshold: number = 0.2) => {
    if (!question.trim()) return;
    setQuerying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          top_k: topK,
          similarity_threshold: threshold,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errorData, `Query failed (${res.status})`));
      }

      const result: QueryResponse = await res.json();
      setQueryResult(result);
    } catch (err: any) {
      setError(err.message || 'Query failed');
    } finally {
      setQuerying(false);
    }
  };

  // Fetch individual chunks for an item (for Chunk Inspector)
  const fetchItemChunks = async (itemId: string): Promise<ChunkInfo[]> => {
    try {
      const res = await fetch(`${API_BASE}/items/${itemId}/chunks`);
      if (!res.ok) {
        throw new Error('Could not fetch chunks');
      }
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to inspect chunks');
    }
  };

  // Delete an item
  const deleteItem = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    }
  };

  return {
    items,
    loading,
    ingesting,
    querying,
    error,
    queryResult,
    setError,
    setQueryResult,
    fetchItems,
    ingest,
    uploadFile,
    query,
    fetchItemChunks,
    deleteItem,
  };
}
