"""code_reviewer tool — curriculum-aware code review for learners."""

import json
from pathlib import Path

from langchain_core.tools import tool
from openai import OpenAI

from app.config import settings
from app.db import get_sync_connection

# learner/tools/ → learner/ → agent/ → app/ → backend/ → backend/prompts/code_review.md
_REVIEW_PROMPT_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent.parent
    / "prompts"
    / "code_review.md"
)

_REVIEW_PROMPT_CACHE: str | None = None


def _load_review_prompt() -> str:
    global _REVIEW_PROMPT_CACHE
    if _REVIEW_PROMPT_CACHE is None:
        _REVIEW_PROMPT_CACHE = _REVIEW_PROMPT_PATH.read_text(encoding="utf-8")
    return _REVIEW_PROMPT_CACHE


@tool
def code_reviewer(
    code: str,
    user_id: str,
    course_id: str = "",
    chapter_no: int = 0,
) -> str:
    """Review a learner's code with curriculum-aware feedback.

    Checks the learner's profile and enrolled courses, then reviews
    the code against concepts covered up to the specified chapter.

    Args:
        code: The code snippet to review.
        user_id: The learner's unique identifier.
        course_id: Optional course ID to scope the review.
        chapter_no: Chapter number up to which concepts are considered
            "allowed" (0 means all concepts are allowed).

    Returns:
        JSON string with praise, improvements, next_hint, and
        curriculum_note.
    """
    profile = _fetch_profile(user_id)
    allowed_concepts = _fetch_allowed_concepts(course_id, chapter_no)
    return _review_code(code, profile, allowed_concepts, course_id, chapter_no)


def _fetch_profile(user_id: str) -> dict:
    """Fetch the learner's profile from the database."""
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, career_goal, experience_level, "
                "available_minutes, final_goal "
                "FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return {"user_id": user_id, "experience_level": "beginner"}
            return {
                "user_id": row[0],
                "career_goal": row[1],
                "experience_level": row[2],
                "available_minutes": row[3],
                "final_goal": row[4],
            }


def _fetch_allowed_concepts(course_id: str, chapter_no: int) -> list[str]:
    """Fetch concept_ids covered up to a given chapter in a course."""
    if not course_id or chapter_no <= 0:
        return []

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT concept_id FROM course_clips "
                "WHERE course_id = %s AND chapter_no <= %s "
                "AND concept_id IS NOT NULL",
                (course_id, chapter_no),
            )
            return [row[0] for row in cur.fetchall()]


def _review_code(
    code: str,
    profile: dict,
    allowed_concepts: list[str],
    course_id: str,
    chapter_no: int,
) -> str:
    """Send code + context to GPT for curriculum-aware review."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    review_prompt = _load_review_prompt()

    context_parts = [
        review_prompt,
        f"\n## Learner Info\n"
        f"- Experience Level: {profile.get('experience_level', 'unknown')}\n"
        f"- Career Goal: {profile.get('career_goal', 'not set')}\n",
    ]

    if allowed_concepts:
        context_parts.append(
            f"\n## Allowed Concepts (up to chapter {chapter_no})\n"
            f"{', '.join(allowed_concepts)}\n"
        )
    elif course_id and chapter_no > 0:
        context_parts.append(
            "\n## Note\nNo concept data found for this course/chapter. "
            "Review without curriculum constraints.\n"
        )

    context_parts.append(f"\n## Code to Review\n```\n{code}\n```\n")

    system_content = "\n".join(context_parts)

    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {
                "role": "user",
                "content": "Review this code and respond with the JSON format specified.",
            },
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content

    # Validate JSON structure
    try:
        parsed = json.loads(raw)
        required_keys = {"praise", "improvements", "next_hint", "curriculum_note"}
        if not required_keys.issubset(parsed.keys()):
            missing = required_keys - parsed.keys()
            parsed.update({k: "" for k in missing})
        return json.dumps(parsed, ensure_ascii=False, indent=2)
    except json.JSONDecodeError:
        return json.dumps(
            {
                "praise": "",
                "improvements": [],
                "next_hint": "",
                "curriculum_note": "",
                "raw_review": raw,
            },
            ensure_ascii=False,
            indent=2,
        )
