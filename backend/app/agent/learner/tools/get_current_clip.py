"""get_current_clip tool — fetch the EXACT clip the learner is watching."""

import json
import uuid as uuid_lib

import psycopg2
from langchain_core.tools import tool

from app.db import get_sync_connection


@tool
def get_current_clip(course_id: str, chapter_no: int, clip_no: int) -> str:
    """Fetch the exact lecture clip the learner is currently watching.

    Use this tool whenever the learner refers to "this part / 이 부분 /
    지금 보고 있는 것 / 방금 본 영상 / 지금 이거" AND `course_context`
    in the system prompt provides `course_id`, `chapter_no`, and `clip_no`.
    This returns the verbatim transcript and metadata of the specific clip
    so you can ground your explanation in what the learner is actually
    watching — never fall back to a semantic search when an exact clip
    pointer is available.

    If `course_id` is not a valid UUID, the tool returns an error JSON;
    do NOT pass course titles or human-readable names. When no
    `course_context.course_id` is provided, use `course_search` with the
    topic instead.

    Args:
        course_id: The UUID of the course (from course_context).
        chapter_no: The chapter number (from course_context).
        clip_no: The clip number within that chapter (from course_context).

    Returns:
        JSON string with course_title, chapter_no, clip_no, clip_title,
        timestamp, concept_id, and script_text. If no matching clip is
        found, returns a JSON error object.
    """
    # Validate UUID format up-front so we fail fast with a clear error
    # instead of letting psycopg2 raise InvalidTextRepresentation deep in
    # the agent stream (which would otherwise propagate to a 503).
    try:
        uuid_lib.UUID(str(course_id))
    except (ValueError, TypeError):
        return json.dumps(
            {
                "error": (
                    "course_id must be a UUID, not a course title or "
                    "human-readable name"
                ),
                "received": course_id,
                "hint": (
                    "Call course_search with the topic instead, or omit "
                    "get_current_clip when course_context is missing course_id."
                ),
            },
            ensure_ascii=False,
        )

    try:
        with get_sync_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        c.title          AS course_title,
                        cc.chapter_no    AS chapter_no,
                        cc.clip_no       AS clip_no,
                        cc.clip_title    AS clip_title,
                        cc.timestamp_start AS timestamp_start,
                        cc.timestamp_end   AS timestamp_end,
                        cc.concept_id      AS concept_id,
                        cc.script_text     AS script_text
                    FROM course_clips cc
                    JOIN courses c ON c.id = cc.course_id
                    WHERE cc.course_id = %s
                      AND cc.chapter_no = %s
                      AND cc.clip_no = %s
                    LIMIT 1
                    """,
                    (course_id, chapter_no, clip_no),
                )
                row = cur.fetchone()
    except psycopg2.Error as exc:
        return json.dumps(
            {
                "error": "database query failed",
                "detail": str(exc).strip(),
                "course_id": course_id,
                "chapter_no": chapter_no,
                "clip_no": clip_no,
            },
            ensure_ascii=False,
        )

    if not row:
        return json.dumps(
            {
                "error": "Clip not found",
                "course_id": course_id,
                "chapter_no": chapter_no,
                "clip_no": clip_no,
            },
            ensure_ascii=False,
        )

    timestamp_start = row[4] or ""
    timestamp_end = row[5] or ""
    if timestamp_start and timestamp_end:
        timestamp = f"{timestamp_start}-{timestamp_end}"
    else:
        timestamp = timestamp_start or timestamp_end or ""

    payload = {
        "course_title": row[0],
        "chapter_no": row[1],
        "clip_no": row[2],
        "clip_title": row[3],
        "timestamp": timestamp,
        "concept_id": row[6],
        "script_text": row[7],
        "source_type": "current_clip",
    }
    return json.dumps(payload, ensure_ascii=False)
