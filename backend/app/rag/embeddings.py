"""OpenAI Embeddings wrapper for the RAG pipeline."""

from langchain_openai import OpenAIEmbeddings

from app.config import settings


def get_embeddings() -> OpenAIEmbeddings:
    """Return a configured OpenAIEmbeddings instance."""
    return OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
    )


def embed_text(text: str) -> list[float]:
    """Embed a single text string and return the vector."""
    embeddings = get_embeddings()
    return embeddings.embed_query(text)


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts and return a list of vectors."""
    embeddings = get_embeddings()
    return embeddings.embed_documents(texts)
