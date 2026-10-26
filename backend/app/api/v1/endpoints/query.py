from fastapi import APIRouter, HTTPException, status
from backend.app.core.logging import logger
from backend.app.models.domain import QueryRequest, QueryResponse
from backend.app.services.rag_service import rag_service

router = APIRouter(tags=["RAG Query"])


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Ask a question across the knowledge inbox"
)
async def query_knowledge_base(payload: QueryRequest) -> QueryResponse:
    """
    RAG Query Endpoint:
    1. Embeds question using configured embedding model.
    2. Searches SQLite vector store for top relevant chunks.
    3. Prompts LLM with strict grounding instructions to prevent hallucination.
    4. Returns synthesized answer along with linked source citations.
    """
    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be blank."
        )

    try:
        response = await rag_service.answer_question(payload)
        return response
    except Exception as exc:
        logger.error(f"Error querying knowledge base: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(exc)}"
        )
