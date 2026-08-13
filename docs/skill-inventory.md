# Skill Inventory

盘点日期：2026-08-09

当前发布数量：11 个 active skill。

## 总览

| Skill | 分组 | 目标 | 主要资源 |
| --- | --- | --- | --- |
| `cs-run` | 总入口 | 整理目标、提出最小阻塞问题并路由到下游 skill | `agents/openai.yaml` |
| `cs-writer` | 内容创作 | 把真实项目素材写成具体、温暖、实用的内容 | `references/style-guide.md` |
| `cs-search-skill` | 深度调研 | 围绕产品、公司、技术、市场和竞品输出有来源的决策简报 | `agents/openai.yaml` |
| `cs-auto-videl` | 电商视频 | 复刻短视频并生成分镜、首帧和视频生成包 | `references/`, `scripts/`, `tests/` |
| `cs-xiaohuang-skill` | 小黄 / 有温度 IP 与正文配图 | 保持同一角色 DNA，生成 2D/3D、动作、联名、风格迁移资产，或将内容认知锚点转成小黄手绘配图 | `references/`, `assets/` |
| `cs-checkpoint-version` | 版本安全 | 在大改前保存可恢复的 dirty worktree checkpoint | `scripts/`, `tests/` |
| `cs-frontend-design` | 产品设计 | 设计、实现和评审用户界面 | `agents/openai.yaml` |
| `cs-clean-code` | 工程质量 | 清理代码、同步文档并验证交付质量 | `references/review-checklist.md` |
| `cs-ralph-runner` | 自动执行 | 把 Markdown PRD 转成 Ralph PRD 并安全 dry-run | `references/` |
| `cs-ending-time` | 交付收尾 | 验证、提交、推送、PR 和部署 | `agents/openai.yaml` |
| `cs-chatcut-video-blueprint` | ChatCut 视频策划 | 将想法排序并收敛为主题，再生成口播稿、素材清单、Motion Graphics、声音方向和逐镜头蓝图 | `agents/openai.yaml` |

## 主入口

`$cs-run` 是显式优先的总入口：用于用户明确调用、需要选择 Skill、需要规划跨域任务，或目标无法判断所属 Skill 的场景。已经明确属于某个 active Skill 的请求直接进入对应 Skill。

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

- 单个或一批内容想法到选题、口播稿、素材筛选、Motion Graphics 和声音规划：`$cs-chatcut-video-blueprint`
- 该 Skill 只输出制作蓝图，不创建项目、不上传素材、不修改时间线。

### 产品与工程

- 页面、工具、仪表盘：`$cs-frontend-design`
- 代码清理、重构、文档同步：`$cs-clean-code`
- Markdown PRD 到 Ralph：`$cs-ralph-runner`
- 大改前保存或恢复：`$cs-checkpoint-version`
- 提交、推送、PR、部署：`$cs-ending-time`

## 已退休能力

当前库不再提供：

- 自动剪辑和通用 MP4 渲染。
- 理想车主信息图。
- Open Design 设计产物。

不要为退休能力保留兼容别名，否则会重新制造触发冲突。

## 发布前检查

1. `SKILL.md` 有合法 frontmatter。
2. `description` 能明确触发场景。
3. `agents/openai.yaml` 与 skill 名称一致。
4. `cs-run` 的路由表不指向已删除 skill。
5. 新 skill 有明确目标、输入、输出、边界和验证方式。
6. `node scripts/validate-skills.mjs` 通过；涉及脚本的 Skill 同时通过统一回归命令。
7. 版本发布前完成 `docs/evals/<version>.md` 的新会话人工验收。
