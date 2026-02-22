# Feature: Save Query as Favorite

## Feature Description
Add the ability for users to save frequently-used natural language queries as favorites. A star icon appears on each query result panel; clicking it saves the query text and generated SQL to a persistent favorites list stored in the backend SQLite database. A "Favorites" side panel in the header lets users browse, re-run, and remove saved queries. Favorites survive page refreshes because they are stored server-side, not in localStorage.

## User Story
As a data analyst
I want to star queries I use frequently
So that I can re-run them instantly without retyping or remembering the exact phrasing

## Problem Statement
Every query is discarded as soon as a new one is run. Analysts who repeat the same queries daily (e.g., "Show total sales by region this week") must retype them from scratch each session with no way to save or retrieve them.

## Solution Statement
Introduce a lightweight favorites system: a `query_favorites` table in the existing SQLite database stores `(id, query_text, sql_text, created_at)` rows. Three new API endpoints (GET/POST/DELETE `/api/favorites`) expose CRUD operations. The frontend adds a star button to each query result, a "Favorites" header button, and a slide-in side panel that lists saved queries with one-click re-run and delete actions.

## Relevant Files

### Existing Files to Modify

- **`app/server/core/data_models.py`** — Add `FavoriteItem`, `FavoriteListResponse`, `AddFavoriteRequest`, `AddFavoriteResponse`, `DeleteFavoriteResponse` Pydantic models.
- **`app/server/server.py`** — Register three new `/api/favorites` routes (GET, POST, DELETE) and import the new favorites module.
- **`app/client/src/types.d.ts`** — Add `FavoriteItem`, `FavoriteListResponse`, `AddFavoriteRequest`, `AddFavoriteResponse` TypeScript interfaces matching the Pydantic models.
- **`app/client/src/api/client.ts`** — Add `getFavorites()`, `addFavorite()`, `deleteFavorite()` methods to the `api` object.
- **`app/client/index.html`** — Add "Favorites" button to the header controls and add the favorites side-panel HTML skeleton.
- **`app/client/src/main.ts`** — Add star button rendering in `displayResults()`, implement `initializeFavorites()`, `toggleFavoritesPanel()`, `loadFavorites()`, `renderFavoritesList()`, `addFavorite()`, `deleteFavorite()`, and `rerunFavorite()` functions.
- **`app/client/src/style.css`** — Add styles for: star button (`.star-button`), active star (`.star-button.starred`), favorites panel (`.favorites-panel`, `.favorites-panel.open`), favorites list (`.favorites-list`, `.favorite-item`), and favorites header button (`.favorites-header-btn`).

### New Files to Create

- **`app/server/core/favorites.py`** — Core favorites CRUD module: `ensure_favorites_table()`, `get_all_favorites()`, `add_favorite()`, `delete_favorite()`, `favorite_exists()`. Uses `sqlite3` directly, consistent with the rest of the codebase.
- **`app/server/tests/test_favorites.py`** — Pytest unit tests covering the favorites module and API endpoints.
- **`.claude/commands/e2e/test_save_query_favorites.md`** — E2E test validating the end-to-end favorites flow in the browser.

### Files to Read Before Implementing (Context)

- Read `.claude/commands/test_e2e.md` to understand the E2E runner format.
- Read `.claude/commands/e2e/test_basic_query.md` as a concrete example of the E2E test format.

## Implementation Plan

### Phase 1: Foundation
Create the `favorites.py` core module and data models so that backend logic is fully in place before touching the API or UI.

### Phase 2: Core Implementation
Wire up the three API endpoints in `server.py`, extend the TypeScript types and `api` client, then build the star button and favorites panel in the frontend.

### Phase 3: Integration
Write unit tests, create the E2E test file, then run all validation commands to confirm zero regressions.

## Step by Step Tasks

### Step 1: Create the Favorites Core Module (`app/server/core/favorites.py`)
- Create `app/server/core/favorites.py` with the following functions (no decorators, plain Python):
  - `ensure_favorites_table()` — Creates the `query_favorites` table if it does not exist:
    ```sql
    CREATE TABLE IF NOT EXISTS query_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_text TEXT NOT NULL,
        sql_text TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    ```
  - `get_all_favorites() -> list[dict]` — Returns all rows ordered by `created_at DESC`.
  - `add_favorite(query_text: str, sql_text: str) -> dict` — Inserts a row, returns the new row as a dict (id, query_text, sql_text, created_at). Raises `ValueError` if an identical `query_text` already exists.
  - `delete_favorite(favorite_id: int) -> bool` — Deletes the row by id; returns `True` if a row was deleted, `False` if not found.
  - `favorite_exists(query_text: str) -> bool` — Returns `True` if a favorite with the exact `query_text` already exists.
- All functions open their own `sqlite3.connect("db/database.db")` connection (consistent with `server.py` and `sql_processor.py` patterns) and close it before returning.
- Import and call `ensure_favorites_table()` at module load time (top-level call after function definitions) so the table is always ready.

### Step 2: Add Pydantic Models (`app/server/core/data_models.py`)
- Add the following models at the end of the file:
  ```python
  class FavoriteItem(BaseModel):
      id: int
      query_text: str
      sql_text: str
      created_at: str

  class FavoriteListResponse(BaseModel):
      favorites: List[FavoriteItem]
      total: int
      error: Optional[str] = None

  class AddFavoriteRequest(BaseModel):
      query_text: str
      sql_text: str

  class AddFavoriteResponse(BaseModel):
      favorite: Optional[FavoriteItem] = None
      already_exists: bool = False
      error: Optional[str] = None

  class DeleteFavoriteResponse(BaseModel):
      deleted: bool
      error: Optional[str] = None
  ```

### Step 3: Register API Endpoints (`app/server/server.py`)
- Import the new models and favorites module at the top:
  ```python
  from core.favorites import get_all_favorites, add_favorite, delete_favorite
  from core.data_models import (
      ...,  # existing imports
      FavoriteListResponse, AddFavoriteRequest, AddFavoriteResponse, DeleteFavoriteResponse, FavoriteItem
  )
  ```
- Add three endpoints after the existing `/api/table/{table_name}` DELETE route:

  **GET `/api/favorites`** → `FavoriteListResponse`
  - Call `get_all_favorites()`
  - Return `FavoriteListResponse(favorites=[FavoriteItem(**r) for r in rows], total=len(rows))`
  - On exception return `FavoriteListResponse(favorites=[], total=0, error=str(e))`

  **POST `/api/favorites`** → `AddFavoriteResponse`
  - Accept `AddFavoriteRequest`
  - If `favorite_exists(request.query_text)`: return `AddFavoriteResponse(already_exists=True)`
  - Else call `add_favorite(request.query_text, request.sql_text)` and return `AddFavoriteResponse(favorite=FavoriteItem(**row), already_exists=False)`
  - On exception return `AddFavoriteResponse(error=str(e))`

  **DELETE `/api/favorites/{favorite_id}`** → `DeleteFavoriteResponse`
  - Accept `favorite_id: int` path parameter
  - Call `delete_favorite(favorite_id)`
  - Return `DeleteFavoriteResponse(deleted=result)`
  - On exception return `DeleteFavoriteResponse(deleted=False, error=str(e))`

- Log each operation with `logger.info(...)` consistent with existing routes.

### Step 4: Add TypeScript Types (`app/client/src/types.d.ts`)
- Append the following interfaces at the end of the file:
  ```typescript
  interface FavoriteItem {
    id: number;
    query_text: string;
    sql_text: string;
    created_at: string;
  }

  interface FavoriteListResponse {
    favorites: FavoriteItem[];
    total: number;
    error?: string;
  }

  interface AddFavoriteRequest {
    query_text: string;
    sql_text: string;
  }

  interface AddFavoriteResponse {
    favorite?: FavoriteItem;
    already_exists: boolean;
    error?: string;
  }

  interface DeleteFavoriteResponse {
    deleted: boolean;
    error?: string;
  }
  ```

### Step 5: Extend the API Client (`app/client/src/api/client.ts`)
- Add three methods to the `api` export object:
  ```typescript
  async getFavorites(): Promise<FavoriteListResponse> {
    return apiRequest<FavoriteListResponse>('/favorites');
  },

  async addFavorite(request: AddFavoriteRequest): Promise<AddFavoriteResponse> {
    return apiRequest<AddFavoriteResponse>('/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  },

  async deleteFavorite(favoriteId: number): Promise<DeleteFavoriteResponse> {
    return apiRequest<DeleteFavoriteResponse>(`/favorites/${favoriteId}`, {
      method: 'DELETE'
    });
  }
  ```

### Step 6: Update the HTML (`app/client/index.html`)
- In the `.query-controls` div, add a "Favorites" button before the "Upload Data" button:
  ```html
  <button id="favorites-button" class="secondary-button favorites-header-btn">☆ Favorites</button>
  ```
- After the closing `</div>` of `id="app"` container (but before the closing `</body>`), add the favorites side panel:
  ```html
  <!-- Favorites Side Panel -->
  <div id="favorites-panel" class="favorites-panel">
    <div class="favorites-panel-header">
      <h3>Saved Favorites</h3>
      <button id="close-favorites" class="close-favorites-btn">&times;</button>
    </div>
    <div id="favorites-list" class="favorites-list">
      <p class="no-favorites">No favorites saved yet. Run a query and click the star to save it.</p>
    </div>
  </div>
  <div id="favorites-overlay" class="favorites-overlay" style="display: none;"></div>
  ```

### Step 7: Add CSS Styles (`app/client/src/style.css`)
- Add the following styles, following the Zen design system (variables, border-radius: 8-12px, transitions: 0.3s, system fonts):

  **Star button:**
  ```css
  .star-button {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    color: #aaa;
    padding: 0 0.25rem;
    transition: color 0.2s, transform 0.2s;
    line-height: 1;
  }
  .star-button:hover {
    color: #f0c040;
    transform: scale(1.2);
  }
  .star-button.starred {
    color: #f0c040;
  }
  ```

  **Favorites header button:**
  ```css
  .favorites-header-btn {
    position: relative;
  }
  ```

  **Favorites side panel:**
  ```css
  .favorites-panel {
    position: fixed;
    top: 0;
    right: -400px;
    width: 380px;
    height: 100vh;
    background: var(--surface, #ffffff);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    z-index: 1001;
    display: flex;
    flex-direction: column;
  }
  .favorites-panel.open {
    right: 0;
  }
  .favorites-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }
  .favorites-panel-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-primary, #2c3e50);
  }
  .close-favorites-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #495057);
    line-height: 1;
    padding: 0;
  }
  .close-favorites-btn:hover {
    color: var(--text-primary, #2c3e50);
  }
  .favorites-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  .no-favorites {
    color: var(--text-secondary, #495057);
    text-align: center;
    margin-top: 2rem;
    font-size: 0.9rem;
  }
  .favorite-item {
    background: var(--background, #f5f7fa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .favorite-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .favorite-item-query {
    font-size: 0.9rem;
    color: var(--text-primary, #2c3e50);
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  .favorite-item-sql {
    font-size: 0.78rem;
    color: var(--text-secondary, #495057);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .favorite-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }
  .favorite-item-date {
    font-size: 0.75rem;
    color: #aaa;
  }
  .delete-favorite-btn {
    background: none;
    border: none;
    color: var(--error-color, #dc3545);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0;
    opacity: 0.7;
  }
  .delete-favorite-btn:hover {
    opacity: 1;
  }
  .favorites-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
  ```

  **Adjust results-header to accommodate star button:**
  - The `.results-header` already uses flexbox; add the star button inside it (between the `<h2>` and the hide button).

### Step 8: Update the Frontend Logic (`app/client/src/main.ts`)
- Add state variable at the top of the module:
  ```typescript
  let currentFavorites: FavoriteItem[] = [];
  let currentQueryText = '';
  let currentSqlText = '';
  ```
- Call `initializeFavorites()` inside `DOMContentLoaded`.
- **`initializeFavorites()`**:
  - Get the `#favorites-button` element; on click call `toggleFavoritesPanel(true)`.
  - Get the `#close-favorites` element; on click call `toggleFavoritesPanel(false)`.
  - Get the `#favorites-overlay` element; on click call `toggleFavoritesPanel(false)`.
  - Call `loadFavorites()` on initialization.
- **`toggleFavoritesPanel(open: boolean)`**:
  - Toggle `open` class on `#favorites-panel`.
  - Toggle display of `#favorites-overlay`.
  - If opening, call `loadFavorites()`.
- **`loadFavorites()`**: Call `api.getFavorites()`, update `currentFavorites`, call `renderFavoritesList()`, update the star button state.
- **`renderFavoritesList()`**: Clear `#favorites-list`, render each `FavoriteItem` as a `.favorite-item` div with:
  - `.favorite-item-query` text (query_text)
  - `.favorite-item-sql` text (sql_text truncated)
  - `.favorite-item-footer` with date and a "Remove" delete button
  - Clicking the item body (not the delete button) calls `rerunFavorite(item.query_text)`.
  - Delete button calls `handleDeleteFavorite(item.id)`.
- **`rerunFavorite(queryText: string)`**:
  - Close the panel.
  - Set `#query-input` value to `queryText`.
  - Programmatically click `#query-button`.
- **`handleDeleteFavorite(id: number)`**:
  - Call `api.deleteFavorite(id)`.
  - On success call `loadFavorites()`.
- **Update `displayResults()`**:
  - Store `currentQueryText = query` and `currentSqlText = response.sql`.
  - Add a star button to the `.results-header`:
    ```typescript
    const starButton = document.createElement('button');
    starButton.className = 'star-button';
    starButton.title = 'Save as favorite';
    starButton.textContent = '☆';
    starButton.id = 'star-button';
    // Check if this query is already favorited
    updateStarButtonState(starButton, query);
    starButton.addEventListener('click', () => handleStarClick(starButton, query, response.sql));
    ```
  - Insert the star button between `<h2>` and the toggle button in `.results-header`.
- **`updateStarButtonState(btn, queryText)`**: Check `currentFavorites` — if any item's `query_text === queryText`, add class `starred` and set text to `★`; otherwise remove `starred` and set text to `☆`.
- **`handleStarClick(btn, queryText, sqlText)`**:
  - If already starred: call `handleDeleteFavorite` for that favorite's id, then update button.
  - If not starred: call `api.addFavorite({ query_text: queryText, sql_text: sqlText })`, then call `loadFavorites()` and update button.

### Step 9: Create the E2E Test File (`.claude/commands/e2e/test_save_query_favorites.md`)
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand the format.
- Create `.claude/commands/e2e/test_save_query_favorites.md` with the following test steps:

  **Test Steps:**
  1. Navigate to the Application URL.
  2. Take a screenshot of the initial state — confirm "Favorites" button is visible in the header.
  3. Load sample Users data via the Upload Data modal (click "Users Data" sample button).
  4. Wait for "users" table to appear in Available Tables.
  5. Enter the query: "Show me all users" in the query input.
  6. Click the Query button and wait for results.
  7. **Verify** a star icon (☆) appears in the Query Results header.
  8. Take a screenshot showing the star icon next to the results.
  9. Click the star icon (☆).
  10. **Verify** the star icon changes to filled (★ / gold color with `.starred` class).
  11. Take a screenshot showing the filled star.
  12. Click the "Favorites" button.
  13. **Verify** the favorites side panel slides open.
  14. **Verify** the panel contains one item with query text "Show me all users".
  15. Take a screenshot of the favorites panel with the saved item.
  16. Click the "Remove" button on the favorite item.
  17. **Verify** the favorites list is now empty (shows "No favorites saved yet").
  18. Close the favorites panel.
  19. **Verify** the star icon in the results header is now unfilled (☆).
  20. Take a screenshot of the final state.

  **Success Criteria:**
  - Star icon appears on every query result.
  - Clicking star saves the favorite and changes icon to filled.
  - Favorites panel opens with the saved query.
  - Clicking a favorite item re-populates input and re-runs the query.
  - Removing a favorite updates the panel and the star icon.
  - 5 screenshots are taken.

### Step 10: Write Unit Tests (`app/server/tests/test_favorites.py`)
- Use `pytest` and `tempfile` / monkeypatching to test with an in-memory or temp SQLite database.
- Test the following:
  - `ensure_favorites_table()` creates the table if absent.
  - `add_favorite()` inserts a row and returns a dict with all fields.
  - `get_all_favorites()` returns the inserted row.
  - `favorite_exists()` returns `True` after adding, `False` before.
  - `delete_favorite()` removes the row and returns `True`; returns `False` for non-existent id.
  - Duplicate `query_text` raises `ValueError` (or is handled by `already_exists` logic).
  - API endpoint `GET /api/favorites` returns 200 with empty favorites list.
  - API endpoint `POST /api/favorites` returns 200 with the new favorite.
  - API endpoint `DELETE /api/favorites/{id}` returns 200 with `deleted: true`.

### Step 11: Run Validation Commands
- Execute all validation commands listed below to confirm zero regressions.

## Testing Strategy

### Unit Tests
- `app/server/tests/test_favorites.py` tests all five favorites CRUD functions in isolation using a temporary SQLite database (monkeypatch the `DB_PATH` or pass a temp db path via a fixture).
- Test happy path, duplicate prevention, not-found deletion, and empty-state list.

### Edge Cases
- Adding the same `query_text` twice: should return `already_exists: True`, not insert a duplicate.
- Deleting a `favorite_id` that does not exist: returns `deleted: False` without error.
- Star button state after a query re-run from favorites: star should appear filled if already in favorites.
- Empty favorites list: panel renders "No favorites saved yet" message.
- Favorites persist across page refresh (server-side SQLite, not localStorage).
- Very long SQL text in the favorites panel: truncated with `text-overflow: ellipsis`.

## Acceptance Criteria
- A star icon (☆) appears on each query result panel after a successful query.
- Clicking the star saves the query and SQL; the icon changes to filled (★) golden color.
- Clicking a filled star removes the favorite; the icon reverts to ☆.
- A "Favorites" button in the header control bar opens the favorites side panel.
- The favorites panel lists all saved queries with query text, truncated SQL, and date.
- Clicking a favorite item closes the panel, populates the query input, and re-runs the query.
- A "Remove" button on each favorite item deletes it from the backend and updates the panel.
- Favorites persist across page refreshes (stored in SQLite `query_favorites` table).
- `GET /api/favorites` returns all favorites in descending creation order.
- `POST /api/favorites` accepts `{query_text, sql_text}` and returns the created item.
- `DELETE /api/favorites/{id}` removes the item and returns `{"deleted": true}`.
- All existing server tests (`uv run pytest`) continue to pass.
- TypeScript compiles with zero errors (`bun tsc --noEmit`).
- Frontend builds without errors (`bun run build`).

## Validation Commands

Execute every command in order to validate the feature works correctly with zero regressions.

1. **Read and execute E2E test:**
   - Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_save_query_favorites.md` to validate the favorites feature end-to-end in the browser.

2. **Run server tests (includes new favorites tests):**
   ```bash
   cd app/server && uv run pytest
   ```

3. **Run TypeScript type-check:**
   ```bash
   cd app/client && bun tsc --noEmit
   ```

4. **Build frontend:**
   ```bash
   cd app/client && bun run build
   ```

## Notes
- The `query_favorites` table uses `query_text TEXT NOT NULL` without a UNIQUE constraint; duplicate prevention is handled in application code (`favorite_exists()` check before insert) so errors surface as `already_exists: True` rather than a database exception.
- All database access in `favorites.py` follows the project pattern: `sqlite3.connect("db/database.db")` with `conn.row_factory = sqlite3.Row` for dict-like access, opened and closed per function call.
- No new Python packages are required; the feature relies entirely on the standard library (`sqlite3`, `datetime`) and existing dependencies.
- The favorites panel uses CSS `position: fixed` with a slide-in transition (`right: -400px` → `right: 0`) and a semi-transparent overlay, consistent with the existing upload modal pattern.
- The star button is injected dynamically into the `.results-header` element inside `displayResults()` each time a new query runs; calling `loadFavorites()` after render ensures the star state reflects current saved favorites.
- Future consideration: add a search/filter bar inside the favorites panel for users with many saved queries.
