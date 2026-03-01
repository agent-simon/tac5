# E2E Coverage Gap Analysis

Analyze what app features exist vs what E2E tests cover.

## Instructions

- Run `ls .claude/commands/e2e/` to see existing test files
- Read each existing test file to understand what it covers
- Read `app/client/index.html` to identify all user-facing features:
  - Buttons and interactive elements
  - Modal dialogs
  - Form inputs and actions
  - Dynamic UI sections
- Read `app/server/server.py` to identify all API endpoints
- Compare features found against existing test coverage
- IMPORTANT: Only flag features with ZERO test coverage

## Report
Return ONLY a JSON array:
[
  {
    "feature": "short feature name",
    "description": "what the feature does",
    "coverage_status": "missing|partial",
    "suggested_test_file": "test_<name>.md",
    "priority": "high|medium|low"
  }
]