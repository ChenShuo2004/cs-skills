# Frontend Execution Contract

Use this reference only after selecting the work mode in `SKILL.md`. Keep the delivered contract compact: it is a decision record and acceptance surface, not a PRD rewrite.

## Build Page Spec

```text
Mode: Build
Screen / route:
Primary user and job:
Trigger and starting context:
Primary action → expected result:
Inputs, data source, permissions, and side effects:
Information hierarchy:
  1. Primary decision or action
  2. Supporting context
  3. Secondary actions
Required states and recovery paths:
Responsive behavior:
Accessibility considerations:
Existing components / tokens / assets to reuse:
Acceptance criteria:
Non-goals:
```

Use observable acceptance criteria. For example: “At 375px, the primary action remains visible and the table becomes a readable list” is testable; “mobile should look good” is not.

## Iterate Change Brief

```text
Mode: Iterate
Existing route / component:
User problem and evidence:
Change requested:
Must preserve:
Affected states and breakpoints:
Acceptance criteria:
Non-goals:
```

Preserve the existing product goal and component ownership unless the user explicitly asks for a wider redesign.

## Review Report

```text
Scope reviewed:
P0 / P1 findings:
P2 / P3 findings:
Evidence (file, route, viewport, or reproduction):
Smallest recommended next action:
Checks not run and why:
```

Review findings must distinguish a confirmed defect from a design recommendation or an assumption that needs user confirmation.

## State Matrix Guidance

Start from the real actions and data dependencies in the Page Spec.

- Use **loading** where an action or data source can be pending.
- Use **empty** where a successful request can produce no usable content.
- Use **error** where a user can recover, retry, correct input, or contact support.
- Use **success / selected** where the user needs confirmation of the completed action or current mode.
- Use **disabled / destructive** where prerequisites are absent or an action is irreversible.

If a state is not applicable, record the reason in the final report instead of silently omitting it.

## Verification Evidence

```text
Check: build | typecheck | lint | browser | manual
Command or route:
Viewport / environment:
Action performed:
Observed result:
Status: passed | failed | blocked
Blocker and residual risk (if any):
```

For browser checks, verify the primary action plus the most failure-prone state. At minimum inspect one desktop and one narrow mobile viewport when the route is responsive.
