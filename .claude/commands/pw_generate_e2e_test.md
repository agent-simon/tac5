# Generate E2E Test File

Generate a new E2E test markdown file for a specific feature.

## Variables
feature_description: $1
test_file_name: $2

## Instructions

- Read these existing test files to understand the exact format and patterns:
  - `.claude/commands/e2e/test_basic_query.md`
  - `.claude/commands/e2e/test_save_query_favorites.md`
  - `.claude/commands/test_e2e.md` to understand how tests are executed
- Read `app/client/index.html` to understand available UI elements,
  CSS classes, and element IDs you can reference in test steps
- Read `app/server/server.py` to understand available API endpoints
- IMPORTANT: Only reference UI elements that actually exist in index.html
  - Use exact CSS classes and IDs from the source — do not invent selectors
  - Prefer elements with id attributes over class selectors
- Generate a new test file at `.claude/commands/e2e/{test_file_name}.md`
- Follow this exact structure from the existing test files:
  - User Story section
  - Test Steps with **Verify** assertions
  - Success Criteria with screenshot count
- Keep tests minimal — validate the feature works, not every edge case
- Every **Verify** step must reference a selector that exists in index.html

## Feature to Test
$1

## Report
- Path to the generated test file
- List of UI elements referenced and where they were found in index.html
- Any elements you could not find (flag these — do not invent selectors)