"""High-level retriever that separates clips and misconceptions."""

from pydantic import BaseModel, Field

from app.config import settings
from app.rag.vectorstore import similarity_search


class RetrievedClip(BaseModel):
    """A single retrieved content item with metadata."""

    content: str
    course_title: str = ""
    chapter_no: int = 0
    clip_no: int = 0
    clip_title: str = ""
    timestamp: str = ""
    concept_id: str = ""
    source_type: str = ""
    relevance_score: float = 0.0


def _build_clip(content: str, metadata: dict, score: float) -> RetrievedClip:
    """Build a RetrievedClip from document content, metadata, and score."""
    timestamp_start = metadata.get("timestamp_start", "")
    timestamp_end = metadata.get("timestamp_end", "")
    timestamp = (
        f"{timestamp_start}-{timestamp_end}"
        if timestamp_start and timestamp_end
        else timestamp_start or timestamp_end or ""
    )
    return RetrievedClip(
        content=content,
        course_title=metadata.get("course_title", ""),
        chapter_no=metadata.get("chapter_no", 0),
        clip_no=metadata.get("clip_no", 0),
        clip_title=metadata.get("clip_title", ""),
        timestamp=timestamp,
        concept_id=metadata.get("concept_id", ""),
        source_type=metadata.get("source_type", ""),
        relevance_score=score,
    )


def search(
    query: str,
    course_id: str | None = None,
    top_k: int | None = None,
) -> dict:
    """Search for relevant clips and misconceptions.

    Returns:
        dict with "clips" (list[RetrievedClip]) and
        "misconceptions" (list[RetrievedClip])
    """
    k = top_k or settings.RAG_TOP_K
    filter_dict = {"course_id": course_id} if course_id else None

    results = similarity_search(query=query, k=k, filter=filter_dict)

    clips: list[RetrievedClip] = []
    misconceptions: list[RetrievedClip] = []

    for doc, score in results:
        item = _build_clip(doc.page_content, doc.metadata, score)
        if item.source_type == "misconception":
            misconceptions.append(item)
        else:
            clips.append(item)

    return {"clips": clips, "misconceptions": misconceptions}
