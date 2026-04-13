"""qa_aggregator — aggregate Q&A activity from quiz_results + agent_events."""

import json

from langchain_core.tools import tool

from app.agent.orchestrator import LEARNER, query_events
from app.db import get_sync_connection


@tool
def qa_aggregator(course_id: str = "", since_hours: int = 168) -> str:
    """Aggregate learner Q&A activity within a recent window.

    Combines two sources:
    - ``quiz_results`` table — pass/fail counts per concept
    - ``agent_events`` (event_type=qa_asked) — chat questions per concept

    Args:
        course_id: Optional course filter (UUID string).
        since_hours: Look-back window in hours (default 168 = 7 days).

    Returns:
        JSON string with totals + per-concept breakdown.
    """
    quiz_rows = _fetch_quiz_aggregates(course_id, since_hours)
    qa_events = query_events(
        agent_name=LEARNER, event_type="qa_asked", since_hours=since_hours, limit=500
    )

    by_concept: dict[str, dict] = {}
    for row in quiz_rows:
        concept = row["concept_id"]
        by_concept.setdefault(
            concept,
            {
                "concept_id": concept,
                "quiz_attempts": 0,
                "quiz_correct": 0,
                "qa_questions": 0,
            },
        )
        by_concept[concept]["quiz_attempts"] = row["attempts"]
        by_concept[concept]["quiz_correct"] = row["correct"]

    for ev in qa_events:
        concept = ev.get("payload", {}).get("concept_id") or "unknown"
        by_concept.setdefault(
            concept,
            {
                "concept_id": concept,
                "quiz_attempts": 0,
                "quiz_correct": 0,
                "qa_questions": 0,
            },
        )
        by_concept[concept]["qa_questions"] += 1

    return json.dumps(
        {
            "since_hours": since_hours,
            "course_id": course_id or None,
            "total_quiz_attempts": sum(c["quiz_attempts"] for c in by_concept.values()),
            "total_qa_questions": sum(c["qa_questions"] for c in by_concept.values()),
            "concepts": list(by_concept.values()),
        },
        ensure_ascii=False,
    )


def _fetch_quiz_aggregates(course_id: str, since_hours: int) -> list[dict]:
    sql = (
        "SELECT concept_id, "
        "COUNT(*) AS attempts, "
        "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct "
        "FROM quiz_results "
        "WHERE created_at >= now() - (%s || ' hours')::interval "
    )
    params: list = [str(since_hours)]
    if course_id:
        sql += "AND course_id = %s "
        params.append(course_id)
    sql += "GROUP BY concept_id ORDER BY attempts DESC"

    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return [
                    {
                        "concept_id": r[0],
                        "attempts": int(r[1] or 0),
                        "correct": int(r[2] or 0),
                    }
                    for r in cur.fetchall()
                ]
        except Exception:
            return []
