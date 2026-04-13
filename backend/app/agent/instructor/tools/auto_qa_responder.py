"""auto_qa_responder — generate an instructor-style answer using RAG."""

import json

from langchain_core.tools import tool

from app.rag.retriever import search


@tool
def auto_qa_responder(question: str, course_id: str = "", top_k: int = 5) -> str:
    """Generate a draft Q&A reply using existing course content.

    Reuses the same RAG retriever as the learner's ``course_search`` so
    the instructor can quickly publish a citation-grounded answer.

    Args:
        question: The student question.
        course_id: Optional course ID filter.
        top_k: Number of clips/misconceptions to consider.

    Returns:
        JSON string with citations and a draft answer skeleton.
    """
    results = search(query=question, course_id=course_id or None, top_k=top_k)

    clips = [c.model_dump() for c in results["clips"]]
    misconceptions = [m.model_dump() for m in results["misconceptions"]]

    citations = [
        {
            "clip_title": c.get("clip_title"),
            "chapter_no": c.get("chapter_no"),
            "clip_no": c.get("clip_no"),
            "timestamp_start": c.get("timestamp_start"),
        }
        for c in clips
    ]

    draft = _build_draft(question, clips, misconceptions)

    return json.dumps(
        {
            "question": question,
            "draft_answer": draft,
            "citations": citations,
            "matched_misconceptions": [m.get("content") for m in misconceptions],
        },
        ensure_ascii=False,
    )


def _build_draft(question: str, clips: list[dict], misconceptions: list[dict]) -> str:
    if not clips:
        return (
            "이 질문에 대응할 강의 클립을 찾지 못했습니다. "
            "신규 콘텐츠 제작이 필요할 수 있습니다."
        )

    top = clips[0]
    base = (
        f"질문 '{question}'에 대해 가장 관련성이 높은 클립은 "
        f"[{top.get('clip_title', '')}] 입니다. "
        f"이 클립의 내용을 인용하여 학생에게 답변하시기 바랍니다."
    )
    if misconceptions:
        base += (
            f" 또한 자주 발생하는 오개념 ('{misconceptions[0].get('content', '')}') "
            f"이 관련될 수 있으니 함께 짚어 주세요."
        )
    return base
