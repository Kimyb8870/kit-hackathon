"""Tests for profile_manager tool — focused on the enrolled_courses bug."""

import json

from app.agent.learner.tools.profile_manager import profile_manager


def test_get_profile_returns_enrolled_courses(seeded_profile):
    user_id = seeded_profile["user_id"]
    raw = profile_manager.invoke({"action": "get", "user_id": user_id})
    data = json.loads(raw)

    assert data.get("user_id") == user_id
    assert "enrolled_courses" in data, (
        "profile_manager must SELECT and return enrolled_courses — "
        "agent cannot personalize otherwise"
    )
    assert isinstance(data["enrolled_courses"], list)
    assert sorted(data["enrolled_courses"]) == sorted(
        seeded_profile["enrolled_courses"]
    )
    assert data["career_goal"] == "백엔드 개발자"
    assert data["experience_level"] == "beginner"


def test_get_profile_not_found():
    raw = profile_manager.invoke(
        {"action": "get", "user_id": "definitely-does-not-exist-zzz"}
    )
    data = json.loads(raw)
    assert "error" in data
    assert data["user_id"] == "definitely-does-not-exist-zzz"


def test_create_profile_with_enrolled(test_user_id):
    payload = {
        "career_goal": "데이터 엔지니어",
        "experience_level": "intermediate",
        "available_minutes": 90,
        "final_goal": "PySpark 마스터",
        "enrolled_courses": [
            "550e8400-e29b-41d4-a716-446655440001",
            "550e8400-e29b-41d4-a716-446655440002",
        ],
    }
    raw = profile_manager.invoke(
        {
            "action": "create",
            "user_id": test_user_id,
            "profile_data": json.dumps(payload),
        }
    )
    data = json.loads(raw)
    assert data["status"] == "created"
    assert data["career_goal"] == "데이터 엔지니어"
    assert "enrolled_courses" in data
    assert sorted(data["enrolled_courses"]) == sorted(payload["enrolled_courses"])

    # Round-trip via get
    raw2 = profile_manager.invoke({"action": "get", "user_id": test_user_id})
    data2 = json.loads(raw2)
    assert sorted(data2["enrolled_courses"]) == sorted(payload["enrolled_courses"])


def test_update_profile_preserves_enrolled(seeded_profile):
    user_id = seeded_profile["user_id"]
    original_enrolled = seeded_profile["enrolled_courses"]

    raw = profile_manager.invoke(
        {
            "action": "update",
            "user_id": user_id,
            "profile_data": json.dumps({"available_minutes": 120}),
        }
    )
    data = json.loads(raw)
    assert data["status"] == "updated"
    assert data["available_minutes"] == 120

    # enrolled_courses should still be present and unchanged
    raw2 = profile_manager.invoke({"action": "get", "user_id": user_id})
    data2 = json.loads(raw2)
    assert sorted(data2["enrolled_courses"]) == sorted(original_enrolled)
