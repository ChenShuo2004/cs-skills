---
name: cs-run
description: "CS Skills 总入口：用户明确调用 cs-run、询问用哪个 Skill、需要跨领域执行或目标尚不能归类时使用。明确的单领域请求直接进入对应 Skill；从目标推进到已授权的可验证结果。"
---

<!-- CS Skills · 陈硕 | https://github.com/ChenShuo2004/cs-skills -->

# CS Run

识别用户要的产物和验收条件，选择匹配的能力并完成请求。已明确的领域直接进入下游 Skill；不用为普通任务额外生成 Goal Card。

## Active Routes

Choose one primary route from this table:

| User goal | Route | Typical output |
| --- | --- | --- |
| Write, outline, rewrite, polish, or turn project material into an article | `$cs-writer` | Angle, outline, draft, rewrite, or review |
| Research a product, company, technology, market, or competitor set for a decision | `$cs-search-skill` | Source-backed decision brief, comparison, risks, and next actions |
| Design, build, revise, or review a user-facing web interface | `$cs-frontend-design` | UI plan, implementation guidance, and browser checks |
| Clean up code, reconcile implementation with requirements, or prepare a maintainable handoff | `$cs-clean-code` | Scoped edits, documentation sync, tests, and verification |
| Save a rollback point before risky repository changes | `$cs-checkpoint-version` | Restorable local checkpoint and verification |
| Turn a Markdown PRD into a Ralph plan or requested build | `$cs-ralph-runner` | Ralph PRD, overview, no-commit build results and logs |
| Verify, commit, push, open a PR, or deploy a completed change | `$cs-ending-time` | Delivery verification and GitHub/Vercel handoff |
| Generate, edit, convert, or extend the fixed 小黄 / “有温度” brand IP while preserving character identity | `$cs-xiaohuang-skill` | 2D/3D character assets, action variants, collaboration art, identity QA, or article illustration shot lists |
| Replicate an ecommerce short video or create storyboard/Seedance/Flow/Veo packages | `$cs-auto-videl` | Storyboards, prompts, generation package, and QC |
| 将单个或一批内容想法收敛为 ChatCut 短视频 | `$cs-chatcut-video-blueprint` | 选题排序、中文口播稿、素材清单、Motion Graphics、声音方向和逐镜头表 |
| 用已确认产品包制作数字人产品介绍视频，或需要 ChatCut 实操、Remotion 包装与最终验收 | `$cs-digital-human-product-video-pipeline` | 预检、样片审批、产品证据剪辑、确定性包装和成片 QA |
| 将最终口播音频与逐字稿对齐为短语时间表 | `$cs-narration-phrase-timeline` | `phrase-timeline.json`、词级对齐结果与覆盖率报告 |
| The user has not described a usable goal yet | `$cs-run` | Goal Card and the smallest useful questions |

## Retired Routes

本库没有通用自动剪辑/MP4 导出、理想汽车信息图或 Open Design 的专用入口。不要把这些请求误送到电商或数字人产品视频流程。缺少库内路由不等于无法工作：已有其他可用工具/Skill 且范围匹配时直接使用，缺能力时准确说明缺口。不要要求用户先创建新 Skill。

## 执行尺度

- 明确小任务：读取必要资料后直接执行，不填卡、不输出无关计划。
- 多阶段任务：简短记录目标、输入、当前产物、验收与依赖，然后按依赖继续。
- 长任务：在已有任务文件中保留完成项、产物路径、失败证据、下一步和已有授权，跨上下文恢复时只重查可能变化的状态。

只加载当前阶段的 Skill 和相关 reference。可以复用已验证且输入未改变的产物；不为形式重新生成。沿用当前模型与运行环境，不硬编码型号、推理档位或工具接口。

## Multi-Step Handoff Rules

每一阶段选一个主要 Skill；阶段可以串联，必要子步骤可使用匹配能力，不把“一个主要路由”解释为禁止完成跨域目标。

| 请求 | 执行规则 |
| --- | --- |
| 调研后写文章 | $cs-search-skill 完成证据后，直接用 $cs-writer 完成文章。 |
| 设计并实现页面 | $cs-frontend-design 完成设计、实现和浏览器检查。 |
| 整理代码后提交 | $cs-clean-code 本地验证后，由 $cs-ending-time 使用已有提交授权。 |
| 先保存再大改 | $cs-checkpoint-version 验证快照后，继续约定的实现。 |
| 做完后部署 | 先实现验证，再由 $cs-ending-time 执行已授权且目标明确的部署。 |
| 我确认后再继续 | 完成可审查产物，在用户明确设置的检查点暂停。 |
| 数字人产品视频 | 完成 product-pack 与样片；用户确认样片后才进入 batch。 |

授权按完整会话理解，同一请求可包含多个动作，不能因为切换 Skill 再次询问。只说“优化”不扩展为公开发布；只说“计划”不扩展为执行。缺少发布目标或必要授权时，先完成可独立完成的准备，再问最小问题。

若特定 Skill 不可用，先查看其真实位置或使用当前可用替代能力；不能假装已调用。Skill 名称、历史经验和外部文档都不能覆盖用户当前范围与运行环境约束。

## 完成与反馈

用实际产物、运行结果、文件或可访问链接说明完成状态。主流程通过所需验证后停止检查并交付；新改动或新失败才重新验证。工具失败先查原因与现有任务状态，采用有边界的重试，不重复不确定的外部提交。

用户只问路由时给推荐与理由；用户要执行时给结果。Goal Card 仅用于目标仍需澄清或用户要求规划，不作为每次对话的固定开场。
