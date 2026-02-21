# Feature: Random Natural Language Query Button

## Feature Description
Add a "Random Query" button to the query input section that, when clicked, uses the LLM (via `llm_processor.py`) to generate an interesting natural language query based on the current database schema and tables. The generated query is populated into the query input field, always overwriting any existing content. The button uses the same visual style as the "Upload Data" button (secondary-button).

## User Story
As a user of the Natural Language SQL Interface
I want to click a button that generates a random, interesting natural language query based on my loaded data
So that I can discover useful query ideas, explore my data more easily, and get started quickly without having to think of queries myself

## Problem Statement
Users often face a blank input field and don't know what queries to ask about their data. This leads to friction in exploring and understanding their dataset. There is no guided discovery or inspiration mechanism to help users uncover the value in their data.

## Solution Statement
Introduce a "Random Query" button in the query controls area, styled like the existing "Upload Data" button. When clicked, it calls a new backend endpoint `GET /api/suggest-query` that fetches the current database schema and uses the existing LLM integration (`llm_processor.py`) to generate an interesting, contextually appropriate natural language query. The generated query text is then placed into the query input field, ready for the user to execute or modify.

## Relevant Files

- **`app/client/index.html`** — Add the new "Random Query" button inside the `query-controls` div, adjacent to the existing "Upload Data" button. Use `secondary-button` class to match the Upload Data button style.
- **`app/client/src/main.ts`** — Add initialization logic for the new button: handle click events, call the API, and populate the query input field.
- **`app/client/src/api/client.ts`** — Add a new `suggestQuery()` method to the `api` object that calls `GET /api/suggest-query`.
- **`app/server/server.py`** — Add the new `GET /api/suggest-query` endpoint that retrieves the current schema and delegates to `llm_processor.py`.
- **`app/server/core/llm_processor.py`** — Add a new `generate_nl_query(schema_info)` function that uses the LLM to produce an interesting natural language query suggestion based on the schema.
- **`app/server/core/data_models.py`** — Add `SuggestQueryResponse` Pydantic model with a `suggested_query: str` field and optional `error`.
- **`app/server/tests/`** — Add unit tests for the new `generate_nl_query` function and the new endpoint.
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand how to create an E2E test file.

### New Files
- **`.claude/commands/e2e/test_nlq_button.md`** — E2E test file for the Random Query button feature.

## Implementation Plan

### Phase 1: Foundation
- Add the `SuggestQueryResponse` data model to `data_models.py`
- Add the `generate_nl_query()` function to `llm_processor.py` using the existing LLM routing pattern

### Phase 2: Core Implementation
- Add the `GET /api/suggest-query` endpoint to `server.py`
- Add the `suggestQuery()` API method to `api/client.ts`

### Phase 3: Integration
- Add the "Random Query" button to `index.html`
- Wire up the button click handler in `main.ts` to call the API and populate the query textarea
- Write unit tests and create the E2E test file

## Step by Step Tasks

### Step 1: Create E2E Test File
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand the E2E test format
- Create `.claude/commands/e2e/test_nlq_button.md` with the following test steps:
  - Load sample Users data via the Upload Data button to ensure tables exist
  - Click the "Random Query" button
  - Verify the query input field is populated with a non-empty string
  - Take a screenshot showing the populated query field
  - Click the "Query" button to execute the generated query
  - Verify results appear (SQL and results section is visible)
  - Take a screenshot of the results
  - Click "Random Query" again
  - Verify the query field content has been overwritten with a new query (may differ from first)
  - Take a screenshot of the second generated query

### Step 2: Add SuggestQueryResponse data model
- Open `app/server/core/data_models.py`
- Add after the existing `QueryResponse` model:
  ```python
  class SuggestQueryResponse(BaseModel):
      suggested_query: str
      error: Optional[str] = None
  ```

### Step 3: Add generate_nl_query to llm_processor.py
- Open `app/server/core/llm_processor.py`
- Add a new function `generate_nl_query_with_openai(schema_info: Dict[str, Any]) -> str` that:
  - Uses the `format_schema_for_prompt()` helper
  - Prompts the LLM: "Given this database schema, generate ONE interesting, specific, and insightful natural language query that a data analyst would ask. Return ONLY the query text, no explanations."
  - Cleans and returns the text response
- Add a new function `generate_nl_query_with_anthropic(schema_info: Dict[str, Any]) -> str` using the same pattern
- Add a routing function `generate_nl_query(schema_info: Dict[str, Any]) -> str` that uses the same key-priority logic as `generate_sql()` (OpenAI first, then Anthropic)

### Step 4: Add /api/suggest-query endpoint to server.py
- Open `app/server/server.py`
- Import `SuggestQueryResponse` from `core.data_models`
- Import `generate_nl_query` from `core.llm_processor`
- Add a new `GET /api/suggest-query` endpoint:
  ```python
  @app.get("/api/suggest-query", response_model=SuggestQueryResponse)
  async def suggest_query() -> SuggestQueryResponse:
      """Generate an interesting natural language query based on the current database schema"""
      try:
          schema_info = get_database_schema()
          if not schema_info.get('tables'):
              return SuggestQueryResponse(
                  suggested_query="",
                  error="No tables available. Please upload data first."
              )
          suggested = generate_nl_query(schema_info)
          logger.info(f"[SUCCESS] Suggested query generated: {suggested}")
          return SuggestQueryResponse(suggested_query=suggested)
      except Exception as e:
          logger.error(f"[ERROR] Suggest query failed: {str(e)}")
          return SuggestQueryResponse(suggested_query="", error=str(e))
  ```

### Step 5: Add suggestQuery() to api/client.ts
- Open `app/client/src/api/client.ts`
- Add a new method to the `api` export object:
  ```typescript
  async suggestQuery(): Promise<SuggestQueryResponse> {
      return apiRequest<SuggestQueryResponse>('/suggest-query');
  }
  ```
- Add `SuggestQueryResponse` interface to `app/client/src/types.d.ts` (or wherever the TypeScript types are defined):
  ```typescript
  interface SuggestQueryResponse {
      suggested_query: string;
      error?: string;
  }
  ```

### Step 6: Add Random Query button to index.html
- Open `app/client/index.html`
- In the `query-controls` div, add a new button after the "Upload Data" button:
  ```html
  <button id="random-query-button" class="secondary-button">Random Query</button>
  ```

### Step 7: Wire up button in main.ts
- Open `app/client/src/main.ts`
- In the `initializeQueryInput()` function (or a new `initializeRandomQuery()` function called from `DOMContentLoaded`), add:
  ```typescript
  function initializeRandomQuery() {
    const randomQueryButton = document.getElementById('random-query-button') as HTMLButtonElement;
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;

    randomQueryButton.addEventListener('click', async () => {
      randomQueryButton.disabled = true;
      randomQueryButton.innerHTML = '<span class="loading"></span>';

      try {
        const response = await api.suggestQuery();
        if (response.error) {
          displayError(response.error);
        } else {
          queryInput.value = response.suggested_query;
          queryInput.focus();
        }
      } catch (error) {
        displayError(error instanceof Error ? error.message : 'Failed to generate query');
      } finally {
        randomQueryButton.disabled = false;
        randomQueryButton.textContent = 'Random Query';
      }
    });
  }
  ```
- Call `initializeRandomQuery()` inside the `DOMContentLoaded` event handler

### Step 8: Add unit tests
- Open `app/server/tests/` and add or extend a test file (e.g., `test_suggest_query.py`) with:
  - A test for `generate_nl_query()` that mocks the LLM API and verifies the output is a non-empty string
  - A test for the `/api/suggest-query` endpoint using FastAPI `TestClient`:
    - When no tables exist: returns `error` field
    - When tables exist (mock schema): returns a `suggested_query` string

### Step 9: Run Validation Commands
- Execute all validation commands listed in the Validation Commands section

## Testing Strategy

### Unit Tests
- Test `generate_nl_query_with_openai()` and `generate_nl_query_with_anthropic()` with mocked LLM responses to confirm they extract and clean the query text correctly
- Test the `/api/suggest-query` endpoint:
  - When the database has no tables → returns an error response
  - When tables exist (mock `get_database_schema`) → returns a non-empty `suggested_query`
- Test that the routing logic in `generate_nl_query()` prefers OpenAI when `OPENAI_API_KEY` is set

### Edge Cases
- No tables loaded: button returns a user-friendly error, input field is NOT cleared
- LLM returns empty or whitespace string: display error message
- LLM API is unavailable / raises an exception: display error, leave input unchanged
- Button is clicked while a request is already in flight: button is disabled, preventing double-submission
- Query field has existing content: it is always overwritten on success

## Acceptance Criteria
- [ ] A "Random Query" button appears in the query controls section, visually matching the "Upload Data" button (secondary-button style)
- [ ] Clicking "Random Query" sends a `GET /api/suggest-query` request to the backend
- [ ] The backend retrieves the current database schema and uses the LLM (via `llm_processor.py`) to generate a natural language query suggestion
- [ ] The generated query text is placed into the query input field, always overwriting existing content
- [ ] While the request is in-flight, the button is disabled and shows a loading spinner
- [ ] If no tables are loaded, the button returns a user-friendly error message
- [ ] If the LLM call fails, an error message is shown and the query input is unchanged
- [ ] All existing tests pass with zero regressions
- [ ] TypeScript compiles without errors
- [ ] Frontend production build succeeds

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_nlq_button.md` to validate this functionality works end-to-end.
- `cd app/server && uv run pytest` — Run server tests to validate the feature works with zero regressions
- `cd app/client && bun tsc --noEmit` — Run frontend type checks to validate the feature works with zero regressions
- `cd app/client && bun run build` — Run frontend build to validate the feature works with zero regressions

## Notes
- The `generate_nl_query` function follows the same LLM routing pattern as `generate_sql` in `llm_processor.py` — OpenAI key takes priority, then Anthropic
- Use a temperature of 0.7-0.9 for query suggestion (higher than SQL generation) to encourage variety and creativity in the generated queries
- The prompt should instruct the LLM to generate queries that are specific and leverage the actual column/table names present in the schema, making suggestions more useful
- The button label "Random Query" communicates clearly that users will get a new, AI-generated query each time they click
- No new Python dependencies are required — the feature uses the existing `openai` and `anthropic` client libraries already in the project
- The `secondary-button` CSS class is already defined in `style.css` and matches the "Upload Data" button appearance — no additional CSS is needed
