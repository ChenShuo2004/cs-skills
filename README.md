# CS Skills

把真实项目中跑通的方法，做成**可安装、可复用、可验证**的 Agent Skills。面向 Codex 和 Claude Code；其他能读取 `SKILL.md` 的 Agent 也可以按需使用。

**说清目标 → `$cs-run` 选择一个主 Skill → 专项执行 → 验证结果。**

仓库现有 **14 个任务 Skill**，覆盖产品开发、内容生产、调研、视频和交付。每个 Skill 都能独立安装；不知道从哪里开始时，先用 [`$cs-run`](cs-run/)。

[快速安装](#快速安装) · [选择-skill](#选择-skill) · [使用示例](#使用示例) · [仓库约定](#仓库约定)

## 快速安装

克隆仓库后，选择要用的 Agent 和 Skill：

```bash
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
./scripts/install.sh --codex cs-run cs-frontend-design cs-github-push
```

安装到 Claude Code 时用 `--claude`；两个 Agent 都用时选 `--both`。省略 Skill 名称会安装全部 **14 个任务 Skill**：

```bash
./scripts/install.sh --claude cs-run cs-writer
./scripts/install.sh --both
```

安装脚本创建软链接。仓库更新后，在原目录执行 `git pull`，链接会读取新内容；重新开始 Agent 会话即可使用更新后的 Skill。脚本不会覆盖已有目录或来自其他位置的链接，遇到冲突会报告具体路径。

```bash
./scripts/install.sh --codex --dry-run              # 先预览
./scripts/install.sh --codex --uninstall cs-run     # 只移除指向当前仓库的链接
./scripts/install.sh --help                         # 查看全部参数
```

> 克隆目录需要保留在原位置，软链接才能持续有效。已有同名 Skill 时，先检查来源和本地修改，再决定是否替换。`cs-recover-skill` 是模型执行校准辅助项，默认安装不包含它。

安装后，在新会话中试一句：

```text
$cs-run 我想把这个产品想法做成可用原型，帮我选择工作流并开始执行。
```

不使用终端时，也可以请支持 GitHub Skill 安装的 Agent 从本仓库安装 `cs-run` 和当前任务需要的专项 Skill；**只安装 `cs-run` 不会自动安装下游 Skill**。

## 选择 Skill

### 入口

| Skill | 什么时候用 | 主要交付 |
| --- | --- | --- |
| [`$cs-run`](cs-run/) | 目标还粗糙，或不知道该调用哪个 Skill | Goal Card、明确路由、继续执行 |

### 产品与工程

| Skill | 什么时候用 | 主要交付 |
| --- | --- | --- |
| [`$cs-frontend-design`](cs-frontend-design/) | 设计、实现或评审网页与工具界面 | 页面、交互与浏览器验证 |
| [`$cs-clean-code`](cs-clean-code/) | 清理代码、核对需求、整理维护交接 | 小范围修改、文档与验证 |
| [`$cs-ralph-runner`](cs-ralph-runner/) | 用 Markdown 需求文档启动 Ralph 工作流 | Ralph PRD、预演与日志 |

### 内容、调研与视频

| Skill | 什么时候用 | 主要交付 |
| --- | --- | --- |
| [`$cs-writer`](cs-writer/) | 把真实材料写成文章、项目故事或改稿 | 提纲、文章、审稿意见 |
| [`$cs-search-skill`](cs-search-skill/) | 对产品、市场、技术或竞品做深度研究 | 带来源的决策简报 |
| [`$cs-xiaohuang-skill`](cs-xiaohuang-skill/) | 延展“小黄”角色，或把中文内容画成正文配图 | 角色资产、shot list、插画；[查看示例](cs-xiaohuang-skill/README.md) |
| [`$cs-auto-videl`](cs-auto-videl/) | 做电商短视频复刻与生成方案 | 九宫格、首帧、Seedance／Flow／Veo 提示词 |
| [`$cs-chatcut`](cs-chatcut/) | 从想法筛选主题并规划 ChatCut 短视频 | 口播稿、素材清单、逐镜头蓝图 |
| [`$cs-web-promo-film`](cs-web-promo-film/) | 把真实网页做成产品演示片 | Remotion 工程、可交付 MP4 |
| [`$cs-knowledge-film`](cs-knowledge-film/) | 明确需要暗夜星空风的知识解说片 | 口播稿、场景 spec、配音与 MP4 |

### 版本与发布

| Skill | 什么时候用 | 主要交付 |
| --- | --- | --- |
| [`$cs-checkpoint-version`](cs-checkpoint-version/) | 大改前保存或恢复本地版本 | 可验证的回退点 |
| [`$cs-github-push`](cs-github-push/) | 将已完成的修改提交并推送到 GitHub | 精确提交、远端核验、PR（按需） |
| [`$cs-ending-time`](cs-ending-time/) | Web／App 功能需要连同部署一起收尾 | 验证、GitHub 与部署结果 |

## 使用示例

**从想法到产品原型**

```text
$cs-run 我想做一个帮助创作者管理 AI 工作流的工具。先做最小可用原型，并告诉我如何验收。
```

**从项目素材到文章和配图**

```text
$cs-writer 把这次产品开发记录写成一篇有真实细节、可复制步骤的文章。
$cs-xiaohuang-skill 为文章找出 4 个认知锚点，先给我正文配图 shot list。
```

**把完成的成果交付到 GitHub**

```text
$cs-github-push 检查本次 Skill 改动，更新必要的目录说明，验证后提交并推送到 GitHub。
```

仅需 GitHub 提交、推送或 PR 时用 `$cs-github-push`；Web／App 功能还要部署上线时用 `$cs-ending-time`。视频类 Skill 的渲染环境和服务要求，请以各目录的 `SKILL.md` 为准。

## 仓库约定

每个 Skill 一个目录，入口文件是 `SKILL.md`；`agents/openai.yaml` 提供 Codex 展示信息，其余资源按实际需要放入：

```text
cs-skills/
├── cs-run/                 总入口
├── cs-writer/              独立的任务 Skill
│   ├── SKILL.md            Agent 读取的工作流
│   ├── agents/openai.yaml  Codex 展示信息
│   └── references/         按需读取的详细规则
├── scripts/
│   ├── install.sh          Codex／Claude Code 软链接安装
│   └── test-install.sh     安装脚本自测
└── docs/                   技能清单与仓库规划
```

新增或调整 Skill 时，请同步检查触发边界、[`$cs-run` 路由](cs-run/SKILL.md)、[技能清单](docs/skill-inventory.md)和安装说明。维护规则见 [AGENTS.md](AGENTS.md)。安装脚本可用 `./scripts/test-install.sh` 在临时目录自测，不会改动真实 Skill 目录。

[更新日志](CHANGELOG.md) · [贡献者说明](CONTRIBUTORS.md) · [MIT License](LICENSE)
