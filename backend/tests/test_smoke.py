"""Smoke test: verifies test infrastructure can talk to the real DB."""

from app.db import get_sync_connection


def test_db_connection():
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            assert cur.fetchone()[0] == 1


def test_seeded_profile_fixture_round_trips(seeded_profile):
    """The seeded_profile fixture should actually insert data we can read back."""
    user_id = seeded_profile["user_id"]
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT enrolled_courses FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            assert row is not None
            assert isinstance(row[0], list)
            assert len(row[0]) == 3

            cur.execute(
                "SELECT count(*) FROM quiz_results WHERE user_id = %s",
                (user_id,),
            )
            assert cur.fetchone()[0] == 5
