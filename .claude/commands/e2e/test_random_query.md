# E2E Test: Random Query Button

Test the Random Query button functionality in the Natural Language SQL Interface application.

## User Story

As a data analyst or database user
I want to click a "Random Query" button that generates a natural language query based on my data
So that I can discover interesting questions to ask about my data and explore the interface capabilities

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the page title is "Natural Language SQL Interface"
4. **Verify** the "Random Query" button exists in the UI next to the "Upload Data" button

5. Click the "Upload Data" button to open the upload modal
6. Click the "Users Data" sample button to load sample data
7. Wait for the upload to complete and the modal to close
8. **Verify** the "users" table appears in the Available Tables section
9. Take a screenshot of the page with the users table loaded

10. Note the current content of the query input field (should be empty or have existing text)
11. Click the "Random Query" button
12. **Verify** the button shows "Generating..." text and is disabled while the request is in progress
13. Wait for the API response to complete
14. **Verify** the query input field is now populated with a non-empty string
15. **Verify** the generated text does not look like SQL (should not start with SELECT, INSERT, UPDATE, DELETE)
16. **Verify** the generated text looks like a natural language question (should end with "?" or be a descriptive phrase)
17. Take a screenshot of the populated query input field

18. Click the "Random Query" button again
19. Wait for the second API response to complete
20. **Verify** the query input field is still populated (may be same or different query)
21. Take a screenshot of the second generated query

## Success Criteria
- "Random Query" button is visible in the UI
- Button is disabled and shows "Generating..." while API call is in progress
- After API response, query input field contains a non-empty string
- The generated text is natural language, not SQL
- The button can be clicked multiple times successfully
- 3 screenshots are taken
