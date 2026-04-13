"""REST endpoints for learner profile management."""

import json
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import get_sync_connection
from app.models.schemas import ProfileCreate, ProfileResponse

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])


class EnrollRequest(BaseModel):
    """Request body for enrolling a learner in a course."""

    course_id: str = Field(..., description="Course UUID to enroll in")


def _row_to_response(row: tuple) -> ProfileResponse:
    return ProfileResponse(
        id=row[0],
        user_id=row[1],
        career_goal=row[2],
        experience_level=row[3],
        available_minutes=row[4],
        final_goal=row[5],
        enrolled_courses=row[6],
        created_at=row[7],
        updated_at=row[8],
    )


_SELECT_COLS = (
    "id, user_id, career_goal, experience_level, available_minutes, "
    "final_goal, enrolled_courses, created_at, updated_at"
)


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str):
    """Fetch a learner profile by user_id."""
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT {_SELECT_COLS} FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _row_to_response(row)


@router.post("", response_model=ProfileResponse, status_code=201)
def create_profile(body: ProfileCreate):
    """Create a new learner profile."""
    enrolled = json.dumps(body.enrolled_courses) if body.enrolled_courses else None
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO learner_profiles "
                    "(user_id, career_goal, experience_level, "
                    "available_minutes, final_goal, enrolled_courses) "
                    f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING {_SELECT_COLS}",
                    (
                        body.user_id,
                        body.career_goal,
                        body.experience_level,
                        body.available_minutes,
                        body.final_goal,
                        enrolled,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
        except Exception as exc:
            conn.rollback()
            if "unique" in str(exc).lower():
                raise HTTPException(
                    status_code=409, detail="Profile already exists"
                ) from exc
            raise

    return _row_to_response(row)


@router.post("/{user_id}/enroll", response_model=ProfileResponse)
def enroll_in_course(user_id: str, body: EnrollRequest):
    """Add a course to the learner's enrolled list.

    Idempotent guard: returns 409 if the learner is already enrolled in
    the given course. Returns 400 if `course_id` is not a valid UUID.
    Returns 404 if no profile exists for `user_id`.
    """
    try:
        UUID(body.course_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="Invalid course_id UUID"
        ) from exc

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT enrolled_courses FROM learner_profiles "
                "WHERE user_id = %s",
                (user_id,),
            )
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Profile not found")

            current = existing[0] or []
            # Normalize to str list so comparisons are stable across
            # psycopg2 jsonb return shapes (list[str] vs list[UUID]).
            current_str = [str(c) for c in current]
            if body.course_id in current_str:
                raise HTTPException(
                    status_code=409,
                    detail="Already enrolled in this course",
                )

            new_enrolled = current_str + [body.course_id]
            cur.execute(
                "UPDATE learner_profiles SET "
                "enrolled_courses = %s, updated_at = now() "
                f"WHERE user_id = %s RETURNING {_SELECT_COLS}",
                (json.dumps(new_enrolled), user_id),
            )
            row = cur.fetchone()
            conn.commit()

    return _row_to_response(row)


@router.put("/{user_id}", response_model=ProfileResponse)
def update_profile(user_id: str, body: ProfileCreate):
    """Update an existing learner profile."""
    enrolled = json.dumps(body.enrolled_courses) if body.enrolled_courses else None
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE learner_profiles SET "
                "career_goal = %s, experience_level = %s, "
                "available_minutes = %s, final_goal = %s, "
                "enrolled_courses = %s, updated_at = now() "
                f"WHERE user_id = %s RETURNING {_SELECT_COLS}",
                (
                    body.career_goal,
                    body.experience_level,
                    body.available_minutes,
                    body.final_goal,
                    enrolled,
                    user_id,
                ),
            )
            row = cur.fetchone()
            conn.commit()

    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _row_to_response(row)
