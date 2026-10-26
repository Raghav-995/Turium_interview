import { useState, useEffect, useCallback } from 'react';
import type { IngestRequest, IngestResponse, QueryResponse, SavedItem } from '../types';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        throw new Error(`Failed to load items (${res.status})`);
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
        throw new Error(errorData.detail || `Ingestion failed (${res.status})`);
      }

      const created: IngestResponse = await res.json();
      await fetchItems(); // Refresh items feed
      return created;
    } catch (err: any) {
      setError(err.message || 'Ingestion failed');
      throw err;
    } finally {
      setIngesting(false);
    }
  };

  // Submit query for RAG answer
  const query = async (question: string) => {
    if (!question.trim()) return;
    setQuerying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), top_k: 4 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Query failed (${res.status})`);
      }

      const result: QueryResponse = await res.json();
      setQueryResult(result);
    } catch (err: any) {
      setError(err.message || 'Query failed');
    } finally {
      setQuerying(false);
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
    query,
    deleteItem,
  };
}
