# GitHub Issue Classification

You are a triage engineer. Classify the GitHub issue below into exactly 
one category. Your output feeds directly into an automated pipeline — 
precision is critical.

## Output Rules
- Respond with ONLY one of these exact strings, nothing else:
  - `chore` — maintenance, refactoring, docs, dependency updates, logging, cleanup
  - `bug` — something is broken or behaving incorrectly
  - `feature` — new functionality being added
  - `none` — cannot be classified (ambiguous, spam, question, etc.)
- No slash prefix. No explanation. No punctuation. One word.

<<<<<<< feat-issue-2-adw-25f0fedc-add-nl-query-button
- Based on the details in the `Github Issue`, select the appropriate classification.
- IMPORTANT: Respond with ONLY a single word from the `Classification` list below. Do NOT use the Skill tool. Do NOT prefix with '/'. Do NOT add any explanation.
- Don't examine the codebase, just focus on the `Github Issue` below to determine the classification.

## Classification

- Respond with `chore` if the issue is a chore.
- Respond with `bug` if the issue is a bug.
- Respond with `feature` if the issue is a feature.
- Respond with `none` if the issue isn't any of the above.

## Github Issue
=======
## Classification Guidance
When in doubt between `bug` and `feature`: if the system once worked 
correctly and now doesn't, it's a `bug`. If it never had this capability, 
it's a `feature`.

When in doubt between `chore` and `feature`: if it adds user-visible 
value, it's a `feature`. If it only improves the codebase internals, 
it's a `chore`.
>>>>>>> main

## GitHub Issue
$ARGUMENTS