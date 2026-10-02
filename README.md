# CS Skills

[更新日志](CHANGELOG.md) · [贡献者说明](CONTRIBUTORS.md)

> 一句话说目标，让 Codex 自动选择工作流，把事情推进到可验证的结果。

CS Skills 是陈硕在真实项目中沉淀的一组 Codex AI Agent 工作流。

它不是 Prompt 收藏夹，也不是一堆互相抢触发的 skill，而是一套精简的任务系统：

```text
模糊/跨域目标 → $cs-run → 对应 skill → 验证结果
```

当前包含 15 个 active skill，覆盖产品设计、工程开发、内容创作、文章配图、深度调研、个人 IP 口播、短视频策划、代码叙事视频、数字人产品视频流水线、口播对齐和交付收尾。

## v0.6 工作方式调整（本地候选）

这轮按当前强模型的能力重新整理了全部 14 个入口：明确的小任务直接做；长流程只加载当前阶段的资料；“调研后写文章”“整理后提交”沿用会话已有授权连续执行。用户指定的确认点、样片审批、产品事实和真实音频时间约束继续保留。

- 计划卡与状态矩阵按复杂度使用，不再是每次任务的必填表。
- 电商视频、蓝图、Ralph 与生产并发的细节分阶段读取。
- Ralph 的 no-commit 是会修改代码的真实构建，dry-run 只做 PRD/overview。
- 静态检查、脚本回归与新会话行为验收分别记录，不把文档匹配当模型效果验证。

设计依据、逐 Skill 改动和验收状态见 [本轮优化记录](docs/evals/v0.6.0.md)。

## 适合谁

- 用 Codex 做真实产品和 SaaS 的独立开发者。
- 想把个人工作方法沉淀成可复用 AI 工作流的人。
- 需要同时处理产品、代码、内容、调研和交付的 AI 创业者。
- 不想每次都先研究“应该调用哪个 Prompt / skill”的用户。

## 小黄 IP 与正文配图 Skill（第一个讲解）

`$cs-xiaohuang-skill` 是小黄 / 有温度品牌角色的唯一入口：既能稳定生成、编辑和延展 2D/3D、联名与风格迁移资产，也能把中文内容中的认知锚点画成小黄参与行动、带中文手写标注的白底手绘正文配图。

[查看完整介绍、示例和调用方式 →](cs-xiaohuang-skill/README.md)

## 30 秒开始

### 1. 安装主入口

```text
帮我安装这个 skill：https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run
```

`$cs-run` 是显式优先的任务入口：当你不知道选哪个 skill、需要规划跨域任务，或目标还无法归类时使用。已经明确属于某个领域的请求，直接调用对应 skill 即可。

> 注意：`cs-run` 负责路由，不会自动下载尚未安装的下游 skill。建议把你常用的下游 skill 一起安装。

### 跨 Agent 使用与归属

这是陈硕维护的 `CS Skills`。每个 skill 的核心入口都是标准 `SKILL.md`，因此只要其他 Agent 支持读取 `SKILL.md`，就可以直接复用同一套触发条件、输入输出、边界和验证规则；Codex 额外读取 `agents/openai.yaml` 来显示名称、功能描述和默认 Prompt。

为了避免与其他 skill 混淆，Codex 主入口显示为 `cs-skills`，下游 skill 保留具体功能名，右侧功能描述统一标注“陈硕的……”。作者、源码地址和兼容性说明保留在 Skill UI 配置与仓库资料中；`SKILL.md` frontmatter 只维护发现所需的名称和描述。推荐把整个仓库作为一个 skill 集合安装，而不是只安装 `$cs-run`。

### 2. 直接说结果

```text
$cs-run 我想把这个想法做成一个可以上线的产品，帮我拆解并开始执行。
```

### 3. 有很多内容想法时，先收敛成一条值得拍的视频

```text
$cs-chatcut-video-blueprint 我有一批关于 AI 创业的内容想法。请先合并重复项，按受众相关性、观点张力、事实支撑和制作可行性排序，推荐最值得先拍的一条；我确认后再写口播稿和制作蓝图。
```

它不会直接开剪。它按请求的深度交付选题、口播或完整蓝图。明确要求先选题、确认后继续时保留该节点；直接要完整蓝图时连续完成。

### 4. 从确认产品包到可验收的数字人产品视频

~~~text
$cs-digital-human-product-video-pipeline 这是确认后的 product-pack.json。请先预检 ChatCut、FFmpeg、ComfyUI、Fish/TTS 和 Remotion，生成一条样片；我确认前不要批量或发布。
~~~

它以产品事实和证据素材为约束，先做预检，再完成一条可审批样片。ChatCut 负责真实剪辑，Remotion 负责确定性包装，导出后必须同时完成时间线、关键帧、音频和编码验收。

### 5. 也可以直接调用具体能力

```text
$cs-writer 把这份项目记录写成一篇有观点、有细节的文章。
$cs-search-skill 调研这个产品和主要竞品，给我一份有来源的决策简报。
$cs-frontend-design 设计并实现这个页面，最后做浏览器验证。
$cs-clean-code 检查这次实现，整理代码、文档和测试。
$cs-ending-time 这个功能已经完成，帮我验证、提交、推送和部署。
```

## 它解决什么问题

| 传统问题 | CS Skills 的做法 |
| --- | --- |
| 不知道该从哪个 skill 开始 | 统一进入 `$cs-run`，由目标驱动路由 |
| AI 只给建议，不负责推进 | 每个 skill 都定义输入、输出、流程和验证 |
| 每次都要重复解释自己的工作方法 | 把真实项目经验沉淀成可复用工作流 |
| skill 越装越多，触发互相冲突 | 只保留稳定目标，明确入口和边界 |
| 完成后不知道是否真的交付 | 通过 `$cs-clean-code` 和 `$cs-ending-time` 做质量与发布收尾 |

## Active Skills

### 主入口

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$cs-run](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run) | 目标澄清、任务卡和自动路由 | 按需目标卡、推荐路径、执行结果 |

### 产品与工程

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$cs-frontend-design](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-frontend-design) | 前端页面、工具、仪表盘设计与评审 | UI 方案、实现约束、浏览器验证 |
| [$cs-clean-code](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-clean-code) | 代码清理、重构、文档同步和质量检查 | 有边界的修改、测试和交付说明 |
| [$cs-ralph-runner](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-ralph-runner) | Markdown PRD 转 Ralph 执行 | Ralph PRD、overview、no-commit 构建日志 |
| [$cs-checkpoint-version](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-checkpoint-version) | 大改前保存版本和回退 | 可恢复的本地 checkpoint |
| [$cs-ending-time](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-ending-time) | 验证、提交、推送、PR 和部署收尾 | 交付报告、GitHub/Vercel 结果 |

### 内容、调研、视觉与视频

| Skill | 功能 | 典型输出 |
| --- | --- | --- |
| [$cs-writer](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-writer) | 文章、改稿、项目复盘和内容提纲 | 角度、提纲、文章或审稿意见 |
| [$cs-search-skill](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-search-skill) | 产品、公司、技术、市场和竞品深度调研 | 来源、对比、风险和决策建议 |
| [$cs-xiaohuang-skill](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-xiaohuang-skill) | 小黄 中文正文配图 | 2D/3D 角色资产、联名、风格迁移、shot list 和正文配图 |
| [$cs-auto-videl](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-auto-videl) | 电商短视频复刻、分镜和生成包 | 分镜图、首帧图、Seedance/Flow/Veo 提示词 |
| [$cs-personal-ip-script](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-personal-ip-script) | 个人 IP 实战口播 | 60–90 秒口播稿、演绎标注、事实待确认项和自检 |
| [$cs-chatcut-video-blueprint](cs-chatcut-video-blueprint/) | 自媒体剧本与制作前策划 | 剧本、视觉约定、逐镜分镜、逐图图片提示词、动作提示词和素材清单 |
| `$cs-code-story-video` | 代码叙事视频制作 | A-roll 角色、全屏 B-roll、Remotion 样片与成片、3:4/4:3 封面和 QA；当前为本地待发布能力 |
| [$cs-digital-human-product-video-pipeline](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-digital-human-product-video-pipeline) | 数字人产品介绍视频全链路 | 产品包预检、样片审批、ChatCut 剪辑、Remotion 包装和最终 QA |
| [$cs-narration-phrase-timeline](https://github.com/ChenShuo2004/cs-skills/tree/main/cs-narration-phrase-timeline) | 最终口播的短语级真实音频对齐 | `phrase-timeline.json`、词级边界、字幕与动画时间基准 |

## 真实使用场景

### 从想法到产品

```text
$cs-run 我想做一个帮助独立开发者管理 AI 工作流的 SaaS。
```

先由 `$cs-run` 整理目标，再根据任务进入 `$cs-frontend-design`、`$cs-clean-code`、`$cs-ralph-runner` 或 `$cs-ending-time`。

### 从项目记录到文章

```text
$cs-writer 把这次产品开发过程写成一篇适合公众号发布的文章。
```

它会提炼真实场景、选择文章角度、补齐结构，并避免编造经历、数据和结果。

### 从文章到正文配图

```text
$cs-xiaohuang-skill 先不要生图。请分析这篇文章最值得配图的 4 个位置，输出 shot list：每张图的核心意思、小黄动作、构图和中文标注词。
```

它把文章中的判断、关系和转折画成白底轻手绘正文配图。每张图只讲一个核心意思，适合公众号、博客、Notion 和方法论文档。

### 从很多想法到一条可拍视频

```text
$cs-chatcut-video-blueprint 我记录了 12 个关于独立开发和 AI 工作流的想法。请先筛选最适合抖音的 3 个，说明选择理由；我确认一个后，再完成 60 秒口播稿和 ChatCut 制作蓝图。
```

它先让内容方向变得可判断：观众是谁、为什么会停留、靠什么事实支撑、要用什么素材讲清。主题确认后才进入脚本与制作筹备，避免一开始就把多个观点塞进一条视频。

### 从真实项目到个人 IP 口播

```text
$cs-personal-ip-script 我刚用 AI 重做团队排期，发现最值钱的不是少填表，而是终于能看清谁在阻塞整个项目。基于这段真实经历写一条 60–90 秒口播。
```

它从项目现场提炼一个可验证的判断，交付可直接录制的稿件和独立的演绎标注；不把不足的事实编成故事，也不强加关注或私信 CTA。

### 自媒体剧本附分镜与逐图提示词

```text
$cs-run 基于我提供的真实项目素材写个人 IP 口播，并附逐镜分镜、每张图可直接复制的图片提示词和需要动态镜头的动作提示词。正文与制作说明分开，暂时没有录音，只做文本。
```

真实项目口播由 `$cs-personal-ip-script` 成稿，随后连续交给 `$cs-chatcut-video-blueprint` 完成制作文本包。已有稿件补镜头或图片提示词时直接调用后者；只要口播时不展开分镜。镜号关联台词、图号与动作提示词，生成图不冒充真实产品证据，实际时码等最终音频后确定。交付格式见 [文本包模板](cs-chatcut-video-blueprint/assets/self-media-package.md)。

### 从口播到代码叙事成片

```text
$cs-code-story-video 我有一段最终口播和角色图。请做 16:9 叙事视频：人物作为 A-roll，关键事件用独立全屏 B-roll 演出；交付两章样片、完整版和 3:4/4:3 封面，不烧录逐句字幕。
```

它以实际原声决定整数帧镜头时间，先看样片再自动完成全片；每条视频的事件场景单独编码，不复用《人生意义》的七章画面。只有主题没有录音时，先交付口播和场景方案，等最终原声再渲染。

### 从确认产品包到数字人产品成片

~~~text
$cs-digital-human-product-video-pipeline 用确认的产品事实、组件视频、数字人和旁白制作 60 秒横版产品介绍。先做 sample；我确认后才允许 batch。
~~~

它用产品包锁定事实和禁用断言，预检本地能力后只做一条代表性样片。样片通过后才进入全片；ChatCut 的项目结构、Remotion 合成帧和 ffprobe 的成片规格共同构成验收证据。

### 从最终口播到字幕和动画时间基准

```text
$cs-narration-phrase-timeline 这里是最终旁白音频和实际朗读稿。请生成逐短语时间表，供字幕和信息图动画使用；不能按字数估算。
```

它只将真实音频和原稿对齐成数据，不负责配音、剪辑或成片导出。已有动态信息图工作台时，优先复用它在配音完成后自动生成的时间表。

### 从竞品到决策

```text
$cs-search-skill 调研这个方向的主要竞品，给出带来源的进入建议。
```

它会建立研究地图、搜索当前来源、对比竞品，并区分事实、推断、风险和行动建议。

### 从产品图到电商视频

```text
$cs-auto-videl 我有一个对标视频和产品图，帮我生成九宫格分镜和 Google Flow 提示词。
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

## 质量验证

发布或合并前先运行：

```powershell
node scripts/validate-skills.mjs

$env:CS_SKILLS_PYTHON = "C:\Path\To\python.exe"
node scripts/run-regression.mjs
```

第一条命令检查 15 个 active skill 的 frontmatter、UI 配置、资源引用、路由和核心边界；第二条还会运行 `cs-code-story-video`、`cs-digital-human-product-video-pipeline`、`cs-auto-videl` 与 `cs-checkpoint-version` 的回归测试。GitHub Actions 在 PR 与 `main` 推送时执行同一套检查。每次发布前，还要按 [docs/evals/v0.5.0.md](docs/evals/v0.5.0.md) 用新会话完成人工验收。

## 当前边界

以下方向已经从 active library 中移除：

- 任意素材的自动剪辑与通用时间线编排；数字人产品视频和有角色、口播、代码场景的叙事视频有各自窄范围入口。
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
├── cs-search-skill/
├── cs-auto-videl/
├── cs-personal-ip-script/
├── cs-chatcut-video-blueprint/
├── cs-code-story-video/
├── cs-digital-human-product-video-pipeline/
├── cs-narration-phrase-timeline/
├── cs-xiaohuang-skill/
├── cs-frontend-design/
├── cs-clean-code/
├── cs-ralph-runner/
├── cs-checkpoint-version/
└── cs-ending-time/
```

每个 skill 尽量保持自包含：

- `SKILL.md`：触发说明和核心工作流。
- `agents/openai.yaml`：UI 展示文案和默认 Prompt。
- `references/`：需要时再读取的详细规则。
- `scripts/`：可重复执行的确定性脚本。
- `tests/`：关键脚本或契约的回归测试。

## License

[MIT](LICENSE)
