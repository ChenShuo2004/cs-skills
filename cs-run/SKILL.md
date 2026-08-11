---
name: cs-run
description: |
  Use as the main CS Skills entrypoint when the user does not explicitly name a downstream skill, asks Codex to execute or organize a task, or the goal is still unclear. Trigger for "$cs-run", "cs-run", "帮我执行", "帮我处理", "不知道用哪个 skill", "先规划再做", and vague product, content, engineering, design, or workflow requests. Turn intent into a compact Goal Card, ask only blocking questions, route to exactly one active skill, and continue through that skill when execution is requested.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# CS Run

## Purpose

`cs-run` is the single front door for this skill library. It converts a rough request into a clear Goal Card, selects one active downstream skill, and keeps the task moving instead of making the user learn the directory structure.

Use it when the user says what they want to achieve but does not know which skill to use. If the user explicitly names another active skill and provides enough input, follow that skill directly.

## Active Routes

Choose one primary route from this table:

| User goal | Route | Typical output |
| --- | --- | --- |
| Write, outline, rewrite, polish, or turn project material into an article | `$cs-writer` | Angle, outline, draft, rewrite, or review |
| Research a product, company, technology, market, or competitor set for a decision | `$search-skill` | Source-backed decision brief, comparison, risks, and next actions |
| Design, build, revise, or review a user-facing web interface | `$frontend-design` | UI plan, implementation guidance, and browser checks |
| Clean up code, reconcile implementation with requirements, or prepare a maintainable handoff | `$clean-code` | Scoped edits, documentation sync, tests, and verification |
| Save a rollback point before risky repository changes | `$checkpoint-version` | Restorable local checkpoint and verification |
| Turn a Markdown PRD into a Ralph workflow or dry-run | `$ralph-runner` | Ralph PRD, overview, dry-run output, and logs |
| Verify, commit, push, open a PR, or deploy a completed change | `$ending-time` | Delivery verification and GitHub/Vercel handoff |
| Generate, edit, convert, or extend the fixed “有温度” brand IP while preserving character identity | `$you-wendu-ip` | 2D/3D character assets, action variants, collaboration art, and identity QA |
| Replicate an ecommerce short video or create storyboard/Seedance/Flow/Veo packages | `$auto-videl` | Storyboards, prompts, generation package, and QC |
| 将单个或一批内容想法收敛为 ChatCut 短视频 | `$youwendu-skill` | 选题排序、中文口播稿、素材清单、Motion Graphics、声音方向和逐镜头表 |
| The user has not described a usable goal yet | `$cs-run` | Goal Card and the smallest useful questions |

## Retired Routes

Do not route to removed skills:

- Automatic editing, timeline rendering, MP4 export, and automatic-editing Ralph workflows are retired from this library.
- Li Auto infographic workflows are retired from this library.
- Open Design artifact workflows are retired from this library.

If a request belongs to a retired route, say that the route is no longer active and ask whether the user wants a new dedicated skill. Do not silently send a generic editing request to `$auto-videl`; it is for ecommerce creative and generation workflows.

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
5. Select exactly one primary skill. Add a secondary skill only when it is a necessary verification or delivery step.
6. If the user asked to execute, continue through the recommended skill in the same task. If the user only asked which skill to use, return the Goal Card and a ready-to-send prompt.
7. Verify the result against the requested output and validation criteria before reporting completion.

## Routing Rules

- Prefer the narrowest active skill that matches the requested outcome.
- Do not route by a single keyword when the user's actual output is clear.
- Respect explicit skill names. `$cs-writer`, `$search-skill`, `$frontend-design`, `$clean-code`, `$checkpoint-version`, `$ralph-runner`, `$ending-time`, `$you-wendu-ip`, `$auto-videl`, and `$youwendu-skill` take precedence over generic routing.
- Route requests about “有温度 IP”, “温度种子”, the hollow-heart antenna, fixed character extensions, 2D/3D character conversion, collaboration art, or identity-preserving style transfer to `$you-wendu-ip`. Do not use it for unrelated general image generation.
- Route requests containing 调研、竞品分析、深度研究、市场判断 or similar intent to `$search-skill` when the user needs evidence for a decision. Do not use it for a simple definition or one-fact lookup.
- 将内容想法、短视频主题到 ChatCut 制作蓝图的请求路由到 `$youwendu-skill`；文章或长文改写交给 `$cs-writer`，实际 ChatCut 项目编辑和电商视频复刻继续使用各自的专用工作流。
- Do not ask the user to choose a skill when the route is unambiguous.
- Do not invent a missing domain skill. Report the retired or unsupported route and propose the smallest next decision.
- Keep the Goal Card short. It is an execution aid, not a long questionnaire.

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
