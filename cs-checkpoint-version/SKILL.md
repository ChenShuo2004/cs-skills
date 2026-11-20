---
name: cs-checkpoint-version
description: "在大改或高风险修改前保存当前 Git 仓库的可恢复回退点（保留分支、HEAD、staged/unstaged diff 和未跟踪文件），或在用户明确要求时恢复历史回退点。触发词包括 $cs-checkpoint-version、保存当前版本、方便回退、回退点、checkpoint、rollback、restore checkpoint。"
---

<!-- CS Skills · 陈硕 | https://github.com/ChenShuo2004/cs-skills -->

# CS Checkpoint Version

为单个 Git 仓库创建本地文件级回退点。默认不创建提交、不切换分支，完整保存当前分支、HEAD、staged diff、unstaged diff 与未跟踪的非忽略文件。

## 硬规则

- 仅作用于单个 Git 仓库根目录，先用 `git rev-parse --show-toplevel` 确认。
- 只在用户请求或高风险改动前创建回退点，不为常规小改动每次快照；若 HEAD、staged/unstaged diff 和未跟踪文件均未变化，可复用已验证回退点。
- 默认保存在仓库 `.codex-checkpoints/` 下（建议已加入 `.gitignore`）；除非用户明确要求，不自动创建 Git checkpoint commit。
- 包含 staged、unstaged 和未跟踪的非忽略文件；不打包依赖目录、构建产物、缓存或密钥等忽略文件。
- 除非用户明确要求回滚或恢复，绝不执行恢复。
- 恢复前必须自动保存当前脏工作区的 `pre-restore` 回退点；`-CleanUntracked` / `--clean-untracked` 仅在用户要求彻底清理回退点之后新增的未跟踪文件时开启（脚本自动排除 `.codex-checkpoints/`）。

## 保存回退点

优先使用跨平台 Node.js 脚本 [`scripts/checkpoint.mjs`](scripts/checkpoint.mjs)（macOS / Linux / Windows 通用）：

```bash
git rev-parse --show-toplevel
git status --short --branch
node "<skill-root>/scripts/checkpoint.mjs" save --repo "<repo-root>" --slug "before-refactor"
```

Windows PowerShell 环境也兼容原脚本 [`scripts/create-checkpoint.ps1`](scripts/create-checkpoint.ps1)：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\scripts\create-checkpoint.ps1" -Repo "<repo-root>" -Slug "before-refactor"
```

完成后报告：回退点目录、分支与 HEAD、是否捕获 staged / unstaged / 未跟踪文件，以及对应的恢复命令。

## 恢复回退点（仅用户明确要求时）

1. 查看可用回退点与 `metadata.json`：

```bash
node "<skill-root>/scripts/checkpoint.mjs" list --repo "<repo-root>"
```

2. 用户已明确指定要恢复某个回退点时，直接恢复（不重复索要同一确认）；目标模糊时先问清楚要恢复哪一个：

```bash
node "<skill-root>/scripts/checkpoint.mjs" restore --repo "<repo-root>" --checkpoint "<checkpoint-path>" --force
# 仅在用户要求精确移除回退点后新增的未跟踪文件时追加：--clean-untracked
```

PowerShell 兼容命令（[`scripts/restore-checkpoint.ps1`](scripts/restore-checkpoint.ps1)）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\scripts\restore-checkpoint.ps1" -Repo "<repo-root>" -Checkpoint "<checkpoint-path>" -Force
```

3. 恢复后验证 `git status --short --branch`、`git diff --cached --stat` 和 `git diff --stat`。

## 产物结构与验证

每个回退点目录包含：`metadata.json`、`status.txt`、`status-porcelain.txt`、`staged.patch`、`unstaged.patch`、`untracked-files.txt`，以及存在未跟踪文件时的 `untracked.zip`。

修改脚本后运行跨平台回归测试：

```bash
node --test "<skill-root>/tests/checkpoint.test.mjs"
```
