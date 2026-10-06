# 生产并发与目标校验

生产分支、域名和 alias 是共享写入目标。先检查现有 CI/CD 的并发组、部署队列或提供方串行能力，优先复用；本地目录锁只覆盖同一主机，不代表跨主机互斥。

## 本地互斥回退

A production URL, Vercel production alias, or production branch is a shared mutable target. Serialize changes to the same production target using the project’s actual concurrency mechanism.

Before running any command that can change production, including `vercel --prod`, `vercel promote`, `vercel alias set`, or pushing to a branch that auto-deploys production:

- Derive a lock key from the repository remote, Vercel project name, and production domain or alias.
- Acquire an exclusive local lock before the production-mutating command. If the provider/CI has no applicable serialization and all relevant writers are on this host, use an atomic directory lock under `$env:TEMP\cs-ending-time-locks\<lock-key>.lock`; record repo root, branch, base commit, target commit, deployment URL, Vercel project, alias/domain, timestamp, and delivery target in the lock metadata.
- If the lock already exists, do not deploy over it. Inspect the metadata, report the active delivery, and wait or ask the user which delivery owns production.
- When the project uses preview promotion, verify that exact preview before promotion. For an existing direct production pipeline, preserve its tested build-and-deploy flow; do not invent an extra preview requirement.
- After acquiring the lock, re-check the current production state with `git fetch`, the target branch HEAD, and `vercel inspect` or the Vercel dashboard. If production advanced after the preview was built, stop and rebuild/rebase instead of promoting stale output.
- Release owned locks in a finally/cleanup path after verification or failure, recording the outcome. Never remove another active lock. For a suspected stale lock, inspect its owner/process and remote state; ask only if ownership cannot be established.
