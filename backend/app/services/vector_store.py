import json
import uuid
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from backend.app.core.config import settings
from backend.app.core.database import get_db_connection
from backend.app.core.logging import logger


class VectorStore:
    """
    Lightweight, embedded vector store built on top of SQLite and NumPy.
    
    Architectural Rationale:
    1. Zero Infrastructure Bloat: Avoids requiring Dockerized vector DBs (Milvus, Qdrant daemon)
       for small-to-medium personal knowledge inbox use cases.
    2. ACID Compliant & Persistent: Documents and vector embeddings live together with foreign keys.
    3. Fast Cosine Similarity: In-process vectorized NumPy matrix multiplication handles 10,000+
       chunks in milliseconds.
    """

    def save_chunks(
        self,
        item_id: str,
        chunks: List[str],
        embeddings: List[List[float]]
    ) -> int:
        """Persists text chunks alongside their vector embeddings into SQLite."""
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks and embeddings must match.")

        with get_db_connection() as conn:
            cursor = conn.cursor()
            for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO chunks (id, item_id, chunk_index, content, embedding)
                    VALUES (?, ?, ?, ?, ?);
                    """,
                    (
                        chunk_id,
                        item_id,
                        idx,
                        chunk_text,
                        json.dumps(embedding)
                    )
                )
            conn.commit()

        logger.info(f"Persisted {len(chunks)} chunks for item_id={item_id}")
        return len(chunks)

    def search_similar_chunks(
        self,
        query_vector: List[float],
        top_k: int = settings.TOP_K_CHUNKS,
        threshold: float = settings.SIMILARITY_THRESHOLD
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the top-k most semantically relevant chunks across all saved items.
        Returns chunk content, similarity score, and item metadata.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    c.id AS chunk_id,
                    c.item_id,
                    c.chunk_index,
                    c.content,
                    c.embedding,
                    i.title AS item_title,
                    i.url AS item_url,
                    i.source_type
                FROM chunks c
                JOIN items i ON c.item_id = i.id;
                """
            )
            rows = cursor.fetchall()

        if not rows:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        # Vectorized similarity calculation
        scored_chunks = []
        for row in rows:
            chunk_vec = np.array(json.loads(row["embedding"]), dtype=np.float32)
            c_norm = np.linalg.norm(chunk_vec)
            if c_norm == 0 or len(chunk_vec) != len(q_vec):
                continue

            # Cosine similarity = dot(A, B) / (||A|| * ||B||)
            similarity = float(np.dot(q_vec, chunk_vec) / (q_norm * c_norm))


            if similarity >= threshold:
                scored_chunks.append({
                    "chunk_id": row["chunk_id"],
                    "item_id": row["item_id"],
                    "chunk_index": row["chunk_index"],
                    "content": row["content"],
                    "item_title": row["item_title"],
                    "item_url": row["item_url"],
                    "source_type": row["source_type"],
                    "similarity_score": round(similarity, 4)
                })

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]

    def delete_item_chunks(self, item_id: str) -> None:
        """Deletes all chunks associated with an item."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chunks WHERE item_id = ?;", (item_id,))
            conn.commit()


vector_store = VectorStore()
