# Skill Inventory

盘点日期：2026-06-04

本文件只记录当前仓库内发布的 skill。

当前发布数量：14 个。

## 总览

| Skill | 分组 | 目标 | 主要资源 |
| --- | --- | --- | --- |
| `auto-cutting` | 自动剪辑 | 规划、实现、渲染和验证自动剪辑流程 | `references/`, `assets/`, `scripts/` |
| `auto-cutting-prd` | 自动剪辑 | 把自动剪辑想法整理成需求文档、剪辑方案或 Ralph PRD | `agents/openai.yaml` |
| `auto-cutting-ralph` | 自动剪辑 | 把自动剪辑需求交给 Ralph dry-run 执行 | `agents/openai.yaml` |
| `auto-render-video` | 自动剪辑 | 根据素材和 render-plan 直接导出 MP4 | `agents/openai.yaml` |
| `goal-mode` | 目标路由 | 澄清目标并推荐下一步 skill | `agents/openai.yaml` |
| `happy-writer` | 内容创作 | 把真实项目素材写成温暖、实用、好奇心驱动内容 | `references/style-guide.md` |
| `li-auto-infographic-suite` | 信息图 | 生产理想车主信息图套图并做 QA/归档 | `references/current-workflow.md` |
| `li-auto-minimal-infographic` | 信息图 | 生成极简分享码信息图 | `references/minimal-style-spec.md` |
| `li-info` | 信息图 | 快速触发理想信息图工作流 | `agents/openai.yaml` |
| `ending-time` | 工程发布 | 完成实现收尾、验证、GitHub 推送和 Vercel 部署 | `agents/openai.yaml` |
| `frontend-design` | 设计 | 指导前端产品设计、实现和评审 | `agents/openai.yaml` |
| `open-design` | 设计 | 使用本地 Open Design 项目生成设计产物 | `references/open-design-map.md` |
| `ralph-runner` | 执行 | 把 Markdown 需求转成 Ralph PRD 并安全 dry-run | `references/` |
| `clean-code` | 工程质量 | 清理代码、同步文档、验证交付状态 | `references/review-checklist.md` |

## Goal 分组

### 自动剪辑

目标：把视频制作从想法推进到方案、执行和验证。

推荐入口：

- 只有想法：`$auto-cutting-prd`
- 直接成片：`$auto-render-video`
- 工程闭环：`$auto-cutting-ralph`
- 不确定模式：`$auto-cutting`

### 内容创作

目标：把真实项目素材写成有温度、有方法、有可执行价值的内容。

推荐入口：

- 文章、改稿、提纲：`$happy-writer`

### 信息图

目标：围绕理想车主场景生成清晰、可发布的信息图。

推荐入口：

- 快速入口：`$li-info`
- 完整套图：`$li-auto-infographic-suite`
- 极简分享码：`$li-auto-minimal-infographic`

### 设计与工程

目标：把产品界面、设计产物、PRD 执行和代码交付串成闭环。

推荐入口：

- 目标不清楚：`$goal-mode`
- 收尾发布：`$ending-time`
- 前端体验：`$frontend-design`
- 设计产物：`$open-design`
- PRD dry-run：`$ralph-runner`
- 工程收尾：`$clean-code`

## 维护检查

更新仓库时检查：

1. 新 skill 是否服务一个稳定 goal。
2. `SKILL.md` 是否有清晰触发语。
3. `agents/openai.yaml` 是否与 `SKILL.md` 对齐。
4. 是否含有本机路径、私有资料或不可公开链接。
5. README 的 Goal Mode 是否需要更新。

## README 展示资产

- `assets/chenshuo-skills-hero.png`：带 `ChenShuo Skills` 和 `陈硕的 Skill 仓库` 文案的仓库首页 hero 图。
- `assets/skill-code-animation.svg`：用 SVG/CSS 生成的代码动画和工作流关系图。
- `assets/skill-growth-curve.svg`：仓库 skill 增长曲线和分组结构图。
