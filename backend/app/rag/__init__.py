"""RAG pipeline: embeddings, chunker, vectorstore, retriever."""

from app.rag.chunker import process_course_clips, process_misconceptions
from app.rag.embeddings import embed_batch, embed_text, get_embeddings
from app.rag.retriever import RetrievedClip, search
from app.rag.vectorstore import add_documents, get_vectorstore, similarity_search

__all__ = [
    "add_documents",
    "embed_batch",
    "embed_text",
    "get_embeddings",
    "get_vectorstore",
    "process_course_clips",
    "process_misconceptions",
    "RetrievedClip",
    "search",
    "similarity_search",
]
