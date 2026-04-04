from langchain_google_genai import ChatGoogleGenerativeAI


class LLMService:
    DEFAULT_MODEL = "gemini-3.1-flash-lite-preview"

    @staticmethod
    def get(
        model=DEFAULT_MODEL,
        temperature: float = 0.2,
        max_tokens: int | None = None,
        timeout: int | None = None,
        max_retries: int = 2,
        ) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
            max_retries=max_retries
        )
