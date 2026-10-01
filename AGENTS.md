# CS Skills 仓库协作规则

- 工作范围是本仓库。先看 `git status`、目标 Skill 的 `SKILL.md` 和相关 `references/`，保留他人的未提交改动。
- `SKILL.md` 是 Agent 工作流的来源；`README.md` 和 `README.en.md` 是读者入口。不要把营销描述写成尚未实现的能力，也不要用过期的图片或数字代替当前目录事实。
- 新增、删除或重命名任务 Skill 时，同步 `cs-run/SKILL.md`、根目录两份 README、`docs/skill-inventory.md`、`docs/repository-plan.md` 和 `CHANGELOG.md`；核对名称、数量、触发边界与实际文件一致。
- 每个任务 Skill 至少包含有效的 `SKILL.md` 和 `agents/openai.yaml`。复杂规则放在 `references/`，确定性操作优先放在 `scripts/`。
- 修改安装脚本后运行 `./scripts/test-install.sh`；修改 README 后检查相对链接；提交前运行 `git diff --check`。只暂存本次改动的文件。
- GitHub 推送使用 `$cs-github-push` 的范围检查和远端 SHA 核验；Web／App 部署使用 `$cs-ending-time`。不要把本地提交、远端推送和部署称为同一结果。
