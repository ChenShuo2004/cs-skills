---
name: cs-run
description: |
  Use as the CS Skills entrypoint only when the user explicitly invokes "$cs-run" or "cs-run", asks which CS Skill to use, asks to plan a cross-domain task, or has a goal whose primary outcome cannot be determined. Do not intercept requests that clearly belong to an active downstream skill. Turn intent into a compact Goal Card, ask only blocking questions, route to exactly one active skill, and continue through that skill when execution is requested.
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# CS Run

## Purpose

`cs-run` is the single front door for this skill library. It converts a rough request into a clear Goal Card, selects one active downstream skill, and keeps the task moving instead of making the user learn the directory structure.

Use it when the user explicitly invokes it, needs help choosing a CS Skill, asks for a plan across multiple domains, or gives a goal that cannot be assigned to one active skill after reading the available context. If a request clearly belongs to another active skill, follow that skill directly even when the user does not know the library structure.

Do not use `cs-run` as a catch-all for requests that merely ask Codex to act. A clear writing, research, frontend, code-quality, delivery, video, or 小黄 request belongs to its downstream skill.

## Active Routes

Choose one primary route from this table:

| User goal | Route | Typical output |
| --- | --- | --- |
| Write, outline, rewrite, polish, or turn project material into an article | `$cs-writer` | Angle, outline, draft, rewrite, or review |
| Research a product, company, technology, market, or competitor set for a decision | `$cs-search-skill` | Source-backed decision brief, comparison, risks, and next actions |
| Design, build, revise, or review a user-facing web interface | `$cs-frontend-design` | UI plan, implementation guidance, and browser checks |
| Clean up code, reconcile implementation with requirements, or prepare a maintainable handoff | `$cs-clean-code` | Scoped edits, documentation sync, tests, and verification |
| Save a rollback point before risky repository changes | `$cs-checkpoint-version` | Restorable local checkpoint and verification |
| Turn a Markdown PRD into a Ralph workflow or dry-run | `$cs-ralph-runner` | Ralph PRD, overview, dry-run output, and logs |
| Verify, commit, push, open a PR, or deploy a completed change | `$cs-ending-time` | Delivery verification and GitHub/Vercel handoff |
| Generate, edit, convert, or extend the fixed 小黄 / “有温度” brand IP while preserving character identity | `$cs-xiaohuang-skill` | 2D/3D character assets, action variants, collaboration art, identity QA, or article illustration shot lists |
| Replicate an ecommerce short video or create storyboard/Seedance/Flow/Veo packages | `$cs-auto-videl` | Storyboards, prompts, generation package, and QC |
| 将单个或一批内容想法收敛为 ChatCut 短视频 | `$cs-chatcut-video-blueprint` | 选题排序、中文口播稿、素材清单、Motion Graphics、声音方向和逐镜头表 |
| The user has not described a usable goal yet | `$cs-run` | Goal Card and the smallest useful questions |

## Retired Routes

Do not route to removed skills:

- Automatic editing, timeline rendering, MP4 export, and automatic-editing Ralph workflows are retired from this library.
- Li Auto infographic workflows are retired from this library.
- Open Design artifact workflows are retired from this library.

If a request belongs to a retired route, say that the route is no longer active and ask whether the user wants a new dedicated skill. Do not silently send a generic editing request to `$cs-auto-videl`; it is for ecommerce creative and generation workflows.

## Workflow

1. Inspect the current repository and nearby project documentation before asking questions.
2. Restate the intended result in one sentence.
3. Fill this Goal Card:

   ```text
   Goal:
   Inputs:
   Expected output:
   Audience/user:
   Constraints:
   Validation:
   Recommended skill:
   ```

4. Ask only questions that can change the route or make execution unsafe. Ask up to three concise blocking questions; record safe defaults instead of asking about preferences that do not matter yet.
5. Select exactly one primary skill. Add a secondary skill only after the primary result is complete and only when a separately requested verification or delivery step is necessary.
6. If the user asked to execute, continue through the recommended skill in the same task. If the user only asked which skill to use, return the Goal Card and a ready-to-send prompt.
7. Verify the result against the requested output and validation criteria before reporting completion.

## Routing Rules

- Prefer the narrowest active skill that matches the requested outcome.
- Do not route by a single keyword when the user's actual output is clear.
- Do not intercept a request that clearly belongs to an active downstream skill. Explain the selected downstream skill directly instead of generating a Goal Card unless the user asks for planning.
- Respect explicit skill names. `$cs-writer`, `$cs-search-skill`, `$cs-frontend-design`, `$cs-clean-code`, `$cs-checkpoint-version`, `$cs-ralph-runner`, `$cs-ending-time`, `$cs-auto-videl`, `$cs-xiaohuang-skill`, and `$cs-chatcut-video-blueprint` take precedence over generic routing.
- Apply outcome priority when a request names several activities: (1) a retired or unsupported outcome stops routing; (2) an explicit active skill wins; (3) an immediately executable primary artifact wins; (4) planning wins only when no primary artifact can be chosen; (5) delivery is always a later step after implementation and verification.
- Treat research, writing, design, implementation, cleanup, checkpoint, and delivery as different artifacts. Route the first artifact that is both explicitly requested and safe to start; name later artifacts as a sequence, not concurrent routes.
- Route requests about “小黄”、“有温度 IP”、“温度种子”、空心爱心天线、固定角色延展、2D/3D 转换、联名、风格迁移或身份修复 to `$cs-xiaohuang-skill`. Do not use it for unrelated general image generation.
- Route requests containing 调研、竞品分析、深度研究、市场判断 or similar intent to `$cs-search-skill` when the user needs evidence for a decision. Do not use it for a simple definition or one-fact lookup.
- 将中文文章、观点或方法论转成正文配图的请求也路由到 `$cs-xiaohuang-skill`；将内容想法、短视频主题到 ChatCut 制作蓝图的请求路由到 `$cs-chatcut-video-blueprint`；文章或长文改写交给 `$cs-writer`，实际 ChatCut 项目编辑和电商视频复刻继续使用各自的专用工作流。
- Do not ask the user to choose a skill when the route is unambiguous.
- Do not invent a missing domain skill. Report the retired or unsupported route and propose the smallest next decision.
- Keep the Goal Card short. It is an execution aid, not a long questionnaire.

## Multi-Step Handoff Rules

Use these rules when a request genuinely contains more than one skill-shaped outcome. Do not invent a sequence when the user asked for only one outcome.

| Request pattern | Start with | Handoff rule |
| --- | --- | --- |
| “调研后写文章” | `$cs-search-skill` | Finish the evidence brief; then ask whether to turn approved findings into a `$cs-writer` draft. |
| “设计并实现页面” | `$cs-frontend-design` | Treat design and implementation as one Build flow; do not insert `$cs-run` again. |
| “整理代码后提交” | `$cs-clean-code` | Finish local verification first. A commit begins only after separate explicit authorization, via `$cs-ending-time`. |
| “先保存再大改” | `$cs-checkpoint-version` | Create and verify the checkpoint before starting the requested downstream implementation skill. |
| “做完后部署” | Primary implementation skill | Finish the primary artifact and local checks, then use `$cs-ending-time` only after explicit authorization. If the user says only “部署”, ask preview or production. |
| “想法到产品、调研和上线” | `$cs-run` | Produce the Goal Card and one recommended first skill; list the later order without treating it as authorization to execute all steps. |

Never let “完成、收尾、上线、发布” bypass the authorization rules of `$cs-ending-time`. A later Git, PR, preview deployment, or production deployment action remains separately authorized.

## Output Contract

When routing only, report:

```text
我理解的目标：
推荐 skill：$<skill-name>
理由：
默认假设：
需要补充的信息：
下一步：
```

When executing, route immediately and report the downstream skill's actual result, changed files, validation, and remaining risk.

For a multi-step plan, report:

```text
First artifact and skill:
Why it comes first:
Later sequence (not yet authorized):
Blocking question, if any:
```
