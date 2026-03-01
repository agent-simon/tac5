# E2E Test: Delete Table

Test deleting a loaded table from the Natural Language SQL Interface application.

## User Story

As a user
I want to remove tables I no longer need
So that I can keep my workspace clean and avoid querying stale data

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the Available Tables section (`#tables-section`) shows "No tables loaded" (`.no-tables` element is present)
4. Load sample Users data: click the "Upload Data" button (`#upload-data-button`), then click the "Users Data" sample button in the modal
5. Wait for the modal to close and for "users" to appear in the Available Tables section (`#tables-list`)
6. **Verify** a `.table-card` element is present inside `#tables-list`
7. **Verify** the table card contains a remove button (`.remove-table-button`) with "×"
8. Take a screenshot showing the loaded table with the remove button
9. Click the remove `button (`.remove-table-button`) on the users table card
10. A confirmation dialog will appear — accept it
11. Wait for the table to be removed from the Available Tables section
12. **Verify** the `#tables-list` section shows "No tables loaded" again (`.no-tables` element is present)
13. Take a screenshot of the final state showing no tables

## Success Criteria

- Sample data loads successfully and a table card appears
- The remove button (×) is visible on the table card
- Clicking the remove button triggers a confirmation dialog
- After confirming, the table is deleted and the empty state message returns
- 3 screenshots are taken
