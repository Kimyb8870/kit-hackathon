"""course_search tool for the LangGraph ReAct agent."""

import json

from langchain_core.tools import tool

from app.rag.retriever import search


@tool
def course_search(
    query: str,
    course_id: str | None = None,
    top_k: int = 5,
) -> str:
    """Search course content and misconceptions using RAG.

    Use this tool to find relevant lecture clips and common misconceptions
    based on the learner's question.

    Args:
        query: The search query (learner's question).
        course_id: Optional course ID to filter results.
        top_k: Number of top results to return (default 5).

    Returns:
        JSON string with "clips" and "misconceptions" lists.
    """
    results = search(query=query, course_id=course_id, top_k=top_k)
    return json.dumps(
        {
            "clips": [clip.model_dump() for clip in results["clips"]],
            "misconceptions": [m.model_dump() for m in results["misconceptions"]],
        },
        ensure_ascii=False,
        indent=2,
    )
