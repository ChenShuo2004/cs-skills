# Skill Inventory

盘点日期：2026-10-03

当前发布数量：16 个任务 skill。

## 总览

| Skill | 分组 | 目标 | 主要资源 |
| --- | --- | --- | --- |
| `cs-run` | 总入口 | 整理目标、提出最小阻塞问题并路由到下游 skill | `agents/openai.yaml` |
| `cs-writer` | 内容创作 | 把真实项目素材写成具体、温暖、实用的内容 | `references/style-guide.md` |
| `cs-search-skill` | 深度调研 | 围绕产品、公司、技术、市场和竞品输出有来源的决策简报 | `agents/openai.yaml` |
| `cs-auto-videl` | 电商视频 | 复刻短视频并生成分镜、首帧和视频生成包 | `references/`, `scripts/`, `tests/` |
| `cs-xiaohuang-skill` | 小黄 / 有温度 IP 与正文配图 | 保持同一角色 DNA，生成 2D/3D、动作、联名、风格迁移资产，或将内容认知锚点转成小黄手绘配图 | `references/`, `assets/` |
| `cs-checkpoint-version` | 版本安全 | 在大改前保存可恢复的 dirty worktree checkpoint | `scripts/`, `tests/` |
| `cs-github-push` | GitHub 发布 | 精确提交、推送、按需创建 PR 并核验远端 | `agents/openai.yaml` |
| `cs-frontend-design` | 产品设计 | 设计、实现和评审用户界面 | `agents/openai.yaml` |
| `cs-clean-code` | 工程质量 | 清理代码、同步文档并验证交付质量 | `references/review-checklist.md` |
| `cs-ralph-runner` | 自动执行 | 把 Markdown PRD 转成 Ralph PRD 并安全 dry-run | `references/` |
| `cs-ending-time` | Web/App 交付收尾 | 验证、GitHub 与部署 | `agents/openai.yaml` |
| `cs-chatcut` | ChatCut 视频策划 | 将想法排序并收敛为主题，再生成口播稿、素材清单、Motion Graphics、声音方向、逐镜头蓝图和零到一操作指南 | `agents/openai.yaml`, `references/zero-to-one-guide.html` |
| `cs-web-promo-film` | 网页产品演示片 | 把真实网页做成 30–60 秒产品演示宣传片：采集长截图、Remotion 运镜、渲染无音轨 mp4，并可附口播稿 | `references/`, `scripts/`, `assets/promo-starter/` |
| `cs-knowledge-film` | 知识解说片 | 把一个知识点做成暗夜星空 + 衬线双语字幕 + 金色光点隐喻的 2–6 分钟解说片：口播稿、spec、edge-tts 配音、Canvas 逐帧渲染 mp4 | `references/`, `scripts/`, `assets/example-spec.json` |
| `cs-code-video` | 代码动画视频 | 页面暴露 render(t)，Playwright 逐帧截图 + FFmpeg 合成 mp4；5 项输入 → 风格卡 → 分镜表 → 3 张关键帧 → 逐镜头制作 → 自评；配乐音效代码合成，可接 GPT 出图与 edge-tts 配音；含 KAI 教程片系列 | `references/`, `scripts/`, `assets/` |
| `cs-pixel-explainer` | 像素解说视频 | 中文文案 → 像素风 + 坐标系隐喻 + 打字机字幕解说片：spec.json、edge-tts 配音、Canvas 逐帧渲染 1080p mp4 + SRT；含像素纯度参考实现 | `engine/`, `assets/` |

## 主入口

所有未明确指定 skill 的任务优先进入 `$cs-run`。

它维护 Goal Card：

```text
Goal:
Inputs:
Expected output:
Audience/user:
Constraints:
Validation:
Recommended skill:
```

路由只选择一个主 skill。只有必要的验证或交付步骤，才追加第二个 skill。

## 领域路由

### 内容

- 文章、提纲、项目记录、工具体验、改稿：`$cs-writer`
- 产品、公司、技术、市场、竞品调研：`$cs-search-skill`

### 小黄 / 有温度 IP 与正文配图

- 小黄 / 有温度 IP 标准图、动作表情、2D/3D、联名、风格迁移和身份修复：`$cs-xiaohuang-skill`
- 中文文章、帖子、Notion 或方法论到 shot list、小黄轻手绘正文配图和局部改图：`$cs-xiaohuang-skill`
- 只处理小黄 / 有温度固定角色；不承接无关的通用生图任务。

### 电商视频

- 对标复刻、九宫格分镜、Seedance、Gemini Omni、Google Flow/Veo：`$cs-auto-videl`

### ChatCut 视频筹备

- 单个或一批内容想法到选题、口播稿、素材筛选、Motion Graphics、声音规划和 ChatCut 上手：`$cs-chatcut`
- 该 Skill 只输出制作蓝图，不创建项目、不上传素材、不修改时间线。

### 网页产品演示片

- 把真实网页做成 30–60 秒产品演示宣传片：`$cs-web-promo-film`
- 只拍匿名访客能打开的公开页，不重绘产品界面；电商对标复刻仍走 `$cs-auto-videl`，ChatCut 策划仍走 `$cs-chatcut`。

### 知识解说片

- 把概念、原理、科普主题做成暗夜星空风（Vibe知识大赏风格）解说片：`$cs-knowledge-film`
- 自带配音、双语字幕和渲染；网页演示走 `$cs-web-promo-film`，ChatCut 策划走 `$cs-chatcut`。

### 代码动画视频

- 用代码做动画视频、动态图形、片头、教程片（KAI 教程片）、按选题重新设计画面的解说单片：`$cs-code-video`
- 中文文案做成像素风 + 坐标系隐喻 + 打字机字幕的解说片，或像素解说系列续集：`$cs-pixel-explainer`
- 两者都只用代码生成画面，不剪辑已有素材；网页演示走 `$cs-web-promo-film`，暗夜星空知识片走 `$cs-knowledge-film`。

### 产品与工程

- 页面、工具、仪表盘：`$cs-frontend-design`
- 代码清理、重构、文档同步：`$cs-clean-code`
- Markdown PRD 到 Ralph：`$cs-ralph-runner`
- 大改前保存或恢复：`$cs-checkpoint-version`
- 仅提交、推送、PR 或核验 GitHub 远端：`$cs-github-push`
- Web/App 功能需要连同部署一起收尾：`$cs-ending-time`

## 已退休能力

当前库不再提供：

- 自动剪辑和通用 MP4 渲染。网页产品演示片走 `$cs-web-promo-film`；代码生成的动画视频走 `$cs-code-video`，不剪辑已有素材。
- 理想车主信息图。
- Open Design 设计产物。

不要为退休能力保留兼容别名，否则会重新制造触发冲突。

## 发布前检查

1. `SKILL.md` 有合法 frontmatter。
2. `description` 能明确触发场景。
3. `agents/openai.yaml` 与 skill 名称一致。
4. `cs-run` 的路由表不指向已删除 skill。
5. 新 skill 有明确目标、输入、输出、边界和验证方式。
