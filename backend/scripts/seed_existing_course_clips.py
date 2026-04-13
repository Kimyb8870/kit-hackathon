"""Backfill the `course_clips` SQL table for the 6 original catalog courses.

Task #94 follow-up to #93. The original 6 courses (440002~440007) already
have their chapter JSON files under `data/course_clips/<slug>/` AND their
embeddings in the LangChain `course_content` PGVector collection (keyed by
slug — e.g. ``course_id: "backend-intro"``). What they DON'T have is any
row in the `course_clips` Postgres table, so tools that SELECT directly
from that table (`get_current_clip`, `chat._fetch_clip_context`,
`review.py`, `content_gap_finder`, `code_reviewer`) return nothing for
these courses.

This script backfills only the SQL table. It deliberately does NOT push
anything into PGVector because those rows already exist there — re-adding
would silently duplicate embeddings and skew RAG scores.

Scope: 6 slugs (backend-intro, backend-patterns, python-async,
data-analysis, llm-apps, frontend-basics), all chapters present on disk
(currently chapter1~4 per course = 72 clips total).

Safe to re-run: existence is checked on (course_id, chapter_no, clip_no)
before each INSERT.

Usage (from src/backend/):
    python -m scripts.seed_existing_course_clips
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
from app.rag.embeddings import embed_text  # noqa: E402

DATA_DIR = _backend_dir / "data" / "course_clips"

# slug → course UUID (verified against the `courses` table).
EXISTING_COURSES: list[tuple[str, str]] = [
    ("backend-intro",     "550e8400-e29b-41d4-a716-446655440002"),
    ("backend-patterns",  "550e8400-e29b-41d4-a716-446655440003"),
    ("python-async",      "550e8400-e29b-41d4-a716-446655440004"),
    ("data-analysis",     "550e8400-e29b-41d4-a716-446655440005"),
    ("llm-apps",          "550e8400-e29b-41d4-a716-446655440006"),
    ("frontend-basics",   "550e8400-e29b-41d4-a716-446655440007"),
]


def _chapter_files(slug: str) -> Iterable[Path]:
    course_dir = DATA_DIR / slug
    if not course_dir.exists():
        print(f"  [SKIP] {slug} (directory missing)")
        return []
    return sorted(course_dir.glob("*.json"))


def _vector_literal(vec: list[float]) -> str:
    """Format a Python list as a pgvector literal string."""
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def seed_course_clips_table() -> tuple[int, int]:
    """Insert every disk-backed clip into `course_clips` with embeddings.

    Returns:
        (inserted, skipped) — counts.
    """
    inserted = 0
    skipped = 0
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            for slug, course_id in EXISTING_COURSES:
                for chapter_path in _chapter_files(slug):
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
                            skipped += 1
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
                        inserted += 1
                        print(
                            f"  [OK]  {slug} "
                            f"ch{clip['chapter_no']} clip{clip['clip_no']} "
                            f"— {clip['clip_title']}"
                        )
        conn.commit()
    return inserted, skipped


def main() -> None:
    print("=== Seed existing course clips (440002~440007) ===\n")
    print("Backfilling the course_clips SQL table only.")
    print("(PGVector embeddings for these slugs already exist — not touching.)\n")

    inserted, skipped = seed_course_clips_table()

    print()
    print("=== Done ===")
    print(f"  inserted: {inserted}")
    print(f"  skipped:  {skipped}")


if __name__ == "__main__":
    main()
