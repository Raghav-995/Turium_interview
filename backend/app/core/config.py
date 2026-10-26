import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    # API Keys & Providers
    # Supports "gemini", "openai", or "mock" (for testing without API keys)
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Model specifications
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"


    # SQLite Storage
    DATABASE_NAME: str = "knowledge_inbox.db"

    @property
    def DATABASE_PATH(self) -> Path:
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        return self.DATA_DIR / self.DATABASE_NAME

    # RAG Settings
    CHUNK_SIZE: int = 500  # Target characters per chunk
    CHUNK_OVERLAP: int = 100  # Character overlap between chunks
    TOP_K_CHUNKS: int = 4  # Retrieved chunks per query
    SIMILARITY_THRESHOLD: float = 0.25  # Minimum cosine similarity to consider

    # Web Scraper
    SCRAPER_TIMEOUT_SECONDS: float = 12.0
    SCRAPER_USER_AGENT: str = (
        "Mozilla/5.0 (compatible; AIKnowledgeInboxBot/1.0; +https://github.com/ai-knowledge-inbox)"
    )

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
