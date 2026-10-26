from datetime import datetime, timezone
import io
from pathlib import Path
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pypdf import PdfReader
from backend.app.core.database import get_db_connection
from backend.app.core.logging import logger
from backend.app.models.domain import IngestRequest, IngestResponse
from backend.app.services.chunker import chunk_text
from backend.app.services.llm_service import llm_service
from backend.app.services.scraper import ScraperError, fetch_url_content
from backend.app.services.vector_store import vector_store

router = APIRouter(tags=["Ingestion"])


def extract_file_content(file_path: Path) -> tuple[str, str]:
    """Reads a local text or PDF file."""
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Local file does not exist at: {file_path}"
        )
    
    title = file_path.stem.replace("_", " ").title()
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        try:
            reader = PdfReader(str(file_path))
            pages_text = []
            for p in reader.pages:
                text = p.extract_text()
                if text:
                    pages_text.append(text)
            content = "\n\n".join(pages_text).strip()
            if not content:
                raise ValueError("PDF file did not contain any readable text.")
            return title, content
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to read PDF document: {str(exc)}"
            )
    else:
        try:
            content = file_path.read_text(encoding="utf-8").strip()
            if not content:
                raise ValueError("File is empty.")
            return title, content
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to read file: {str(exc)}"
            )


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest plain text note, web URL, or local file"
)
async def ingest_content(payload: IngestRequest) -> IngestResponse:
    """
    Ingests either a raw text note, an external URL, or a local document into the inbox.
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
                detail=f"Could not connect to URL: {str(exc)}"
            )
    elif source_type == "file":
        file_path = Path(str(payload.url))
        url = str(file_path)
        extracted_title, raw_content = extract_file_content(file_path)
        title = payload.title or extracted_title
    else:
        # Plain text note
        url = None
        raw_content = payload.content.strip()
        if payload.title and payload.title.strip():
            title = payload.title.strip()
        else:
            first_line = raw_content.splitlines()[0][:50].strip()
            title = first_line if first_line else "Untitled Note"

    # 1. Chunk content
    chunks = chunk_text(raw_content)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The content does not contain enough readable text to create search chunks."
        )

    # 2. Compute embeddings
    try:
        embeddings = await llm_service.get_embeddings_batch(chunks)
    except Exception as exc:
        logger.error(f"Failed to generate embeddings: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Embedding generation failed: {str(exc)}"
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


@router.post(
    "/upload",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF, TXT, or Markdown document directly"
)
async def upload_document(file: UploadFile = File(...)) -> IngestResponse:
    """Uploads and indexes a file (.pdf, .txt, .md)."""
    filename = file.filename or "uploaded_document.txt"
    title = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    content_bytes = await file.read()

    if not content_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty."
        )

    suffix = Path(filename).suffix.lower()
    raw_content = ""

    if suffix == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
            pages_text = [p.extract_text() for p in reader.pages if p.extract_text()]
            raw_content = "\n\n".join(pages_text).strip()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unable to parse PDF text: {str(exc)}"
            )
    else:
        try:
            raw_content = content_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            raw_content = content_bytes.decode("latin-1", errors="ignore").strip()

    if not raw_content or len(raw_content) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract readable text from the uploaded file."
        )

    # Ingest document
    item_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    chunks = chunk_text(raw_content)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document text could not be chunked."
        )

    embeddings = await llm_service.get_embeddings_batch(chunks)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO items (id, source_type, title, raw_content, url, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (item_id, "file", title, raw_content, filename, created_at)
        )
        conn.commit()

    vector_store.save_chunks(item_id=item_id, chunks=chunks, embeddings=embeddings)

    return IngestResponse(
        id=item_id,
        title=title,
        source_type="file",
        chunk_count=len(chunks),
        url=filename,
        created_at=created_at
    )
