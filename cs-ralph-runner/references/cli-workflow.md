# Ralph CLI 操作

路径相对 Skill 根目录。执行前以本机 ralph help 和 codex exec --help 核对参数；以下为模板，不改宿主授权或沙箱。--no-commit 仅禁提交，不是 dry-run。

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

Only if installing this dependency is authorized and allowed by references/run-policy.json, install it; otherwise report the missing tool:

```powershell
npm.cmd i -g @iannuttall/ralph
```

Then re-run `ralph.cmd help`.

Ralph build uses shell scripts internally. On Windows, if `ralph.cmd build` fails to start because `.sh` scripts cannot be launched, use Git Bash directly from the target project:

```powershell
$env:AGENT_CMD = "codex.cmd exec -"
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
AGENT_CMD="codex.cmd exec -"
PRD_AGENT_CMD="codex.cmd exec {prompt}"
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

Keep stories independently verifiable and sized to the current task. Split only at real page, API, data model, state flow, or verification boundaries; do not target a fixed story count.

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

Default no-commit build (executes work and can modify files):

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
