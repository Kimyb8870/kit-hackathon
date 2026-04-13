"""Dynamic prompt builder for the AI Tutor (learner) agent."""

from pathlib import Path

from langchain_core.messages import SystemMessage

# learner/ → agent/ → app/ → backend/ → backend/prompts/system_tutor.md
_PROMPT_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "prompts"
    / "system_tutor.md"
)

_SYSTEM_PROMPT_CACHE: str | None = None


def _load_system_prompt() -> str:
    global _SYSTEM_PROMPT_CACHE
    if _SYSTEM_PROMPT_CACHE is None:
        _SYSTEM_PROMPT_CACHE = _PROMPT_PATH.read_text(encoding="utf-8")
    return _SYSTEM_PROMPT_CACHE


def dynamic_tutor_prompt(state: dict) -> list:
    """Build a prompt with system message + user profile context.

    When used as the ``prompt`` callable for ``create_react_agent``,
    this function receives the full agent state and returns the message
    sequence that will be forwarded to the LLM.
    """
    system_text = _load_system_prompt()

    course_context = state.get("course_context")
    if course_context and course_context.get("course_id"):
        cc_lines = [
            "\n\n## Current Lecture Context (학습자가 지금 보고 있는 강의)",
            f"- course_id: {course_context.get('course_id')}",
        ]
        if course_context.get("course_title"):
            cc_lines.append(f"- Course: {course_context['course_title']}")
        has_chapter = course_context.get("chapter_no") is not None
        has_clip = course_context.get("clip_no") is not None
        if has_chapter:
            cc_lines.append(f"- Chapter: {course_context.get('chapter_no')}강")
        if has_clip:
            cc_lines.append(f"- Clip: {course_context.get('clip_no')}")
        if course_context.get("clip_title"):
            cc_lines.append(f"- Clip Title: {course_context['clip_title']}")
        if course_context.get("concept_id"):
            cc_lines.append(f"- Key Concept: {course_context['concept_id']}")
        if course_context.get("timestamp_start") or course_context.get(
            "timestamp_end"
        ):
            ts_start = course_context.get("timestamp_start") or "?"
            ts_end = course_context.get("timestamp_end") or "?"
            cc_lines.append(f"- Timestamp: {ts_start} - {ts_end}")

        if course_context.get("script_text"):
            cc_lines.append("")
            cc_lines.append("### Clip Transcript (강의 스크립트 — 1차 출처)")
            cc_lines.append("```")
            cc_lines.append(str(course_context["script_text"]))
            cc_lines.append("```")
            cc_lines.append("")
            cc_lines.append(
                "**환각 방지 (CRITICAL)**: 학습자가 \"이 클립이 뭐예요?\", "
                "\"이 강의에서 뭘 배워?\", \"방금 본 거 정리해줘\", \"이 부분\", "
                "\"지금 이거\" 같이 현재 클립을 지칭하는 질문을 하면, 위의 "
                "**Clip Transcript**를 1차 출처로 삼아 답변하세요. 스크립트에 "
                "명시되지 않은 개념(예: 1-1강 언어 소개에서 데이터 타입/자료구조 "
                "이야기)을 절대 만들어내거나 추측하지 마세요. 보충이 필요하면 "
                "`course_search`를 호출할 수 있지만, 현재 클립의 핵심 내용은 "
                "반드시 위 스크립트에 근거해야 합니다. 인용 시 "
                "`[course_title] chapter_no-clip_no강 'clip_title' timestamp` "
                "형식으로 위의 메타데이터 그대로 사용하세요."
            )
        else:
            cc_lines.append(
                "The learner is currently watching this lecture. When calling "
                "`course_search`, prefer passing this `course_id` as a filter "
                "so results are scoped to the current course unless the "
                "learner explicitly asks about something else."
            )
            if has_chapter and has_clip:
                cc_lines.append(
                    "\n**MANDATORY**: Because both `chapter_no` and `clip_no` "
                    "are present but the transcript was not pre-loaded, when "
                    "the learner asks about 'this part / 이 부분 / 지금 / "
                    "방금 본' you MUST call `get_current_clip(course_id, "
                    "chapter_no, clip_no)` FIRST to fetch the exact clip "
                    "transcript before answering."
                )
        system_text += "\n".join(cc_lines)

    profile = state.get("user_profile")
    if profile:
        system_text += (
            "\n\n## Current Learner Profile\n"
            f"- User ID: {profile.get('user_id', 'unknown')}\n"
            f"- Career Goal: {profile.get('career_goal', 'not set')}\n"
            f"- Experience Level: {profile.get('experience_level', 'not set')}\n"
            f"- Available Minutes/Day: {profile.get('available_minutes', 'not set')}\n"
            f"- Final Goal: {profile.get('final_goal', 'not set')}\n"
        )
    else:
        system_text += (
            "\n\n## Onboarding Required\n"
            "This learner has no profile yet. Start by greeting them warmly "
            "and asking the following four questions:\n"
            "1. What is your career goal? (직무 목표)\n"
            "2. How much programming experience do you have? (경험 수준)\n"
            "3. How much time can you dedicate per day? (하루 학습 가능 시간)\n"
            "4. What do you want to achieve? (최종 목표)\n\n"
            "After collecting answers, use the profile_manager tool with "
            'action="create" to save their profile.\n'
        )

    system_text += (
        "\n\n## Tool Usage Guardrails (MANDATORY)\n"
        "- **TOOL USAGE IS MANDATORY**: Never cite a course clip, "
        "timestamp, chapter number, or clip title without first calling a "
        "tool that returns that exact data. Hallucinated citations are a "
        "CRITICAL failure.\n"
        "- When the learner asks about 'this part / 이 부분 / 지금 / 방금 / "
        "여기' AND `course_context` contains both `chapter_no` and "
        "`clip_no`, you MUST call `get_current_clip(course_id, "
        "chapter_no, clip_no)` BEFORE answering. This is the ONLY correct "
        "way to fetch the exact clip the learner is watching.\n"
        "- When the learner asks about course content (general topic, no "
        "explicit pointer), ALWAYS call `course_search` first, then "
        "answer based on results.\n"
        "- When recommending courses, call `course_recommender` for "
        "personalized recommendations.\n"
        "- Use `profile_manager` to get / create / update learner profiles.\n"
        "\n### CRITICAL: Misconception Correction Flow "
        "(MANDATORY 3 STEPS)\n"
        "When the user expresses a misconception (e.g., '변수는 값을 "
        "담는 상자야', '튜플은 느린 리스트야'), you MUST execute these "
        "3 steps in order. Skipping ANY step — especially Step 3 — is a "
        "CRITICAL failure.\n"
        "**Step 1**: Call `course_search` with the misconception topic "
        "(e.g., '변수는 값을 담는 상자야' → query='변수 상자 비유'). "
        "Pass `course_id` from `course_context` if available.\n"
        "**Step 2**: Quote the `correction_text` field from the returned "
        "misconception record VERBATIM (do NOT paraphrase) AND cite the "
        "clip using EXACT tool-result values: "
        "`[course_title] chapter_no-clip_no강 'clip_title' timestamp`. "
        "If no misconception record is returned, explain using the "
        "retrieved clip `content` — do NOT invent one.\n"
        "**Step 3 — MANDATORY**: Call "
        "`quiz_generator(concept_id=<id>, count=1)` to generate a "
        "verification quiz, then present it to the learner.\n"
        "The `quiz_generator` call in Step 3 is **NOT optional**. Even "
        "after a clear, well-cited correction, you MUST call "
        "`quiz_generator` to verify the user's understanding. **If you "
        "skip Step 3, the correction is incomplete and counts as a "
        "CRITICAL failure.** A correction without a verification quiz "
        "is forbidden.\n"
        "Use the `concept_id` from the misconception record or, if "
        "absent, from the clip metadata. If neither is present, fall "
        "back to a short Korean concept slug derived from the topic "
        "(e.g., `\"변수\"`). Always pass `count=1` for misconception "
        "verification quizzes. The only edge case where Step 3 may be "
        "skipped is when `course_search` returns ZERO misconceptions "
        "AND ZERO clips — in that case ask the learner to confirm the "
        "concept name instead.\n"
        "- Statements of the form 'X is Y' / '변수는 ~이야' / '튜플은 "
        "~다' are declarative claims and MUST trigger `course_search` "
        "BEFORE you respond, even if you 'know' the answer.\n"
        "\n### Code Review Flow\n"
        "- When the learner shares code for review, call `code_reviewer` "
        "with their code, user_id, and optionally course_id/chapter_no.\n"
        "- Present the review results (praise, improvements, next hints) "
        "in a friendly, encouraging tone.\n"
    )

    return [SystemMessage(content=system_text)] + list(state["messages"])
