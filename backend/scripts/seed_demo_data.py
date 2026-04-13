"""Seed demo data for Instructor / Platform dashboard metrics.

Inserts:
  - 40 demo learner profiles (user_id prefix: "demo-user-")
  - 400-600 quiz_results across realistic concept distribution
  - 80 agent_events (qa_asked, quiz_attempted) for content_gap_finder & qa_aggregator

Usage (from src/backend/):
    python -m scripts.seed_demo_data

Safety:
  - Only inserts rows with user_id starting with "demo-user-"
  - Uses ON CONFLICT DO NOTHING — safe to re-run
  - Never touches auth.users
  - Never deletes or truncates existing data
"""

import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Ensure app package is importable when run as a module
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.db import get_sync_connection  # noqa: E402

random.seed(42)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

NUM_DEMO_USERS = 40
NOW = datetime.now(timezone.utc)
SEVEN_DAYS_AGO = NOW - timedelta(hours=168)

# Real course UUIDs from the DB
COURSES = [
    {"id": "550e8400-e29b-41d4-a716-446655440001", "category": "프로그래밍"},
    {"id": "550e8400-e29b-41d4-a716-446655440002", "category": "backend"},
    {"id": "550e8400-e29b-41d4-a716-446655440003", "category": "backend"},
    {"id": "550e8400-e29b-41d4-a716-446655440004", "category": "backend"},
    {"id": "550e8400-e29b-41d4-a716-446655440005", "category": "data"},
    {"id": "550e8400-e29b-41d4-a716-446655440006", "category": "ai"},
    {"id": "550e8400-e29b-41d4-a716-446655440007", "category": "frontend"},
]

# concept_id → (course_id, base_accuracy, response_time_range_ms)
# Accuracy below 0.55 = "struggling" concept (intentional signal)
CONCEPT_MAP = [
    # ── Python 기초 (course 001) ──────────────────────────────────────
    ("python-variables",       "550e8400-e29b-41d4-a716-446655440001", 0.80, (300,  4000)),
    ("python-conditionals",    "550e8400-e29b-41d4-a716-446655440001", 0.75, (400,  5000)),
    ("python-for-loop",        "550e8400-e29b-41d4-a716-446655440001", 0.78, (300,  4500)),
    ("python-while-loop",      "550e8400-e29b-41d4-a716-446655440001", 0.72, (400,  5000)),
    ("python-list",            "550e8400-e29b-41d4-a716-446655440001", 0.70, (500,  6000)),
    ("python-tuple-dict",      "550e8400-e29b-41d4-a716-446655440001", 0.68, (600,  7000)),
    ("python-functions",       "550e8400-e29b-41d4-a716-446655440001", 0.73, (500,  6000)),
    ("python-scope-closure",   "550e8400-e29b-41d4-a716-446655440001", 0.30, (3000, 15000)),  # HARD
    ("python-class",           "550e8400-e29b-41d4-a716-446655440001", 0.45, (2000, 12000)),  # HARD
    ("python-inheritance",     "550e8400-e29b-41d4-a716-446655440001", 0.55, (1500, 10000)),
    # ── 백엔드 입문 (course 002) ─────────────────────────────────────
    ("http-methods",           "550e8400-e29b-41d4-a716-446655440002", 0.72, (300,  4000)),
    ("rest-principles",        "550e8400-e29b-41d4-a716-446655440002", 0.65, (600,  7000)),
    ("rdbms-basics",           "550e8400-e29b-41d4-a716-446655440002", 0.70, (500,  6000)),
    ("sql-queries",            "550e8400-e29b-41d4-a716-446655440002", 0.68, (700,  8000)),
    # ── 백엔드 패턴 (course 003) ─────────────────────────────────────
    ("repository-pattern",     "550e8400-e29b-41d4-a716-446655440003", 0.58, (1000, 9000)),
    ("transaction-boundary",   "550e8400-e29b-41d4-a716-446655440003", 0.48, (2000, 12000)),  # HARD
    ("service-layer",          "550e8400-e29b-41d4-a716-446655440003", 0.62, (800,  8000)),
    # ── 고급 Python 비동기 (course 004) ──────────────────────────────
    ("event-loop",             "550e8400-e29b-41d4-a716-446655440004", 0.40, (3000, 15000)),  # HARD
    ("await-semantics",        "550e8400-e29b-41d4-a716-446655440004", 0.50, (2500, 13000)),  # HARD
    ("coroutines",             "550e8400-e29b-41d4-a716-446655440004", 0.55, (2000, 11000)),
    # ── 데이터 분석 (course 005) ─────────────────────────────────────
    ("numpy-broadcast",        "550e8400-e29b-41d4-a716-446655440005", 0.60, (800,  8000)),
    ("pandas-selection",       "550e8400-e29b-41d4-a716-446655440005", 0.73, (500,  5000)),
    ("missing-values",         "550e8400-e29b-41d4-a716-446655440005", 0.68, (600,  7000)),
    # ── LLM 앱 (course 006) ──────────────────────────────────────────
    ("llm-tokens",             "550e8400-e29b-41d4-a716-446655440006", 0.65, (700,  8000)),
    ("rag-pipeline",           "550e8400-e29b-41d4-a716-446655440006", 0.35, (3500, 15000)),  # HARD
    ("tool-calling",           "550e8400-e29b-41d4-a716-446655440006", 0.50, (2500, 13000)),  # HARD
    # ── 프론트엔드 (course 007) ──────────────────────────────────────
    ("css-box-model",          "550e8400-e29b-41d4-a716-446655440007", 0.72, (400,  5000)),
    ("css-selectors",          "550e8400-e29b-41d4-a716-446655440007", 0.75, (300,  4000)),
    ("dom-manipulation",       "550e8400-e29b-41d4-a716-446655440007", 0.65, (600,  7000)),
    ("event-delegation",       "550e8400-e29b-41d4-a716-446655440007", 0.58, (1000, 9000)),
]

EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"]
CAREER_GOALS = [
    "백엔드 개발자로 취업",
    "데이터 사이언티스트 커리어 전환",
    "AI 엔지니어 역량 강화",
    "프론트엔드 개발 학습",
    "풀스택 개발자 목표",
    "파이썬 기초부터 탄탄히",
]

# Q&A question templates per concept (used in agent_events payload)
QA_QUESTIONS = {
    "python-scope-closure": [
        "클로저에서 외부 변수가 왜 유지되나요?",
        "LEGB 규칙을 자세히 설명해 주세요.",
        "nonlocal 키워드는 언제 써야 하나요?",
    ],
    "rag-pipeline": [
        "RAG 파이프라인에서 chunking 전략이 왜 중요한가요?",
        "임베딩 모델 선택 기준을 알고 싶어요.",
        "RAG vs Fine-tuning 언제 어떤 걸 써야 할까요?",
    ],
    "event-loop": [
        "이벤트 루프가 정확히 어떻게 작동하나요?",
        "asyncio.run()과 loop.run_until_complete() 차이가 있나요?",
        "이벤트 루프가 멈추는 이유를 모르겠어요.",
    ],
    "python-class": [
        "__init__과 __new__의 차이가 뭔가요?",
        "클래스 변수와 인스턴스 변수를 언제 구분하나요?",
        "dataclass를 써야 할 때가 언제인가요?",
    ],
    "tool-calling": [
        "LangChain에서 tool을 언제 호출하나요?",
        "tool_choice 파라미터를 어떻게 써야 하나요?",
        "커스텀 도구를 정의하는 방법이 궁금해요.",
    ],
    "transaction-boundary": [
        "트랜잭션 경계를 어디에 설정해야 하나요?",
        "중첩 트랜잭션 처리 방법을 모르겠어요.",
    ],
    "await-semantics": [
        "await 없이 coroutine을 호출하면 어떻게 되나요?",
        "await은 실행을 어떻게 멈추나요?",
    ],
    "numpy-broadcast": [
        "브로드캐스팅 규칙을 이해하기 어려워요.",
        "shape mismatch 에러가 계속 납니다.",
    ],
    "repository-pattern": [
        "리포지토리 패턴이 DAO와 다른 점이 뭔가요?",
        "인터페이스 없이도 리포지토리를 쓸 수 있나요?",
    ],
    "event-delegation": [
        "이벤트 위임이 왜 성능에 좋은가요?",
        "동적으로 추가된 요소에 이벤트를 붙이려면?",
    ],
    # generic fallback
    "default": [
        "이 개념을 더 자세히 설명해 주세요.",
        "실제 코드 예시를 보고 싶어요.",
        "언제 이걸 써야 하는지 모르겠어요.",
    ],
}


def _random_timestamp(start: datetime, end: datetime) -> datetime:
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def _build_learner_profiles() -> list[dict]:
    profiles = []
    for i in range(1, NUM_DEMO_USERS + 1):
        user_id = f"demo-user-{i:03d}"
        level = random.choice(EXPERIENCE_LEVELS)
        goal = random.choice(CAREER_GOALS)
        profiles.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "career_goal": goal,
                "experience_level": level,
                "available_minutes": random.choice([30, 60, 90, 120]),
                "final_goal": f"{goal}을 위한 체계적 학습",
                "enrolled_courses": json.dumps(
                    random.sample(
                        [c["id"] for c in COURSES],
                        k=random.randint(1, 3),
                    )
                ),
            }
        )
    return profiles


def _build_quiz_results(user_ids: list[str]) -> list[dict]:
    results = []
    for user_id in user_ids:
        # each user attempts 10–15 concepts
        num_attempts = random.randint(10, 15)
        sampled_concepts = random.choices(CONCEPT_MAP, k=num_attempts)

        for concept_id, course_id, base_accuracy, rt_range in sampled_concepts:
            # jitter accuracy per user ±0.15
            accuracy = max(0.05, min(0.95, base_accuracy + random.uniform(-0.15, 0.15)))
            is_correct = random.random() < accuracy

            reviewed_at = _random_timestamp(SEVEN_DAYS_AGO, NOW)
            interval_days = random.randint(1, 14)
            next_review_at = reviewed_at + timedelta(days=interval_days)

            response_time_ms = random.randint(*rt_range)

            question_text = _question_for(concept_id)
            user_answer = "정답 예시 답변" if is_correct else "오답 예시 답변"

            results.append(
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "concept_id": concept_id,
                    "course_id": course_id,
                    "question_text": question_text,
                    "user_answer": user_answer,
                    "is_correct": is_correct,
                    "response_time_ms": response_time_ms,
                    "reviewed_at": reviewed_at,
                    "next_review_at": next_review_at,
                    "interval_days": interval_days,
                    "ease_factor": round(random.uniform(1.8, 3.0), 2),
                    "created_at": reviewed_at,
                }
            )
    return results


def _question_for(concept_id: str) -> str:
    templates = [
        f"{concept_id} 개념에 대한 퀴즈입니다. 다음 중 올바른 설명은?",
        f"{concept_id} 를 실제 코드에서 어떻게 활용하나요?",
        f"{concept_id} 에서 가장 자주 발생하는 오류는 무엇인가요?",
    ]
    return random.choice(templates)


def _build_agent_events(user_ids: list[str]) -> list[dict]:
    """Generate qa_asked + quiz_attempted events.

    content_gap_finder needs:
      event_type="qa_asked", payload.concept_id present, agent_name="learner"
    qa_aggregator also reads qa_asked events.
    """
    events = []

    # Hard concepts that learners frequently ask about
    hot_concepts = [
        "python-scope-closure",
        "rag-pipeline",
        "event-loop",
        "python-class",
        "tool-calling",
        "transaction-boundary",
        "await-semantics",
        "numpy-broadcast",
        "repository-pattern",
        "event-delegation",
    ]

    # qa_asked events: 5–10 per hot concept  → 50–100 events
    for concept_id in hot_concepts:
        num_events = random.randint(5, 10)
        for _ in range(num_events):
            questions = QA_QUESTIONS.get(concept_id, QA_QUESTIONS["default"])
            question = random.choice(questions)
            user_id = random.choice(user_ids)
            created_at = _random_timestamp(SEVEN_DAYS_AGO, NOW)
            events.append(
                {
                    "id": str(uuid.uuid4()),
                    "agent_name": "learner",
                    "event_type": "qa_asked",
                    "payload": {
                        "concept_id": concept_id,
                        "question": question,
                        "user_id": user_id,
                    },
                    "created_at": created_at,
                }
            )

    # quiz_attempted events: sparse, for audit trail
    for user_id in random.sample(user_ids, k=min(20, len(user_ids))):
        concept_id, course_id, _, _ = random.choice(CONCEPT_MAP)
        created_at = _random_timestamp(SEVEN_DAYS_AGO, NOW)
        events.append(
            {
                "id": str(uuid.uuid4()),
                "agent_name": "learner",
                "event_type": "quiz_attempted",
                "payload": {
                    "concept_id": concept_id,
                    "course_id": course_id,
                    "user_id": user_id,
                    "result": random.choice(["correct", "incorrect"]),
                },
                "created_at": created_at,
            }
        )

    return events


def insert_learner_profiles(conn, profiles: list[dict]) -> int:
    inserted = 0
    with conn.cursor() as cur:
        for p in profiles:
            cur.execute(
                """
                INSERT INTO learner_profiles
                  (id, user_id, career_goal, experience_level,
                   available_minutes, final_goal, enrolled_courses,
                   created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, now(), now())
                ON CONFLICT (user_id) DO NOTHING
                """,
                (
                    p["id"],
                    p["user_id"],
                    p["career_goal"],
                    p["experience_level"],
                    p["available_minutes"],
                    p["final_goal"],
                    p["enrolled_courses"],
                ),
            )
            inserted += cur.rowcount
    conn.commit()
    return inserted


def insert_quiz_results(conn, results: list[dict]) -> int:
    inserted = 0
    batch_size = 100
    with conn.cursor() as cur:
        for i in range(0, len(results), batch_size):
            batch = results[i : i + batch_size]
            for r in batch:
                cur.execute(
                    """
                    INSERT INTO quiz_results
                      (id, user_id, concept_id, course_id, question_text,
                       user_answer, is_correct, response_time_ms,
                       reviewed_at, next_review_at, interval_days, ease_factor,
                       created_at)
                    VALUES (%s, %s, %s, %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        r["id"],
                        r["user_id"],
                        r["concept_id"],
                        r["course_id"],
                        r["question_text"],
                        r["user_answer"],
                        r["is_correct"],
                        r["response_time_ms"],
                        r["reviewed_at"],
                        r["next_review_at"],
                        r["interval_days"],
                        r["ease_factor"],
                        r["created_at"],
                    ),
                )
                inserted += cur.rowcount
            conn.commit()
            print(
                f"  ... committed batch {i // batch_size + 1} "
                f"({min(i + batch_size, len(results))}/{len(results)})"
            )
    return inserted


def insert_agent_events(conn, events: list[dict]) -> int:
    inserted = 0
    with conn.cursor() as cur:
        for ev in events:
            cur.execute(
                """
                INSERT INTO agent_events (id, agent_name, event_type, payload, created_at)
                VALUES (%s, %s, %s, %s::jsonb, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (
                    ev["id"],
                    ev["agent_name"],
                    ev["event_type"],
                    json.dumps(ev["payload"], ensure_ascii=False),
                    ev["created_at"],
                ),
            )
            inserted += cur.rowcount
    conn.commit()
    return inserted


def main() -> None:
    print("=== Clover Demo Data Seeding ===\n")
    print(f"Generating data for {NUM_DEMO_USERS} demo users...")

    profiles = _build_learner_profiles()
    user_ids = [p["user_id"] for p in profiles]

    quiz_results = _build_quiz_results(user_ids)
    agent_events = _build_agent_events(user_ids)

    print(f"  Prepared {len(profiles)} learner profiles")
    print(f"  Prepared {len(quiz_results)} quiz results")
    print(f"  Prepared {len(agent_events)} agent events")
    print()

    with get_sync_connection() as conn:
        try:
            print("[1/3] Inserting learner profiles...")
            n_profiles = insert_learner_profiles(conn, profiles)
            print(f"  → Inserted {n_profiles} learner profiles (skipped existing)\n")

            print("[2/3] Inserting quiz results...")
            n_quiz = insert_quiz_results(conn, quiz_results)
            print(f"  → Inserted {n_quiz} quiz results\n")

            print("[3/3] Inserting agent events...")
            n_events = insert_agent_events(conn, agent_events)
            print(f"  → Inserted {n_events} agent events\n")
        except Exception as exc:
            conn.rollback()
            print(f"[ERROR] Rolling back — {exc}")
            raise

    print("=== Done ===")
    print(f"  learner_profiles : {n_profiles}")
    print(f"  quiz_results     : {n_quiz}")
    print(f"  agent_events     : {n_events}")
    print()
    print("Verify with:")
    print(
        "  curl https://clover-backend-production-20a5.up.railway.app"
        "/api/v1/instructor/insights"
    )
    print(
        "  curl https://clover-backend-production-20a5.up.railway.app"
        "/api/v1/platform/demand"
    )
    print(
        "  curl https://clover-backend-production-20a5.up.railway.app"
        "/api/v1/platform/recommendations"
    )


if __name__ == "__main__":
    main()
