"""student_struggle_reporter — list concepts where learners struggle most."""

import json

from langchain_core.tools import tool

from app.db import get_sync_connection


@tool
def student_struggle_reporter(
    course_id: str = "",
    top_n: int = 5,
    min_attempts: int = 3,
) -> str:
    """Return the top N concepts with the lowest accuracy.

    Args:
        course_id: Optional course filter.
        top_n: How many struggling concepts to return.
        min_attempts: Minimum quiz attempts required to be considered.

    Returns:
        JSON string with the ranked struggle list and per-concept stats.
    """
    sql = (
        "SELECT concept_id, "
        "COUNT(*) AS attempts, "
        "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct, "
        "AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) AS accuracy "
        "FROM quiz_results "
    )
    params: list = []
    if course_id:
        sql += "WHERE course_id = %s "
        params.append(course_id)
    sql += (
        "GROUP BY concept_id "
        "HAVING COUNT(*) >= %s "
        "ORDER BY accuracy ASC, attempts DESC "
        "LIMIT %s"
    )
    params.extend([min_attempts, top_n])

    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
        except Exception as exc:
            return json.dumps({"error": str(exc), "struggles": []}, ensure_ascii=False)

    struggles = [
        {
            "concept_id": r[0],
            "attempts": int(r[1] or 0),
            "correct": int(r[2] or 0),
            "accuracy": round(float(r[3] or 0), 3),
        }
        for r in rows
    ]

    # Cross-agent signal: publish the aggregated report so the platform
    # operator dashboard can show that the instructor agent just surfaced
    # learner struggles. Best-effort — inline import avoids circular
    # dependencies and any failure is swallowed so the caller still gets
    # its struggle list back.
    if struggles:
        try:
            from app.agent.orchestrator import log_event

            top = struggles[0]
            log_event(
                agent_name="instructor",
                event_type="instructor_struggle_analyzed",
                payload={
                    "course_id": course_id,
                    "top_concept_id": top.get("concept_id"),
                    "top_accuracy": top.get("accuracy"),
                    "total_struggles": len(struggles),
                },
            )
        except Exception:
            pass

    return json.dumps(
        {
            "course_id": course_id or None,
            "top_n": top_n,
            "struggles": struggles,
            "total": len(struggles),
        },
        ensure_ascii=False,
    )
