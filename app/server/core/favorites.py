import sqlite3
from datetime import datetime, timezone


def ensure_favorites_table():
    conn = sqlite3.connect("db/database.db")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS query_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_text TEXT NOT NULL,
            sql_text TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_all_favorites() -> list[dict]:
    ensure_favorites_table()
    conn = sqlite3.connect("db/database.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, query_text, sql_text, created_at FROM query_favorites ORDER BY created_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def add_favorite(query_text: str, sql_text: str) -> dict:
    ensure_favorites_table()
    if favorite_exists(query_text):
        raise ValueError(f"A favorite with query_text already exists: {query_text!r}")
    created_at = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect("db/database.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO query_favorites (query_text, sql_text, created_at) VALUES (?, ?, ?)",
        (query_text, sql_text, created_at)
    )
    conn.commit()
    row_id = cursor.lastrowid
    cursor.execute("SELECT id, query_text, sql_text, created_at FROM query_favorites WHERE id = ?", (row_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row


def delete_favorite(favorite_id: int) -> bool:
    ensure_favorites_table()
    conn = sqlite3.connect("db/database.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM query_favorites WHERE id = ?", (favorite_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def favorite_exists(query_text: str) -> bool:
    ensure_favorites_table()
    conn = sqlite3.connect("db/database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM query_favorites WHERE query_text = ? LIMIT 1", (query_text,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


# Ensure table exists at module load time
ensure_favorites_table()
