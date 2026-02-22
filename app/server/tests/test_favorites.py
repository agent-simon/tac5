"""
Tests for the query favorites feature — core module and API endpoints.
"""

import pytest
import sqlite3
import tempfile
import os
from unittest.mock import patch
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def temp_db(tmp_path):
    """Provide a temporary SQLite database path, patched into favorites module."""
    db_dir = tmp_path / "db"
    db_dir.mkdir()
    db_path = str(db_dir / "database.db")

    # Patch sqlite3.connect calls inside the favorites module so they use our temp db.
    original_connect = sqlite3.connect

    def patched_connect(path, *args, **kwargs):
        if "database.db" in str(path):
            return original_connect(db_path, *args, **kwargs)
        return original_connect(path, *args, **kwargs)

    with patch("sqlite3.connect", side_effect=patched_connect):
        import importlib
        import core.favorites as fav_module
        # Re-run ensure_favorites_table against our temp db
        fav_module.ensure_favorites_table()
        yield db_path, fav_module


# ---------------------------------------------------------------------------
# Core Module Tests
# ---------------------------------------------------------------------------

class TestFavoritesModule:

    def test_ensure_favorites_table_creates_table(self, temp_db):
        db_path, fav = temp_db
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='query_favorites'")
        result = cursor.fetchone()
        conn.close()
        assert result is not None, "query_favorites table should exist after ensure_favorites_table()"

    def test_add_favorite_returns_dict_with_all_fields(self, temp_db):
        _, fav = temp_db
        row = fav.add_favorite("Show me all users", "SELECT * FROM users")
        assert isinstance(row, dict)
        assert "id" in row
        assert row["query_text"] == "Show me all users"
        assert row["sql_text"] == "SELECT * FROM users"
        assert "created_at" in row

    def test_get_all_favorites_returns_inserted_row(self, temp_db):
        _, fav = temp_db
        fav.add_favorite("Show me all users", "SELECT * FROM users")
        rows = fav.get_all_favorites()
        assert len(rows) == 1
        assert rows[0]["query_text"] == "Show me all users"

    def test_favorite_exists_true_after_adding(self, temp_db):
        _, fav = temp_db
        fav.add_favorite("Show me all users", "SELECT * FROM users")
        assert fav.favorite_exists("Show me all users") is True

    def test_favorite_exists_false_before_adding(self, temp_db):
        _, fav = temp_db
        assert fav.favorite_exists("nonexistent query") is False

    def test_delete_favorite_returns_true_when_found(self, temp_db):
        _, fav = temp_db
        row = fav.add_favorite("Show me all users", "SELECT * FROM users")
        result = fav.delete_favorite(row["id"])
        assert result is True

    def test_delete_favorite_returns_false_when_not_found(self, temp_db):
        _, fav = temp_db
        result = fav.delete_favorite(99999)
        assert result is False

    def test_delete_favorite_removes_row(self, temp_db):
        _, fav = temp_db
        row = fav.add_favorite("Show me all users", "SELECT * FROM users")
        fav.delete_favorite(row["id"])
        rows = fav.get_all_favorites()
        assert len(rows) == 0

    def test_duplicate_query_text_raises_value_error(self, temp_db):
        _, fav = temp_db
        fav.add_favorite("Show me all users", "SELECT * FROM users")
        with pytest.raises(ValueError):
            fav.add_favorite("Show me all users", "SELECT * FROM users")

    def test_get_all_favorites_ordered_by_created_at_desc(self, temp_db):
        _, fav = temp_db
        fav.add_favorite("First query", "SELECT 1")
        fav.add_favorite("Second query", "SELECT 2")
        rows = fav.get_all_favorites()
        # Most recently added should come first
        assert rows[0]["query_text"] == "Second query"
        assert rows[1]["query_text"] == "First query"


# ---------------------------------------------------------------------------
# API Endpoint Tests
# ---------------------------------------------------------------------------

@pytest.fixture
def client(temp_db):
    """FastAPI test client with favorites module patched to use temp db."""
    db_path, _ = temp_db
    original_connect = sqlite3.connect

    def patched_connect(path, *args, **kwargs):
        if "database.db" in str(path):
            return original_connect(db_path, *args, **kwargs)
        return original_connect(path, *args, **kwargs)

    with patch("sqlite3.connect", side_effect=patched_connect):
        from server import app
        with TestClient(app) as c:
            yield c


class TestFavoritesAPI:

    def test_get_favorites_returns_200_empty(self, client):
        response = client.get("/api/favorites")
        assert response.status_code == 200
        data = response.json()
        assert data["favorites"] == []
        assert data["total"] == 0
        assert data["error"] is None

    def test_post_favorite_returns_200_with_item(self, client):
        response = client.post("/api/favorites", json={
            "query_text": "Show me all users",
            "sql_text": "SELECT * FROM users"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["already_exists"] is False
        assert data["favorite"]["query_text"] == "Show me all users"
        assert data["error"] is None

    def test_post_duplicate_returns_already_exists(self, client):
        client.post("/api/favorites", json={
            "query_text": "Show me all users",
            "sql_text": "SELECT * FROM users"
        })
        response = client.post("/api/favorites", json={
            "query_text": "Show me all users",
            "sql_text": "SELECT * FROM users"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["already_exists"] is True

    def test_delete_favorite_returns_deleted_true(self, client):
        post_resp = client.post("/api/favorites", json={
            "query_text": "Show me all users",
            "sql_text": "SELECT * FROM users"
        })
        favorite_id = post_resp.json()["favorite"]["id"]
        response = client.delete(f"/api/favorites/{favorite_id}")
        assert response.status_code == 200
        assert response.json()["deleted"] is True

    def test_delete_nonexistent_favorite_returns_deleted_false(self, client):
        response = client.delete("/api/favorites/99999")
        assert response.status_code == 200
        assert response.json()["deleted"] is False

    def test_get_favorites_after_post_returns_item(self, client):
        client.post("/api/favorites", json={
            "query_text": "Show me all users",
            "sql_text": "SELECT * FROM users"
        })
        response = client.get("/api/favorites")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["favorites"][0]["query_text"] == "Show me all users"
