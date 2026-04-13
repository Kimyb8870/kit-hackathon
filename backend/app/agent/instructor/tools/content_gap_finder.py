"""content_gap_finder — find concepts that learners ask about but lack content."""

import json

from langchain_core.tools import tool

from app.agent.orchestrator import LEARNER, query_events
from app.db import get_sync_connection


@tool
def content_gap_finder(min_questions: int = 3, since_hours: int = 168) -> str:
    """Identify content gaps where learners ask questions but coverage is thin.

    Heuristic: count distinct ``qa_asked`` events per concept_id from
    ``agent_events``, then compare against the number of ``course_clips``
    that mention the concept. Concepts with high question count but low
    clip coverage are flagged as gaps.

    Args:
        min_questions: Minimum question count to be considered.
        since_hours: Look-back window in hours.

    Returns:
        JSON string with a ranked list of content gaps.
    """
    events = query_events(
        agent_name=LEARNER,
        event_type="qa_asked",
        since_hours=since_hours,
        limit=1000,
    )

    counts: dict[str, int] = {}
    for ev in events:
        concept = ev.get("payload", {}).get("concept_id")
        if not concept:
            continue
        counts[concept] = counts.get(concept, 0) + 1

    if not counts:
        return json.dumps({"gaps": [], "total_gaps": 0}, ensure_ascii=False)

    coverage = _fetch_clip_coverage(list(counts.keys()))

    gaps = []
    for concept, q_count in counts.items():
        if q_count < min_questions:
            continue
        clip_count = coverage.get(concept, 0)
        gap_score = q_count / max(1, clip_count)
        gaps.append(
            {
                "concept_id": concept,
                "question_count": q_count,
                "clip_count": clip_count,
                "gap_score": round(gap_score, 2),
            }
        )

    gaps.sort(key=lambda g: g["gap_score"], reverse=True)
    return json.dumps(
        {"gaps": gaps[:20], "total_gaps": len(gaps)},
        ensure_ascii=False,
    )


def _fetch_clip_coverage(concept_ids: list[str]) -> dict[str, int]:
    if not concept_ids:
        return {}
    placeholders = ", ".join(["%s"] * len(concept_ids))
    sql = (
        f"SELECT concept_id, COUNT(*) FROM course_clips "
        f"WHERE concept_id IN ({placeholders}) "
        f"GROUP BY concept_id"
    )
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, concept_ids)
                return {r[0]: int(r[1]) for r in cur.fetchall()}
        except Exception:
            return {}
