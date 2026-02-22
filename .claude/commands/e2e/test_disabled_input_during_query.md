# E2E Test: Input Disabled During Query Execution

Test that the query input area (textarea, Query button, Random Query button) is disabled while a query is running and re-enabled after completion.

## User Story

As a user
I want the input area to be disabled while a query is running
So that I cannot accidentally submit duplicate requests or modify the query mid-flight

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. Click the "Upload Data" button to open the upload modal
4. Click the "Users Data" sample data button to load sample data
5. Wait for the upload modal to close and tables to appear
6. **Verify** the "users" table appears in the Available Tables section
7. Type "Show me all users" in the query input textarea
8. Take a screenshot showing the query typed in the input
9. Click the Query button
10. **Immediately** verify the textarea (`#query-input`) has the `disabled` attribute
11. **Immediately** verify the Random Query button (`#random-query-button`) has the `disabled` attribute
12. **Immediately** verify the Query button (`#query-button`) has the `disabled` attribute
13. Take a screenshot showing the disabled state of all inputs
14. Wait for the query results to appear
15. **Verify** the textarea is re-enabled (no `disabled` attribute)
16. **Verify** the Random Query button is re-enabled (no `disabled` attribute)
17. **Verify** the Query button is re-enabled (no `disabled` attribute)
18. **Verify** query results are displayed in the results section
19. Take a screenshot of the final state showing re-enabled inputs and results

## Success Criteria
- Textarea is disabled during query execution
- Random Query button is disabled during query execution
- Query button is disabled during query execution
- All inputs are re-enabled after query completes
- Query results display correctly
- 4 screenshots are taken
