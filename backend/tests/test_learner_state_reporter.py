"""Tests for learner_state_reporter — the comprehensive learner snapshot tool."""

import json

from app.agent.learner.tools.learner_state_reporter import learner_state_reporter


def _invoke(user_id: str, focus: str = "overview") -> dict:
    raw = learner_state_reporter.invoke({"user_id": user_id, "focus": focus})
    return json.loads(raw)


def test_overview_returns_all_sections(seeded_profile):
    data = _invoke(seeded_profile["user_id"])
    assert "enrolled_courses" in data
    assert "recent_quiz_stats" in data
    assert "weak_concepts" in data
    assert "due_reviews_count" in data


def test_recent_quizzes_aggregate(seeded_profile):
    data = _invoke(seeded_profile["user_id"])
    stats = data["recent_quiz_stats"]
    # Fixture seeded 5 quizzes today: 3 correct, 2 incorrect.
    assert stats["total"] == 5
    assert stats["correct"] == 3
    # accuracy is 3/5 = 0.6
    assert abs(stats["accuracy"] - 0.6) < 1e-6


def test_weak_concepts_top5(seeded_profile):
    data = _invoke(seeded_profile["user_id"])
    weak = data["weak_concepts"]
    assert isinstance(weak, list)
    assert len(weak) >= 1
    # 'variables' has 1/3 correct; 'loops' has 2/2. variables should rank first.
    assert weak[0]["concept_id"] == "variables"
    assert weak[0]["attempts"] == 3
    assert weak[0]["correct"] == 1
    # accuracy is rounded to 4 decimals in the tool, so tolerate 1e-3
    assert abs(weak[0]["accuracy"] - (1 / 3)) < 1e-3


def test_enrolled_courses_join(seeded_profile):
    data = _invoke(seeded_profile["user_id"])
    courses = data["enrolled_courses"]
    assert isinstance(courses, list)
    assert len(courses) == 3
    # Each entry must carry the joined metadata
    for c in courses:
        assert "id" in c
        assert "title" in c
        assert "category" in c
        assert "difficulty" in c
        assert c["title"]  # non-empty


def test_focus_filter_weak_concepts(seeded_profile):
    data = _invoke(seeded_profile["user_id"], focus="weak_concepts")
    assert "weak_concepts" in data
    # Other heavy sections must be omitted to keep the payload small
    assert "enrolled_courses" not in data
    assert "recent_quiz_stats" not in data


def test_focus_filter_enrolled(seeded_profile):
    data = _invoke(seeded_profile["user_id"], focus="enrolled")
    assert "enrolled_courses" in data
    assert "weak_concepts" not in data


def test_no_quiz_history(test_user_id):
    # Create a bare profile with no quizzes
    from app.db import get_sync_connection

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO learner_profiles "
                "(user_id, career_goal, experience_level, available_minutes, "
                "final_goal, enrolled_courses) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (test_user_id, "tester", "beginner", 30, "study", json.dumps([])),
            )
            conn.commit()

    data = _invoke(test_user_id)
    assert data["recent_quiz_stats"]["total"] == 0
    assert data["recent_quiz_stats"]["correct"] == 0
    assert data["recent_quiz_stats"]["accuracy"] == 0
    assert data["weak_concepts"] == []
    assert data["due_reviews_count"] == 0
    assert data["enrolled_courses"] == []


def test_due_reviews_count(seeded_profile):
    data = _invoke(seeded_profile["user_id"])
    # Fixture inserts exactly 1 quiz_result with next_review_at in the past
    assert data["due_reviews_count"] == 1


def test_profile_not_found():
    data = _invoke("definitely-not-a-user-xyz")
    assert "error" in data
