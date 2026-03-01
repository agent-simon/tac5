# Bug: CSV Download Button Misplaced in Table Header

## Bug Description
The download CSV button in the Available Tables section appears floating in the center of the table card header row instead of being grouped next to the remove (×) button on the right side. This is visually confusing because the two action buttons are not logically grouped together.

**Expected behavior:** The download CSV button (↓) should appear immediately to the left of the remove (×) button, both flush to the right side of the table header.

**Actual behavior:** With three direct flex children in `.table-header` (which uses `justify-content: space-between`), the download button lands in the horizontal center of the row — between the table name/info block on the left and the remove button on the far right.

## Problem Statement
The `.table-header` element uses `display: flex; justify-content: space-between`, which distributes its three direct children (tableLeft, downloadButton, removeButton) with maximum spacing. The download button ends up visually centered instead of grouped with the remove button.

## Solution Statement
Wrap the `downloadButton` and `removeButton` in a shared container `div` with `display: flex` and `align-items: center`. This makes both buttons a single flex child of `.table-header`, so `justify-content: space-between` places the left content block on the left and the button group on the right — with the two buttons side-by-side.

## Steps to Reproduce
1. Open the application at `http://localhost:5173`
2. Click "Upload Data" and load any sample data (e.g. Products)
3. Observe the Available Tables section
4. Notice the download (↓) button appears in the middle of the table card header, not next to the remove (×) button

## Root Cause Analysis
In `app/client/src/main.ts`, inside `displayTables()`, three elements are appended as direct children of `tableHeader`:

```js
tableHeader.appendChild(tableLeft);      // flex child 1 (left)
tableHeader.appendChild(downloadButton); // flex child 2 (center — BUG)
tableHeader.appendChild(removeButton);   // flex child 3 (right)
```

`.table-header` CSS:
```css
.table-header {
  display: flex;
  justify-content: space-between;  /* pushes items to far ends + middle */
  align-items: center;
}
```

With `justify-content: space-between` and three children, the middle child (downloadButton) is placed at the horizontal center. The fix is to group `downloadButton` and `removeButton` into a single container so `.table-header` only has two flex children.

## Relevant Files

- **`app/client/src/main.ts`** — Contains `displayTables()` where `tableHeader` children are assembled. This is the only file that needs changing.
- **`app/client/src/style.css`** — Contains `.table-header`, `.download-table-button`, and `.remove-table-button` styles. No changes required; the existing styles already render the buttons correctly in isolation.

### New Files

- **`.claude/commands/e2e/test_csv_download_alignment.md`** — New E2E test that validates the download button is visually grouped next to the remove button in the table header.

## Step by Step Tasks

### 1. Fix button grouping in `displayTables()` in `main.ts`

- Open `app/client/src/main.ts`
- Locate the `displayTables()` function (around line 208)
- Find the block where `downloadButton` and `removeButton` are appended to `tableHeader`:
  ```js
  tableHeader.appendChild(tableLeft);
  tableHeader.appendChild(downloadButton);
  tableHeader.appendChild(removeButton);
  ```
- Wrap `downloadButton` and `removeButton` in a new container div:
  ```js
  const buttonGroup = document.createElement('div');
  buttonGroup.style.display = 'flex';
  buttonGroup.style.alignItems = 'center';
  buttonGroup.appendChild(downloadButton);
  buttonGroup.appendChild(removeButton);

  tableHeader.appendChild(tableLeft);
  tableHeader.appendChild(buttonGroup);
  ```
- Save the file

### 2. Create E2E test for CSV download button alignment

- Read `.claude/commands/test_e2e.md`, `.claude/commands/e2e/test_basic_query.md`, and `.claude/commands/e2e/test_csv_download.md` to understand the test file format
- Create `.claude/commands/e2e/test_csv_download_alignment.md` that:
  - Loads sample data (Products)
  - Verifies a `.download-table-button` exists inside the `products` table card
  - Verifies the download button and remove button are siblings within the same parent element (i.e. they share a common parent that is a child of `.table-header`)
  - Alternatively, verifies via bounding box that the download button's right edge is adjacent to (immediately left of) the remove button's left edge
  - Takes a screenshot of the table card header to visually confirm alignment
  - Verifies the download button still works (triggers the download endpoint)

### 3. Run validation commands

- Execute all validation commands listed below to confirm zero regressions

## Validation Commands

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_csv_download_alignment.md` to validate the alignment fix works
- `cd app/server && uv run pytest` — Run server tests to validate the bug is fixed with zero regressions
- `cd app/client && bun tsc --noEmit` — Run frontend type check to validate the bug is fixed with zero regressions
- `cd app/client && bun run build` — Run frontend build to validate the bug is fixed with zero regressions

## Notes

- The fix is a minimal one-function change in `main.ts` — no CSS changes needed
- The existing `.download-table-button` styles already include proper sizing (`width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center`) so no new CSS is required
- The existing `test_csv_download.md` E2E test verifies download functionality; the new test focuses on layout/alignment correctness
