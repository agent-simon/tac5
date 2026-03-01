"""
Tests for the CSV table download endpoint.
"""

import pytest
import sqlite3
from unittest.mock import patch
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def temp_db(tmp_path):
    """Provide a temporary SQLite database path for tests."""
    db_dir = tmp_path / "db"
    db_dir.mkdir()
    db_path = str(db_dir / "database.db")

    original_connect = sqlite3.connect

    def patched_connect(path, *args, **kwargs):
        if "database.db" in str(path):
            return original_connect(db_path, *args, **kwargs)
        return original_connect(path, *args, **kwargs)

    with patch("sqlite3.connect", side_effect=patched_connect):
        yield db_path


@pytest.fixture
def client(temp_db):
    """FastAPI test client with sqlite3.connect patched to use temp db."""
    original_connect = sqlite3.connect

    def patched_connect(path, *args, **kwargs):
        if "database.db" in str(path):
            return original_connect(temp_db, *args, **kwargs)
        return original_connect(path, *args, **kwargs)

    with patch("sqlite3.connect", side_effect=patched_connect):
        from server import app
        with TestClient(app) as c:
            yield c, temp_db


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def create_test_table(db_path: str, table_name: str, rows: list[tuple], columns: list[str]):
    """Create a table with given columns and rows in the test database."""
    conn = sqlite3.connect(db_path)
    col_defs = ", ".join(f"{col} TEXT" for col in columns)
    conn.execute(f"CREATE TABLE IF NOT EXISTS [{table_name}] ({col_defs})")
    if rows:
        placeholders = ", ".join("?" for _ in columns)
        conn.executemany(f"INSERT INTO [{table_name}] VALUES ({placeholders})", rows)
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestCSVDownloadEndpoint:

    def test_download_existing_table_returns_csv(self, client):
        c, db_path = client
        create_test_table(db_path, "products", [("Widget", "9.99"), ("Gadget", "19.99")], ["name", "price"])

        response = c.get("/api/table/products/download")

        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        lines = response.text.strip().splitlines()
        assert lines[0] == "name,price"
        assert "Widget" in lines[1]
        assert "Gadget" in lines[2]

    def test_download_nonexistent_table_returns_404(self, client):
        c, db_path = client

        response = c.get("/api/table/nonexistent_table/download")

        assert response.status_code == 404

    def test_download_invalid_table_name_returns_400(self, client):
        c, db_path = client
        # "SELECT" is in the sql_keywords rejection set in validate_identifier
        response = c.get("/api/table/SELECT/download")

        assert response.status_code == 400

    def test_download_empty_table_returns_header_only(self, client):
        c, db_path = client
        create_test_table(db_path, "empty_table", [], ["col_a", "col_b"])

        response = c.get("/api/table/empty_table/download")

        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        lines = response.text.strip().splitlines()
        assert len(lines) == 1
        assert lines[0] == "col_a,col_b"
