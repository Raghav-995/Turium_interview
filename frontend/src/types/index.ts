export type SourceType = 'note' | 'url' | 'file';

export interface SavedItem {
  id: string;
  source_type: SourceType;
  title: string;
  raw_content: string;
  url?: string | null;
  chunk_count: number;
  created_at: string;
}

export interface IngestRequest {
  source_type?: SourceType;
  content?: string;
  url?: string;
  title?: string;
}

export interface IngestResponse {
  id: string;
  title: string;
  source_type: SourceType;
  chunk_count: number;
  url?: string | null;
  created_at: string;
}

export interface ChunkInfo {
  id: string;
  chunk_index: number;
  content: string;
  char_count: number;
  created_at: string;
}

export interface Citation {
  item_id: string;
  item_title: string;
  url?: string | null;
  chunk_id: string;
  chunk_index: number;
  snippet: string;
  similarity_score: number;
}

export interface QueryResponse {
  question: string;
  answer: string;
  citations: Citation[];
  retrieved_chunks_count: number;
  llm_provider: string;
}
