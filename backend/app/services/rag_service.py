from typing import List, Tuple
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.models.domain import Citation, QueryRequest, QueryResponse
from backend.app.services.llm_service import llm_service
from backend.app.services.vector_store import vector_store


class RAGService:
    """
    RAG (Retrieval-Augmented Generation) Orchestrator.
    Handles embedding generation, similarity retrieval, prompt structuring,
    anti-hallucination guardrails, and citation mapping.
    """

    async def answer_question(self, request: QueryRequest) -> QueryResponse:
        logger.info(f"Processing RAG query: '{request.question}'")

        # 1. Embed query
        query_vector = await llm_service.get_embedding(request.question)

        # 2. Vector search in SQLite
        top_k = request.top_k or settings.TOP_K_CHUNKS
        threshold = (
            request.similarity_threshold
            if request.similarity_threshold is not None
            else settings.SIMILARITY_THRESHOLD
        )
        retrieved_chunks = vector_store.search_similar_chunks(
            query_vector=query_vector,
            top_k=top_k,
            threshold=threshold
        )


        # 3. Guardrail: If no chunks pass the similarity threshold or no docs exist
        if not retrieved_chunks:
            logger.info("No relevant document chunks found above threshold.")
            return QueryResponse(
                question=request.question,
                answer=(
                    "I could not find any relevant information in your saved notes or URLs "
                    "to answer this question. Try adding notes or URLs related to your question first."
                ),
                citations=[],
                retrieved_chunks_count=0,
                llm_provider=llm_service.provider
            )

        # 4. Assemble Grounded Context Prompt with Source Citations
        context_blocks = []
        citations: List[Citation] = []

        for idx, chunk in enumerate(retrieved_chunks, start=1):
            source_tag = f"[Source {idx}]"
            title = chunk["item_title"]
            url_part = f" ({chunk['item_url']})" if chunk.get("item_url") else ""
            context_blocks.append(
                f"{source_tag} Title: {title}{url_part}\nSnippet:\n\"{chunk['content']}\""
            )

            citations.append(
                Citation(
                    item_id=chunk["item_id"],
                    item_title=chunk["item_title"],
                    url=chunk.get("item_url"),
                    chunk_id=chunk["chunk_id"],
                    chunk_index=chunk["chunk_index"],
                    snippet=chunk["content"],
                    similarity_score=chunk["similarity_score"]
                )
            )

        formatted_context = "\n\n".join(context_blocks)

        system_instruction = (
            "You are a precise AI knowledge assistant answering user questions based exclusively "
            "on their saved inbox items.\n"
            "Strict Guidelines:\n"
            "1. Answer ONLY using the facts explicitly stated in the provided context.\n"
            "2. Whenever you state a claim or fact, cite the source using the exact tag, e.g., [Source 1], [Source 2].\n"
            "3. If the context does not contain enough information to fully answer the question, honestly state what is missing.\n"
            "4. Do NOT hallucinate or assume facts beyond the provided snippets."
        )

        prompt = (
            f"Context Information from saved items:\n"
            f"---------------------\n"
            f"{formatted_context}\n"
            f"---------------------\n"
            f"User Question: {request.question}\n\n"
            f"Grounded Answer (remember to cite sources like [Source 1]):"
        )

        # 5. Call LLM
        answer = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction
        )

        return QueryResponse(
            question=request.question,
            answer=answer.strip(),
            citations=citations,
            retrieved_chunks_count=len(retrieved_chunks),
            llm_provider=llm_service.provider
        )


rag_service = RAGService()
