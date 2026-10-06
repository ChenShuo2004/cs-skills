---
name: cs-ralph-runner
description: "将 Markdown 需求转换为 Ralph PRD，并在本地 Git 项目执行 overview 或有界 no-commit 构建。用户明确要求 Ralph 工作流时使用；不作为普通开发任务的默认循环器。"
---

<!-- CS Skills · 陈硕 | https://github.com/ChenShuo2004/cs-skills -->

# CS Ralph Runner

保留用户指定的 Ralph 工作流，完成需求转 PRD、项目预检和要求的执行。更强的模型不需要把每个普通开发请求都改造成循环代理。

## 输入与模式

需要实际 Markdown 需求和目标 Git 仓库；用户明确提供的路径优先。文档未指定时先检查会话与当前项目中明确对应的需求；仅有多个无法区分的候选才询问。未指定项目时使用当前 Git 仓库。别名仅在使用别名时读取 [projects](references/projects.json)。

执行前读取 [run policy](references/run-policy.json)，保留本地约定：默认 1 次迭代、no-commit、缺工具不自动全局安装、执行预告不要求确认。

- plan / dry-run：读取需求、生成独立 PRD 与 overview；不启动 build。不把 overview 失败时的猜测称作真实预览。
- no-commit build：真实执行任务，可以修改代码；--no-commit 只禁止提交。
- commit build：沿用当前会话对 Ralph 运行内提交的明确授权；不包含推送/部署。

只要必需输入与授权已具备就连续完成。用户说“运行并允许提交”本身已给提交授权，不重复询问。

## 执行

核对仓库、工作区、Ralph/Codex 版本和现有配置。按 [CLI 工作流](references/cli-workflow.md) 生成有业务验收条件的 stories，按真实依赖划分，不为凑固定数量拆任务。

已有 PRD/配置先检查能否复用；生成新文件可用独立名称，不覆盖用户配置。工作区有改动时遵守 stopOnDirtyWorktree：不得在原脏目录直接运行构建。可创建隔离工作区；若任务依赖未提交内容，必须将其纳入隔离副本并核对，否则说明输入缺口。不要自动 stash/reset 用户工作。

保留宿主的审批、沙箱与工具策略，不写绕过它们的 AGENT_CMD。Windows 使用实际可用的 .cmd 和 Git Bash 路径；根据 help 核实当前参数，不猜安装路径。

运行前给简短预告：目标、模式、迭代数、命令和日志。执行日志保留完整文件，聊天只提供进展和重要失败；等待时保持用户可见进度。

## 验收与恢复

检查每次运行的 story、状态、产物、实际验证以及 Git 前后变化。no-commit 运行若产生提交，视为约束失败。overview、进程退出和代码验收分别记录，不等同。

达到本次迭代上限或关键条件失败时停止循环并交付诊断，不擅自增加迭代；恢复先检查已有运行 ID 与日志，避免重复执行完成的 story。报告 PRD、日志、修改与未通过的验收。
