# CS Skills

![CS Skills hero](assets/cs-skills-hero.png)

> 一句话说目标，让 Codex 自动选择工作流，把事情推进到可验证的结果。

CS Skills 是陈硕在真实项目中沉淀的一组 Codex AI Agent 工作流。

它不是 Prompt 收藏夹，也不是一堆互相抢触发的 skill，而是一套精简的任务系统：

```text
用户目标 → $cs-run → 对应 skill → 验证结果
```

当前包含 10 个 active skill，覆盖产品设计、工程开发、内容创作、深度调研、电商视频和交付收尾。

## 适合谁

- 用 Codex 做真实产品和 SaaS 的独立开发者。
- 想把个人工作方法沉淀成可复用 AI 工作流的人。
- 需要同时处理产品、代码、内容、调研和交付的 AI 创业者。
- 不想每次都先研究“应该调用哪个 Prompt / skill”的用户。

## 30 秒开始

### 1. 安装主入口

```text
帮我安装这个 skill：https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run
```

`$cs-run` 是任务入口。它负责理解目标、整理输入和输出、识别约束、选择下游 skill，并在你要求执行时继续推进。

> 注意：`cs-run` 负责路由，不会自动下载尚未安装的下游 skill。建议把你常用的下游 skill 一起安装。

### 跨 Agent 使用与归属

这是陈硕维护的 `CS Skills`。每个 skill 的核心入口都是标准 `SKILL.md`，因此只要其他 Agent 支持读取 `SKILL.md`，就可以直接复用同一套触发条件、输入输出、边界和验证规则；Codex 额外读取 `agents/openai.yaml` 来显示名称、功能描述和默认 Prompt。

为了避免与其他 skill 混淆，Codex 主入口显示为 `cs-skills`，下游 skill 保留具体功能名，右侧功能描述统一标注“陈硕的……”。每个 `SKILL.md` 的元数据也包含作者、源码地址和兼容性说明。推荐把整个仓库作为一个 skill 集合安装，而不是只安装 `$cs-run`。

### 2. 直接说结果

```text
$cs-run 我想把这个想法做成一个可以上线的产品，帮我拆解并开始执行。
```

### 3. 也可以直接调用具体能力

```text
$cs-writer 把这份项目记录写成一篇有观点、有细节的文章。
$search-skill 调研这个产品和主要竞品，给我一份有来源的决策简报。
$frontend-design 设计并实现这个页面，最后做浏览器验证。
$clean-code 检查这次实现，整理代码、文档和测试。
$ending-time 这个功能已经完成，帮我验证、提交、推送和部署。
```

## 它解决什么问题

| 传统问题 | CS Skills 的做法 |
| --- | --- |
| 不知道该从哪个 skill 开始 | 统一进入 `$cs-run`，由目标驱动路由 |
| AI 只给建议，不负责推进 | 每个 skill 都定义输入、输出、流程和验证 |
| 每次都要重复解释自己的工作方法 | 把真实项目经验沉淀成可复用工作流 |
| skill 越装越多，触发互相冲突 | 只保留稳定目标，明确入口和边界 |
| 完成后不知道是否真的交付 | 通过 `$clean-code` 和 `$ending-time` 做质量与发布收尾 |

## Active Skills

### 主入口

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$cs-run](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run) | 目标澄清、任务卡和自动路由 | Goal Card、推荐路径、执行结果 |

### 产品与工程

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$frontend-design](https://github.com/ChenShuo2004/cs-skills/tree/main/frontend-design) | 前端页面、工具、仪表盘设计与评审 | UI 方案、实现约束、浏览器验证 |
| [$clean-code](https://github.com/ChenShuo2004/cs-skills/tree/main/clean-code) | 代码清理、重构、文档同步和质量检查 | 有边界的修改、测试和交付说明 |
| [$ralph-runner](https://github.com/ChenShuo2004/cs-skills/tree/main/ralph-runner) | Markdown PRD 转 Ralph 执行 | Ralph PRD、overview、dry-run 日志 |
| [$checkpoint-version](https://github.com/ChenShuo2004/cs-skills/tree/main/checkpoint-version) | 大改前保存版本和回退 | 可恢复的本地 checkpoint |
| [$ending-time](https://github.com/ChenShuo2004/cs-skills/tree/main/ending-time) | 验证、提交、推送、PR 和部署收尾 | 交付报告、GitHub/Vercel 结果 |

### 内容、调研与视频

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$cs-writer](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-writer) | 文章、改稿、项目复盘和内容提纲 | 角度、提纲、文章或审稿意见 |
| [$search-skill](https://github.com/ChenShuo2004/cs-skills/tree/main/search-skill) | 产品、公司、技术、市场和竞品深度调研 | 来源、对比、风险和决策建议 |
| [$auto-videl](https://github.com/ChenShuo2004/cs-skills/tree/main/auto-videl) | 电商短视频复刻、分镜和生成包 | 分镜图、首帧图、Seedance/Flow/Veo 提示词 |
| [$chatcut-video-blueprint](https://github.com/ChenShuo2004/cs-skills/tree/main/chatcut-video-blueprint) | ChatCut 视频制作前的策划 | 口播稿、素材清单、Motion Graphics 和逐镜头表 |

## 真实使用场景

### 从想法到产品

```text
$cs-run 我想做一个帮助独立开发者管理 AI 工作流的 SaaS。
```

先由 `$cs-run` 整理目标，再根据任务进入 `$frontend-design`、`$clean-code`、`$ralph-runner` 或 `$ending-time`。

### 从项目记录到文章

```text
$cs-writer 把这次产品开发过程写成一篇适合公众号发布的文章。
```

它会提炼真实场景、选择文章角度、补齐结构，并避免编造经历、数据和结果。

### 从竞品到决策

```text
$search-skill 调研这个方向的主要竞品，给出带来源的进入建议。
```

它会建立研究地图、搜索当前来源、对比竞品，并区分事实、推断、风险和行动建议。

### 从产品图到电商视频

```text
$auto-videl 我有一个对标视频和产品图，帮我生成九宫格分镜和 Google Flow 提示词。
```

它适合电商短视频创意和生成包，不等同于通用时间线剪辑或 MP4 渲染。

## 设计原则

每个 skill 都应该清楚回答：

1. 目标是什么？
2. 输入是什么？
3. 输出是什么？
4. 核心流程是什么？
5. 边界在哪里？
6. 怎么验证完成？

新增 skill 前先确认它解决的是稳定目标，而不是一次性 Prompt；如果可以并入已有 skill，就不新增入口。

## 当前边界

以下方向已经从 active library 中移除：

- 自动剪辑、时间线编排和通用 MP4 渲染。
- 理想车主信息图生产。
- Open Design 设计产物。

退休目录保存在工作区外的归档中，不参与 skill 发现。

## 仓库结构

```text
cs-skills/
├── README.md
├── LICENSE
├── assets/
├── docs/
├── cs-run/
├── cs-writer/
├── search-skill/
├── auto-videl/
├── chatcut-video-blueprint/
├── frontend-design/
├── clean-code/
├── ralph-runner/
├── checkpoint-version/
└── ending-time/
```

每个 skill 尽量保持自包含：

- `SKILL.md`：触发说明和核心工作流。
- `agents/openai.yaml`：UI 展示文案和默认 Prompt。
- `references/`：需要时再读取的详细规则。
- `scripts/`：可重复执行的确定性脚本。
- `tests/`：关键脚本或契约的回归测试。

## License

[MIT](LICENSE)

![CS Skills code animation](assets/skill-code-animation.svg)

![CS Skills growth curve](assets/skill-growth-curve.svg)
