# Feature: Generate Natural Language Query Button

## Feature Description
Add a "Generate Query" button to the Natural Language SQL Interface that uses the LLM (via `llm_processor.py`) to generate an interesting natural language query based on the current database schema. When clicked, the generated query is inserted (always overwriting) into the query input textarea, ready for the user to review and execute manually. The button follows the same visual style as the existing "Upload Data" button (`secondary-button` CSS class).

## User Story
As a data analyst
I want to click a button that auto-generates an interesting natural language query based on my loaded data
So that I can quickly discover insights without having to think of what to ask first

## Problem Statement
Users who upload data into the application may not know what queries to run against their data. There is no guidance or inspiration for what questions to ask, which creates friction and reduces discoverability of the tool's capabilities.

## Solution Statement
Add a "Generate Query" button that calls a new `POST /api/generate-query` backend endpoint. The endpoint uses the existing LLM infrastructure in `llm_processor.py` to inspect the current database schema (via `get_database_schema()`) and generate an interesting, relevant natural language query. The query is returned and placed directly in the query input textarea, overwriting any existing text, so the user can immediately execute it or modify it before clicking the Query button.

## Relevant Files
Use these files to implement the feature:

- **`app/server/core/data_models.py`** — Add new Pydantic response model `GenerateQueryResponse` with fields `query: str` and `error: Optional[str] = None`. No request model is needed since the endpoint requires no input.
- **`app/server/core/llm_processor.py`** — Add `generate_natural_language_query(schema_info: Dict[str, Any]) -> str` function plus private helpers `_generate_nl_query_with_openai` and `_generate_nl_query_with_anthropic`, following the exact pattern of the existing `generate_sql_with_openai` / `generate_sql_with_anthropic` functions.
- **`app/server/server.py`** — Add the new `POST /api/generate-query` endpoint. Calls `get_database_schema()` (no parameters — it manages its own SQLite connection internally), checks for empty schema, then calls `generate_natural_language_query(schema_info)`.
- **`app/client/src/types.d.ts`** — Add `GenerateQueryResponse` TypeScript interface with fields `query: string` and `error?: string` to mirror the Pydantic model.
- **`app/client/src/api/client.ts`** — Add `generateQuery(): Promise<GenerateQueryResponse>` method to the `api` export object, using `apiRequest<GenerateQueryResponse>`.
- **`app/client/index.html`** — Add `<button id="generate-query-button" class="secondary-button">Generate Query</button>` immediately after the existing `upload-data-button`.
- **`app/client/src/main.ts`** — Add `initializeGenerateQueryButton()` function and call it from `DOMContentLoaded`. The handler disables the button with "Generating..." text, calls `api.generateQuery()`, overwrites the `query-input` textarea value, then restores the button.
- **`app/server/tests/core/test_llm_processor.py`** — Extend with tests for the new `generate_natural_language_query` function using the same mock patterns (`@patch('core.llm_processor.OpenAI')`, `@patch('core.llm_processor.Anthropic')`).
- **`app/server/tests/`** — Add or extend integration tests for the new `POST /api/generate-query` endpoint.
- **`.claude/commands/test_e2e.md`** — Read to understand how to author E2E test files.
- **`.claude/commands/e2e/test_basic_query.md`** — Read as a reference example for E2E test file format and structure.

### New Files
- **`.claude/commands/e2e/test_generate_query.md`** — E2E test file for the Generate Query button feature

## Implementation Plan
### Phase 1: Foundation
Add the `GenerateQueryResponse` Pydantic model to `data_models.py` and implement the `generate_natural_language_query` function in `llm_processor.py`. This is the foundational work that the backend endpoint depends on.

### Phase 2: Core Implementation
Implement the `POST /api/generate-query` backend endpoint in `server.py`, add the TypeScript interface to `types.d.ts`, add the `generateQuery()` API client method to `client.ts`, add the button to `index.html`, and wire up the click handler in `main.ts`.

### Phase 3: Integration
Add server-side unit tests for the new LLM function and endpoint, run validation commands to confirm zero regressions end-to-end.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create the E2E Test File
- Read `.claude/commands/test_e2e.md` to understand the E2E test runner format and how tests are executed
- Read `.claude/commands/e2e/test_basic_query.md` as a reference for the E2E test file format
- Create `.claude/commands/e2e/test_generate_query.md` with the following test steps:
  - Navigate to the Application URL
  - Take a screenshot of the initial page state
  - Verify the "Generate Query" button is visible in the query controls section
  - Open the Upload Data modal and load the "Users" sample data (so the DB has schema to generate from)
  - Close the modal and verify the "users" table appears in Available Tables
  - Take a screenshot showing the loaded data
  - Click the "Generate Query" button
  - Wait for the query input textarea to be populated (button text returns to "Generate Query")
  - Take a screenshot showing the populated query input field
  - Verify the query input field contains a non-empty string
  - Click the "Query" button to execute the generated query
  - Verify results section appears with SQL and results
  - Take a screenshot of the results
- Success criteria:
  - "Generate Query" button is present with `secondary-button` class
  - After clicking, the query textarea is populated with a non-empty natural language query
  - The generated query, when executed via the Query button, returns results without error
  - 4 screenshots are taken

### Step 2: Add Pydantic Response Model to `data_models.py`
- Open `app/server/core/data_models.py`
- Add `GenerateQueryResponse` model after `QueryResponse`:
  ```python
  class GenerateQueryResponse(BaseModel):
      query: str
      error: Optional[str] = None
  ```

### Step 3: Add LLM Function to `llm_processor.py`
- Open `app/server/core/llm_processor.py`
- Add private helper `_generate_nl_query_with_openai(schema_info: Dict[str, Any]) -> str`:
  - Checks `OPENAI_API_KEY` env var, raises `ValueError` if missing
  - Constructs a prompt using `format_schema_for_prompt(schema_info)` (already exists)
  - Prompt instructs the LLM to return a single interesting, specific natural language question a data analyst would ask — no SQL, just plain English
  - Suggests variety: aggregations, filters, top-N, time-based, comparisons
  - Must instruct to return ONLY the question text with no preamble
  - Calls `client.chat.completions.create(model="gpt-4.1-mini", temperature=0.8, max_tokens=100)`
  - Returns `response.choices[0].message.content.strip()`
- Add private helper `_generate_nl_query_with_anthropic(schema_info: Dict[str, Any]) -> str`:
  - Same pattern but uses `ANTHROPIC_API_KEY` and `client.messages.create(model="claude-3-haiku-20240307", max_tokens=100, temperature=0.8)`
  - Returns `response.content[0].text.strip()`
- Add public function `generate_natural_language_query(schema_info: Dict[str, Any]) -> str`:
  - Same API key priority logic as existing `generate_sql`: OpenAI key → Anthropic key → raise
  - Wraps in try/except, re-raises with `f"Error generating natural language query: {str(e)}"`

### Step 4: Add Backend Endpoint to `server.py`
- Open `app/server/server.py`
- Add `GenerateQueryResponse` to the import from `core.data_models`
- Add `generate_natural_language_query` to the import from `core.llm_processor`
- Add `POST /api/generate-query` endpoint:
  ```python
  @app.post("/api/generate-query", response_model=GenerateQueryResponse)
  async def generate_query() -> GenerateQueryResponse:
      try:
          schema_info = get_database_schema()
          if not schema_info.get('tables'):
              return GenerateQueryResponse(query="", error="No tables found. Please upload data first.")
          result = generate_natural_language_query(schema_info)
          if not result:
              return GenerateQueryResponse(query="", error="LLM returned an empty response. Please try again.")
          logger.info(f"[SUCCESS] Generated query: {result}")
          return GenerateQueryResponse(query=result)
      except Exception as e:
          logger.error(f"[ERROR] Generate query failed: {str(e)}")
          return GenerateQueryResponse(query="", error=str(e))
  ```

### Step 5: Add TypeScript Interface to `types.d.ts`
- Open `app/client/src/types.d.ts`
- Add `GenerateQueryResponse` interface after `QueryResponse`:
  ```typescript
  interface GenerateQueryResponse {
    query: string;
    error?: string;
  }
  ```

### Step 6: Add API Client Method to `client.ts`
- Open `app/client/src/api/client.ts`
- Add `generateQuery()` method to the `api` export object:
  ```typescript
  async generateQuery(): Promise<GenerateQueryResponse> {
    return apiRequest<GenerateQueryResponse>('/generate-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
  },
  ```

### Step 7: Add the Button to `index.html`
- Open `app/client/index.html`
- Locate `<button id="upload-data-button" class="secondary-button">Upload Data</button>` inside `.query-controls`
- Add the new button immediately after it:
  ```html
  <button id="generate-query-button" class="secondary-button">Generate Query</button>
  ```

### Step 8: Wire Up the Event Handler in `main.ts`
- Open `app/client/src/main.ts`
- Add `initializeGenerateQueryButton()` function call inside the `DOMContentLoaded` listener (after `initializeModal()`)
- Implement `initializeGenerateQueryButton()`:
  ```typescript
  function initializeGenerateQueryButton() {
    const generateQueryButton = document.getElementById('generate-query-button') as HTMLButtonElement;
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;

    generateQueryButton.addEventListener('click', async () => {
      generateQueryButton.disabled = true;
      generateQueryButton.textContent = 'Generating...';

      try {
        const response = await api.generateQuery();
        if (response.error) {
          displayError(response.error);
        } else if (response.query) {
          queryInput.value = response.query;
        } else {
          displayError('No query was generated. Please try again.');
        }
      } catch (error) {
        displayError(error instanceof Error ? error.message : 'Failed to generate query');
      } finally {
        generateQueryButton.disabled = false;
        generateQueryButton.textContent = 'Generate Query';
      }
    });
  }
  ```

### Step 9: Add Server-Side Tests
- Open `app/server/tests/core/test_llm_processor.py`
- Add tests for `generate_natural_language_query` and its private helpers using the same `@patch` patterns as existing tests:
  - `test_generate_nl_query_with_openai_success` — mock OpenAI client, verify `temperature=0.8`, `max_tokens=100`, returns stripped text
  - `test_generate_nl_query_with_openai_no_api_key` — verify `ValueError` raised when `OPENAI_API_KEY` missing
  - `test_generate_nl_query_with_anthropic_success` — mock Anthropic client, verify `temperature=0.8`, `max_tokens=100`
  - `test_generate_nl_query_with_anthropic_no_api_key` — verify `ValueError` raised when `ANTHROPIC_API_KEY` missing
  - `test_generate_natural_language_query_openai_priority` — when OpenAI key exists, OpenAI helper is called
  - `test_generate_natural_language_query_anthropic_fallback` — when only Anthropic key exists, Anthropic helper is called
- Optionally add an integration test for the `POST /api/generate-query` endpoint using FastAPI `TestClient`

### Step 10: Run Validation Commands
- Execute all validation commands listed below to confirm zero regressions

## Testing Strategy
### Unit Tests
- **Backend LLM function**: Mock `OpenAI` and `Anthropic` classes to test `_generate_nl_query_with_openai` and `_generate_nl_query_with_anthropic`. Verify `temperature=0.8` and `max_tokens=100` are used (distinct from the SQL generation values of `0.1`/`500`).
- **Backend endpoint**: Use FastAPI `TestClient` to test `POST /api/generate-query`. Mock `get_database_schema` and `generate_natural_language_query` to cover: happy path (query returned), no-tables path (error response), LLM exception path (error response).
- **Frontend**: TypeScript compiler (`bun tsc --noEmit`) catches type errors in the new interface and its usage in `main.ts` and `client.ts`.

### Edge Cases
- No tables in database: endpoint returns `{"query": "", "error": "No tables found. Please upload data first."}` — frontend displays error via `displayError()`
- LLM API key not set: endpoint catches the exception and returns a meaningful `error` field
- LLM returns empty string: frontend checks `response.query` truthiness before setting textarea; shows error if falsy
- User has text already in the textarea: always overwrite (per requirements)
- Button clicked while still loading: button is disabled during the request, preventing double-clicks

## Acceptance Criteria
- A "Generate Query" button appears in the UI immediately after the "Upload Data" button, using `secondary-button` CSS class for identical styling
- Clicking the button disables it and shows "Generating..." text while the API call is in progress
- On success, the query textarea is always overwritten with the returned natural language query
- If no data is loaded, a friendly error message is displayed via `displayError()` without crashing
- If the LLM returns an error, the error is shown via `displayError()`
- The generated query, when executed via the existing Query button, returns meaningful results
- Server-side unit tests pass for the new LLM function (`temperature=0.8`, `max_tokens=100`)
- TypeScript compiles without errors (`bun tsc --noEmit`)
- Frontend build succeeds (`bun run build`)
- E2E test passes: button visible, textarea populated, query executes successfully

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_generate_query.md` to validate the Generate Query button feature end-to-end
- `cd /home/sam/work/tac/tac-5/app/server && uv run pytest` - Run server tests to validate the feature works with zero regressions
- `cd /home/sam/work/tac/tac-5/app/client && bun tsc --noEmit` - Run frontend TypeScript checks to validate with zero regressions
- `cd /home/sam/work/tac/tac-5/app/client && bun run build` - Run frontend build to validate the feature works with zero regressions

## Notes
- The `generate_natural_language_query` function intentionally uses a higher temperature (`0.8`) than `generate_sql` (`0.1`) to produce varied and interesting queries on each button click — this makes the feature more useful as users can click repeatedly to get different suggestions
- The feature intentionally does NOT auto-execute the generated query — the user must click the Query button themselves, preserving user control and allowing review/modification
- `get_database_schema()` manages its own SQLite connection internally (no connection parameter) — the endpoint can call it directly without any connection setup or teardown
- The existing `format_schema_for_prompt()` helper in `llm_processor.py` is reused directly in the new LLM helpers, keeping the prompt format consistent
- Button placement after "Upload Data" groups data-related actions together logically in the `query-controls` div
- The `_generate_nl_query_with_openai` / `_generate_nl_query_with_anthropic` naming follows the existing `generate_sql_with_openai` / `generate_sql_with_anthropic` convention
- Future enhancement: clicking the button multiple times always gets a fresh LLM query (already supported since each call is independent)
