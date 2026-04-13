"""Tests for course_recommender — enrolled-courses filter and profile fetch."""

import importlib
import json

import pytest

# Same submodule-shadowing problem as quiz_generator: import via importlib.
cr_module = importlib.import_module(
    "app.agent.learner.tools.course_recommender"
)
course_recommender = cr_module.course_recommender


@pytest.fixture
def stub_llm(monkeypatch):
    """Stub the OpenAI call so the recommender returns a deterministic JSON.

    The fixture also captures the courses list that the helper builds —
    that is what we want to assert against (the filter must drop
    enrolled UUIDs *before* the LLM is invoked).
    """
    captured: dict = {}

    def fake_generate(profile: dict, courses: list[dict]) -> str:
        captured["courses"] = courses
        captured["profile"] = profile
        return json.dumps(
            {
                "recommendations": [
                    {
                        "course_id": courses[0]["id"] if courses else "",
                        "title": courses[0]["title"] if courses else "",
                        "reason": "stub",
                        "priority": 1,
                    }
                ],
                "learning_path": "stub",
            },
            ensure_ascii=False,
        )

    monkeypatch.setattr(cr_module, "_generate_recommendations", fake_generate)
    return captured


def test_excludes_enrolled_courses(stub_llm, seeded_profile):
    raw = course_recommender.invoke({"user_id": seeded_profile["user_id"]})
    enrolled_set = set(seeded_profile["enrolled_courses"])
    candidate_ids = {c["id"] for c in stub_llm["courses"]}
    overlap = candidate_ids & enrolled_set
    assert overlap == set(), (
        f"Recommender must filter out enrolled courses, "
        f"but candidate list still contained: {overlap}"
    )
    # The recommender should still hand the LLM at least one candidate
    # (the seed has 7 courses total minus 3 enrolled = 4 candidates).
    assert len(stub_llm["courses"]) > 0


def test_no_enrolled_returns_all_candidates(stub_llm, test_user_id):
    """When enrolled_courses is empty, every course should be a candidate."""
    from app.db import get_sync_connection

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO learner_profiles "
                "(user_id, career_goal, experience_level, available_minutes, "
                "final_goal, enrolled_courses) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (test_user_id, "tester", "beginner", 30, "study", "[]"),
            )
            conn.commit()

            cur.execute("SELECT count(*) FROM courses")
            total = cur.fetchone()[0]

    course_recommender.invoke({"user_id": test_user_id})
    assert len(stub_llm["courses"]) == total


def test_profile_not_found(stub_llm):
    raw = course_recommender.invoke(
        {"user_id": "definitely-not-a-user-zzz"}
    )
    data = json.loads(raw)
    assert "error" in data
    # The LLM stub must NOT have been called when the profile is missing
    assert "courses" not in stub_llm
