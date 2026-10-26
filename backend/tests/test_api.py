import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.chunker import chunk_text

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_chunking_boundaries_and_overlap():
    text = (
        "Artificial intelligence is transforming software engineering. "
        "Retrieval-Augmented Generation connects vector databases with large language models. "
        "Chunking text properly ensures that context is never lost across arbitrary character cuts. "
        "Overlapping segments preserve semantic bridges between concepts."
    )
    chunks = chunk_text(text, chunk_size=120, chunk_overlap=30)
    assert len(chunks) >= 2
    for c in chunks:
        assert len(c) > 0


def test_ingest_note():
    payload = {
        "source_type": "note",
        "title": "Machine Learning Fundamentals",
        "content": "Supervised learning maps inputs to outputs based on labeled example pairs. Deep neural networks use backpropagation."
    }
    response = client.post("/ingest", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Machine Learning Fundamentals"
    assert data["source_type"] == "note"
    assert data["chunk_count"] >= 1
    assert "id" in data


def test_list_items():
    response = client.get("/items")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert any(item["title"] == "Machine Learning Fundamentals" for item in items)


def test_query_rag():
    payload = {
        "question": "What is supervised learning?",
        "top_k": 3
    }
    response = client.post("/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data
    assert data["retrieved_chunks_count"] >= 1


def test_ingest_empty_note_fails():
    payload = {
        "source_type": "note",
        "content": "   "
    }
    response = client.post("/ingest", json=payload)
    assert response.status_code == 422


def test_ingest_url_mocked(monkeypatch):
    from backend.app.api.v1.endpoints import ingest
    
    async def mock_fetch(url: str):
        return ("FastAPI Documentation", "FastAPI is a modern, fast web framework for building APIs with Python 3.8+ based on standard Python type hints.")

    monkeypatch.setattr(ingest, "fetch_url_content", mock_fetch)

    payload = {
        "source_type": "url",
        "url": "https://fastapi.tiangolo.com/"
    }
    response = client.post("/ingest", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["source_type"] == "url"
    assert data["title"] == "FastAPI Documentation"
    assert data["chunk_count"] >= 1

