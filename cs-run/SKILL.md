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
| Generate or edit images with Codex built-in imagegen, or connect it to Claude / a local MCP Agent | `$cs-codex-image` | Verified image files or a tested local image MCP connection |
| Create a 5:2 X / Twitter article cover with the fixed KAI character and clear Chinese title | `$cs-kai-cover` | KAI background plus deterministic-title PNG |
| Design, build, revise, or review a user-facing web interface | `$cs-frontend-design` | UI plan, implementation guidance, and browser checks |
| Clean up code, reconcile implementation with requirements, or prepare a maintainable handoff | `$cs-clean-code` | Scoped edits, documentation sync, tests, and verification |
| Save a rollback point before risky repository changes | `$cs-checkpoint-version` | Restorable local checkpoint and verification |
| Turn a Markdown PRD into a Ralph plan or requested build | `$cs-ralph-runner` | Ralph PRD, overview, no-commit build results and logs |
| Verify, commit, push, open a PR, or deploy a completed change | `$cs-ending-time` | Delivery verification and GitHub/Vercel handoff |
| Generate, edit, convert, or extend the fixed 小黄 / “有温度” brand IP while preserving character identity | `$cs-xiaohuang-skill` | 2D/3D character assets, action variants, collaboration art, identity QA, or article illustration shot lists |
| Replicate an ecommerce short video or create storyboard/Seedance/Flow/Veo packages | `$cs-auto-videl` | Storyboards, prompts, generation package, and QC |
| 将真实项目、经历或现场观察写成 60–90 秒个人 IP 实战口播 | `$cs-personal-ip-script` | 可直接录制的口播稿、演绎标注、事实待确认项与自检 |
| 将自媒体素材、内容想法或已有口播做成剧本包、分镜分图提示词或制作蓝图 | `$cs-chatcut-video-blueprint` | 中文剧本、视觉约定、逐镜分镜、逐图图片提示词、动作提示词与素材清单 |
| 将口播与角色制作成代码叙事视频，包含独立 A/B-roll 场景、样片、成片和双比例封面 | `$cs-code-story-video` | Remotion 工程、真实音频时间轴、16:9 视频、3:4/4:3 封面与 QA |
| 用已确认产品包制作数字人产品介绍视频，或需要 ChatCut 实操、Remotion 包装与最终验收 | `$cs-digital-human-product-video-pipeline` | 预检、样片审批、产品证据剪辑、确定性包装和成片 QA |
| 将最终口播音频与逐字稿对齐为短语时间表 | `$cs-narration-phrase-timeline` | `phrase-timeline.json`、词级对齐结果与覆盖率报告 |
| ChatCut 安装上手与从脚本到编辑工作台的操作指引 | `$cs-chatcut` | 中文策划、操作指南与项目交接 |
| 将真实网页制作成产品演示宣传片 | `$cs-web-promo-film` | 真实页面采集、Remotion 工程与 MP4 |
| 用代码制作动画、KAI 教程片或来源可核查的 Vibe 科普片 | `$cs-code-video` | 风格卡、分镜、样片与可重渲工程 |
| 明确选择暗夜星空系列知识解说片 | `$cs-knowledge-film` | 场景 spec、配音、双语字幕与 MP4 |
| 明确选择固定像素解说系列 | `$cs-pixel-explainer` | 像素动画、实际配音、SRT 与 MP4 |
| GitHub 提交、推送、PR 与远端提交核验 | `$cs-github-push` | 精确提交、远端 SHA 与按需 PR |
| 显式要求执行复位，或陷入无效验证循环时辅助当前任务 | `$cs-recover-skill` | 校准行动与恢复有效进展（辅助项） |
| The user has not described a usable goal yet | `$cs-run` | Goal Card and the smallest useful questions |

## Retired Routes

本库没有对任意素材做通用自动剪辑的入口；`$cs-code-story-video` 只处理有口播、角色和代码场景的叙事视频。理想汽车信息图与 Open Design 也没有专用入口。不要把这些请求误送到电商或数字人产品视频流程。缺少库内路由不等于无法工作：已有其他可用工具/Skill 且范围匹配时直接使用，缺能力时准确说明缺口。不要要求用户先创建新 Skill。

内置图片生成与 Claude 图片工具接入用 `$cs-codex-image`；品牌画面仍由 KAI 或小黄 Skill 决定，本工具只承担实际出图与接入。

## 执行尺度

- 明确小任务：读取必要资料后直接执行，不填卡、不输出无关计划。
- 多阶段任务：简短记录目标、输入、当前产物、验收与依赖，然后按依赖继续。
- 长任务：在已有任务文件中保留完成项、产物路径、失败证据、下一步和已有授权，跨上下文恢复时只重查可能变化的状态。

只加载当前阶段的 Skill 和相关 reference。可以复用已验证且输入未改变的产物；不为形式重新生成。沿用当前模型与运行环境，不硬编码型号、推理档位或工具接口。

涉及本地模型时，先识别目标项目实际后端、模型版本与缓存位置，再检查文件完整性并复用已有缓存。Skill 安装不触发模型全量下载；只准备当前阶段已选定且缺失的模型。发现损坏文件先报告，获修复授权后才替换；ComfyUI、Fish/TTS 未配置时不能猜测 checkpoint。完整仓库附有逐技能模型清单和离线检测脚本，独立安装时按同样规则检查目标项目。

## Multi-Step Handoff Rules

每一阶段选一个主要 Skill；阶段可以串联，必要子步骤可使用匹配能力，不把“一个主要路由”解释为禁止完成跨域目标。

| 请求 | 执行规则 |
| --- | --- |
| 调研后写文章 | $cs-search-skill 完成证据后，直接用 $cs-writer 完成文章。 |
| 真实项目个人 IP 口播附分镜分图提示词 | $cs-personal-ip-script 完成口播后，直接用 $cs-chatcut-video-blueprint 完成分镜、逐图提示词与按需的动作提示词；保留已定稿件。 |
| 已有自媒体稿件补分镜或提示词 | 直接用 $cs-chatcut-video-blueprint，只补点名内容，不重写稿件、不生成媒体。 |
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

## 相近视频入口

自媒体稿件、分镜分图提示词用 `$cs-chatcut-video-blueprint`；ChatCut 安装与操作上手用 `$cs-chatcut`。真实网页宣传片用 `$cs-web-promo-film`，代码生成动画或 Vibe 科普片用 `$cs-code-video`；最终原声、角色 A/B-roll 的 Remotion 叙事用 `$cs-code-story-video`。暗夜星空与像素固定系列需用户明确选择。纯 GitHub 交付优先 `$cs-github-push`，完整发布与应用交付用 `$cs-ending-time`。
