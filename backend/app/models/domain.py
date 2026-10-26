from datetime import datetime
from pathlib import Path
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


SourceType = Literal["note", "url", "file"]


class IngestRequest(BaseModel):
    """Payload for ingesting text notes, external web pages, or local files."""
    source_type: Optional[SourceType] = Field(
        default=None,
        description="Type of content: 'note', 'url', or 'file'."
    )
    content: Optional[str] = Field(
        default=None,
        description="Plain text content (required if source_type is 'note')."
    )
    url: Optional[str] = Field(
        default=None,
        description="Web URL (http/https) or local file path (file://)."
    )
    title: Optional[str] = Field(
        default=None,
        description="Optional title. If omitted, will be auto-extracted."
    )

    @model_validator(mode="after")
    def validate_inputs(self) -> "IngestRequest":
        # Handle URL / file paths
        if self.url and self.url.strip():
            cleaned_url = self.url.strip()
            if cleaned_url.startswith("file://") or cleaned_url.startswith("/"):
                self.source_type = "file"
                self.url = cleaned_url.replace("file://", "")
            elif cleaned_url.startswith("http://") or cleaned_url.startswith("https://"):
                self.source_type = "url"
                self.url = cleaned_url
            else:
                # Auto-prefix https:// for user convenience
                self.url = f"https://{cleaned_url}"
                self.source_type = "url"

        # Auto-detect if source_type still not explicitly set
        if not self.source_type:
            if self.content and self.content.strip():
                self.source_type = "note"
            else:
                raise ValueError("Please provide either note text, a web URL, or an uploaded document.")

        if self.source_type == "note":
            if not self.content or not self.content.strip():
                raise ValueError("Note content cannot be empty.")
        elif self.source_type == "url":
            if not self.url:
                raise ValueError("A valid web URL (e.g., https://example.com) must be provided.")
        elif self.source_type == "file":
            if not self.url or not Path(self.url).exists():
                raise ValueError(f"Target file does not exist at path: {self.url}")

        return self


class IngestResponse(BaseModel):
    """Confirmation returned after successfully storing and indexing an item."""
    id: str
    title: str
    source_type: SourceType
    chunk_count: int
    url: Optional[str] = None
    created_at: str


class ChunkInfo(BaseModel):
    """Individual chunk representation for inspector."""
    id: str
    chunk_index: int
    content: str
    char_count: int
    created_at: str


class SavedItem(BaseModel):
    """Representation of an ingested item in the inbox."""
    id: str
    source_type: SourceType
    title: str
    raw_content: str
    url: Optional[str] = None
    chunk_count: int = 0
    created_at: str


class QueryRequest(BaseModel):
    """Payload to ask a question across the knowledge inbox."""
    question: str = Field(..., min_length=2, description="The query to ask against saved documents.")
    top_k: Optional[int] = Field(
        default=4,
        ge=1,
        le=10,
        description="Number of relevant chunks to retrieve."
    )
    similarity_threshold: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Optional minimum cosine similarity filter (0.0 to 1.0)."
    )


class Citation(BaseModel):
    """Reference metadata for each chunk used to ground the LLM's response."""
    item_id: str
    item_title: str
    url: Optional[str] = None
    chunk_id: str
    chunk_index: int
    snippet: str
    similarity_score: float


class QueryResponse(BaseModel):
    """Synthesized answer accompanied by cited source snippets."""
    question: str
    answer: str
    citations: List[Citation]
    retrieved_chunks_count: int
    llm_provider: str
