# CS Skills

陈硕的 AI 工作流仓库：把真实项目里的方法做成可安装、可复用、可验证的 Agent Skills。面向 Codex，也可用于支持 `SKILL.md` 的其他 Agent。

**一句话说目标 → `$cs-run` 选工作流 → 专项 skill 执行 → 验证交付。**

目前收录 **14 个任务 skill**，覆盖产品与工程、内容与视频、调研和 GitHub 发布。每个 skill 都能单独使用；`$cs-run` 适合不知道从哪里开始时调用。

## 快速开始

在 Codex 中直接说：

```text
请从 https://github.com/ChenShuo2004/cs-skills 安装 cs-run 和我需要的下游 skills。
```

安装后试一句：

```text
$cs-run 我想把这个产品想法做成可用原型，帮我选择工作流并开始执行。
```

也可以克隆仓库，按需将某个 skill 目录链接到 Agent 的技能目录：

```bash
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
mkdir -p "$HOME/.codex/skills"
ln -s "$PWD/cs-run" "$HOME/.codex/skills/cs-run"
```

Claude Code 使用同样的 `SKILL.md`，把最后两行中的 `.codex/skills` 换成 `.claude/skills` 即可。目标目录已有同名 skill 时，先检查其来源和本地修改，再决定如何更新；不要直接覆盖。

> 只安装 `$cs-run` 不会自动安装下游 skill。要执行表中的专项工作流，请同时安装对应目录。

## Skill 地图

### 入口

| Skill | 什么时候用 | 主要交付 |
| --- | --- | --- |
| [`$cs-run`](cs-run/) | 目标还粗糙，或不知道该调用哪个 skill | Goal Card、明确路由、继续执行 |

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

## 三个典型用法

**从想法到原型**

```text
$cs-run 我想做一个帮助创作者管理 AI 工作流的工具。先做最小可用原型。
```

**从素材到内容**

```text
$cs-writer 把这次产品开发记录写成一篇有真实细节、可复制步骤的文章。
$cs-xiaohuang-skill 为这篇文章找出 4 个认知锚点，先给我正文配图 shot list。
```

**从本地成果到 GitHub**

```text
$cs-github-push 检查本次 skill 改动，更新必要的目录说明，验证后提交并推送到 GitHub。
```

`$cs-github-push` 负责 GitHub 交付；如果还要把 Web／App 功能部署上线，使用 `$cs-ending-time`。

## 使用条件

| 场景 | 需要准备 |
| --- | --- |
| 阅读和调用 skill | 支持读取 `SKILL.md` 的 Agent；Codex 可读取 `agents/openai.yaml` 展示信息 |
| 推送到 GitHub | 本机 Git、目标仓库写权限；创建 PR 时还需要可用的 GitHub 入口 |
| 视频生成 | 依所选 skill 的 `SKILL.md` 准备渲染环境、素材和所需服务 |

## 仓库约定

每个 skill 一个目录，最少包含 `SKILL.md`；按实际需要放入其余资源：

```text
cs-skills/
├── cs-run/
│   ├── SKILL.md             Agent 读取的触发条件与工作流
│   └── agents/openai.yaml   Codex 中的展示名称与默认提示词
├── cs-github-push/
│   ├── SKILL.md
│   └── agents/openai.yaml
├── 其他 skill/
│   ├── references/          按需读取的规则
│   ├── scripts/             可重复执行的工具
│   ├── tests/               关键逻辑的测试
│   └── assets/              输出素材
└── docs/                    仓库级清单与规划
```

新增 skill 时，同时检查触发边界、`$cs-run` 路由、[技能清单](docs/skill-inventory.md)和安装说明。具体依赖与验收方式以各目录的 `SKILL.md` 为准。`cs-recover-skill` 是模型执行校准辅助项，不计入上述 14 个任务 skill。

[更新日志](CHANGELOG.md) · [贡献者说明](CONTRIBUTORS.md) · [MIT License](LICENSE)
