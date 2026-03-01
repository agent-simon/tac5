# E2E Test: Rerun Favorite Query

Test that clicking a favorite item in the favorites panel populates the query textarea and executes the query.

## User Story

As a data analyst
I want to click a saved favorite to instantly rerun it
So that I can quickly repeat frequent queries without retyping them

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the page title is "Natural Language SQL Interface"
4. Load sample Users data: click the "Upload Data" button (`#upload-data-button`), then click the "Users Data" sample button in the modal
5. Wait for the modal to close and for "users" to appear in the Available Tables section (`#tables-list`)
6. Enter the query "Show me all users" in the query input textarea (`#query-input`)
7. Click the "Query" button (`#query-button`) and wait for the results section (`#results-section`) to appear
8. **Verify** the results section is visible and contains data
9. Click the star icon (`#star-button`) to save the query as a favorite
10. **Verify** the star icon has the CSS class `starred`
11. Take a screenshot showing the starred query
12. Click the "☆ Favorites" button (`#favorites-button`) to open the favorites panel
13. **Verify** the favorites panel (`#favorites-panel`) has the CSS class `open`
14. **Verify** the panel contains a `.favorite-item` element with text "Show me all users"
15. Take a screenshot of the favorites panel with the saved item
16. Click the `.favorite-item` element containing "Show me all users"
17. **Verify** the favorites panel (`#favorites-panel`) no longer has the CSS class `open` (panel closed)
18. **Verify** the query input textarea (`#query-input`) contains the text "Show me all users"
19. **Verify** the results section (`#results-section`) is visible with query results
20. **Verify** the results table contains data rows
21. Take a screenshot of the final state showing the populated query and results

## Success Criteria
- Clicking a `.favorite-item` closes the favorites panel
- The query textarea is populated with the favorite's query text
- The query is automatically executed and results are displayed
- 4 screenshots are taken
