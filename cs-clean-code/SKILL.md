---
name: cs-clean-code
description: |
  Use when Codex needs to clean up code, refactor safely, review implementation quality, reconcile code with requirements, update docs after development, or prepare a maintainable handoff. Trigger for "clean code", "整理代码", "代码洁癖", "重构一下", "收尾", "新人能看懂", "review this implementation", "make it maintainable", or any request where correctness, business logic, docs, tests, and verification need to line up. This is ChenShuo's engineering cleanup skill: requirements first, business flow closed loop, small scoped edits, and verified output.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# Clean Code

## Purpose

Use this skill as ChenShuo's code quality and handoff layer.

The goal is not to make code look elegant in isolation. The goal is to make the implementation match the requirement, keep business logic complete, remove avoidable complexity, and leave the project easier for the next human or agent to continue.

## When To Use

- The user asks to clean, refactor, organize, simplify, review, or polish code.
- A feature is implemented but needs a final quality pass before commit, PR, or handoff.
- Docs, README, AGENTS.md, or task notes may be stale after code changes.
- The code works, but the data flow, state flow, errors, tests, or naming feel messy.
- The user says "收尾", "整理一下", "新人能直接上手", "代码洁癖", or "clean code".

Do not use this skill for purely visual design work unless code maintainability is also part of the task.

## ChenShuo Principles

- Requirements first: read the PRD, README, AGENTS.md, docs, task notes, and existing tests before changing code.
- Business logic over surface polish: trace the user goal, inputs, outputs, state transitions, permissions, and failure paths.
- Small edits: fix the real problem without unrelated rewrites.
- Consistency: follow the project's existing framework, naming, directory structure, and helper APIs.
- Verification: every meaningful cleanup should end with a concrete check, even if the check is a targeted manual inspection.
- Handoff quality: docs and code should tell the same story.

## Workflow

1. Inspect the project context.
   Read the relevant docs and list the files or modules that own the behavior.

2. Map the logic before editing.
   Identify the user goal, inputs, outputs, core flow, edge cases, error states, and affected public contracts.

3. Classify the cleanup.
   Decide whether the task is correctness cleanup, maintainability cleanup, docs sync, test coverage, or handoff preparation.

4. Edit with the smallest useful scope.
   Prefer local simplification, clearer names, duplicate removal, safer guards, and better boundaries over broad architecture changes.

5. Synchronize knowledge.
   If behavior, commands, routes, environment variables, data structures, or workflow changed, update the relevant README, docs, or agent instructions.

6. Verify.
   Run focused tests, lint, typecheck, build, or manual checks. If verification is blocked, say exactly what was blocked and why.

For broad reviews or milestone cleanup, read [references/review-checklist.md](references/review-checklist.md).

## Cleanup Levels

### L1 Correctness

- The implementation matches the documented requirement.
- Data flow, state flow, and error flow are complete.
- Edge cases are handled where the project already expects handling.
- Public APIs, routes, schemas, and return values remain compatible unless the user asked to change them.

### L2 Maintainability

- Names describe business meaning, not temporary implementation details.
- Shared behavior lives in the right local abstraction, but no abstraction is added just to look tidy.
- Dead code, stale comments, repeated branches, and unused paths are removed when safe.
- Complex blocks have short useful comments only where they prevent future confusion.

### L3 Knowledge Sync

- README and docs reflect how the code actually runs.
- AGENTS.md or project agent notes contain only rules that future agents need to avoid mistakes.
- Historical narration does not crowd out current instructions.
- Relative dates are replaced with concrete dates when timing matters.

### L4 Verification

- Tests or checks cover the changed behavior at the right level.
- Manual verification steps are concrete enough for the user to repeat.
- Remaining risk is named directly.

## Output Expectations

After work, report using the project format:

- 需求理解
- 实现方案
- 关键逻辑
- 修改文件
- 验证方式
- 风险与待确认

For code review, lead with findings first and include file/line references.

## Boundaries

- Do not rewrite working modules just because another style looks nicer.
- Do not silently change public contracts, schemas, or data formats.
- Do not delete user changes you did not make.
- Do not add dependencies unless the repo cannot reasonably solve the problem without them.
- Do not claim cleanup is complete without verification or a clear verification blocker.
