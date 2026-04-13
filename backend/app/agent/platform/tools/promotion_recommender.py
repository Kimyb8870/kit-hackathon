"""promotion_recommender — LLM-driven course promotion strategy suggestions."""

import json

from langchain_core.tools import tool
from openai import OpenAI

from app.agent.orchestrator import (
    EVENT_PROMOTION_SUGGESTED,
    INSTRUCTOR,
    PLATFORM,
    log_event,
    query_events,
)
from app.config import settings
from app.db import get_sync_connection


@tool
def promotion_recommender(focus_category: str = "") -> str:
    """Generate promotion strategy ideas using profile + course data.

    This is the **only** tool in the platform agent that calls the LLM,
    keeping inference cost low while still demonstrating value.

    Args:
        focus_category: Optional category to target (empty = all categories).

    Returns:
        JSON string with promotion suggestions.
    """
    catalog = _fetch_catalog(focus_category)
    learner_summary = _fetch_learner_summary()
    instructor_signals = _fetch_instructor_signals()

    if not catalog:
        return json.dumps(
            {"error": "No courses available for promotion."},
            ensure_ascii=False,
        )

    suggestions = _generate_suggestions(
        catalog, learner_summary, focus_category, instructor_signals
    )

    log_event(
        agent_name=PLATFORM,
        event_type=EVENT_PROMOTION_SUGGESTED,
        payload={
            "focus_category": focus_category,
            "suggestion_preview": suggestions[:200],
        },
    )

    return suggestions


def _fetch_catalog(focus_category: str) -> list[dict]:
    sql = (
        "SELECT id, title, category, difficulty, platform, total_chapters "
        "FROM courses "
    )
    params: list = []
    if focus_category:
        sql += "WHERE category = %s "
        params.append(focus_category)
    sql += "LIMIT 30"

    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
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
        except Exception:
            return []


def _fetch_learner_summary() -> dict:
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM learner_profiles")
                total_learners = int(cur.fetchone()[0] or 0)

                cur.execute(
                    "SELECT experience_level, COUNT(*) FROM learner_profiles "
                    "GROUP BY experience_level"
                )
                by_level = {r[0] or "unknown": int(r[1]) for r in cur.fetchall()}
        except Exception:
            return {"total_learners": 0, "by_experience_level": {}}

    return {"total_learners": total_learners, "by_experience_level": by_level}


def _fetch_instructor_signals(since_hours: int = 72) -> list[dict]:
    """Read recent instructor agent events (struggle/content-gap analysis)."""
    events = query_events(agent_name=INSTRUCTOR, since_hours=since_hours, limit=50)
    return [
        {"event_type": ev["event_type"], "payload": ev.get("payload") or {}}
        for ev in events
    ]


def _generate_suggestions(
    catalog: list[dict],
    learner_summary: dict,
    focus_category: str,
    instructor_signals: list[dict],
) -> str:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    signals_preview = json.dumps(instructor_signals[:10], ensure_ascii=False)
    prompt = (
        "You are a marketing strategist for an online learning platform.\n"
        f"Learner base summary: {json.dumps(learner_summary, ensure_ascii=False)}\n"
        f"Course catalog (sample): {json.dumps(catalog[:10], ensure_ascii=False)}\n"
        f"Instructor analysis signals (recent): {signals_preview}\n"
        f"Focus category: {focus_category or '(all)'}\n\n"
        "Suggest 3 concrete promotion campaigns. For each, return:\n"
        "- name (Korean)\n- target_segment (Korean)\n"
        "- offer (e.g., 30% 할인)\n"
        "- target_courses (list of course_id)\n"
        "- rationale (1-2 sentences in Korean)\n\n"
        "IMPORTANT: All output text MUST be in Korean (한국어).\n"
        "- Use only Korean for name, target_segment, offer description, "
        "and rationale\n"
        "- Technical terms (Python, Django, React, API 등) and course "
        "titles can stay in their original language\n"
        "- But all explanatory text, marketing copy, and segment "
        "descriptions must be Korean\n"
        "- Do NOT mix English words like \"solidify\", \"leverage\", "
        "\"comprehensive\", \"engagement\", \"onboarding\" — use 한국어 "
        "equivalents (다지다, 활용하다, 종합적인, 참여, 첫 사용 안내)\n"
        "- Even if an English marketing phrase feels natural, translate "
        "it to Korean\n\n"
        'Respond ONLY with JSON: {"promotions": [...]}'
    )
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )
    return response.choices[0].message.content
