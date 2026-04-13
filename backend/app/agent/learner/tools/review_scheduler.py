"""review_scheduler tool — spaced repetition scheduling with SM-2 variant."""

import json
import math
from datetime import datetime, timedelta, timezone

from langchain_core.tools import tool

from app.db import get_sync_connection


@tool
def review_scheduler(
    action: str,
    user_id: str,
    quiz_result: str = "",
) -> str:
    """Manage spaced repetition review schedules for a learner.

    Args:
        action: One of "get_schedule" or "update_after_quiz".
        user_id: The learner's unique identifier.
        quiz_result: JSON string with quiz result data (required for
            "update_after_quiz"). Expected fields: concept_id, course_id,
            question_text, user_answer, is_correct, response_time_ms.

    Returns:
        JSON string with schedule data or update confirmation.
    """
    if action == "get_schedule":
        return _get_schedule(user_id)
    if action == "update_after_quiz":
        return _update_after_quiz(user_id, quiz_result)
    return json.dumps(
        {"error": f"Unknown action: {action}. Use get_schedule/update_after_quiz."},
        ensure_ascii=False,
    )


def _get_schedule(user_id: str) -> str:
    """Fetch today's due reviews and upcoming reviews."""
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            now = datetime.now(timezone.utc)
            today_end = now.replace(hour=23, minute=59, second=59)

            # Due today
            cur.execute(
                "SELECT id, concept_id, course_id, question_text, "
                "next_review_at, interval_days, ease_factor, is_correct "
                "FROM quiz_results "
                "WHERE user_id = %s AND next_review_at <= %s "
                "ORDER BY next_review_at ASC",
                (user_id, today_end),
            )
            today_reviews = [_row_to_review(r) for r in cur.fetchall()]

            # Upcoming (next 7 days)
            upcoming_end = now + timedelta(days=7)
            cur.execute(
                "SELECT id, concept_id, course_id, question_text, "
                "next_review_at, interval_days, ease_factor, is_correct "
                "FROM quiz_results "
                "WHERE user_id = %s AND next_review_at > %s "
                "AND next_review_at <= %s "
                "ORDER BY next_review_at ASC",
                (user_id, today_end, upcoming_end),
            )
            upcoming_reviews = [_row_to_review(r) for r in cur.fetchall()]

    return json.dumps(
        {
            "user_id": user_id,
            "today_reviews": today_reviews,
            "today_count": len(today_reviews),
            "upcoming_reviews": upcoming_reviews,
            "upcoming_count": len(upcoming_reviews),
        },
        ensure_ascii=False,
        default=str,
    )


def _update_after_quiz(user_id: str, quiz_result: str) -> str:
    """Insert quiz result and compute next review interval via SM-2 variant."""
    if not quiz_result:
        return json.dumps(
            {"error": "quiz_result is required for update_after_quiz."},
            ensure_ascii=False,
        )

    data = json.loads(quiz_result)
    is_correct = data.get("is_correct", False)
    response_time_ms = data.get("response_time_ms", 0) or 0

    # SM-2 variant interval calculation
    ease = 2.5
    interval = 1

    # Look up previous result for this user+concept to carry forward ease/interval
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ease_factor, interval_days FROM quiz_results "
                "WHERE user_id = %s AND concept_id = %s "
                "ORDER BY created_at DESC LIMIT 1",
                (user_id, data.get("concept_id", "")),
            )
            prev = cur.fetchone()
            if prev:
                ease = prev[0]
                interval = prev[1]

            # Apply SM-2 variant rules
            if is_correct and response_time_ms < 10_000:
                ease = ease + 0.1
                interval = max(1, math.ceil(interval * ease))
            elif is_correct:
                interval = max(1, math.ceil(interval * ease))
            else:
                interval = 1
                ease = max(1.3, ease - 0.2)

            now = datetime.now(timezone.utc)
            next_review = now + timedelta(days=interval)

            cur.execute(
                "INSERT INTO quiz_results "
                "(user_id, concept_id, course_id, question_text, "
                "user_answer, is_correct, response_time_ms, "
                "reviewed_at, next_review_at, interval_days, ease_factor) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "RETURNING id, created_at",
                (
                    user_id,
                    data.get("concept_id", ""),
                    data.get("course_id"),
                    data.get("question_text", ""),
                    data.get("user_answer", ""),
                    is_correct,
                    response_time_ms,
                    now,
                    next_review,
                    interval,
                    ease,
                ),
            )
            row = cur.fetchone()
            conn.commit()

    # Cross-agent signal: surface incorrect answers to the instructor /
    # platform dashboards via the shared agent_events bus. Best-effort —
    # import is inline to avoid circular-import risk, and any failure is
    # swallowed so the quiz result insert above is never undone.
    if not is_correct:
        try:
            from app.agent.orchestrator import log_event

            log_event(
                agent_name="learner",
                event_type="learner_struggle",
                payload={
                    "user_id": user_id,
                    "concept_id": data.get("concept_id", ""),
                    "course_id": data.get("course_id"),
                    "response_time_ms": response_time_ms,
                },
            )
        except Exception:
            pass

    return json.dumps(
        {
            "status": "recorded",
            "quiz_result_id": str(row[0]),
            "is_correct": is_correct,
            "new_interval_days": interval,
            "new_ease_factor": round(ease, 2),
            "next_review_at": next_review.isoformat(),
        },
        ensure_ascii=False,
    )


def _row_to_review(row: tuple) -> dict:
    return {
        "id": str(row[0]),
        "concept_id": row[1],
        "course_id": str(row[2]),
        "question_text": row[3],
        "next_review_at": row[4].isoformat() if row[4] else None,
        "interval_days": row[5],
        "ease_factor": row[6],
        "is_correct": row[7],
    }
