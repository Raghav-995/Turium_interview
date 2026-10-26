from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl, model_validator


SourceType = Literal["note", "url"]


class IngestRequest(BaseModel):
    """Payload for ingesting text notes or external web pages."""
    source_type: Optional[SourceType] = Field(
        default=None,
        description="Type of content: 'note' or 'url'. If omitted, auto-detected from url/content."
    )
    content: Optional[str] = Field(
        default=None,
        description="Plain text content (required if source_type is 'note')."
    )
    url: Optional[str] = Field(
        default=None,
        description="HTTP/HTTPS URL to fetch (required if source_type is 'url')."
    )
    title: Optional[str] = Field(
        default=None,
        description="Optional title. If omitted, will be extracted or generated."
    )

    @model_validator(mode="after")
    def validate_inputs(self) -> "IngestRequest":
        # Auto-detect source_type if not explicitly set
        if not self.source_type:
            if self.url and (self.url.startswith("http://") or self.url.startswith("https://")):
                self.source_type = "url"
            elif self.content:
                self.source_type = "note"
            else:
                raise ValueError("Must provide either 'content' for a note or a valid 'url'.")

        if self.source_type == "note":
            if not self.content or not self.content.strip():
                raise ValueError("Content cannot be empty when ingesting a note.")
        elif self.source_type == "url":
            if not self.url or not (self.url.startswith("http://") or self.url.startswith("https://")):
                raise ValueError("A valid http:// or https:// URL must be provided.")
        
        return self


class IngestResponse(BaseModel):
    """Confirmation returned after successfully storing and indexing an item."""
    id: str
    title: str
    source_type: SourceType
    chunk_count: int
    url: Optional[str] = None
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
