from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import get_db_connection
from backend.app.core.logging import logger
from backend.app.models.domain import IngestRequest, IngestResponse
from backend.app.services.chunker import chunk_text
from backend.app.services.llm_service import llm_service
from backend.app.services.scraper import ScraperError, fetch_url_content
from backend.app.services.vector_store import vector_store

router = APIRouter(tags=["Ingestion"])


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest plain text note or web URL"
)
async def ingest_content(payload: IngestRequest) -> IngestResponse:
    """
    Ingests either a raw text note or an external URL into the AI knowledge inbox:
    1. Extracts/cleans content (server-side scraping for URLs).
    2. Chunks content using semantic boundary splitting with overlap.
    3. Computes vector embeddings.
    4. Stores document and vector chunks in SQLite.
    """
    item_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    source_type = payload.source_type

    if source_type == "url":
        url = str(payload.url)
        try:
            scraped_title, raw_content = await fetch_url_content(url)
            title = payload.title or scraped_title
        except ScraperError as exc:
            logger.error(f"Scraper error for {url}: {exc}")
            raise HTTPException(status_code=exc.status_code, detail=str(exc))
        except Exception as exc:
            logger.error(f"Unexpected error scraping {url}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal error scraping URL: {str(exc)}"
            )
    else:
        # Plain text note
        url = None
        raw_content = payload.content.strip()
        if payload.title and payload.title.strip():
            title = payload.title.strip()
        else:
            # First line or snippet as title
            first_line = raw_content.splitlines()[0][:50].strip()
            title = first_line if first_line else "Untitled Note"

    # 1. Chunk content
    chunks = chunk_text(raw_content)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content did not yield any indexable text chunks."
        )

    # 2. Compute embeddings
    try:
        embeddings = await llm_service.get_embeddings_batch(chunks)
    except Exception as exc:
        logger.error(f"Failed to generate embeddings: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding generation failed: {str(exc)}"
        )

    # 3. Save Item in database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO items (id, source_type, title, raw_content, url, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (item_id, source_type, title, raw_content, url, created_at)
        )
        conn.commit()

    # 4. Save Chunks & Embeddings in Vector Store
    vector_store.save_chunks(
        item_id=item_id,
        chunks=chunks,
        embeddings=embeddings
    )

    logger.info(f"Successfully ingested {source_type} '{title}' with {len(chunks)} chunks.")

    return IngestResponse(
        id=item_id,
        title=title,
        source_type=source_type,
        chunk_count=len(chunks),
        url=url,
        created_at=created_at
    )
