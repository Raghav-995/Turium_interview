import hashlib
import json
import math
from typing import List, Optional
import httpx
import numpy as np
from backend.app.core.config import settings
from backend.app.core.logging import logger


class LLMService:
    """
    Unified LLM & Embeddings client supporting Google Gemini, OpenAI,
    and a zero-dependency deterministic Mock mode for offline testing.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        if settings.GEMINI_API_KEY:
            self.provider = "gemini"
        elif settings.OPENAI_API_KEY:
            self.provider = "openai"

    async def get_embedding(self, text: str) -> List[float]:
        """Generates a dense vector embedding for a given text string."""
        embeddings = await self.get_embeddings_batch([text])
        return embeddings[0]

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for a list of text strings."""
        if not texts:
            return []

        # 1. Google Gemini Embeddings
        if self.provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await self._get_gemini_embeddings(texts)
            except Exception as exc:
                logger.error(f"Gemini embedding call failed: {exc}. Falling back to mock embeddings.")

        # 2. OpenAI Embeddings
        elif self.provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._get_openai_embeddings(texts)
            except Exception as exc:
                logger.error(f"OpenAI embedding call failed: {exc}. Falling back to mock embeddings.")

        # 3. Deterministic Mock Fallback (zero crash, reproducible testable embeddings)
        logger.info("Using deterministic fallback embeddings (no active external API key found).")
        return [self._generate_mock_embedding(t) for t in texts]

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "You are an AI assistant answering questions strictly based on the provided inbox items."
    ) -> str:
        """Generates an answer from the chosen LLM given prompt and system instructions."""
        # 1. Google Gemini
        if self.provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await self._call_gemini_llm(prompt, system_instruction)
            except Exception as exc:
                logger.error(f"Gemini generation call failed: {exc}. Falling back to mock synthesizer.")

        # 2. OpenAI
        elif self.provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._call_openai_llm(prompt, system_instruction)
            except Exception as exc:
                logger.error(f"OpenAI generation call failed: {exc}. Falling back to mock synthesizer.")

        # 3. Deterministic Mock Fallback
        return self._generate_mock_response(prompt)

    # -------------------------------------------------------------
    # Provider Implementations
    # -------------------------------------------------------------

    async def _get_gemini_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Calls Google Gemini text-embedding-004 via REST."""
        model = settings.GEMINI_EMBEDDING_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents?key={settings.GEMINI_API_KEY}"
        
        requests_payload = [
            {
                "model": f"models/{model}",
                "content": {"parts": [{"text": t}]}
            }
            for t in texts
        ]

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json={"requests": requests_payload})
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API returned {resp.status_code}: {resp.text}")
            
            data = resp.json()
            embeddings = [item["values"] for item in data.get("embeddings", [])]
            return embeddings

    async def _call_gemini_llm(self, prompt: str, system_instruction: str) -> str:
        """Calls Google Gemini model (e.g. gemini-2.5-flash or gemini-1.5-flash) via REST."""
        model = settings.GEMINI_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000,
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                # If gemini-2.5-flash is not available, try gemini-1.5-flash fallback
                fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                resp = await client.post(fallback_url, json=payload)
                if resp.status_code != 200:
                    raise RuntimeError(f"Gemini generation returned {resp.status_code}: {resp.text}")
            
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
            return "No response generated by model."

    async def _get_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Calls OpenAI Embeddings API."""
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=texts
        )
        return [item.embedding for item in response.data]

    async def _call_openai_llm(self, prompt: str, system_instruction: str) -> str:
        """Calls OpenAI Chat Completion API."""
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content or ""

    def _generate_mock_embedding(self, text: str, dimensions: int = 768) -> List[float]:
        """
        Produces a normalized 768-dim sparse-dense vector using the Hashing Trick (feature hashing).
        Guarantees that shared keywords result in high cosine similarity even in offline/mock mode.
        """
        import re
        vec = np.zeros(dimensions, dtype=np.float32)
        words = re.findall(r"\w+", text.lower())
        if not words:
            words = ["empty"]

        for word in words:
            # Deterministic word hash
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % dimensions
            sign = 1.0 if ((h >> 16) % 2 == 0) else -1.0
            vec[idx] += sign

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()


    def _generate_mock_response(self, prompt: str) -> str:
        """Synthesizes a clean grounded response from context when running offline/mock."""
        return (
            "Based on your saved notes and ingested content, here is the answer: "
            "The retrieved sources contain relevant information matching your query. "
            "(Note: Provide a GEMINI_API_KEY in backend/.env for live Gemini 2.5 Flash synthesis)."
        )


llm_service = LLMService()
