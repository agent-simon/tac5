# E2E Test: Save Query Favorites

Test the save-query-favorites feature in the Natural Language SQL Interface application.

## User Story

As a data analyst
I want to star queries I use frequently
So that I can re-run them instantly without retyping or remembering the exact phrasing

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state — confirm "Favorites" button (☆ Favorites) is visible in the header controls
3. **Verify** the "☆ Favorites" button is present in the `.query-controls` area
4. Load sample Users data: click the "Upload Data" button, then click the "Users Data" sample button in the modal
5. Wait for the modal to close and for "users" to appear in the Available Tables section
6. Enter the query "Show me all users" in the query input textarea
7. Click the "Query" button and wait for the results section to appear
8. **Verify** a star icon (☆) appears in the Query Results header (element with id `star-button`)
9. Take a screenshot showing the star icon next to the results header
10. Click the star icon (☆) with id `star-button`
11. **Verify** the star icon has changed to filled (★) and has the CSS class `starred`
12. Take a screenshot showing the filled star (★)
13. Click the "☆ Favorites" / "★ Favorites" button to open the favorites side panel
14. **Verify** the favorites side panel (`#favorites-panel`) has the CSS class `open`
15. **Verify** the panel contains one `.favorite-item` element with query text "Show me all users"
16. Take a screenshot of the favorites panel with the saved item
17. Click the "Remove" button (`.delete-favorite-btn`) on the favorite item
18. **Verify** the favorites list now shows "No favorites saved yet" (the `.no-favorites` element is present)
19. Click the close button (`#close-favorites`) to close the favorites panel
20. **Verify** the star icon in the results header is now unfilled (☆) without the `starred` class
21. Take a screenshot of the final state showing the unfilled star

## Success Criteria

- "☆ Favorites" button is visible in the header controls area
- Star icon (☆) appears in the Query Results header after a successful query
- Clicking the star saves the favorite and changes the icon to filled (★) with golden color
- The favorites side panel opens and shows the saved query item
- Clicking "Remove" deletes the favorite and the panel shows the empty state message
- After removal, the star icon in results header reverts to unfilled (☆)
- 5 screenshots are taken
