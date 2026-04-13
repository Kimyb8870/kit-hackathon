"""Seed course_clips + RAG embeddings for the 7 new catalog courses.

This is a one-off ingestion script scoped to the catalog additions
(`440008` ~ `44000e`). It does three things:

1. Reads the chapter JSON files under `data/course_clips/<slug>/` for
   each new slug.
2. Inserts each clip into the `course_clips` Postgres table along with
   an OpenAI `text-embedding-3-small` vector so that tools like
   `get_current_clip`, `chat._fetch_clip_context`, and review scheduling
   can find them.
3. Pushes the same clips into the LangChain `course_content` PGVector
   collection that `course_search` actually queries, reusing
   `process_course_clips` so the chunking/metadata stay consistent with
   the existing corpus.

Safe to re-run: the `course_clips` INSERT checks `(course_id, chapter_no,
clip_no)` before writing. The PGVector side is additive — running this
twice will duplicate the new embeddings, so avoid repeat runs unless you
first delete the previous rows from `langchain_pg_embedding`.

Usage (from src/backend/):
    python -m scripts.seed_new_course_clips
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Iterable

# Ensure app package is importable when run as a module
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.db import get_sync_connection  # noqa: E402
from app.rag.chunker import process_course_clips  # noqa: E402
from app.rag.embeddings import embed_text  # noqa: E402
from app.rag.vectorstore import add_documents  # noqa: E402

DATA_DIR = _backend_dir / "data" / "course_clips"

# slug → (course_id UUID, course_title)
# Must stay in sync with scripts.ingest_scripts.COURSE_SLUG_META and with
# the catalog rows inserted by the backend-courses-seed task (#91).
NEW_COURSES: list[tuple[str, str, str]] = [
    (
        "react-practical",
        "550e8400-e29b-41d4-a716-446655440008",
        "리액트 실전 — 컴포넌트 설계부터 상태관리까지",
    ),
    (
        "figma-interaction",
        "550e8400-e29b-41d4-a716-446655440009",
        "피그마 인터랙션 디자인 마스터클래스",
    ),
    (
        "korean-cooking",
        "550e8400-e29b-41d4-a716-44665544000a",
        "집밥의 정석 — 한식 기본기 30가지",
    ),
    (
        "business-english",
        "550e8400-e29b-41d4-a716-44665544000b",
        "비즈니스 영어 이메일 & 회의 영어",
    ),
    (
        "aws-saa",
        "550e8400-e29b-41d4-a716-44665544000c",
        "AWS SAA 자격증 한 번에 합격하기",
    ),
    (
        "unity-mobile-game",
        "550e8400-e29b-41d4-a716-44665544000d",
        "유니티로 만드는 첫 모바일 게임",
    ),
    (
        "daily-makeup",
        "550e8400-e29b-41d4-a716-44665544000e",
        "데일리 메이크업 클래스",
    ),
]


def _load_clip_files(slug: str) -> Iterable[Path]:
    course_dir = DATA_DIR / slug
    if not course_dir.exists():
        print(f"  [SKIP] {slug} (directory missing)")
        return []
    return sorted(course_dir.glob("*.json"))


def _vector_literal(vec: list[float]) -> str:
    """Format a Python list as a pgvector literal string."""
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def seed_course_clips_table() -> int:
    """Insert raw clips + embeddings into the `course_clips` SQL table.

    Skips rows that already exist (matched by course_id, chapter_no, clip_no).
    Returns the number of rows actually inserted.
    """
    inserted_total = 0
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            for slug, course_id, course_title in NEW_COURSES:
                for chapter_path in _load_clip_files(slug):
                    with open(chapter_path, encoding="utf-8") as f:
                        clips = json.load(f)
                    for clip in clips:
                        cur.execute(
                            "SELECT 1 FROM course_clips "
                            "WHERE course_id = %s AND chapter_no = %s "
                            "AND clip_no = %s",
                            (course_id, clip["chapter_no"], clip["clip_no"]),
                        )
                        if cur.fetchone():
                            print(
                                f"  [SKIP] {slug} "
                                f"ch{clip['chapter_no']} clip{clip['clip_no']} "
                                f"(already present)"
                            )
                            continue

                        embedding = embed_text(clip["script_text"])
                        cur.execute(
                            """
                            INSERT INTO course_clips (
                                course_id, chapter_no, clip_no, clip_title,
                                timestamp_start, timestamp_end, script_text,
                                concept_id, embedding
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s::vector
                            )
                            """,
                            (
                                course_id,
                                clip["chapter_no"],
                                clip["clip_no"],
                                clip["clip_title"],
                                clip.get("timestamp_start"),
                                clip.get("timestamp_end"),
                                clip["script_text"],
                                clip["concept_id"],
                                _vector_literal(embedding),
                            ),
                        )
                        inserted_total += 1
                        print(
                            f"  [OK]  {slug} "
                            f"ch{clip['chapter_no']} clip{clip['clip_no']} "
                            f"— {clip['clip_title']}"
                        )
        conn.commit()
    return inserted_total


def seed_rag_collection() -> int:
    """Push the same clips into the `course_content` PGVector collection."""
    all_docs = []
    for slug, course_id, course_title in NEW_COURSES:
        for chapter_path in _load_clip_files(slug):
            docs = process_course_clips(
                chapter_path,
                course_id=course_id,
                course_title=course_title,
            )
            all_docs.extend(docs)
            print(
                f"  {slug} / {chapter_path.name}: "
                f"{len(docs)} chunks"
            )
    if all_docs:
        add_documents(all_docs)
    return len(all_docs)


def main() -> None:
    print("=== Seed new course clips (440008~44000e) ===\n")

    print("[1/2] Inserting rows into course_clips table + embeddings...")
    inserted = seed_course_clips_table()
    print(f"  → Inserted {inserted} course_clips rows\n")

    print("[2/2] Pushing clips into LangChain PGVector collection...")
    chunk_count = seed_rag_collection()
    print(f"  → Added {chunk_count} vector documents\n")

    print("=== Done ===")


if __name__ == "__main__":
    main()
