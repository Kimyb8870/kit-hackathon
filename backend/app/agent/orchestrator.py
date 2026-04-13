"""Cross-agent orchestrator + event bus.

Provides:
1. ``log_event`` — append a row to ``agent_events`` table
2. ``query_events`` — read recent events with optional filters
3. Lazy accessors for the three agents (learner / instructor / platform)

Other modules should never import the agent graphs directly when they
only need to "send a message and stream tokens" — use ``run_agent`` so
the orchestrator can record cross-agent events.
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any

from app.db import get_sync_connection

# ----- agent_name constants -----
LEARNER = "learner"
INSTRUCTOR = "instructor"
PLATFORM = "platform"

# ----- common event types -----
EVENT_QA_ASKED = "qa_asked"
EVENT_QUIZ_ATTEMPTED = "quiz_attempted"
EVENT_STRUGGLE_DETECTED = "struggle_detected"
EVENT_CONTENT_GAP = "content_gap"
EVENT_PROMOTION_SUGGESTED = "promotion_suggested"
EVENT_DEMAND_ANALYZED = "demand_analyzed"


def log_event(
    agent_name: str,
    event_type: str,
    payload: dict[str, Any],
) -> str | None:
    """Insert a single event row.

    Returns the event id (str UUID) on success, or ``None`` if the
    table is missing (graceful degradation during early bootstrap).
    """
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO agent_events (agent_name, event_type, payload) "
                    "VALUES (%s, %s, %s::jsonb) "
                    "RETURNING id",
                    (agent_name, event_type, json.dumps(payload, ensure_ascii=False)),
                )
                row = cur.fetchone()
                conn.commit()
                return str(row[0]) if row else None
        except Exception:
            # Avoid crashing the agent if the event table doesn't exist yet
            conn.rollback()
            return None


def query_events(
    agent_name: str | list[str] | None = None,
    event_type: str | None = None,
    since_hours: int = 24,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Read recent events with optional filters.

    ``agent_name`` may be a single string or a list of agent names.
    Passing a list filters with ``IN (...)`` so multiple agents' events
    are returned in one query.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=since_hours)
    clauses = ["created_at >= %s"]
    params: list[Any] = [cutoff]

    if agent_name is not None:
        if isinstance(agent_name, list):
            placeholders = ", ".join(["%s"] * len(agent_name))
            clauses.append(f"agent_name IN ({placeholders})")
            params.extend(agent_name)
        else:
            clauses.append("agent_name = %s")
            params.append(agent_name)
    if event_type:
        clauses.append("event_type = %s")
        params.append(event_type)

    where_sql = " AND ".join(clauses)
    params.append(limit)

    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, agent_name, event_type, payload, created_at "
                    f"FROM agent_events WHERE {where_sql} "
                    f"ORDER BY created_at DESC LIMIT %s",
                    params,
                )
                rows = cur.fetchall()
                return [
                    {
                        "id": str(r[0]),
                        "agent_name": r[1],
                        "event_type": r[2],
                        "payload": r[3],
                        "created_at": r[4].isoformat() if r[4] else None,
                    }
                    for r in rows
                ]
        except Exception:
            return []


# ----- lazy agent accessors -----

def get_learner_agent():
    from app.agent.learner.graph import agent

    return agent


def get_instructor_agent():
    from app.agent.instructor.graph import agent

    return agent


def get_platform_agent():
    from app.agent.platform.graph import agent

    return agent


AGENTS = {
    LEARNER: get_learner_agent,
    INSTRUCTOR: get_instructor_agent,
    PLATFORM: get_platform_agent,
}
