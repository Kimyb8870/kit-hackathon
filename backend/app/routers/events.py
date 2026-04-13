"""Cross-agent event bus polling endpoint.

Returns rows from the ``agent_events`` table so the frontend can render a
live cross-agent activity feed. Read-only — writes still flow through
``app.agent.orchestrator.log_event``.
"""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.db import get_sync_connection

router = APIRouter(prefix="/api/v1/events", tags=["events"])


def _parse_since(since: str | None) -> datetime | None:
    """Parse an ISO-8601 timestamp, tolerating the common ``Z`` suffix.

    Returns ``None`` when ``since`` is missing. Raises ``HTTPException`` on
    malformed input so callers get a clear 400 instead of a silent
    full-table scan.
    """
    if not since:
        return None
    value = since.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"invalid 'since' timestamp (expected ISO-8601): {exc}",
        )


@router.get("")
def list_recent_events(
    since: str | None = Query(
        None,
        description="Only return events created strictly after this ISO-8601 timestamp.",
    ),
    for_role: Literal["learner", "instructor", "platform", "all"] = Query(
        "all",
        description=(
            "Role viewing the feed. 'instructor' returns learner activity; "
            "'platform' returns learner+instructor activity; 'learner' and "
            "'all' return everything unfiltered."
        ),
    ),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Return recent ``agent_events`` rows for the cross-agent activity feed."""
    since_ts = _parse_since(since)

    clauses: list[str] = []
    params: list = []

    if since_ts is not None:
        clauses.append("created_at > %s")
        params.append(since_ts)

    if for_role == "instructor":
        # Instructors care about learner-originated signals.
        clauses.append("agent_name = %s")
        params.append("learner")
    elif for_role == "platform":
        # Platform operators watch both learner + instructor signals.
        clauses.append("agent_name = ANY(%s)")
        params.append(["learner", "instructor"])
    # 'all' and 'learner' → no role filter.

    sql = (
        "SELECT id, agent_name, event_type, payload, created_at "
        "FROM agent_events"
    )
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)

    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
        except Exception:
            # Table missing (early bootstrap) or transient DB error —
            # degrade gracefully with an empty feed instead of 500.
            conn.rollback()
            return []

    return [
        {
            "id": str(row[0]),
            "agent_name": row[1],
            "event_type": row[2],
            "payload": row[3],
            "created_at": row[4].isoformat() if row[4] else None,
        }
        for row in rows
    ]
