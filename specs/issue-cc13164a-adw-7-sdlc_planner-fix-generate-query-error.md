# Bug: Failed to generate random query

## Bug Description
When a user clicks the "Generate Query" button in the Natural Language SQL Interface, the server returns an error instead of a generated query. The error message is:

```
name 'generate_natural_language_query' is not defined
```

**Expected behavior**: Clicking "Generate Query" populates the query textarea with an interesting natural language question based on the loaded database schema.

**Actual behavior**: The endpoint raises a `NameError` and returns an error response to the frontend.

## Problem Statement
The `/api/generate-query` endpoint in `server.py` calls `generate_natural_language_query(schema_info)` on line 224, but this function is never imported into `server.py`. The function is defined and fully implemented in `core/llm_processor.py`, but the import statement on line 30 of `server.py` only imports `generate_sql` from that module.

## Solution Statement
Add `generate_natural_language_query` to the existing import from `core.llm_processor` in `server.py`. This is a one-line fix that adds the missing function name to the import statement.

## Steps to Reproduce
1. Start the application (`./scripts/start.sh`)
2. Upload any sample data (e.g., click "Upload Data" → "Users Data")
3. Click the "Generate Query" button
4. Observe the error: the query textarea remains empty and an error is returned

## Root Cause Analysis
In `app/server/server.py`, the import on line 30 reads:

```python
from core.llm_processor import generate_sql
```

The `/api/generate-query` endpoint (line 217–231) calls `generate_natural_language_query(schema_info)` directly, but `generate_natural_language_query` is not in the import list. Python raises a `NameError` at runtime when the endpoint is called.

The function `generate_natural_language_query` is correctly implemented in `app/server/core/llm_processor.py` (line 229–246) — it selects between OpenAI and Anthropic providers based on available API keys. It simply was never imported into `server.py`.

## Relevant Files

- **`app/server/server.py`** — Contains the `/api/generate-query` endpoint that calls the undefined name. The import on line 30 must be updated to include `generate_natural_language_query`.
- **`app/server/core/llm_processor.py`** — Defines `generate_natural_language_query` (line 229). No changes needed here; the function is correct.

## Step by Step Tasks

### 1. Fix the missing import in server.py
- Open `app/server/server.py`
- Find the import on line 30: `from core.llm_processor import generate_sql`
- Update it to: `from core.llm_processor import generate_sql, generate_natural_language_query`

### 2. Create an E2E test file for the generate query fix
- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_generate_query.md` to understand the E2E test format
- The existing `.claude/commands/e2e/test_generate_query.md` already covers the generate query flow, so verify it validates the exact bug fix scenario (button click → no error → textarea populated)
- Confirm the existing test steps include verifying that no error is shown after clicking "Generate Query"

### 3. Validate the fix with the E2E test
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_generate_query.md` to validate the Generate Query button works without error.

### 4. Run all validation commands
- Run the validation commands listed below to confirm zero regressions.

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_generate_query.md` to validate the Generate Query button works end-to-end without error.
- `cd app/server && uv run pytest` - Run server tests to validate the bug is fixed with zero regressions
- `cd app/client && bun tsc --noEmit` - Run frontend tests to validate the bug is fixed with zero regressions
- `cd app/client && bun run build` - Run frontend build to validate the bug is fixed with zero regressions

## Notes
- The fix is a single-line change: adding `generate_natural_language_query` to the import statement in `server.py`.
- No new dependencies are required.
- The function itself (`generate_natural_language_query` in `llm_processor.py`) is already correctly implemented and tested; this is purely a missing import.
- An E2E test file for this feature already exists at `.claude/commands/e2e/test_generate_query.md` and should be used for validation.
