"""trend_detector — surface hot topics across recent learner activity."""

import json

from langchain_core.tools import tool

from app.agent.orchestrator import INSTRUCTOR, LEARNER, query_events
from app.db import get_sync_connection


@tool
def trend_detector(since_hours: int = 72, top_n: int = 10) -> str:
    """Detect trending topics from recent learner events + quiz attempts.

    Args:
        since_hours: Look-back window in hours.
        top_n: Number of trending topics to return.

    Returns:
        JSON string with hot topics ranked by combined activity score.
    """
    events = query_events(
        agent_name=[LEARNER, INSTRUCTOR], since_hours=since_hours, limit=1000
    )

    topic_scores: dict[str, float] = {}
    for ev in events:
        payload = ev.get("payload") or {}
        topic = payload.get("concept_id") or payload.get("topic")
        if not topic:
            continue
        weight = 1.0 if ev["event_type"] == "qa_asked" else 0.5
        topic_scores[topic] = topic_scores.get(topic, 0) + weight

    # Augment with recent quiz attempts (DB-level signal)
    quiz_topics = _fetch_recent_quiz_topics(since_hours)
    for concept, attempts in quiz_topics.items():
        topic_scores[concept] = topic_scores.get(concept, 0) + attempts * 0.3

    ranked = sorted(
        topic_scores.items(), key=lambda kv: kv[1], reverse=True
    )[:top_n]

    return json.dumps(
        {
            "since_hours": since_hours,
            "trending": [
                {"topic": t, "score": round(s, 2)} for t, s in ranked
            ],
        },
        ensure_ascii=False,
    )


def _fetch_recent_quiz_topics(since_hours: int) -> dict[str, int]:
    sql = (
        "SELECT concept_id, COUNT(*) FROM quiz_results "
        "WHERE created_at >= now() - (%s || ' hours')::interval "
        "GROUP BY concept_id"
    )
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, (str(since_hours),))
                return {r[0]: int(r[1]) for r in cur.fetchall()}
        except Exception:
            return {}
