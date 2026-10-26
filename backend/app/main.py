from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.api.v1.endpoints import ingest, items, query
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.logging import RequestLoggingMiddleware, logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Starting AI Knowledge Inbox Backend...")
    init_db()
    logger.info(f"LLM Provider configured as: {settings.LLM_PROVIDER}")
    yield
    logger.info("Shutting down AI Knowledge Inbox Backend.")


app = FastAPI(
    title="AI Knowledge Inbox API",
    description="Production-style minimal RAG API for saving notes/URLs and asking grounded questions.",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "path": request.url.path
        }
    )


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "provider": settings.LLM_PROVIDER,
        "database": "sqlite_ready"
    }


# Include Routers directly at root (as specified in PDF: POST /ingest, GET /items, POST /query)
app.include_router(ingest.router)
app.include_router(items.router)
app.include_router(query.router)

# Also expose under /api/v1 for standard REST versioning
app.include_router(ingest.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
app.include_router(query.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
