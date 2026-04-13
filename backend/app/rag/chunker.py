"""Document chunker for course clips and misconceptions."""

import json
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=100,
    length_function=len,
)

_TOKEN_THRESHOLD = 800


def _should_split(text: str) -> bool:
    """Check if text exceeds the token threshold (approximated by char count)."""
    return len(text) > _TOKEN_THRESHOLD


def _split_with_metadata(doc: Document) -> list[Document]:
    """Split a document if it exceeds the threshold, preserving metadata."""
    if not _should_split(doc.page_content):
        return [doc]
    chunks = _splitter.split_text(doc.page_content)
    return [
        Document(page_content=chunk, metadata={**doc.metadata, "chunk_index": i})
        for i, chunk in enumerate(chunks)
    ]


def process_course_clips(
    clips_json_path: str | Path,
    course_id: str = "python-basics",
    course_title: str = "Python 기초",
) -> list[Document]:
    """Load a chapter JSON file and convert clips to LangChain Documents.

    Supports two JSON formats:
    - Array of clip objects: [{chapter_no, clip_no, clip_title, ...}, ...]
    - Object with metadata: {course_id, course_title, chapter_no, clips: [...]}
    """
    path = Path(clips_json_path)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    # Support both array and object formats
    if isinstance(data, list):
        clips = data
        cid = course_id
        ctitle = course_title
    else:
        clips = data.get("clips", [])
        cid = data.get("course_id", course_id)
        ctitle = data.get("course_title", course_title)

    documents: list[Document] = []
    for clip in clips:
        metadata = {
            "course_id": cid,
            "course_title": ctitle,
            "chapter_no": clip["chapter_no"],
            "clip_no": clip["clip_no"],
            "clip_title": clip["clip_title"],
            "timestamp_start": clip.get("timestamp_start", ""),
            "timestamp_end": clip.get("timestamp_end", ""),
            "concept_id": clip["concept_id"],
            "source_type": "lecture",
        }
        doc = Document(page_content=clip["script_text"], metadata=metadata)
        documents.extend(_split_with_metadata(doc))

    return documents


def process_misconceptions(misconceptions_json_path: str | Path) -> list[Document]:
    """Load misconceptions JSON and convert to LangChain Documents.

    Expected JSON structure:
    {
        "misconceptions": [
            {
                "concept_id": "...",
                "misconception_text": "...",
                "correction_text": "..."
            }
        ]
    }
    """
    path = Path(misconceptions_json_path)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    documents: list[Document] = []
    for item in data["misconceptions"]:
        content = (
            f"오해: {item['misconception_text']}\n\n"
            f"교정: {item['correction_text']}"
        )
        metadata = {
            "concept_id": item["concept_id"],
            "source_type": "misconception",
        }
        doc = Document(page_content=content, metadata=metadata)
        documents.extend(_split_with_metadata(doc))

    return documents
