"""course_demand_analyzer — aggregate demand signals per course category."""

import json

from langchain_core.tools import tool

from app.agent.orchestrator import INSTRUCTOR, query_events
from app.db import get_sync_connection


@tool
def course_demand_analyzer(since_hours: int = 168) -> str:
    """Analyze course demand by category.

    Combines:
    - learner_profiles enrolled_courses (current enrollment)
    - quiz_results activity (engagement)
    - courses table (catalog)

    Args:
        since_hours: Recent activity window in hours.

    Returns:
        JSON string with per-category demand metrics.
    """
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                # Per-category course count
                cur.execute(
                    "SELECT category, COUNT(*) FROM courses GROUP BY category"
                )
                catalog = {r[0]: int(r[1]) for r in cur.fetchall()}

                # Recent quiz activity per category (joined via course_id)
                cur.execute(
                    "SELECT c.category, COUNT(qr.id) AS attempts, "
                    "COUNT(DISTINCT qr.user_id) AS active_learners "
                    "FROM courses c "
                    "LEFT JOIN quiz_results qr ON qr.course_id = c.id "
                    "AND qr.created_at >= now() - (%s || ' hours')::interval "
                    "GROUP BY c.category",
                    (str(since_hours),),
                )
                activity = {
                    r[0]: {
                        "attempts": int(r[1] or 0),
                        "active_learners": int(r[2] or 0),
                    }
                    for r in cur.fetchall()
                }
        except Exception as exc:
            return json.dumps(
                {"error": str(exc), "categories": []}, ensure_ascii=False
            )

    categories = []
    for cat, course_count in catalog.items():
        a = activity.get(cat, {"attempts": 0, "active_learners": 0})
        demand_score = a["attempts"] * 1.0 + a["active_learners"] * 5.0
        categories.append(
            {
                "category": cat,
                "course_count": course_count,
                "recent_attempts": a["attempts"],
                "active_learners": a["active_learners"],
                "demand_score": round(demand_score, 1),
            }
        )

    # Boost demand for categories where instructors have flagged struggles
    struggle_boost = _fetch_instructor_struggle_boost(since_hours)
    for cat_entry in categories:
        boost = struggle_boost.get(cat_entry["category"], 0.0)
        cat_entry["demand_score"] = round(cat_entry["demand_score"] + boost, 1)
        if boost > 0:
            cat_entry["instructor_signal_boost"] = round(boost, 1)

    categories.sort(key=lambda c: c["demand_score"], reverse=True)
    return json.dumps(
        {"since_hours": since_hours, "categories": categories},
        ensure_ascii=False,
    )


def _fetch_instructor_struggle_boost(since_hours: int) -> dict[str, float]:
    """Return per-category demand boost derived from instructor struggle events.

    Each instructor struggle/content-gap event adds 2.0 to the demand score
    of the category it references, surfacing educator-confirmed pain points.
    """
    events = query_events(agent_name=INSTRUCTOR, since_hours=since_hours, limit=100)
    boost: dict[str, float] = {}
    for ev in events:
        if ev["event_type"] not in ("struggle_detected", "content_gap"):
            continue
        payload = ev.get("payload") or {}
        category = payload.get("category") or payload.get("concept_category")
        if category:
            boost[category] = boost.get(category, 0.0) + 2.0
    return boost
