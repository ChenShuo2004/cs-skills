---
name: ralph-runner
description: Use when the user wants Codex to turn a Markdown requirements document into a Ralph PRD and run a safe Ralph/Codex build workflow against a local Git repository. Triggers include "ralph-runner", "run Ralph", "generate Ralph PRD", or requests to run a Markdown PRD against a repo.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# Ralph Runner

## Purpose

Use this skill to run a controlled local workflow in Codex:

1. Read a Markdown requirements document.
2. Resolve a target Git repository from a project alias, explicit path, or the current workspace.
3. Generate a Ralph-compatible PRD JSON in the target project.
4. Run `ralph` overview and a safe dry-run build through Codex.
5. Show the user the planned commands as an informational preview, then continue automatically.
6. Report paths, commands, logs, git state, and next steps.

This skill is for Codex desktop/local CLI workflows. It is not a graphical project picker.

## `$` Workflow Triggers

- `$ralph-runner`: generic Markdown requirements to Ralph PRD and safe build workflow.
- `$auto-cutting-ralph`: automatic video editing requirements to Ralph PRD, dry-run build, output generation plan, and verification feedback.
- `$auto-cutting-prd`: automatic video editing requirements or PRD only, without running Ralph build unless requested.
- `$auto-render-video`: direct render workflow; use Ralph only if the user asks for implementation automation.

## Inputs

Require these before running:

- Markdown requirements document path (`.md`).
- Target project, which can be:
  - a project alias from `references/projects.json`, such as `web-app`;
  - an absolute local repository path, such as `<repo-path>`;
  - a relative repository path, resolved from the current workspace;
  - `.` or `current repo` to use the current working directory.

Optional inputs:

- Iteration count, default `1`.
- Commit permission, default `false`.
- Existing PRD JSON path, only if the user wants to skip PRD generation.

If the document path is missing, ask for it before executing commands. If the target project is missing and the current working directory is a Git repository, use the current working directory as the target. If the current working directory is not a Git repository, ask for an alias or path.

## Run Policy

Read `references/run-policy.json` before executing. It stores the default behavior that was agreed once and should be reused on later runs.

Default policy:

- Auto-run after required inputs are present.
- Execution previews are informational, not confirmation gates.
- Default mode is dry-run with `--no-commit`.
- Default iteration count is `1`.
- Stop on dirty worktrees.
- Require explicit permission for commit-enabled runs.

Do not ask the user for routine confirmation after the Markdown document and target project are known. Continue automatically through PRD generation, overview, and dry-run build.

Ask only when one of these is true:

- Required input is missing.
- Project alias is unknown and the provided target cannot be resolved as a valid local path.
- Target path does not exist or is not a Git repository.
- `git status --short` is dirty before the run.
- A command would overwrite existing Ralph config.
- The user requests a commit-enabled run but did not explicitly allow commit.
- A required tool is missing and the policy does not allow auto-install.

## Project Aliases and Paths

Read `references/projects.json` before resolving aliases. Its shape is:

```json
{}
```

Resolve the target project in this order:

1. If the target is `.` or says `current repo` / `current workspace`, use the current working directory.
2. If the target matches a key in `references/projects.json`, use the mapped path.
3. If the target is an absolute path, use it directly.
4. If the target is a relative path, resolve it from the current working directory.
5. If no target was provided and the current working directory is a Git repository, use the current working directory.

If an alias is unknown and the same value cannot be resolved to an existing path, show the known aliases and ask the user to choose an alias or provide a path. Do not require users to edit `projects.json` just to run Ralph in a one-off repository.

## Safety Rules

- Never run in a non-Git directory.
- Never run a formal commit build unless the user explicitly says commit is allowed, such as "allow commit", "commit is allowed", "formal run", "run with commit", or the equivalent in the user's language.
- Default build command must include `--no-commit`.
- If `git status --short` is not clean before the run, stop and summarize the existing changes. Ask before continuing.
- Prefer Windows `.cmd` shims in PowerShell: `codex.cmd`, `npm.cmd`, `ralph.cmd`.
- If PowerShell blocks `.ps1` scripts, do not change execution policy; use `.cmd`.
- Do not use the Obsidian vault as the target project unless the user explicitly provides that path or an alias points there and it is a Git repo.

## Visibility Rules

Before running `ralph.cmd prd`, `ralph.cmd overview`, `ralph.cmd build`, or a Git Bash fallback, send the user an execution preview in chat. This preview is informational only; continue automatically unless the Run Policy requires stopping.

- Requirement document path.
- Project target label and resolved path.
- PRD output path.
- Iteration count.
- Dry-run or commit-enabled mode.
- Exact command or commands about to run.
- Where full output will be saved.

During execution:

- Run commands in the foreground so the terminal output remains visible.
- Do not hide command output behind silent redirects.
- If capturing output, tee it to both the terminal and a log file.
- For PowerShell, prefer this pattern:

```powershell
New-Item -ItemType Directory -Force -Path ".ralph\runs" | Out-Null
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$log = ".ralph\runs\ralph-visible-<purpose>-$stamp.log"
ralph.cmd build 1 --agent=codex --prd ".agents/tasks/prd-<short-slug>.json" --no-commit 2>&1 | Tee-Object -FilePath $log
```

After each Ralph build command:

- Inspect `.ralph/runs/` for new `run-*-iter-*.md` and `run-*-iter-*.log` files.
- Show the user one section per iteration with:
  - Run ID and iteration.
  - Story ID/title.
  - Status.
  - Whether it was no-commit.
  - Verification results.
  - Full run summary/log paths.
  - A short tail of the terminal output if the log is long.
- Do not paste huge logs in full; provide the full path and summarize the important output.

## Preflight

Run these checks in the target project:

```powershell
Test-Path -LiteralPath "<project-path>"
git -C "<project-path>" rev-parse --show-toplevel
git -C "<project-path>" status --short
codex.cmd --version
ralph.cmd help
Get-Command bash -ErrorAction SilentlyContinue
Test-Path -LiteralPath "<Git Bash path>"
```

If `ralph.cmd` is missing, install it:

```powershell
npm.cmd i -g @iannuttall/ralph
```

Then re-run `ralph.cmd help`.

Ralph build uses shell scripts internally. On Windows, if `ralph.cmd build` fails to start because `.sh` scripts cannot be launched, use Git Bash directly from the target project:

```powershell
$env:AGENT_CMD = "codex.cmd exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -"
$env:PRD_PATH = ".agents/tasks/prd-<short-slug>.json"
New-Item -ItemType Directory -Force -Path ".ralph\runs" | Out-Null
$stamp = Get-Date -Format yyyyMMdd-HHmmss
& "<Git Bash path>" ".agents/ralph/loop.sh" build 1 --no-commit 2>&1 | Tee-Object -FilePath ".ralph\runs\ralph-visible-build-$stamp.log"
```

Only remove `--no-commit` when the user explicitly allows commit.

## Initialize Ralph

From the target project:

```powershell
ralph.cmd install
```

If prompted to install skills, choose Codex and local project scope. If `.agents/ralph` already exists, do not overwrite unless the user explicitly asks.

After install, ensure `.agents/ralph/config.sh` has Codex commands compatible with this Windows environment:

```bash
AGENT_CMD="codex.cmd exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -"
PRD_AGENT_CMD="codex.cmd exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check {prompt}"
```

If the config already has custom `AGENT_CMD` values, preserve unrelated settings and ask before replacing them.

## PRD Generation

Default behavior: generate a Ralph PRD from the Markdown requirements document.

Preferred target:

```text
.agents/tasks/prd-<short-slug>.json
```

Use a Ralph-compatible schema:

```json
{
  "version": 1,
  "project": "Project name",
  "qualityGates": [
    "Run the project's relevant typecheck, tests, or build command",
    "Keep git diff limited to the selected story"
  ],
  "stories": [
    {
      "id": "US-001",
      "title": "Short story title",
      "description": "What this story should accomplish",
      "acceptanceCriteria": [
        "Concrete, verifiable criterion"
      ],
      "dependsOn": [],
      "status": "open"
    }
  ]
}
```

Keep stories small enough for one Codex run. Prefer 3-8 stories for a normal feature. Split large requests by page, API, data model, state flow, or verification path.

For automatic video editing requirements, first load the `auto-cutting` skill and read:

```text
../auto-cutting/references/optimized-ralph-workflow.md
```

Then generate stories around the full closed loop: requirements and output mode, material manifest, metadata probing, editing plan, output generation, subtitles/audio, and verification report. If the user asks for direct video output, the PRD must include a render plan path, the render command, and the report path. Prefer the `li-auto-auto-cutting` project alias when the user does not provide another target.

If using `ralph.cmd prd` is reliable for the document size, it is acceptable:

```powershell
ralph.cmd prd "<requirements summary>" --agent=codex --out ".agents/tasks/prd-<short-slug>.json"
```

For long Markdown documents, generate the JSON file directly from the read document instead of passing the full content as a command argument.

## Run Workflow

After PRD generation, run:

```powershell
New-Item -ItemType Directory -Force -Path ".ralph\runs" | Out-Null
$stamp = Get-Date -Format yyyyMMdd-HHmmss
ralph.cmd overview --prd ".agents/tasks/prd-<short-slug>.json" 2>&1 | Tee-Object -FilePath ".ralph\runs\ralph-visible-overview-$stamp.log"
```

Default dry-run build:

```powershell
New-Item -ItemType Directory -Force -Path ".ralph\runs" | Out-Null
$stamp = Get-Date -Format yyyyMMdd-HHmmss
ralph.cmd build 1 --agent=codex --prd ".agents/tasks/prd-<short-slug>.json" --no-commit 2>&1 | Tee-Object -FilePath ".ralph\runs\ralph-visible-build-$stamp.log"
```

Only when the user explicitly allows commit:

```powershell
New-Item -ItemType Directory -Force -Path ".ralph\runs" | Out-Null
$stamp = Get-Date -Format yyyyMMdd-HHmmss
ralph.cmd build 1 --agent=codex --prd ".agents/tasks/prd-<short-slug>.json" 2>&1 | Tee-Object -FilePath ".ralph\runs\ralph-visible-build-$stamp.log"
```

Use the requested iteration count if provided. If not provided, use `1`.

## Reporting

At the end, report:

- Requirements document path.
- Project target label and resolved project path.
- PRD JSON path.
- Overview path, if generated.
- Exact commands run.
- Whether this was dry-run or commit-enabled.
- Git status before and after.
- One visible-output section per Ralph iteration.
- Log locations:
  - `.ralph/progress.md`
  - `.ralph/activity.log`
  - `.ralph/runs/`
- Any failures, blocked checks, or manual confirmations needed.

Keep the final answer concise and actionable.
