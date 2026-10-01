[![中文](https://img.shields.io/badge/%E4%B8%AD%E6%96%87-0d5d57?style=for-the-badge)](README.md)
[![English](https://img.shields.io/badge/English-e7f3ef?style=for-the-badge&labelColor=e7f3ef&color=3b8279)](README.en.md)
[![关注作者 X](https://img.shields.io/badge/%E5%85%B3%E6%B3%A8%E4%BD%9C%E8%80%85-%40ChenshuoAI-3b8279?style=for-the-badge&logo=x&logoColor=white)](https://x.com/ChenshuoAI)

🚀 **[从一个目标开始使用 CS Skills](#安装)**

[![CS Skills 工作流封面](assets/chenshuo-skills-cover.png)](#安装)

# CS Skills

**把真实项目里的方法做成 Agent Skills**：一句话说目标，选对工作流，完成任务，再检查交付结果。面向 Codex 和 Claude Code，也能按需用于支持 `SKILL.md` 的 Agent。

仓库现有 **14 个任务 Skill**。它们可以独立安装；不知道用哪个时，先从 [`cs-run`](cs-run/) 进入。

整套工作流长这样——**`cs-run` 只选一个主 Skill，交付步骤按任务需要追加**：

<img src="assets/cs-skills-pipeline.svg" alt="目标与素材 → cs-run → 专项执行 → 验证结果 → 按需发布" width="900">

| Skill | 做什么 |
| --- | --- |
| [**cs-run**](cs-run/) | 把模糊目标整理成 Goal Card，读取项目上下文，选择一个主 Skill，并在用户要求执行时继续做下去。 |
| [**cs-search-skill**](cs-search-skill/) | 对产品、公司、技术、市场或竞品做深度调研；区分事实和判断，交付带来源、风险与行动建议的简报。 |
| [**cs-writer**](cs-writer/) | 把真实项目材料写成文章、产品故事、工具体验或改稿；保留事实细节，给出能直接使用的内容。 |
| [**cs-xiaohuang-skill**](cs-xiaohuang-skill/) | 保持“小黄”品牌角色身份一致，制作标准图、动作、2D/3D 变体和中文内容配图；[看实际示例](cs-xiaohuang-skill/README.md)。 |
| [**cs-auto-videl**](cs-auto-videl/) | 处理电商短视频对标与生成：拆强 Hook、规划九宫格、首帧和 Seedance／Flow／Veo 提示词包。 |
| [**cs-chatcut**](cs-chatcut/) | 从内容想法选出一个可拍主题，交付中文口播稿、素材清单、Motion Graphics、声音方向和逐镜头表。 |
| [**cs-web-promo-film**](cs-web-promo-film/) | 采集真实网页，用 Remotion 做推进、滚动和点击，渲染 30–60 秒产品演示 MP4。 |
| [**cs-knowledge-film**](cs-knowledge-film/) | 把知识点做成暗夜星空风解说片：口播稿、场景 spec、配音、双语字幕和 MP4。 |
| [**cs-frontend-design**](cs-frontend-design/) | 设计、实现或评审网页与工具界面，处理布局、交互状态、响应式和浏览器验证。 |
| [**cs-clean-code**](cs-clean-code/) | 对照需求整理实现，收束业务逻辑、代码、文档和验证，留下可维护的交接状态。 |
| [**cs-ralph-runner**](cs-ralph-runner/) | 把 Markdown 需求文档转成 Ralph PRD，在本地仓库安全预演 Ralph／Codex 构建流程。 |
| [**cs-checkpoint-version**](cs-checkpoint-version/) | 在大改前保存包含未提交改动的可恢复检查点，并验证回退位置。 |
| [**cs-github-push**](cs-github-push/) | 精确提交并推送完成的改动，按需创建 PR，核对远端 SHA，区分本地提交与真正发布。 |
| [**cs-ending-time**](cs-ending-time/) | 收尾需要部署的 Web／App 功能：完成验证、GitHub 交付和上线检查。 |

`cs-recover-skill` 是模型执行校准辅助项，不计入上述 14 个任务 Skill，也不参与默认安装。

## 看一个实际产物

例如，把一篇中文文章变成“小黄”轻手绘正文配图：先用 [`cs-writer`](cs-writer/) 整理文章，再让 [`cs-xiaohuang-skill`](cs-xiaohuang-skill/) 找出认知锚点、生成 shot list 和插画。

```text
$cs-writer 把这次产品开发记录写成一篇有真实细节、可复制步骤的文章。
$cs-xiaohuang-skill 找出 4 个适合配图的认知锚点，先给我 shot list，再逐张生成。
```

下面是仓库已有的正文配图示例。完整的角色标准、动作和配图示例见 [小黄 Skill 展示页](cs-xiaohuang-skill/README.md)。

<img src="cs-xiaohuang-skill/assets/examples/01-cognitive-anchor.png" alt="小黄轻手绘示例：抓住一个核心动作" width="680">

做产品原型可以直接说：

```text
$cs-run 我想做一个帮助创作者管理 AI 工作流的工具。先做最小可用原型，并告诉我如何验收。
```

## 安装

克隆仓库，用脚本把 Skill 软链接到 Codex 或 Claude Code 的技能目录：

```bash
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
./scripts/install.sh --codex
```

不指定 Skill 名称时安装全部 14 个任务 Skill；也可以只装需要的：

```bash
./scripts/install.sh --claude cs-run cs-writer  # 只装到 Claude Code
./scripts/install.sh --both cs-run               # 同时装到 Codex 和 Claude Code
./scripts/install.sh --codex --dry-run           # 预览，不修改文件
./scripts/install.sh --codex --uninstall cs-run  # 移除指向本仓库的链接
```

脚本**不会覆盖**已有目录或来自其他位置的链接，遇到冲突会报告路径。软链接依赖克隆目录的位置；保留该目录，日后 `git pull` 后重新开始 Agent 会话即可读取更新后的 Skill。全部参数见 `./scripts/install.sh --help`。

不使用脚本时，也可以手动链接某一个 Skill：

```bash
mkdir -p "$HOME/.codex/skills"
ln -s "$PWD/cs-run" "$HOME/.codex/skills/cs-run"
```

Claude Code 的目标目录是 `$HOME/.claude/skills`。只安装 `cs-run` 不会自动安装下游 Skill；要执行某个专项工作流，请同时安装对应目录。

## 前置条件

| | 必需？ | 说明 |
| --- | --- | --- |
| **Agent** | 必需 | Codex、Claude Code，或能读取 `SKILL.md` 的 Agent。 |
| **Git + Bash** | 只在克隆和使用安装脚本时需要 | 安装脚本在 macOS 的 Bash 环境完成自测；Skill 本身的运行条件看各自说明。 |
| **额外服务或渲染环境** | 按 Skill 而定 | 视频、图像和部署任务可能需要对应工具或账号；每个 `SKILL.md` 写明具体要求。 |
| **GitHub 写权限** | 仅发布时需要 | `cs-github-push` 与 `cs-ending-time` 推送目标仓库时需要。 |

## 仓库约定

每个 Skill 一个目录，入口是 `SKILL.md`。`agents/openai.yaml` 给 Codex 提供展示信息，复杂规则、脚本和素材按需放在 Skill 内：

```text
cs-skills/
├── cs-run/
│   ├── SKILL.md
│   └── agents/openai.yaml
├── cs-<name>/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── references/       按需读取的详细规则
│   ├── scripts/          可重复运行的工具
│   ├── tests/            确定性逻辑的检查
│   └── assets/           示例与素材
├── scripts/              仓库级安装与自测
└── docs/                 技能清单与规划
```

新增或调整任务 Skill 时，同时核对 [`cs-run` 路由](cs-run/SKILL.md)、[技能清单](docs/skill-inventory.md)、README 和安装说明。详细规则见 [AGENTS.md](AGENTS.md)。安装脚本自测不调用模型，也不修改真实技能目录：

```bash
./scripts/test-install.sh
```

## Star 趋势

[![CS Skills Star 趋势](https://api.star-history.com/svg?repos=ChenShuo2004/cs-skills&type=Date)](https://star-history.com/#ChenShuo2004/cs-skills&Date)

## License

[MIT](LICENSE) · [更新日志](CHANGELOG.md) · [贡献者](CONTRIBUTORS.md)
