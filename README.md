# AI Knowledge Inbox

> A production-style, minimal RAG (Retrieval-Augmented Generation) web application that lets users save plain text notes and web URLs, and query them with grounded AI responses and verifiable source citations.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- *(Optional)* [Google Gemini API Key](https://aistudio.google.com/app/apikey) (or OpenAI API Key). If no API key is provided, the system seamlessly runs in **deterministic offline mock mode** with full vector search and synthesis so you can test immediately.

---

### 2. Run Locally

#### Backend Setup
```bash
# 1. Navigate to backend and create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure API Key
cp backend/.env.example backend/.env
# Add your GEMINI_API_KEY in backend/.env

# 4. Start FastAPI server
PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation (Swagger UI) is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Frontend Setup
```bash
# In a new terminal window
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Run with Docker Compose
```bash
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 4. Running Automated Tests
```bash
PYTHONPATH=. .venv/bin/pytest backend/tests/test_api.py -v
```

---

## 🏛️ System Architecture & Code Organization

```
ai-knowledge-inbox/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── ingest.py         # POST /ingest (Note & URL ingestion)
│   │   │       │   ├── items.py          # GET /items & DELETE /items/{id}
│   │   │       │   └── query.py          # POST /query (RAG question answering)
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py                 # Pydantic Settings & environment validation
│   │   │   ├── database.py               # SQLite schema & foreign key management
│   │   │   └── logging.py                # Structured console logging & request tracing
│   │   ├── models/
│   │   │   └── domain.py                 # Pydantic schemas (Request/Response contracts)
│   │   ├── services/
│   │   │   ├── scraper.py                # Async web fetcher + trafilatura extraction
│   │   │   ├── chunker.py                # Boundary-aware semantic chunker with overlap
│   │   │   ├── llm_service.py            # Multi-provider client (Gemini, OpenAI, Mock)
│   │   │   ├── vector_store.py           # SQLite + NumPy cosine similarity engine
│   │   │   └── rag_service.py            # Context assembly, citation mapping & LLM call
│   │   └── main.py                       # App factory, lifespan, CORS, error middleware
│   ├── tests/
│   │   └── test_api.py                   # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                # App title and live LLM status badge
│   │   │   ├── IngestionPanel.tsx        # Tabbed Note & URL ingestion forms
│   │   │   ├── SavedItemsList.tsx        # Item feed with chunk count & preview
│   │   │   ├── AskQuestion.tsx           # Search query input with loading states
│   │   │   └── AnswerCard.tsx            # Formatted answer with clickable citation pills
│   │   ├── hooks/
│   │   │   └── useKnowledgeInbox.ts      # Custom hook managing state & REST calls
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript domain models
│   │   ├── App.tsx                       # Main layout grid
│   │   ├── index.css                     # Vanilla CSS design system (tokens, cards)
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔍 API Contract

| Endpoint | Method | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `/ingest` | `POST` | Ingest note or scrape URL | `{ "source_type": "note"\|"url", "content": "...", "url": "..." }` | `201 Created` |
| `/items` | `GET` | List all saved items | None | `200 OK` |
| `/items/{id}` | `DELETE` | Delete item & its vector chunks | None | `204 No Content` |
| `/query` | `POST` | Ask question across inbox | `{ "question": "...", "top_k": 4 }` | `200 OK` |
| `/health` | `GET` | System readiness check | None | `200 OK` |

*Note: All endpoints are also accessible under `/api/v1/*` for backward and forward compatibility.*

---

## 🧠 Architectural Decisions & Tradeoffs

### 1. Chunking Strategy Rationale
- **Approach**: Recursive boundary-aware chunking with target chunk size ~500 characters and 100-character sliding overlap.
- **Why not fixed-character slicing?**: Blindly slicing every $N$ characters frequently breaks words and severs clauses in mid-sentence, which degrades embedding accuracy and produces fragmented snippets in citations.
- **Why overlap?**: An overlap of ~100 characters ensures that facts or definitions spanning across two sentences maintain continuity in at least one retrieved chunk.
- **Tradeoff**: Takes slightly more compute at ingestion time than naive chunking, and overlapping tokens create a small amount of redundant storage, which is an intentional tradeoff for higher retrieval precision.

### 2. Vector Store Choice
- **Approach**: In-process SQLite vector table storing JSON-serialized dense vectors, paired with vectorized NumPy cosine similarity search (`dot(u, v) / (||u|| * ||v||)`).
- **Why this over external vector databases (Pinecone, Weaviate, Milvus)?**:
  1. **Zero Infrastructure Bloat**: No separate vector server to provision, maintain, or pay for.
  2. **ACID Transactions**: Document metadata and vector embeddings are stored in the exact same database. Deleting an item cascades automatically to its vector chunks (`ON DELETE CASCADE`).
  3. **Performance**: Vectorized matrix multiplication in NumPy takes **< 10ms for 10,000+ chunks**, which easily accommodates a personal knowledge inbox.
- **Tradeoff**: Linear scan $O(N)$ similarity calculation rather than approximate nearest neighbors ($O(\log N)$). Works well up to ~50,000 vectors; beyond that, indexing is required.

### 3. Server-Side URL Ingestion
- **Approach**: `httpx` async client combined with `trafilatura` (article extraction) and `BeautifulSoup4` fallback.
- **Why**: Raw HTML contains excessive boilerplate (cookie banners, menus, scripts, advertisements) that injects noise into vector embeddings. `trafilatura` extracts only the article body text, while OpenGraph/`<title>` tags extract clean titles.

---

## 💥 What Breaks at Scale & Production Evolution

If this system scaled from a personal tool to serving **100,000+ active users**:

| Bottleneck | What Breaks at Scale | Production Solution |
| :--- | :--- | :--- |
| **URL Scraping Latency** | Synchronous scraping during HTTP request causes request timeouts (gateway 504) and exhausts web server worker threads. | Offload scraping to an asynchronous background worker queue (**Celery** / **ARQ** with **Redis**). Return `202 Accepted` with a task ID and stream status updates via WebSockets or Server-Sent Events (SSE). |
| **Dynamic SPAs & Anti-Bot** | `httpx` only reads static HTML. JavaScript-heavy SPAs (React/Vue) or sites behind Cloudflare/CloudFront will fail or return blank pages. | Integrate headless browsers (**Playwright** / **Puppeteer**) pool with rotating residential proxies and exponential backoff retry. |
| **Vector Search Throughput** | In-process SQLite linear cosine scan becomes memory and CPU bound beyond 50k–100k chunks. | Migrate to **PostgreSQL + `pgvector`** with **HNSW (Hierarchical Navigable Small World)** or **IVFFlat** indexing, or a dedicated vector database (**Qdrant** / **Pinecone**). |
| **Data Isolation & Security** | Single-user database has no multi-tenancy or authorization boundaries. | Implement JWT-based authentication, user tenant IDs on all tables, and row-level security (RLS) policies. |
| **LLM Rate Limits & Cost** | Concurrent user queries quickly breach API rate limits (TPM/RPM) and generate high token bills. | Implement semantic caching (**Redis + GPTCache**) to instantly serve frequent questions, and queue LLM requests through a token-bucket rate limiter. |

---

## 🛡️ Debuggability & Code Quality Highlights

- **Structured Logging**: Every inbound HTTP request is intercepted by custom middleware, logging HTTP method, path, response status code, and latency in milliseconds.
- **Meaningful HTTP Status Codes**:
  - `400 Bad Request`: Missing mandatory parameters or invalid URL syntax.
  - `408 Request Timeout`: Target website took too long to respond during scraping.
  - `422 Unprocessable Entity`: Blank note content or web page containing no readable text.
  - `500 Internal Server Error`: Safe exception handling with standardized error envelopes (`{"error": "...", "detail": "...", "path": "..."}`).
- **Strict Separation of Concerns**:
  - `endpoints/`: Handles HTTP routing and validation only.
  - `services/`: Encapsulates scraper, chunker, vector store, and RAG logic.
  - `models/`: Centralized Pydantic contracts shared across services.
  - `core/`: Global settings, database connection management, and logging.
