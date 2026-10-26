import json
import sqlite3
from typing import Any, Dict, List, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger


_initialized = False

def get_db_connection() -> sqlite3.Connection:
    """Provides a SQLite database connection with row factory enabled."""
    global _initialized
    conn = sqlite3.connect(str(settings.DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    if not _initialized:
        _init_tables(conn)
        _initialized = True
    return conn


def _init_tables(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            source_type TEXT NOT NULL CHECK(source_type IN ('note', 'url')),
            title TEXT NOT NULL,
            raw_content TEXT NOT NULL,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        );
        """
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_chunks_item_id ON chunks(item_id);"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);"
    )
    conn.commit()


def init_db() -> None:
    """Initializes tables for items and vector chunks."""
    logger.info(f"Initializing database at {settings.DATABASE_PATH}")
    with get_db_connection() as conn:
        _init_tables(conn)
    logger.info("Database schema initialized successfully.")

