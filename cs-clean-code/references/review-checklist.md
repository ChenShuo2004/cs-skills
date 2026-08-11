# Clean Code Review Checklist

Use this reference when the cleanup is broader than a local edit, especially before a handoff, commit, PR, or milestone close.

## Requirement Alignment

- What did the user actually ask for?
- Which requirement document, README section, issue, or task note defines success?
- Does the code implement the full workflow, or only the visible happy path?
- Did any requirement change during the conversation?
- Are assumptions named when the requirement is incomplete?

## Business Flow

Trace the main path:

1. User action or external input.
2. Validation and permission checks.
3. Data transformation.
4. Persistence or external calls.
5. UI/API response.
6. Error and retry behavior.
7. Logging, observability, or user feedback when relevant.

If one of these steps is missing, either fix it or explain why the project does not need it.

## Maintainability

- Remove dead branches, stale TODOs, unused imports, and duplicated conditionals.
- Prefer project-local helpers over new global abstractions.
- Keep names close to the business concept.
- Keep modules within their existing ownership boundary.
- Avoid cleverness that makes the next edit harder.
- Comments should explain why a surprising choice exists, not narrate obvious assignments.

## Docs Sync

Update docs when code changes affect:

- install or run commands
- environment variables
- routes or API contracts
- database tables or schemas
- generated artifacts
- user-facing workflows
- deployment, verification, or troubleshooting

Keep agent instructions short. Put full external-facing guidance in README or docs.

## Verification

Choose the smallest check that proves the behavior:

- unit test for isolated logic
- integration test for API/data flow
- typecheck or build for shared contracts
- lint for style-sensitive code
- browser check for UI flows
- manual command or sample request for scripts and CLIs

If a check cannot run, record the command attempted, the blocker, and the residual risk.
