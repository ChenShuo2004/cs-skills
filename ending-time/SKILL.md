---
name: ending-time
description: |
  Use when the user asks to finish, ship, publish, commit, push, or deploy a completed implementation in one bounded delivery scope.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# Ending Time

## Purpose

Use this skill as the final-mile delivery workflow for web and app projects.

## Task Isolation (required)

This workflow closes only one bounded delivery at a time. Before any staging, commit, push, or deploy action:

- Bind one delivery target explicitly: feature/ticket name, route(s), data, and expected output.
- Run in a single repository target (do not mix parent and nested repos).
- Confirm branch and target files are scoped to that single delivery.
- Ignore unrelated worktree changes and never stage them in this workflow.
- Do not reuse deployment URLs, commit SHAs, or validation artifacts from another delivery.

If multiple tasks are detected in the same conversation or worktree, ask to split and finish one task before moving to the next.

The goal is to turn a requested page or feature into a verified delivery: requirements understood, implementation scoped, checks run, Git history clean, GitHub updated, Vercel deployment verified, and the user left with exact links and remaining risks.

## Production Deployment Concurrency (required)

A production URL, Vercel production alias, or production branch is a shared mutable target. Preview deployments can run in parallel, but anything that can change production must be serialized.

Before running any command that can change production, including `vercel --prod`, `vercel promote`, `vercel alias set`, or pushing to a branch that auto-deploys production:

- Derive a lock key from the repository remote, Vercel project name, and production domain or alias.
- Acquire an exclusive local lock before the production-mutating command. Prefer an atomic directory lock under `$env:TEMP\codex-ending-time-locks\<lock-key>.lock`; record repo root, branch, base commit, target commit, deployment URL, Vercel project, alias/domain, timestamp, and delivery target in the lock metadata.
- If the lock already exists, do not deploy over it. Inspect the metadata, report the active delivery, and wait or ask the user which delivery owns production.
- Build and verify a unique preview deployment first. Only promote that exact deployment after holding the lock.
- After acquiring the lock, re-check the current production state with `git fetch`, the target branch HEAD, and `vercel inspect` or the Vercel dashboard. If production advanced after the preview was built, stop and rebuild/rebase instead of promoting stale output.
- Release the lock only after production verification and closeout. Treat stale locks as unsafe unless the user confirms they are abandoned.

## When To Use

- The user asks to implement a page or function and publish it.
- The user asks to commit, push, submit to GitHub, deploy to Vercel, or make a change live.
- The work is already implemented but needs a reliable finish: validation, commit, push, deploy, and handoff.
- The user says "收尾", "上线", "发布", "部署", "提交 GitHub", "Vercel", "对应页面和功能实现", or "一键使用".

Do not use this skill for pure planning, pure code review, or non-Git/non-Vercel delivery unless the user explicitly asks for this finish-line workflow.

## Core Rules

- Requirements first: read `README`, `AGENTS.md`, product docs, page docs, issue notes, or deployment docs before changing code.
- Scope before staging: inspect `git status` and relevant diffs. Never stage unrelated user changes silently.
- Small edits: implement only the requested page/function/deploy support. Avoid unrelated refactors.
- Verify before publishing: do not commit or deploy a broken build unless the user explicitly accepts that state.
- GitHub and Vercel are output surfaces, not substitutes for local validation.
- Serialize production updates: preview deployments may run concurrently, but production alias/branch changes require the production lock.
- Keep secrets out of Git. Never commit `.env`, `.env.local`, tokens, project auth files, or local cache/output directories.

## Workflow

1. Orient in the repo.
   - Confirm the current working directory and Git remote.
   - Lock the delivery scope first: record feature target, route/files, branch, and commit boundary before edits.
   - Confirm the exact repo root with `git rev-parse --show-toplevel` and proceed only in that repo for this invocation.
   - Read the nearest project instructions: `AGENTS.md`, `README.md`, `docs/`, PRD files, page docs, and deploy notes.
   - Identify the framework, package manager, build command, test command, and Vercel config.

2. Restate the delivery target.
   - User goal.
   - Inputs and expected output.
   - Pages, routes, APIs, data files, or deployment config affected.
   - Assumptions and unclear requirements.

3. Plan briefly before editing.
   - List the smallest useful implementation steps.
   - Note public contracts that could be affected: routes, schemas, environment variables, permissions, data shape, or state flow.

4. Implement the requested work.
   - Follow existing project patterns, components, names, and styling.
   - Update docs when behavior, commands, env vars, routes, or deployment steps changed.
   - For frontend work, verify the real page when a browser/dev server is available.

5. Verify locally.
   - Prefer project scripts such as `npm.cmd run build`, `npm.cmd test`, `npm.cmd run lint`, `pnpm build`, `yarn build`, or repo-specific checks.
   - If scripts are missing, inspect package files and run the nearest meaningful check.
   - If verification is blocked by auth, missing env vars, external services, or local tooling, say exactly what is blocked.

6. Prepare Git.
   - Run `git status --short --branch`.
   - Inspect diffs for changed files that will be staged.
   - If the worktree is mixed, stage explicit files only.
   - If on `main`, `master`, or a protected/default branch and the user did not ask for direct commit, create a branch named `codex/<short-purpose>`.
   - Commit with a concise message that describes the delivered behavior.

7. Push to GitHub.
   - Push the current branch with tracking.
   - If the user asks for a PR, create one after push and include validation in the PR body.
   - If the user asks for direct production delivery and the repo normally deploys from the pushed branch, confirm the branch/deploy relationship.
   - If this push can update production, acquire the production lock before pushing.

8. Deploy with Vercel.
   - Prefer the repo's existing GitHub-to-Vercel integration when it is configured and the pushed branch is expected to deploy.
   - Use a unique preview deployment for parallel work, then promote the exact verified deployment while holding the production lock.
   - Use Vercel CLI as fallback or when the user asks for immediate production deployment: `vercel --prod`; this still requires the production lock.
   - If `.vercel/project.json` exists, confirm the linked project name before deployment.
   - If Vercel auth or project linking is missing, stop before guessing and report the exact command or dashboard action needed.

9. Verify the live result.
   - Capture the deployment URL.
   - Inspect Vercel output or deployment status.
   - When production changed, confirm the live alias/domain points to the expected deployment id or commit.
   - Open or request-check the relevant route when possible.
   - Confirm SPA rewrites, asset loading, API routes, and key page flows for the changed surface.

10. Report in the user's preferred closeout format.

11. Closeout binding check.
   - Before finalizing, verify the report includes:
     - delivery target name
     - repository root
     - branch
     - commit hash (or explicit "not committed")
     - staged file list
     - deployment target/project + URL
     - production lock key/path and live alias before/after, when production was changed

## Git Safety

- Do not run `git add -A` when unrelated files exist.
- Do not rewrite history, reset, force-push, or delete branches unless the user explicitly asks.
- Do not commit generated dependency folders, build output, logs, local browser caches, or secrets unless the repo intentionally tracks them.
- If pre-existing changes are present, work with them. Do not revert them.
- If a deploy requires environment variable changes, explain the required variables and where they must be configured.

## Vercel Checks

Look for these signals before deploying:

- `vercel.json`
- `.vercel/project.json`
- `.vercelignore`
- framework config such as Vite, Next.js, Remix, Astro, or SvelteKit
- build output expectations such as `dist`, `.next`, `out`, or `build`
- required environment variables from `.env.example`, docs, or runtime errors

For Vite SPA projects, ensure route refreshes are covered by rewrites, usually through `vercel.json`.

## Output Format

Use this format after completing work:

```markdown
### 需求理解
...

### 实现方案
...

### 关键逻辑
...

### 修改文件
...

### 验证方式
...

### GitHub / Vercel
...

### 风险与待确认
...
```

Include exact commands run, commit hash, branch name, remote URL or PR URL, Vercel deployment URL, and any verification blockers.

The closeout must also include these task-bound fields:
- Delivery target name
- Repository root (absolute path)
- Branch
- Commit hash or `not committed`
- Staged files
- Deployment target/project and deployment URL
- Production lock key/path and live alias before/after, when production was changed

## Common Mistakes

- Shipping before reading the page or product docs.
- Treating a successful push as a verified deployment.
- Staging the user's unrelated work because it happened to be in the same checkout.
- Deploying from the wrong Vercel project or team.
- Forgetting that preview and production deployments can use different environment variables.
- Promoting a stale preview or direct `--prod` deployment while another window is already changing the same production alias.
- Reporting "done" without a route, deployment URL, or repeatable verification step.
