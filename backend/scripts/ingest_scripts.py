"""Ingest course clips and misconceptions into the vector store.

Usage (from src/backend/):
    python -m scripts.ingest_scripts
"""

import sys
from pathlib import Path

# Ensure app package is importable when run as a module
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.rag.chunker import process_course_clips, process_misconceptions
from app.rag.vectorstore import add_documents

DATA_DIR = _backend_dir / "data"
CLIPS_ROOT = DATA_DIR / "course_clips"
MISCONCEPTIONS_PATH = DATA_DIR / "misconceptions.json"

# Map directory slug → (course_id, course_title) used as RAG metadata.
# Note: older slugs below still use their slug as course_id for backwards
# compatibility with existing embeddings. New catalog courses (440008~44000e)
# use the real courses.id UUID so that course_search can be filtered by it
# and so that metadata lines up with the `courses` / `course_clips` tables.
COURSE_SLUG_META: dict[str, tuple[str, str]] = {
    "python-basics": ("python-basics", "Python 기초"),
    "backend-intro": ("backend-intro", "백엔드 개발 입문"),
    "backend-patterns": ("backend-patterns", "실무 백엔드 패턴"),
    "python-async": ("python-async", "고급 Python: 비동기와 동시성"),
    "data-analysis": ("data-analysis", "데이터 분석 입문"),
    "llm-apps": ("llm-apps", "LLM 애플리케이션 구축"),
    "frontend-basics": ("frontend-basics", "프론트엔드 기초"),
    "react-practical": (
        "550e8400-e29b-41d4-a716-446655440008",
        "리액트 실전 — 컴포넌트 설계부터 상태관리까지",
    ),
    "figma-interaction": (
        "550e8400-e29b-41d4-a716-446655440009",
        "피그마 인터랙션 디자인 마스터클래스",
    ),
    "korean-cooking": (
        "550e8400-e29b-41d4-a716-44665544000a",
        "집밥의 정석 — 한식 기본기 30가지",
    ),
    "business-english": (
        "550e8400-e29b-41d4-a716-44665544000b",
        "비즈니스 영어 이메일 & 회의 영어",
    ),
    "aws-saa": (
        "550e8400-e29b-41d4-a716-44665544000c",
        "AWS SAA 자격증 한 번에 합격하기",
    ),
    "unity-mobile-game": (
        "550e8400-e29b-41d4-a716-44665544000d",
        "유니티로 만드는 첫 모바일 게임",
    ),
    "daily-makeup": (
        "550e8400-e29b-41d4-a716-44665544000e",
        "데일리 메이크업 클래스",
    ),
}


def ingest_clips() -> int:
    """Load all chapter JSON files from every course_clips subdirectory."""
    if not CLIPS_ROOT.exists():
        print(f"[WARN] Clips root not found: {CLIPS_ROOT}")
        return 0

    course_dirs = sorted(p for p in CLIPS_ROOT.iterdir() if p.is_dir())
    if not course_dirs:
        print(f"[WARN] No course directories found in {CLIPS_ROOT}")
        return 0

    all_docs = []
    for course_dir in course_dirs:
        course_id, course_title = COURSE_SLUG_META.get(
            course_dir.name, (course_dir.name, course_dir.name)
        )
        chapter_files = sorted(course_dir.glob("*.json"))
        if not chapter_files:
            print(f"  [SKIP] {course_dir.name} (no chapter files)")
            continue

        print(f"  Course: {course_dir.name}")
        for chapter_file in chapter_files:
            print(f"    Processing {chapter_file.name}...")
            docs = process_course_clips(
                chapter_file, course_id=course_id, course_title=course_title
            )
            all_docs.extend(docs)

    if all_docs:
        print(f"  Adding {len(all_docs)} clip documents to vector store...")
        add_documents(all_docs)

    return len(all_docs)


def ingest_misconceptions() -> int:
    """Load misconceptions JSON."""
    if not MISCONCEPTIONS_PATH.exists():
        print(f"[WARN] Misconceptions file not found: {MISCONCEPTIONS_PATH}")
        return 0

    print(f"  Processing {MISCONCEPTIONS_PATH.name}...")
    docs = process_misconceptions(MISCONCEPTIONS_PATH)

    if docs:
        print(f"  Adding {len(docs)} misconception documents to vector store...")
        add_documents(docs)

    return len(docs)


def main() -> None:
    """Run the full ingestion pipeline."""
    print("=== Course Content Ingestion ===\n")

    print("[1/2] Ingesting course clips...")
    clip_count = ingest_clips()
    print(f"  → {clip_count} clip documents ingested\n")

    print("[2/2] Ingesting misconceptions...")
    misconception_count = ingest_misconceptions()
    print(f"  → {misconception_count} misconception documents ingested\n")

    total = clip_count + misconception_count
    print(f"=== Done: {total} total documents ingested ===")


if __name__ == "__main__":
    main()
