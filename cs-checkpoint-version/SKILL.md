---
name: cs-checkpoint-version
description: |
  Use when the user asks to save the current repository version, create a rollback point, checkpoint dirty worktree changes, preserve staged/unstaged/untracked files before risky edits, or restore a prior checkpoint. Trigger for "$cs-checkpoint-version", "保存当前版本", "方便回退", "回退点", "checkpoint", "rollback", "restore checkpoint", or similar wording.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# Checkpoint Version

## Purpose

Use this skill to create a local, file-based rollback point for one Git repository.

The default goal is safety: preserve the current branch, HEAD, staged diff, unstaged diff, and untracked files without creating a commit or changing the branch.

## Rules

- Work in one Git repository root. Confirm with `git rev-parse --show-toplevel`.
- Create checkpoints before risky edits, broad refactors, dependency changes, generated asset changes, or user-requested rollback protection.
- Default to a safe snapshot under `.codex-checkpoints/`; do not commit unless the user explicitly asks for a Git checkpoint commit.
- Include staged, unstaged, and untracked non-ignored files. Do not include ignored files such as dependencies, builds, caches, or secrets.
- Never restore a checkpoint unless the user explicitly asks to roll back or restore.
- Before restore, preserve the current worktree with a `pre-restore` checkpoint.

## Save Workflow

1. Inspect the repository:

```powershell
git rev-parse --show-toplevel
git status --short --branch
```

2. Pick a short slug from the task, such as `before-refactor`, `before-release`, or `current-version`.

3. Run the bundled script from this skill:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\scripts\create-checkpoint.ps1" -Repo "<repo-root>" -Slug "current-version"
```

4. Report:

- checkpoint directory
- branch and HEAD
- whether staged, unstaged, and untracked files were captured
- restore command

## Restore Workflow

Use this only after the user explicitly asks to restore a checkpoint.

1. Inspect available checkpoints:

```powershell
Get-ChildItem -Directory "<repo-root>\.codex-checkpoints" | Sort-Object Name -Descending
```

2. Read the checkpoint metadata:

```powershell
Get-Content "<checkpoint-path>\metadata.json" -Raw
```

3. Restore with the bundled script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\scripts\restore-checkpoint.ps1" -Repo "<repo-root>" -Checkpoint "<checkpoint-path>" -Force
```

Add `-CleanUntracked` only when the user wants an exact rollback that removes untracked files created after the checkpoint. The restore script excludes `.codex-checkpoints/` from `git clean`.

4. Verify after restore:

```powershell
git status --short --branch
git diff --cached --stat
git diff --stat
```

## Script Outputs

`scripts/create-checkpoint.ps1` writes:

- `metadata.json`: branch, HEAD, timestamp, counts, and restore hint
- `status.txt`: branch-aware short status
- `status-porcelain.txt`: exact status entries with untracked files expanded
- `staged.patch`: binary-safe staged diff
- `unstaged.patch`: binary-safe unstaged diff
- `untracked-files.txt`: untracked non-ignored file list
- `untracked.zip`: untracked file archive when untracked files exist

`scripts/restore-checkpoint.ps1` resets to the checkpoint HEAD, reapplies staged and unstaged patches, restores untracked files, and creates a `pre-restore` checkpoint when the current worktree is not clean.

## Common Mistakes

| Mistake | Correct behavior |
| --- | --- |
| Treating checkpoint as a commit | Use file snapshots by default; commit only when requested. |
| Saving only `git diff` | Also capture staged diff and untracked files. |
| Restoring without preserving current state | Let the restore script create `pre-restore` first. |
| Including ignored outputs | Keep dependencies, build folders, caches, logs, and secrets out. |
| Running restore for a vague request | Ask which checkpoint to restore before changing files. |

## Verification

Run the bundled tests after editing the scripts:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\tests\cs-checkpoint-version.tests.ps1"
```
