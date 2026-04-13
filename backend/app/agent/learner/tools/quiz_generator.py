"""quiz_generator tool — generate multiple-choice quizzes from course content."""

import json

from langchain_core.tools import tool
from openai import OpenAI

from app.config import settings
from app.db import get_sync_connection
from app.rag.retriever import search

# When the learner's accuracy on a concept drops below this floor, the
# tool downgrades the requested difficulty to "easy" so the next quiz
# revisits fundamentals instead of piling on harder questions.
_WEAK_CONCEPT_ACCURACY_THRESHOLD = 0.5


@tool
def quiz_generator(
    concept_id: str,
    difficulty: str = "medium",
    count: int = 3,
    user_id: str = "",
) -> str:
    """Generate multiple-choice quizzes for a given concept using RAG.

    Retrieves relevant lecture clips for the concept, then uses GPT to
    generate quiz questions with 4 options each. When ``user_id`` is
    provided, the tool also looks up the learner's prior quiz history
    for this concept and:

      - downgrades difficulty to "easy" if the learner's accuracy is
        below ~50% (so the next quiz revisits fundamentals);
      - injects the learner's accuracy / attempts into the prompt so
        the model can frame questions for that specific learner.

    Args:
        concept_id: The concept identifier to generate quizzes for.
        difficulty: Quiz difficulty level — "easy", "medium", or "hard".
            May be auto-downgraded when ``user_id`` reveals a weak spot.
        count: Number of quiz questions to generate (default 3, max 10).
        user_id: Optional learner identifier. When provided, the tool
            personalizes the difficulty and prompt context.

    Returns:
        JSON string with generated quizzes.
    """
    clamped_count = max(1, min(count, 10))
    results = search(query=concept_id, top_k=5)

    clips_text = "\n\n".join(
        f"[{clip.clip_title}] {clip.content}"
        for clip in results["clips"]
    )
    misconceptions_text = "\n".join(
        f"- {m.content}" for m in results["misconceptions"]
    )

    if not clips_text:
        return json.dumps(
            {"error": f"No content found for concept '{concept_id}'."},
            ensure_ascii=False,
        )

    effective_difficulty, learner_context = _personalize_for_user(
        user_id=user_id,
        concept_id=concept_id,
        requested_difficulty=difficulty,
    )

    return _generate_quizzes(
        concept_id=concept_id,
        clips_text=clips_text,
        misconceptions_text=misconceptions_text,
        difficulty=effective_difficulty,
        count=clamped_count,
        learner_context=learner_context,
    )


def _personalize_for_user(
    user_id: str,
    concept_id: str,
    requested_difficulty: str,
) -> tuple[str, str]:
    """Look up the learner's history for this concept and adjust accordingly.

    Returns:
        ``(effective_difficulty, learner_context)``. When ``user_id`` is
        empty or the learner has no history for this concept, the
        difficulty is left unchanged and ``learner_context`` is empty.
    """
    if not user_id:
        return requested_difficulty, ""

    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*), "
                "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) "
                "FROM quiz_results "
                "WHERE user_id = %s AND concept_id = %s",
                (user_id, concept_id),
            )
            row = cur.fetchone()

    attempts = int(row[0] or 0)
    correct = int(row[1] or 0)

    if attempts == 0:
        return requested_difficulty, ""

    accuracy = correct / attempts
    learner_context = (
        f"이 학습자는 '{concept_id}' 개념에서 총 {attempts}회 시도 중 "
        f"{correct}회 정답 (정답률 {accuracy * 100:.0f}%)을 기록했습니다."
    )

    if accuracy < _WEAK_CONCEPT_ACCURACY_THRESHOLD:
        learner_context += (
            " 이 학습자는 해당 개념에서 어려움을 겪고 있으니, "
            "기본기를 다지는 쉬운 문제로 시작해 주세요."
        )
        return "easy", learner_context

    return requested_difficulty, learner_context


def _generate_quizzes(
    concept_id: str,
    clips_text: str,
    misconceptions_text: str,
    difficulty: str,
    count: int,
    learner_context: str = "",
) -> str:
    """Call GPT to produce quiz JSON from retrieved content."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = (
        f"You are a quiz generator for an educational AI tutor.\n\n"
        f"Concept: {concept_id}\n"
        f"Difficulty: {difficulty}\n"
        f"Number of questions: {count}\n\n"
        f"Lecture content:\n{clips_text}\n\n"
    )
    if misconceptions_text:
        prompt += f"Common misconceptions to test:\n{misconceptions_text}\n\n"
    if learner_context:
        prompt += (
            "Learner-specific context (use this to tailor the difficulty "
            "and tone of the questions):\n"
            f"{learner_context}\n\n"
        )

    prompt += (
        "Generate multiple-choice quiz questions in JSON format.\n"
        "Each question must have exactly 4 options labeled A, B, C, D.\n"
        "Include the correct answer letter and a brief explanation.\n\n"
        "IMPORTANT: All quiz text (question, options, explanation) MUST be "
        "written in Korean (한국어).\n"
        "- Technical terms (Python, Django, React, API, JSON 등) can stay "
        "in English, and code snippets stay as-is\n"
        "- But every other word — questions, choices, and explanations — "
        "must be Korean\n"
        "- Do NOT mix English words like \"solidify\", \"leverage\", "
        "\"comprehensive\", \"intuitive\", \"robust\" — use 한국어 "
        "equivalents (다지다, 활용하다, 종합적인, 직관적인, 견고한)\n"
        "- Even if an English phrase feels natural, translate it to Korean\n\n"
        "Respond ONLY with valid JSON, no markdown:\n"
        '{"quizzes": [{"question": "...", '
        '"options": ["A: ...", "B: ...", "C: ...", "D: ..."], '
        '"correct_answer": "B", '
        '"explanation": "...", '
        f'"concept_id": "{concept_id}"'
        "}]}"
    )

    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content
