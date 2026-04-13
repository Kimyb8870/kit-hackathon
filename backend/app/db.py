"""Synchronous database connection helper using psycopg2 with connection pooling."""

from contextlib import contextmanager
from typing import Iterator

import psycopg2
from psycopg2.pool import ThreadedConnectionPool

from app.config import settings

_pool: ThreadedConnectionPool | None = None


def _build_dsn() -> str:
    url = settings.DATABASE_URL
    if "sslmode" not in url:
        separator = "&" if "?" in url else "?"
        url += f"{separator}sslmode=require"
    return url


def init_pool(minconn: int = 3, maxconn: int = 10) -> None:
    """Initialize the global connection pool. Call once at app startup.

    Note: psycopg2's ThreadedConnectionPool CLOSES any connection above
    ``minconn`` when it is released back. Raising ``minconn`` lets us keep
    a few warm connections on hand so bursty traffic does not pay the
    ~0.6s Supabase TLS handshake on every request above the floor.
    """
    global _pool
    if _pool is not None:
        return
    _pool = ThreadedConnectionPool(minconn, maxconn, _build_dsn())


def close_pool() -> None:
    """Close all connections in the pool. Call at app shutdown."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


@contextmanager
def get_sync_connection() -> Iterator[psycopg2.extensions.connection]:
    """Borrow a connection from the pool; return it automatically.

    Usage:
        with get_sync_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(...)

    The connection is released back to the pool on exit. Any aborted
    transaction is rolled back so the next borrower starts clean.
    """
    if _pool is None:
        # Lazy init for safety (e.g., scripts that bypass FastAPI lifespan)
        init_pool()
    assert _pool is not None
    conn = _pool.getconn()
    try:
        yield conn
    finally:
        # Rollback any aborted transaction before returning to the pool so
        # the next borrower does not inherit a broken transaction state.
        try:
            if conn.closed == 0 and conn.status != psycopg2.extensions.STATUS_READY:
                conn.rollback()
        except Exception:
            pass
        _pool.putconn(conn)
