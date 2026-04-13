"""PGVector-based vector store for course content."""

from langchain_core.documents import Document
from langchain_postgres import PGVector

from app.config import settings
from app.rag.embeddings import get_embeddings

COLLECTION_NAME = "course_content"


def _get_sync_connection_string() -> str:
    """Convert asyncpg URL to psycopg sync URL for PGVector."""
    url = settings.DATABASE_URL
    conn = url.replace("+asyncpg", "").replace("postgresql://", "postgresql+psycopg://")
    if "sslmode" not in conn:
        separator = "&" if "?" in conn else "?"
        conn += f"{separator}sslmode=require"
    return conn


def get_vectorstore(connection_string: str | None = None) -> PGVector:
    """Return a PGVector instance connected to the course_content collection."""
    conn = connection_string or _get_sync_connection_string()
    return PGVector(
        embeddings=get_embeddings(),
        collection_name=COLLECTION_NAME,
        connection=conn,
        use_jsonb=True,
    )


def add_documents(docs: list[Document]) -> None:
    """Add documents to the vector store."""
    store = get_vectorstore()
    store.add_documents(docs)


def similarity_search(
    query: str,
    k: int = 5,
    filter: dict | None = None,
) -> list[tuple[Document, float]]:
    """Search for similar documents and return (document, score) tuples."""
    store = get_vectorstore()
    return store.similarity_search_with_relevance_scores(
        query=query,
        k=k,
        filter=filter,
    )
