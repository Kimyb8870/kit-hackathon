"""Tests for quiz_generator — user_id-aware difficulty adjustment.

These tests focus on the user_id branch (history lookup + difficulty
adjustment) and avoid hitting OpenAI by stubbing the LLM helper.
"""

import importlib
import json

import pytest

# tools/__init__.py re-exports the @tool function under the same name as
# the submodule, which shadows the module via attribute access. Pull the
# module via importlib so monkeypatch can patch its globals.
qg_module = importlib.import_module(
    "app.agent.learner.tools.quiz_generator"
)
quiz_generator = qg_module.quiz_generator


class _FakeClip:
    def __init__(self, content: str, clip_title: str = "fake clip") -> None:
        self.content = content
        self.clip_title = clip_title


@pytest.fixture(autouse=True)
def _stub_search_and_llm(monkeypatch):
    """Replace RAG search + LLM call with deterministic stubs.

    The tests below only care about (1) what difficulty the tool decides
    to use and (2) whether user history is folded into the prompt — they
    do NOT need a real OpenAI call.
    """

    def fake_search(query: str, top_k: int = 5):
        return {
            "clips": [_FakeClip("기본 설명입니다.", "1-1강 변수란")],
            "misconceptions": [],
        }

    captured: dict = {}

    def fake_generate(
        concept_id: str,
        clips_text: str,
        misconceptions_text: str,
        difficulty: str,
        count: int,
        learner_context: str = "",
    ) -> str:
        captured["difficulty"] = difficulty
        captured["learner_context"] = learner_context
        captured["concept_id"] = concept_id
        captured["count"] = count
        return json.dumps(
            {
                "quizzes": [
                    {
                        "question": "stub",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "A",
                        "explanation": "stub",
                        "concept_id": concept_id,
                    }
                ],
                "_difficulty_used": difficulty,
                "_learner_context_used": learner_context,
            },
            ensure_ascii=False,
        )

    monkeypatch.setattr(qg_module, "search", fake_search)
    monkeypatch.setattr(qg_module, "_generate_quizzes", fake_generate)
    return captured


def test_no_user_id_uses_explicit_difficulty(_stub_search_and_llm):
    raw = quiz_generator.invoke(
        {"concept_id": "variables", "difficulty": "hard", "count": 2}
    )
    data = json.loads(raw)
    assert data["_difficulty_used"] == "hard"
    assert _stub_search_and_llm["learner_context"] == ""


def test_with_user_id_lowers_difficulty_for_weak_concept(
    _stub_search_and_llm, seeded_profile
):
    # 'variables' has 1/3 correct in fixture → tool should drop to easy
    raw = quiz_generator.invoke(
        {
            "concept_id": "variables",
            "difficulty": "medium",
            "count": 1,
            "user_id": seeded_profile["user_id"],
        }
    )
    data = json.loads(raw)
    assert data["_difficulty_used"] == "easy"
    assert "정답률" in _stub_search_and_llm["learner_context"]


def test_with_user_id_keeps_difficulty_for_strong_concept(
    _stub_search_and_llm, seeded_profile
):
    # 'loops' has 2/2 correct in fixture → tool should NOT lower difficulty
    raw = quiz_generator.invoke(
        {
            "concept_id": "loops",
            "difficulty": "medium",
            "count": 1,
            "user_id": seeded_profile["user_id"],
        }
    )
    data = json.loads(raw)
    assert data["_difficulty_used"] == "medium"
    # Context should still mention the learner's history
    assert _stub_search_and_llm["learner_context"] != ""


def test_with_user_id_no_history_uses_default(
    _stub_search_and_llm, test_user_id
):
    # No quiz_results for this concept → default difficulty stays
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

    raw = quiz_generator.invoke(
        {
            "concept_id": "brand-new-concept",
            "difficulty": "medium",
            "count": 1,
            "user_id": test_user_id,
        }
    )
    data = json.loads(raw)
    assert data["_difficulty_used"] == "medium"
