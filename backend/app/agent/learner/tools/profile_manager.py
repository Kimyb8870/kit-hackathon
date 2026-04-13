"""profile_manager tool — learner profile CRUD via psycopg2."""

import json

from langchain_core.tools import tool

from app.db import get_sync_connection

# Columns we expose to the agent. enrolled_courses is JSONB and is decoded
# into a Python list automatically by psycopg2.
_SELECT_COLS = (
    "user_id, career_goal, experience_level, available_minutes, "
    "final_goal, enrolled_courses"
)


@tool
def profile_manager(action: str, user_id: str, profile_data: str = "") -> str:
    """Manage learner profiles in the database.

    Args:
        action: One of "get", "create", or "update".
        user_id: The learner's unique identifier.
        profile_data: JSON string with profile fields for create/update.
            Accepted fields: career_goal, experience_level,
            available_minutes (int), final_goal,
            enrolled_courses (list[str] of course UUIDs).

    Returns:
        JSON string with the profile data or an error message.
        The returned object always includes ``enrolled_courses`` so the
        agent can personalize answers based on what the learner already
        owns.
    """
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            if action == "get":
                return _get_profile(cur, user_id)
            if action == "create":
                return _create_profile(cur, conn, user_id, profile_data)
            if action == "update":
                return _update_profile(cur, conn, user_id, profile_data)
            return json.dumps(
                {"error": f"Unknown action: {action}. Use get/create/update."},
                ensure_ascii=False,
            )


def _row_to_dict(row: tuple) -> dict:
    return {
        "user_id": row[0],
        "career_goal": row[1],
        "experience_level": row[2],
        "available_minutes": row[3],
        "final_goal": row[4],
        "enrolled_courses": row[5] if row[5] is not None else [],
    }


def _get_profile(cur, user_id: str) -> str:
    cur.execute(
        f"SELECT {_SELECT_COLS} FROM learner_profiles WHERE user_id = %s",
        (user_id,),
    )
    row = cur.fetchone()
    if not row:
        return json.dumps(
            {"error": "Profile not found", "user_id": user_id},
            ensure_ascii=False,
        )
    return json.dumps(_row_to_dict(row), ensure_ascii=False)


def _create_profile(cur, conn, user_id: str, profile_data: str) -> str:
    data = json.loads(profile_data) if profile_data else {}
    enrolled = data.get("enrolled_courses")
    enrolled_json = json.dumps(enrolled) if enrolled is not None else None

    cur.execute(
        "INSERT INTO learner_profiles "
        "(user_id, career_goal, experience_level, available_minutes, "
        "final_goal, enrolled_courses) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "ON CONFLICT (user_id) DO UPDATE SET "
        "career_goal = EXCLUDED.career_goal, "
        "experience_level = EXCLUDED.experience_level, "
        "available_minutes = EXCLUDED.available_minutes, "
        "final_goal = EXCLUDED.final_goal, "
        "enrolled_courses = EXCLUDED.enrolled_courses, "
        "updated_at = now() "
        f"RETURNING {_SELECT_COLS}",
        (
            user_id,
            data.get("career_goal"),
            data.get("experience_level"),
            data.get("available_minutes"),
            data.get("final_goal"),
            enrolled_json,
        ),
    )
    row = cur.fetchone()
    conn.commit()
    result = _row_to_dict(row)
    result["status"] = "created"
    return json.dumps(result, ensure_ascii=False)


def _update_profile(cur, conn, user_id: str, profile_data: str) -> str:
    data = json.loads(profile_data) if profile_data else {}
    set_clauses: list[str] = []
    values: list = []
    for field in ("career_goal", "experience_level", "available_minutes", "final_goal"):
        if field in data:
            set_clauses.append(f"{field} = %s")
            values.append(data[field])
    if "enrolled_courses" in data:
        set_clauses.append("enrolled_courses = %s")
        values.append(json.dumps(data["enrolled_courses"]))
    if not set_clauses:
        return json.dumps({"error": "No fields to update"}, ensure_ascii=False)

    set_clauses.append("updated_at = now()")
    values.append(user_id)
    cur.execute(
        f"UPDATE learner_profiles SET {', '.join(set_clauses)} "
        f"WHERE user_id = %s RETURNING {_SELECT_COLS}",
        values,
    )
    row = cur.fetchone()
    conn.commit()
    if not row:
        return json.dumps(
            {"error": "Profile not found", "user_id": user_id},
            ensure_ascii=False,
        )
    result = _row_to_dict(row)
    result["status"] = "updated"
    return json.dumps(result, ensure_ascii=False)
