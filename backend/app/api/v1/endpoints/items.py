import json
from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import get_db_connection
from backend.app.core.logging import logger
from backend.app.models.domain import ChunkInfo, SavedItem
from backend.app.services.vector_store import vector_store

router = APIRouter(tags=["Items"])


@router.get(
    "/items",
    response_model=List[SavedItem],
    summary="List all saved notes and URLs"
)
async def list_items() -> List[SavedItem]:
    """
    Retrieves all saved items in the knowledge inbox, ordered by most recently added.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                i.id,
                i.source_type,
                i.title,
                i.raw_content,
                i.url,
                i.created_at,
                COUNT(c.id) AS chunk_count
            FROM items i
            LEFT JOIN chunks c ON i.id = c.item_id
            GROUP BY i.id
            ORDER BY i.created_at DESC;
            """
        )
        rows = cursor.fetchall()

    items = [
        SavedItem(
            id=row["id"],
            source_type=row["source_type"],
            title=row["title"],
            raw_content=row["raw_content"],
            url=row["url"],
            chunk_count=row["chunk_count"],
            created_at=row["created_at"]
        )
        for row in rows
    ]
    return items


@router.get(
    "/items/{item_id}/chunks",
    response_model=List[ChunkInfo],
    summary="Inspect individual chunks generated for a specific item"
)
async def get_item_chunks(item_id: str) -> List[ChunkInfo]:
    """
    Returns all text chunks, their order, character lengths, and timestamps
    for technical transparency in the UI chunk inspector.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, chunk_index, content, created_at
            FROM chunks
            WHERE item_id = ?
            ORDER BY chunk_index ASC;
            """,
            (item_id,)
        )
        rows = cursor.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No chunks found for this item.")

    return [
        ChunkInfo(
            id=row["id"],
            chunk_index=row["chunk_index"],
            content=row["content"],
            char_count=len(row["content"]),
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a saved item and its vector chunks"
)
async def delete_item(item_id: str):
    """Deletes an item and cleans up its associated vector embeddings."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM items WHERE id = ?;", (item_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")

        cursor.execute("DELETE FROM items WHERE id = ?;", (item_id,))
        cursor.execute("DELETE FROM chunks WHERE item_id = ?;", (item_id,))
        conn.commit()

    logger.info(f"Deleted item and chunks for id={item_id}")
    return None
