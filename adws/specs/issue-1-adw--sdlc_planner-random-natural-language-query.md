# Feature: Random Natural Language Query Generator Button

## Feature Description
Add a "Random Query" button to the Natural Language SQL Interface that, when clicked, uses the LLM to generate an interesting and contextually relevant natural language query based on the current database tables and their structure. The generated query is automatically inserted into the query input field, overwriting any existing content, allowing users to discover what kinds of questions they can ask or to quickly explore their data.

## User Story
As a data analyst or database user
I want to click a button that generates a random natural language query based on my uploaded tables
So that I can discover interesting questions to ask about my data and learn what the interface is capable of

## Problem Statement
New users and experienced users alike may struggle to think of interesting queries to run against their data. There is currently no way to get query suggestions or examples tailored to the actual data structure in the database. Users must manually craft every query from scratch, which creates friction for exploration and discovery.

## Solution Statement
Add a "Random Query" button (styled like the existing "Upload Data" secondary button) that calls a new backend API endpoint `/api/suggest-query`. This endpoint uses `llm_processor.py` to generate a creative, interesting natural language query based on the actual database schema (table names, column names, row counts). The generated query overwrites the query input field content, ready for the user to review and execute.

## Relevant Files
Use these files to implement the feature:

- **`app/server/core/llm_processor.py`** - Add `generate_suggested_query(schema_info)` function that uses the existing LLM clients (OpenAI/Anthropic) to generate interesting natural language queries based on schema
- **`app/server/server.py`** - Add new `GET /api/suggest-query` endpoint that fetches schema and calls the new LLM function
- **`app/server/core/data_models.py`** - Add `SuggestQueryResponse` Pydantic model for the new endpoint response
- **`app/client/index.html`** - Add the "Random Query" button element next to the "Upload Data" button
- **`app/client/src/main.ts`** - Add event handler for the new button that calls the API and populates the textarea
- **`app/client/src/api/client.ts`** - Add `suggestQuery()` method to the API client
- **`app/client/src/types.d.ts`** - Add `SuggestQueryResponse` TypeScript interface
- **`app/server/tests/core/test_llm_processor.py`** - Add unit tests for the new `generate_suggested_query` function
- **`.claude/commands/test_e2e.md`** - Read to understand how to create the E2E test file
- **`.claude/commands/e2e/test_basic_query.md`** - Read as reference for E2E test structure

### New Files
- **`.claude/commands/e2e/test_random_query.md`** - E2E test file validating the Random Query button functionality

## Implementation Plan
### Phase 1: Foundation
Add the `generate_suggested_query` function to `llm_processor.py` and the `SuggestQueryResponse` model to `data_models.py`. This is the core logic that generates interesting queries using the LLM based on schema context.

### Phase 2: Core Implementation
Add the `GET /api/suggest-query` endpoint to `server.py` that orchestrates fetching the schema and calling the LLM function. Add the `suggestQuery()` method to the API client and the TypeScript type definition.

### Phase 3: Integration
Add the "Random Query" button to the HTML and wire up the event handler in `main.ts` to call the API, show a loading state on the button, and overwrite the query input field with the generated query.

## Step by Step Tasks

### Step 1: Create E2E test file for the Random Query button
- Read `.claude/commands/test_e2e.md` to understand E2E test structure and conventions
- Read `.claude/commands/e2e/test_basic_query.md` as a reference example
- Create `.claude/commands/e2e/test_random_query.md` with steps to:
  1. Navigate to the app (http://localhost:5173)
  2. Verify the "Random Query" button exists in the UI
  3. Upload sample data first (users.json) so schema is populated
  4. Click "Random Query" button
  5. Verify the query input field gets populated with a non-empty string
  6. Verify the generated text looks like a natural language query (not SQL)
  7. Take screenshots at key moments

### Step 2: Add `SuggestQueryResponse` to data models
- Open `app/server/core/data_models.py`
- Add a new Pydantic model:
  ```python
  class SuggestQueryResponse(BaseModel):
      query: str
      error: Optional[str] = None
  ```

### Step 3: Add `generate_suggested_query` to llm_processor.py
- Open `app/server/core/llm_processor.py`
- Add function `generate_suggested_query(schema_info: dict) -> str` that:
  - Uses `format_schema_for_prompt(schema_info)` to get a schema string
  - Sends a prompt to the LLM asking it to generate ONE interesting natural language question a user might ask about the data (not SQL, just a question in plain English)
  - The prompt should instruct the LLM to be creative, vary the complexity (sometimes simple counts, sometimes aggregations, sometimes filters, sometimes rankings), and tailor the question to the actual column names and table context
  - Uses the same provider priority logic as `generate_sql` (OpenAI first, then Anthropic)
  - Returns the generated natural language query string
  - If no schema tables exist, returns a helpful placeholder like "What are all the records in my table?"
  - Example prompt:
    ```
    You are a data analyst. Given this database schema, generate ONE interesting natural language question a user might want to ask about this data. Return ONLY the question, nothing else.

    {schema_string}

    Be creative and vary the type of question (filtering, aggregation, ranking, comparison). Make it specific to the actual column names and data.
    ```

### Step 4: Add `GET /api/suggest-query` endpoint to server.py
- Open `app/server/server.py`
- Add import for `SuggestQueryResponse` from data_models
- Add import for `generate_suggested_query` from llm_processor
- Add new endpoint:
  ```python
  @app.get("/api/suggest-query")
  async def suggest_query() -> SuggestQueryResponse:
      try:
          schema_info = get_database_schema()
          if not schema_info.get("tables"):
              return SuggestQueryResponse(query="What are all the records in my table?")
          suggested = generate_suggested_query(schema_info)
          return SuggestQueryResponse(query=suggested)
      except Exception as e:
          logger.error(f"Error generating suggested query: {e}")
          return SuggestQueryResponse(query="", error=str(e))
  ```

### Step 5: Add `SuggestQueryResponse` TypeScript type
- Open `app/client/src/types.d.ts`
- Add interface:
  ```typescript
  interface SuggestQueryResponse {
    query: string;
    error?: string;
  }
  ```

### Step 6: Add `suggestQuery()` to API client
- Open `app/client/src/api/client.ts`
- Add method to the api object:
  ```typescript
  suggestQuery: async (): Promise<SuggestQueryResponse> => {
    const response = await fetch(`${API_BASE_URL}/suggest-query`);
    return response.json();
  },
  ```

### Step 7: Add "Random Query" button to index.html
- Open `app/client/index.html`
- Locate the "Upload Data" button (`<button id="upload-data-button" class="secondary-button">`)
- Add a new button directly next to it (before or after the Upload Data button):
  ```html
  <button id="random-query-button" class="secondary-button">Random Query</button>
  ```
- Place it in the same button group/row as the Upload Data button

### Step 8: Wire up the Random Query button in main.ts
- Open `app/client/src/main.ts`
- Add a new initialization function `initializeRandomQueryButton()`:
  ```typescript
  function initializeRandomQueryButton() {
    const randomQueryButton = document.getElementById('random-query-button') as HTMLButtonElement;
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;

    if (!randomQueryButton || !queryInput) return;

    randomQueryButton.addEventListener('click', async () => {
      const originalText = randomQueryButton.textContent;
      randomQueryButton.textContent = 'Generating...';
      randomQueryButton.disabled = true;

      try {
        const response = await api.suggestQuery();
        if (response.query) {
          queryInput.value = response.query;
          queryInput.focus();
        }
      } catch (error) {
        console.error('Failed to generate query suggestion:', error);
      } finally {
        randomQueryButton.textContent = originalText;
        randomQueryButton.disabled = false;
      }
    });
  }
  ```
- Call `initializeRandomQueryButton()` in the main initialization block (alongside `initializeQueryInput()` and `initializeFileUpload()`)

### Step 9: Add unit tests for generate_suggested_query
- Open `app/server/tests/core/test_llm_processor.py`
- Add tests for the `generate_suggested_query` function:
  - Test with valid schema returns a non-empty string
  - Test with empty schema returns a default placeholder question
  - Mock the LLM calls to avoid real API calls in tests

### Step 10: Run validation commands
- Run all validation commands listed in the `Validation Commands` section to ensure zero regressions

## Testing Strategy
### Unit Tests
- Mock OpenAI/Anthropic clients in `test_llm_processor.py` to test `generate_suggested_query`:
  - Returns a non-empty string when schema has tables
  - Returns a sensible default when schema has no tables
  - Handles LLM API errors gracefully
- Test the `/api/suggest-query` endpoint in server tests (mock the LLM call)

### Edge Cases
- **Empty database**: No tables uploaded yet → return a helpful default question
- **LLM unavailable**: No API keys set → return a default placeholder or error
- **LLM error**: Network timeout or API error → return an error in the response
- **Single table with few columns**: LLM still generates a meaningful question
- **Many tables with many columns**: LLM picks a focused, coherent question
- **Button clicked while loading**: Disabled state prevents duplicate requests

## Acceptance Criteria
- A "Random Query" button appears in the UI styled identically to the "Upload Data" secondary button
- Clicking the button calls `GET /api/suggest-query` and populates the query input field with the generated question
- The generated question is always in natural language (not SQL)
- The question is tailored to the actual tables and columns in the current database schema
- Clicking the button always overwrites the existing content in the query input field
- The button shows "Generating..." and is disabled while the API call is in progress
- When no tables are uploaded, the button still works and returns a reasonable default question
- The feature works with both OpenAI and Anthropic LLM providers
- All existing tests continue to pass
- The new unit tests for `generate_suggested_query` pass

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_random_query.md` to validate the Random Query button functionality end-to-end
- `cd app/server && uv run pytest` - Run server tests to validate the feature works with zero regressions
- `cd app/client && bun tsc --noEmit` - Run frontend TypeScript checks to validate with zero regressions
- `cd app/client && bun run build` - Run frontend build to validate the feature works with zero regressions

## Notes
- The `generate_suggested_query` function should follow the same provider priority pattern as `generate_sql` in `llm_processor.py`: OpenAI first (if `OPENAI_API_KEY` set), then Anthropic (if `ANTHROPIC_API_KEY` set)
- Keep the LLM prompt concise to minimize token usage — we only need ONE question, not a list
- The button should be placed near the "Upload Data" button to keep related actions grouped (both are secondary actions that help users interact with the query input area)
- Temperature for the suggest query LLM call can be higher (e.g., 0.7-0.8) compared to SQL generation (0.1) to encourage variety and creativity in the generated questions
- Consider the button label: "Random Query" is clear and concise; alternatives could be "Suggest Query" or "Inspire Me" — stick with "Random Query" as specified
- Future enhancement: could add a keyboard shortcut for the button or allow generating multiple suggestions at once
