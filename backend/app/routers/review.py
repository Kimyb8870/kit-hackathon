"""REST endpoints for review schedule and forgetting curve data."""

import math
from datetime import datetime, date, timedelta, timezone

from fastapi import APIRouter

from app.db import get_sync_connection
from app.models.schemas import (
    LearningScheduleResponse,
    QuizResponse,
    ReviewScheduleResponse,
    ScheduleItem,
    ScheduleStats,
    WeeklyPlanDay,
)

router = APIRouter(prefix="/api/v1/review", tags=["review"])

_WEEKDAY_KR = ["월", "화", "수", "목", "금", "토", "일"]


@router.get("/schedule/{user_id}", response_model=LearningScheduleResponse)
def get_review_schedule(user_id: str):
    """Get today's learning schedule for a user.

    Returns today_schedule (review + new + quiz items),
    weekly_plan (7-day overview), and aggregated stats.
    """
    with get_sync_connection() as conn:
        today_schedule, stats = _build_today_schedule_and_stats(conn, user_id)

    weekly_plan = _build_weekly_plan(
        today_total=stats.today_total,
        today_completed=stats.today_completed,
    )

    return LearningScheduleResponse(
        today_schedule=today_schedule,
        weekly_plan=weekly_plan,
        stats=stats,
    )


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _build_today_schedule_and_stats(
    conn, user_id: str
) -> tuple[list[ScheduleItem], ScheduleStats]:
    """Query DB and assemble today's schedule + stats."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=0)

    with conn.cursor() as cur:
        # --- 1. Review items (next_review_at is today) ---
        review_items = _fetch_review_items(cur, user_id, today_start, today_end)

        # --- 2. New learning items (next unlearned clips) ---
        new_items = _fetch_new_items(cur, user_id, review_items)

        # --- 3. Stats ---
        today_completed = _count_today_completed(cur, user_id, today_start, today_end)
        streak = _calculate_streak(cur, user_id)
        mastered = _count_mastered(cur, user_id)

    # Merge: review items + quiz for each review + new items
    schedule: list[ScheduleItem] = []
    seen_concepts: set[str] = set()

    for item in review_items:
        if item.concept_id not in seen_concepts:
            seen_concepts.add(item.concept_id)
            schedule.append(item)
            # Add a quiz entry for each review concept
            schedule.append(ScheduleItem(
                type="quiz",
                title=item.title,
                concept_id=item.concept_id,
                estimated_minutes=3,
                completed=False,
            ))

    for item in new_items:
        if item.concept_id not in seen_concepts:
            seen_concepts.add(item.concept_id)
            schedule.append(item)

    stats = ScheduleStats(
        today_completed=today_completed,
        today_total=len(schedule),
        streak_days=max(streak, 1),
        mastered_concepts=mastered,
    )
    return schedule, stats


def _fetch_review_items(
    cur, user_id: str, today_start: datetime, today_end: datetime
) -> list[ScheduleItem]:
    """Fetch review-due items by joining quiz_results with course metadata."""
    cur.execute(
        "SELECT DISTINCT ON (qr.concept_id) "
        "qr.concept_id, c.title, cc.chapter_no, cc.clip_no, cc.clip_title "
        "FROM quiz_results qr "
        "JOIN courses c ON c.id = qr.course_id "
        "LEFT JOIN course_clips cc "
        "  ON cc.concept_id = qr.concept_id AND cc.course_id = qr.course_id "
        "WHERE qr.user_id = %s "
        "  AND qr.next_review_at >= %s AND qr.next_review_at <= %s "
        "ORDER BY qr.concept_id, qr.next_review_at ASC",
        (user_id, today_start, today_end),
    )
    return [
        ScheduleItem(
            type="review",
            title=row[1] or "",
            chapter_no=row[2],
            clip_no=row[3],
            clip_title=row[4],
            concept_id=row[0],
            estimated_minutes=5,
            completed=False,
        )
        for row in cur.fetchall()
    ]


def _fetch_new_items(
    cur, user_id: str, existing_items: list[ScheduleItem]
) -> list[ScheduleItem]:
    """Fetch next unlearned clips for enrolled courses, with fallback."""
    seen = {item.concept_id for item in existing_items}

    # Get enrolled courses from learner profile
    cur.execute(
        "SELECT enrolled_courses FROM learner_profiles WHERE user_id = %s",
        (user_id,),
    )
    profile_row = cur.fetchone()
    enrolled: list[str] = []
    if profile_row and profile_row[0]:
        enrolled = profile_row[0] if isinstance(profile_row[0], list) else []

    # Get concepts the user already studied
    cur.execute(
        "SELECT DISTINCT concept_id FROM quiz_results WHERE user_id = %s",
        (user_id,),
    )
    studied = {row[0] for row in cur.fetchall()}

    new_items: list[ScheduleItem] = []

    if enrolled:
        cur.execute(
            "SELECT cc.concept_id, c.title, cc.chapter_no, cc.clip_no, cc.clip_title "
            "FROM course_clips cc "
            "JOIN courses c ON c.id = cc.course_id "
            "WHERE c.title = ANY(%s) "
            "ORDER BY cc.chapter_no, cc.clip_no "
            "LIMIT 10",
            (enrolled,),
        )
    else:
        # Fallback: pick clips from any course
        cur.execute(
            "SELECT cc.concept_id, c.title, cc.chapter_no, cc.clip_no, cc.clip_title "
            "FROM course_clips cc "
            "JOIN courses c ON c.id = cc.course_id "
            "ORDER BY cc.chapter_no, cc.clip_no "
            "LIMIT 10",
        )

    for row in cur.fetchall():
        concept_id = row[0]
        if concept_id in studied or concept_id in seen:
            continue
        seen.add(concept_id)
        new_items.append(ScheduleItem(
            type="new",
            title=row[1] or "",
            chapter_no=row[2],
            clip_no=row[3],
            clip_title=row[4],
            concept_id=concept_id,
            estimated_minutes=10,
            completed=False,
        ))
        if len(new_items) >= 3:
            break

    # Ultimate fallback: if still empty, get first 5 clips regardless
    if not existing_items and not new_items:
        cur.execute(
            "SELECT cc.concept_id, c.title, cc.chapter_no, cc.clip_no, cc.clip_title "
            "FROM course_clips cc "
            "JOIN courses c ON c.id = cc.course_id "
            "ORDER BY cc.chapter_no, cc.clip_no "
            "LIMIT 5",
        )
        for row in cur.fetchall():
            new_items.append(ScheduleItem(
                type="new",
                title=row[1] or "",
                chapter_no=row[2],
                clip_no=row[3],
                clip_title=row[4],
                concept_id=row[0],
                estimated_minutes=10,
                completed=False,
            ))

    return new_items


def _count_today_completed(
    cur, user_id: str, today_start: datetime, today_end: datetime
) -> int:
    cur.execute(
        "SELECT COUNT(*) FROM quiz_results "
        "WHERE user_id = %s AND is_correct = true "
        "  AND created_at >= %s AND created_at <= %s",
        (user_id, today_start, today_end),
    )
    result = cur.fetchone()
    return result[0] if result else 0


def _calculate_streak(cur, user_id: str) -> int:
    """Count consecutive days with quiz activity ending at today."""
    cur.execute(
        "SELECT DISTINCT DATE(created_at) AS study_date "
        "FROM quiz_results WHERE user_id = %s "
        "ORDER BY study_date DESC",
        (user_id,),
    )
    dates = [row[0] for row in cur.fetchall()]
    if not dates:
        return 0

    today = date.today()
    streak = 0
    for i, d in enumerate(dates):
        expected = today - timedelta(days=i)
        if d == expected:
            streak += 1
        else:
            break
    return streak


def _count_mastered(cur, user_id: str) -> int:
    """Mastered = concepts with ease_factor >= 3.0 and interval_days >= 7."""
    cur.execute(
        "SELECT COUNT(DISTINCT concept_id) FROM quiz_results "
        "WHERE user_id = %s AND ease_factor >= 3.0 AND interval_days >= 7",
        (user_id,),
    )
    result = cur.fetchone()
    return result[0] if result else 0


def _build_weekly_plan(
    today_total: int = 4,
    today_completed: int = 0,
) -> list[WeeklyPlanDay]:
    """Generate a 7-day plan starting from today."""
    today = date.today()
    plan: list[WeeklyPlanDay] = []
    for offset in range(7):
        d = today + timedelta(days=offset)
        weekday_kr = _WEEKDAY_KR[d.weekday()]
        if offset == 0:
            total = today_total if today_total > 0 else 4
            completed = today_completed
        else:
            # Default: 3-5 items per day (weekday=4, weekend=3)
            total = 3 if d.weekday() >= 5 else 4
            completed = 0
        plan.append(WeeklyPlanDay(
            day=weekday_kr,
            date=d.isoformat(),
            total_items=total,
            completed_items=completed,
        ))
    return plan


@router.get("/curve/{user_id}")
def get_forgetting_curve(user_id: str, days: int = 30):
    """Get forgetting curve chart data — daily retention rate.

    Uses a simplified exponential decay model:
        retention = e^(-t / S)
    where S (stability) is derived from the average ease_factor and
    interval_days of the user's quiz results.
    """
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            # Get per-concept latest stats
            cur.execute(
                "SELECT DISTINCT ON (concept_id) "
                "concept_id, ease_factor, interval_days, is_correct, "
                "next_review_at, created_at "
                "FROM quiz_results "
                "WHERE user_id = %s "
                "ORDER BY concept_id, created_at DESC",
                (user_id,),
            )
            concepts = cur.fetchall()

            # Get daily correct/total counts for the period
            period_start = datetime.now(timezone.utc) - timedelta(days=days)
            cur.execute(
                "SELECT DATE(created_at) AS day, "
                "COUNT(*) AS total, "
                "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct "
                "FROM quiz_results "
                "WHERE user_id = %s AND created_at >= %s "
                "GROUP BY DATE(created_at) "
                "ORDER BY day",
                (user_id, period_start),
            )
            daily_stats = cur.fetchall()

    # Build daily retention data
    daily_data = []
    for row in daily_stats:
        day_str = row[0].isoformat() if hasattr(row[0], "isoformat") else str(row[0])
        total = row[1]
        correct = row[2]
        retention = round(correct / total * 100, 1) if total > 0 else 0.0
        daily_data.append({
            "date": day_str,
            "total": total,
            "correct": correct,
            "retention_pct": retention,
        })

    # Build per-concept retention projection
    now = datetime.now(timezone.utc)
    concept_curves = []
    for row in concepts:
        concept_id = row[0]
        ease = row[1]
        interval = row[2]
        stability = max(1.0, interval * (ease / 2.5))

        projections = []
        for day_offset in range(days + 1):
            t = day_offset
            retention = math.exp(-t / stability) * 100
            projections.append({
                "day": day_offset,
                "retention_pct": round(retention, 1),
            })

        concept_curves.append({
            "concept_id": concept_id,
            "current_ease": ease,
            "current_interval": interval,
            "stability": round(stability, 2),
            "projections": projections,
        })

    return {
        "user_id": user_id,
        "period_days": days,
        "daily_retention": daily_data,
        "concept_curves": concept_curves,
    }


def _row_to_response(row: tuple) -> QuizResponse:
    return QuizResponse(
        id=row[0],
        user_id=row[1],
        concept_id=row[2],
        course_id=row[3],
        question_text=row[4],
        user_answer=row[5],
        is_correct=row[6],
        response_time_ms=row[7],
        next_review_at=row[8],
        interval_days=row[9],
        ease_factor=row[10],
        created_at=row[11],
    )
