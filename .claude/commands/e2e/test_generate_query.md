# E2E Test: Generate Query Button

Test the Generate Query button functionality in the Natural Language SQL Interface application.

## User Story

As a data analyst
I want to click a button that auto-generates an interesting natural language query based on my loaded data
So that I can quickly discover insights without having to think of what questions to ask first

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial page state
3. **Verify** the "Generate Query" button is visible in the query controls section with class `secondary-button`

4. Open the Upload Data modal by clicking the "Upload Data" button
5. Click the "Users Data" sample button to load sample data
6. Wait for the modal to close and **Verify** the "users" table appears in the Available Tables section
7. Take a screenshot showing the loaded table

8. Click the "Generate Query" button
9. Wait for the button text to return to "Generate Query" (API call complete)
10. Take a screenshot showing the populated query input textarea
11. **Verify** the query input textarea contains a non-empty string

12. Click the "Query" button to execute the generated query
13. **Verify** the results section appears with SQL translation and result rows
14. Take a screenshot of the results

## Success Criteria
- "Generate Query" button is present with `secondary-button` class
- After clicking, the query textarea is populated with a non-empty natural language query
- The generated query, when executed via the Query button, returns results without error
- 4 screenshots are taken
