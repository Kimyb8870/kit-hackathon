"""course_recommender tool — profile-based course recommendations."""

import json

from langchain_core.tools import tool
from openai import OpenAI

from app.config import settings
from app.db import get_sync_connection


@tool
def course_recommender(user_id: str) -> str:
    """Recommend courses for a learner based on their profile.

    Fetches the learner's profile and all available courses from the DB,
    then uses GPT to generate personalized recommendations with reasoning.

    Args:
        user_id: The learner's unique identifier.

    Returns:
        JSON string with recommended courses and reasoning.
    """
    profile, courses = _fetch_data(user_id)
    if "error" in profile:
        return json.dumps(profile, ensure_ascii=False)
    if not courses:
        return json.dumps({"error": "No courses available."}, ensure_ascii=False)

    return _generate_recommendations(profile, courses)


def _fetch_data(user_id: str) -> tuple[dict, list[dict]]:
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT career_goal, experience_level, available_minutes, "
                "final_goal, enrolled_courses "
                "FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return {"error": "No profile found. Please create a profile first."}, []

            enrolled_raw = row[4] or []
            enrolled_ids: set[str] = (
                {str(c) for c in enrolled_raw} if isinstance(enrolled_raw, list) else set()
            )

            profile = {
                "career_goal": row[0],
                "experience_level": row[1],
                "available_minutes": row[2],
                "final_goal": row[3],
                "enrolled_course_ids": sorted(enrolled_ids),
            }

            cur.execute(
                "SELECT id, title, category, difficulty, platform, total_chapters "
                "FROM courses"
            )
            courses = [
                {
                    "id": str(r[0]),
                    "title": r[1],
                    "category": r[2],
                    "difficulty": r[3],
                    "platform": r[4],
                    "total_chapters": r[5],
                }
                for r in cur.fetchall()
                if str(r[0]) not in enrolled_ids
            ]

    return profile, courses


def _generate_recommendations(profile: dict, courses: list[dict]) -> str:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = (
        "Based on the learner profile and available courses, recommend courses "
        "from the provided list. You MUST recommend at least 1 course from the "
        "Available Courses list, even if the fit is imperfect — pick the closest "
        "match and explain how it can still help the learner reach their goal.\n\n"
        f"Learner Profile:\n"
        f"- Career Goal: {profile['career_goal']}\n"
        f"- Experience Level: {profile['experience_level']}\n"
        f"- Available Minutes/Day: {profile['available_minutes']}\n"
        f"- Final Goal: {profile['final_goal']}\n\n"
        f"Available Courses:\n{json.dumps(courses, ensure_ascii=False, indent=2)}\n\n"
        "IMPORTANT: All output text MUST be in Korean (한국어).\n"
        "- Use only Korean for reasons, learning paths, descriptions\n"
        "- Technical terms (Python, Django, React, API 등) can stay in English\n"
        "- But explanatory text, transitions, and phrases must be Korean\n"
        "- Do NOT mix English words like \"solidify\", \"leverage\", "
        "\"comprehensive\", \"intuitive\", \"robust\" — use 한국어 equivalents "
        "(다지다, 활용하다, 종합적인, 직관적인, 견고한)\n"
        "- Even if an English phrase feels natural, translate it to Korean\n\n"
        "Respond in JSON format:\n"
        '{"recommendations": [{"course_id": "...", "title": "...", '
        '"reason": "추천 이유 (Korean only)", "priority": 1}], '
        '"learning_path": "학습 경로 설명 (Korean only, 2-3문장)"}\n'
        "Recommend 1-5 courses (minimum 1). Prioritize by experience level and goals. "
        "Only use course_id and title values that appear in Available Courses. "
        "Respond ONLY with valid JSON, no markdown."
    )

    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    content = response.choices[0].message.content
    return _ensure_non_empty(content, courses)


def _ensure_non_empty(content: str, courses: list[dict]) -> str:
    """Guarantee at least one recommendation to avoid empty fallbacks."""
    try:
        parsed = json.loads(content)
    except (json.JSONDecodeError, TypeError):
        return content

    recs = parsed.get("recommendations") or []
    if recs:
        return content

    fallback = courses[0]
    parsed["recommendations"] = [
        {
            "course_id": fallback["id"],
            "title": fallback["title"],
            "reason": (
                "현재 카탈로그에서 학습자 목표에 가장 근접한 과정입니다. "
                "기본기를 다지면서 다음 단계 학습의 토대를 마련할 수 있습니다."
            ),
            "priority": 1,
        }
    ]
    if not parsed.get("learning_path"):
        parsed["learning_path"] = (
            f"먼저 '{fallback['title']}'으로 기초를 점검한 뒤, "
            "학습자의 목표에 맞춰 심화 주제로 확장해 나가세요."
        )
    return json.dumps(parsed, ensure_ascii=False)
