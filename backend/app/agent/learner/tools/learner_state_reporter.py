"""learner_state_reporter tool — comprehensive learner state aggregation.

This is the tool the agent calls when it needs to give a personalized
answer (recommend what to study next, generate tailored quizzes,
summarize what the learner has been struggling with, etc.).
A single call returns four data slices that would otherwise require
separate tool round-trips.
"""

import json

from langchain_core.tools import tool

from app.db import get_sync_connection

# Sections the agent can request via the ``focus`` argument. "overview"
# returns everything; the others trim the payload to one slice so the
# LLM context stays small when only one piece is needed.
_VALID_FOCUS = {"overview", "enrolled", "recent_quizzes", "weak_concepts"}


@tool
def learner_state_reporter(user_id: str, focus: str = "overview") -> str:
    """Report a comprehensive snapshot of the learner's current state.

    Use this tool whenever the agent needs to give a personalized
    response — recommending what to study next, generating tailored
    quizzes, summarizing what the learner has been struggling with,
    or planning a review session. The tool aggregates four data
    sources in a single call:

      1. Enrolled courses — joined with the courses table so each
         entry carries title / category / difficulty.
      2. Recent quiz statistics — last 7 days: total attempts,
         correct count, and accuracy ratio.
      3. Weak concepts — top 5 concept_ids ranked by lowest
         accuracy (ties broken by most attempts).
      4. Due reviews count — number of quiz_results whose
         next_review_at is already in the past or due today.

    Args:
        user_id: The learner's unique identifier.
        focus: One of "overview" | "enrolled" | "recent_quizzes" |
            "weak_concepts". "overview" returns everything; the other
            values return only the relevant section so token usage
            stays small when the agent only needs one slice.

    Returns:
        JSON string with the requested sections, or an error JSON
        object if the user has no profile yet.
    """
    if focus not in _VALID_FOCUS:
        return json.dumps(
            {
                "error": f"Unknown focus '{focus}'. Use one of "
                f"{sorted(_VALID_FOCUS)}.",
            },
            ensure_ascii=False,
        )

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            enrolled_ids = _fetch_enrolled_ids(cur, user_id)
            if enrolled_ids is None:
                return json.dumps(
                    {"error": "Profile not found", "user_id": user_id},
                    ensure_ascii=False,
                )

            result: dict = {"user_id": user_id}

            if focus in ("overview", "enrolled"):
                result["enrolled_courses"] = _fetch_enrolled_courses(
                    cur, enrolled_ids
                )
            if focus in ("overview", "recent_quizzes"):
                result["recent_quiz_stats"] = _fetch_recent_quiz_stats(
                    cur, user_id
                )
            if focus in ("overview", "weak_concepts"):
                result["weak_concepts"] = _fetch_weak_concepts(cur, user_id)
            if focus == "overview":
                result["due_reviews_count"] = _fetch_due_reviews_count(
                    cur, user_id
                )

    return json.dumps(result, ensure_ascii=False, default=str)


def _fetch_enrolled_ids(cur, user_id: str) -> list[str] | None:
    """Return the learner's enrolled course UUIDs, or None if no profile."""
    cur.execute(
        "SELECT enrolled_courses FROM learner_profiles WHERE user_id = %s",
        (user_id,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    enrolled = row[0] or []
    # Normalize to list[str] in case the column ever returns a dict.
    if isinstance(enrolled, list):
        return [str(c) for c in enrolled]
    return []


def _fetch_enrolled_courses(cur, enrolled_ids: list[str]) -> list[dict]:
    """Join the enrolled UUIDs against the courses table."""
    if not enrolled_ids:
        return []
    cur.execute(
        "SELECT id, title, category, difficulty, platform, total_chapters "
        "FROM courses WHERE id = ANY(%s::uuid[])",
        (enrolled_ids,),
    )
    return [
        {
            "id": str(r[0]),
            "title": r[1],
            "category": r[2],
            "difficulty": r[3],
            "platform": r[4],
            "total_chapters": r[5],
        }
        for r in cur.fetchall()
    ]


def _fetch_recent_quiz_stats(cur, user_id: str) -> dict:
    """Total / correct / accuracy over the last 7 days."""
    cur.execute(
        "SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct) "
        "FROM quiz_results "
        "WHERE user_id = %s AND created_at > now() - interval '7 days'",
        (user_id,),
    )
    total, correct = cur.fetchone()
    total = int(total or 0)
    correct = int(correct or 0)
    accuracy = (correct / total) if total else 0
    return {
        "total": total,
        "correct": correct,
        "accuracy": round(accuracy, 4),
        "window_days": 7,
    }


def _fetch_weak_concepts(cur, user_id: str) -> list[dict]:
    """Top 5 concept_ids with the lowest accuracy (ties → more attempts)."""
    cur.execute(
        "SELECT concept_id, "
        "COUNT(*) AS attempts, "
        "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct "
        "FROM quiz_results "
        "WHERE user_id = %s "
        "GROUP BY concept_id "
        "ORDER BY (SUM(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) "
        "/ NULLIF(COUNT(*), 0)) ASC, COUNT(*) DESC "
        "LIMIT 5",
        (user_id,),
    )
    rows = cur.fetchall()
    weak: list[dict] = []
    for concept_id, attempts, correct in rows:
        attempts = int(attempts or 0)
        correct = int(correct or 0)
        accuracy = (correct / attempts) if attempts else 0
        weak.append(
            {
                "concept_id": concept_id,
                "attempts": attempts,
                "correct": correct,
                "accuracy": round(accuracy, 4),
            }
        )
    return weak


def _fetch_due_reviews_count(cur, user_id: str) -> int:
    """Quiz results whose next_review_at is now or earlier."""
    cur.execute(
        "SELECT COUNT(*) FROM quiz_results "
        "WHERE user_id = %s AND next_review_at IS NOT NULL "
        "AND next_review_at <= now()",
        (user_id,),
    )
    return int(cur.fetchone()[0] or 0)
