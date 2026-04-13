"""REST endpoints for quiz submission and history."""

import json
import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from app.db import get_sync_connection
from app.models.schemas import QuizResponse, QuizSubmit

router = APIRouter(prefix="/api/v1/quiz", tags=["quiz"])


@router.post("/submit", response_model=QuizResponse, status_code=201)
def submit_quiz(body: QuizSubmit):
    """Submit a quiz answer and compute the next review schedule."""
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                # Carry forward ease/interval from previous result
                ease = 2.5
                interval = 1

                cur.execute(
                    "SELECT ease_factor, interval_days FROM quiz_results "
                    "WHERE user_id = %s AND concept_id = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (body.user_id, body.concept_id),
                )
                prev = cur.fetchone()
                if prev:
                    ease = prev[0]
                    interval = prev[1]

                response_time_ms = body.response_time_ms or 0

                # SM-2 variant
                if body.is_correct and response_time_ms < 10_000:
                    ease = ease + 0.1
                    interval = max(1, math.ceil(interval * ease))
                elif body.is_correct:
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
                    "RETURNING id, user_id, concept_id, course_id, "
                    "question_text, user_answer, is_correct, response_time_ms, "
                    "next_review_at, interval_days, ease_factor, created_at",
                    (
                        body.user_id,
                        body.concept_id,
                        str(body.course_id),
                        body.question_text,
                        body.user_answer,
                        body.is_correct,
                        response_time_ms,
                        now,
                        next_review,
                        interval,
                        ease,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
        except Exception as exc:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _row_to_response(row)


@router.get("/history/{user_id}", response_model=list[QuizResponse])
def get_quiz_history(user_id: str, limit: int = 50):
    """Fetch quiz history for a user, most recent first."""
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, user_id, concept_id, course_id, "
                "question_text, user_answer, is_correct, response_time_ms, "
                "next_review_at, interval_days, ease_factor, created_at "
                "FROM quiz_results "
                "WHERE user_id = %s "
                "ORDER BY created_at DESC "
                "LIMIT %s",
                (user_id, limit),
            )
            rows = cur.fetchall()

    return [_row_to_response(row) for row in rows]


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
