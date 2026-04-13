"""Shared pytest fixtures for backend tests.

These tests run against the real Supabase database (no mocks).
Each test that needs DB state uses a fresh, unique user_id and
cleans up after itself via CASCADE-friendly fixtures.
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pytest

# Make `app.*` importable when running `pytest` from src/backend
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.db import get_sync_connection  # noqa: E402


# Real course UUIDs that already live in Supabase (verified via SELECT).
# Picking three of them keeps test data realistic without seeding new courses.
REAL_COURSE_IDS: tuple[str, ...] = (
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003",
)


def _delete_user(user_id: str) -> None:
    """Remove all rows owned by a test user.

    quiz_results.user_id has ON DELETE CASCADE on learner_profiles.user_id,
    so deleting the profile is enough.
    """
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            conn.commit()


@pytest.fixture
def test_user_id() -> str:
    """Yield a unique user_id and clean up afterwards."""
    uid = f"test-user-{uuid4()}"
    try:
        yield uid
    finally:
        _delete_user(uid)


@pytest.fixture
def seeded_profile(test_user_id: str) -> dict:
    """Insert a profile + quiz history for the test user.

    Layout:
      - 3 enrolled courses (real UUIDs)
      - 5 quiz results across 2 concepts ("variables", "loops")
        with mixed correctness so weak-concept aggregation has signal
      - One quiz_result is due today (next_review_at = now - 1h)
    """
    enrolled = list(REAL_COURSE_IDS)
    now = datetime.now(timezone.utc)

    profile_payload = {
        "user_id": test_user_id,
        "career_goal": "백엔드 개발자",
        "experience_level": "beginner",
        "available_minutes": 60,
        "final_goal": "Python으로 API 서버 만들기",
        "enrolled_courses": enrolled,
    }

    quiz_rows: list[tuple] = [
        # variables: 1/3 correct → weak concept
        ("variables", REAL_COURSE_IDS[0], "변수란?", "A", False, 8000, now - timedelta(hours=1)),
        ("variables", REAL_COURSE_IDS[0], "변수 선언?", "B", False, 9000, now + timedelta(days=2)),
        ("variables", REAL_COURSE_IDS[0], "변수 타입?", "C", True, 7000, now + timedelta(days=4)),
        # loops: 2/2 correct → strong concept
        ("loops", REAL_COURSE_IDS[1], "for 루프?", "A", True, 5000, now + timedelta(days=3)),
        ("loops", REAL_COURSE_IDS[1], "while 루프?", "B", True, 6000, now + timedelta(days=5)),
    ]

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO learner_profiles "
                "(user_id, career_goal, experience_level, "
                "available_minutes, final_goal, enrolled_courses) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    profile_payload["user_id"],
                    profile_payload["career_goal"],
                    profile_payload["experience_level"],
                    profile_payload["available_minutes"],
                    profile_payload["final_goal"],
                    json.dumps(profile_payload["enrolled_courses"]),
                ),
            )
            for concept, course, q, ans, correct, ms, next_review in quiz_rows:
                cur.execute(
                    "INSERT INTO quiz_results "
                    "(user_id, concept_id, course_id, question_text, "
                    "user_answer, is_correct, response_time_ms, "
                    "next_review_at, interval_days, ease_factor) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        test_user_id,
                        concept,
                        course,
                        q,
                        ans,
                        correct,
                        ms,
                        next_review,
                        1,
                        2.5,
                    ),
                )
            conn.commit()

    return profile_payload
