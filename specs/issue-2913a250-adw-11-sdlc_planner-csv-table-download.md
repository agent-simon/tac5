# Feature: CSV Table Download

## Feature Description
Allow users to export any available SQLite table as a CSV file directly from the UI. A download button will appear next to each table in the "Available Tables" section. Clicking it triggers an HTTP request to a new backend endpoint that streams the full table contents as a properly-formatted CSV file with the table name as the filename.

## User Story
As a data analyst using the Natural Language SQL Interface
I want to download any available table as a CSV file
So that I can use the data in external tools (Excel, Pandas, BI tools) without re-uploading it elsewhere

## Problem Statement
Users upload CSV/JSON data, run queries, and gain insights — but have no way to retrieve the underlying table data back out of the application. If a user wants to share, back up, or further process a table in an external tool, they are stuck. The only current export path is the query results display, which only shows what the last SQL query returned, not the full table.

## Solution Statement
Add a `GET /api/table/{table_name}/download` backend endpoint that:
- Validates the table name for SQL injection safety using the existing `sql_security` module
- Queries all rows from the table using the existing safe query execution utilities
- Streams back the full table as a CSV file with correct HTTP headers for browser download

On the frontend, add a small download button (⬇) to each table card in the Available Tables section. Clicking the button navigates directly to the download endpoint URL, triggering a browser file download with the table name as the filename (e.g., `products.csv`).

No new libraries are required — Python's built-in `csv` and `io` modules handle CSV generation, and FastAPI's `StreamingResponse` handles streaming the file to the client.

## Relevant Files
Use these files to implement the feature:

- **`app/server/server.py`** — Add the new `GET /api/table/{table_name}/download` endpoint here, following the exact same patterns as the existing `delete_table` endpoint (validate identifier, check table exists, use `execute_query_safely`)
- **`app/server/core/data_models.py`** — No new Pydantic models needed; the endpoint returns a `StreamingResponse`, not a JSON model
- **`app/server/core/sql_security.py`** — Use `validate_identifier`, `check_table_exists`, and `execute_query_safely` to securely retrieve the table data
- **`app/server/core/sql_processor.py`** — Reference for how to connect to `db/database.db` and execute safe queries
- **`app/server/tests/core/test_file_processor.py`** — Reference for test structure (pytest class, fixtures, in-memory DB patching)
- **`app/client/src/main.ts`** — Add download button to the `displayTables()` function's per-table DOM construction; add `downloadTable()` helper function
- **`app/client/src/api/client.ts`** — No changes needed; the download uses a direct browser URL navigation, not a JSON API call
- **`app/client/src/types.d.ts`** — No new types needed
- **`app/client/index.html`** — No changes needed
- **`app/client/src/style.css`** — Add `.download-table-button` style consistent with existing `.remove-table-button`

Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand how to create the E2E test file.

### New Files
- **`app/server/tests/test_csv_download.py`** — Unit tests for the new download endpoint
- **`.claude/commands/e2e/test_csv_download.md`** — E2E test to validate the CSV download feature works end-to-end

## Implementation Plan
### Phase 1: Foundation
Implement the backend endpoint with full security validation, correct CSV streaming, and unit tests. This establishes the API contract before any frontend work begins.

### Phase 2: Core Implementation
Add the frontend download button to each table card in the Available Tables section, wiring it to the backend endpoint via a browser URL navigation (simplest, most reliable approach for file downloads).

### Phase 3: Integration
Create the E2E test file that uploads sample data, finds the download button, triggers a download, and validates the network request returned a CSV response. Run all validation commands to confirm zero regressions.

## Step by Step Tasks

### Step 1: Read the E2E test infrastructure
- Read `.claude/commands/test_e2e.md` to understand how E2E tests are executed
- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_file_upload.md` to understand the E2E test format and conventions

### Step 2: Create the E2E test file
- Create `.claude/commands/e2e/test_csv_download.md` with these steps:
  1. Navigate to the Application URL
  2. Load the "Products" sample data via the Upload Data modal (data-sample="products" button)
  3. Take a screenshot of the Available Tables section showing the `products` table
  4. Verify a `.download-table-button` element is visible inside the `products` table card
  5. Intercept the network request by listening for the `/api/table/products/download` URL
  6. Click the download button (`.download-table-button`) for the `products` table
  7. Verify that a network request was made to `/api/table/products/download`
  8. Verify the response has `Content-Type: text/csv`
  9. Verify the response body starts with CSV header columns (e.g., contains a comma-separated header line)
  10. Take a screenshot showing the download was triggered successfully
- Success criteria: download button is visible per table, clicking it triggers a GET to `/api/table/{name}/download`, and the response is valid CSV

### Step 3: Implement the backend download endpoint
- Open `app/server/server.py`
- Add imports at the top: `from fastapi.responses import StreamingResponse` and `import csv` and `import io`
- Add the new endpoint after the existing `delete_table` endpoint:

```python
@app.get("/api/table/{table_name}/download")
async def download_table_as_csv(table_name: str):
    """Download a table as a CSV file"""
    try:
        # Validate table name using security module
        try:
            validate_identifier(table_name, "table")
        except SQLSecurityError as e:
            raise HTTPException(400, str(e))

        conn = sqlite3.connect("db/database.db")

        # Check if table exists using secure method
        if not check_table_exists(conn, table_name):
            conn.close()
            raise HTTPException(404, f"Table '{table_name}' not found")

        # Fetch all rows safely
        cursor = execute_query_safely(
            conn,
            "SELECT * FROM {table}",
            identifier_params={'table': table_name}
        )
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description] if cursor.description else []
        conn.close()

        # Generate CSV in-memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(column_names)
        for row in rows:
            writer.writerow(list(row))
        output.seek(0)

        logger.info(f"[SUCCESS] CSV download: table={table_name}, rows={len(rows)}")
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={table_name}.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] CSV download failed: {str(e)}")
        logger.error(f"[ERROR] Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(500, f"Error downloading table: {str(e)}")
```

### Step 4: Write unit tests for the download endpoint
- Create `app/server/tests/test_csv_download.py`
- Use `pytest` with `TestClient` from `starlette.testclient` or `httpx.AsyncClient` (follow patterns from `tests/test_favorites.py`)
- Test cases:
  - `test_download_existing_table_returns_csv` — upload a table, call the endpoint, verify `Content-Type: text/csv`, verify CSV body has correct header row and data rows
  - `test_download_nonexistent_table_returns_404` — call endpoint with a table that doesn't exist, verify 404
  - `test_download_invalid_table_name_returns_400` — call endpoint with an invalid identifier (e.g., `"DROP TABLE"`), verify 400
  - `test_download_empty_table_returns_header_only` — create an empty table, call endpoint, verify only header row is returned

### Step 5: Add the download button to the frontend
- Open `app/client/src/main.ts`
- In the `displayTables()` function, after the `removeButton` is created, add a new `downloadButton`:

```typescript
const downloadButton = document.createElement('button');
downloadButton.className = 'download-table-button';
downloadButton.innerHTML = '&#8675;';  // ⬇ downward arrow
downloadButton.title = 'Download as CSV';
downloadButton.onclick = () => downloadTable(table.name);
```

- Insert `downloadButton` into `tableLeft` (or `tableHeader`) right before `removeButton`
- Add the `downloadTable` helper function:

```typescript
function downloadTable(tableName: string) {
  const link = document.createElement('a');
  link.href = `/api/table/${encodeURIComponent(tableName)}/download`;
  link.download = `${tableName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### Step 6: Add CSS for the download button
- Open `app/client/src/style.css`
- Add `.download-table-button` styles modeled after `.remove-table-button`:
  - Same sizing, border-radius, cursor
  - Use a neutral color (e.g., `var(--border-color)` background, hover to `var(--primary-color)`)
  - Positioned inline next to the table name/info and before the remove button

### Step 7: Run the validation commands
- Run all commands listed in the Validation Commands section in order
- Fix any failures before considering the feature complete

## Testing Strategy
### Unit Tests
- **`test_download_existing_table_returns_csv`**: Create a test table with known data, call `GET /api/table/{name}/download`, verify 200 status, `text/csv` content type, correct CSV header row, and correct data rows
- **`test_download_nonexistent_table_returns_404`**: Call endpoint for a table that doesn't exist, verify HTTP 404
- **`test_download_invalid_table_name_returns_400`**: Call endpoint with SQL-injection-style names, verify HTTP 400 and that the security module rejected the request
- **`test_download_empty_table_returns_header_only`**: Create a table with columns but no rows, verify only the header CSV line is returned

### Edge Cases
- Table with zero rows — must return CSV with just the header row, not an error
- Table with special characters in column names (e.g., underscores, numbers) — must produce valid CSV column headers
- Very large tables — `StreamingResponse` streams content to avoid memory issues; test with a table of 1000+ rows
- Invalid/SQL-injection table name in the URL (e.g., `; DROP TABLE`) — must be rejected by `validate_identifier` with a 400 response
- Table name encoding in URL (e.g., names with underscores) — `encodeURIComponent` on the frontend handles this correctly

## Acceptance Criteria
- Each table card in the "Available Tables" section displays a download button (⬇) alongside the existing remove (×) button
- Clicking the download button triggers a browser file download named `{table_name}.csv`
- The downloaded CSV file contains the correct column headers (first line) followed by all data rows
- Tables with zero rows produce a CSV file with just the header row (no error)
- Attempting to download a non-existent table returns HTTP 404
- Attempting to download a table with an invalid name (SQL injection attempt) returns HTTP 400
- All existing server unit tests continue to pass
- Frontend TypeScript compiles with zero errors (`bun tsc --noEmit`)
- Frontend build succeeds (`bun run build`)
- E2E test `.claude/commands/e2e/test_csv_download.md` passes successfully

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_csv_download.md` to validate the CSV download feature works end-to-end
- `cd app/server && uv run pytest` — Run all server tests to validate zero regressions including the new CSV download tests
- `cd app/client && bun tsc --noEmit` — Validate TypeScript compiles without errors
- `cd app/client && bun run build` — Validate the frontend build succeeds

## Notes
- **No new dependencies**: Python's `csv`, `io`, and FastAPI's `StreamingResponse` are all already available. No `uv add` required.
- **Security**: The download endpoint reuses the same `validate_identifier` + `check_table_exists` + `execute_query_safely` pattern already used in `delete_table`. This ensures consistent SQL injection protection.
- **Frontend download pattern**: Using a programmatically-created `<a>` element with a `download` attribute is the standard browser-native approach for triggering file downloads. It avoids CORS issues and works with the existing Vite proxy in development.
- **CSV encoding**: Python's built-in `csv.writer` handles quoting, commas in values, and newlines automatically. No need for manual escaping.
- **Streaming vs. in-memory**: For this use case, the table data is already fetched into memory via `cursor.fetchall()` before writing CSV. For very large tables, a true streaming approach (yielding rows one at a time) could be considered as a future enhancement.
- **Future enhancement**: A "Download Results as CSV" button on the query results section could be added separately to let users export only the filtered results of a query.
