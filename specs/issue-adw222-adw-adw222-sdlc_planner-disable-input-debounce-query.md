# Bug: Input area not disabled during query execution and no request debouncing

## Bug Description
When a user submits a query, only the "Query" button is disabled during execution. The textarea input remains fully editable, and the "Random Query" button stays enabled, allowing users to modify the query text or generate a new query while a request is in flight. Additionally, there is no debounce mechanism — rapid clicks on the Query button or rapid Cmd/Ctrl+Enter presses can fire multiple concurrent API requests before the button's disabled state takes effect.

**Expected behavior:** The entire query input area (textarea, Query button, and Random Query button) should be disabled while a query is running. Rapid submissions should be debounced to prevent duplicate requests.

**Actual behavior:** Only the Query button is disabled. The textarea and Random Query button remain interactive. No debounce prevents duplicate requests from rapid clicks.

## Problem Statement
The query submission flow in `main.ts` does not disable the textarea or the Random Query button during query execution, and lacks any debounce/guard mechanism to prevent duplicate concurrent requests from rapid user interactions.

## Solution Statement
1. **Disable the full input area during query execution:** When a query starts, disable the textarea, Query button, and Random Query button. Re-enable all three when the request completes (success or failure).
2. **Add a simple in-flight guard:** Use a boolean flag (`isQueryRunning`) to prevent duplicate submissions. If a query is already in flight, ignore subsequent submit attempts. This is simpler and more appropriate than time-based debouncing since we want to block until the current request completes, not delay execution.

## Steps to Reproduce
1. Start the application (`./scripts/start.sh`)
2. Upload sample data (e.g., Users Data)
3. Type a query in the textarea (e.g., "Show me all users")
4. Click the Query button rapidly multiple times — observe multiple requests fire in the Network tab
5. While a query is running, observe the textarea is still editable and the Random Query button is still clickable

## Root Cause Analysis
In `app/client/src/main.ts`, the `initializeQueryInput()` function only sets `queryButton.disabled = true` inside the click handler. The textarea (`queryInput`) and the Random Query button are never disabled. There is no guard variable to prevent re-entrant calls — the `queryButton.disabled = true` line executes asynchronously after the click event fires, so rapid clicks can queue multiple handlers before the first one disables the button.

## Relevant Files
Use these files to fix the bug:

- `app/client/src/main.ts` — Contains all query submission logic (`initializeQueryInput`, `initializeRandomQueryButton`). This is the primary file to modify. The in-flight guard and input disabling logic go here.
- `app/client/index.html` — Contains the textarea and button elements. No changes needed but useful for reference to understand element IDs.
- `.claude/commands/test_e2e.md` — Read this to understand how to run E2E tests.
- `.claude/commands/e2e/test_basic_query.md` — Read this as a reference for E2E test format.
- `.claude/commands/e2e/test_complex_query.md` — Read this as a reference for E2E test format.

### New Files
- `.claude/commands/e2e/test_disabled_input_during_query.md` — New E2E test to validate input area is disabled during query execution.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Add in-flight guard and disable all inputs during query execution
- In `app/client/src/main.ts`, add a module-level boolean variable `let isQueryRunning = false;` in the global state section at the top.
- In `initializeQueryInput()`, at the start of the click handler:
  - Check `if (isQueryRunning) return;` to guard against re-entrant calls.
  - Set `isQueryRunning = true` immediately.
  - Disable `queryInput` (the textarea): `queryInput.disabled = true;`
  - Disable the Random Query button: get the element and set `disabled = true`.
- In the `finally` block of the click handler:
  - Re-enable `queryInput`: `queryInput.disabled = false;`
  - Re-enable the Random Query button: set `disabled = false`.
  - Set `isQueryRunning = false`.
  - Refocus the textarea: `queryInput.focus();`
- In the keyboard shortcut handler (`keydown` event), add `if (isQueryRunning) return;` before `queryButton.click()`.

### Step 2: Guard the Random Query button against running during a query
- In `initializeRandomQueryButton()`, at the start of the click handler, add: `if (isQueryRunning) return;` to prevent generating a random query while a query is in flight.

### Step 3: Create E2E test file for input disabled during query
- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_complex_query.md` and create a new E2E test file in `.claude/commands/e2e/test_disabled_input_during_query.md` that validates the bug is fixed. The test should:
  1. Navigate to the application URL
  2. Take a screenshot of the initial state
  3. Load sample Users data
  4. Type a query in the textarea
  5. Click the Query button
  6. **Immediately** verify the textarea is disabled (has `disabled` attribute)
  7. **Immediately** verify the Random Query button is disabled
  8. Take a screenshot showing disabled state
  9. Wait for the query to complete
  10. **Verify** the textarea is re-enabled after completion
  11. **Verify** the Random Query button is re-enabled after completion
  12. **Verify** query results are displayed
  13. Take a screenshot of the final state showing re-enabled inputs and results

### Step 4: Run validation commands
- Execute all validation commands listed below to confirm the bug is fixed with zero regressions.

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_disabled_input_during_query.md` test file to validate this functionality works.
- `cd app/server && uv run pytest` - Run server tests to validate the bug is fixed with zero regressions
- `cd app/client && bun tsc --noEmit` - Run frontend tests to validate the bug is fixed with zero regressions
- `cd app/client && bun run build` - Run frontend build to validate the bug is fixed with zero regressions

## Notes
- No new libraries are needed. The fix is pure TypeScript logic changes in `main.ts`.
- The "in-flight guard" pattern (boolean flag) is preferred over `setTimeout`-based debouncing because the goal is to prevent duplicate concurrent requests, not to delay execution by a time window.
- The textarea should receive focus after re-enabling so the user can immediately type their next query.
- The existing `queryButton.disabled` logic should remain as-is — the new guard is additive.
