import os
from langchain_google_genai import ChatGoogleGenerativeAI


class LLMService:
    DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

    @staticmethod
    def get(
        model=None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
        timeout: int | None = None,
        max_retries: int = 2,
        ) -> ChatGoogleGenerativeAI:
        """Instantiates and returns a ChatGoogleGenerativeAI model."""
        return ChatGoogleGenerativeAI(
            model=model or LLMService.DEFAULT_MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
            max_retries=max_retries
        )
