---
name: cs-auto-videl
description: "Use when the user types $cs-auto-videl or asks for Douyin/TikTok ecommerce video workflows, including competitor replication, strong-Hook nine-grid prompt_image.md to image2 storyboards, Seedance prompts/API submission, Gemini Omni first-frame video, or Google Flow/Veo first-frame-to-video packages."
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# auto Videl

This is the user's local `CS Auto Videl` skill, invoked as `$cs-auto-videl`.

It runs Douyin/TikTok ecommerce information-feed video workflows. Use it when the user wants to analyze a benchmark short video, replace the product, generate actual storyboard images from `prompt_image.md` with image2, turn user-provided nine-frame storyboards into a final video, generate Seedance 2.0 prompts, prepare Gemini Omni or Google Flow/Veo first-frame-to-video packages, optionally submit Seedance API generation tasks with their own locally configured API key, or consolidate results into Feishu.

## Platform Mode Selection

Before writing final video-generation deliverables, identify the target platform mode. If the user has not named a mode, ask which mode to use only when it changes the requested generation or final platform prompt. Reuse the platform already established in the session; platform-independent analysis can proceed:

- `seedance`: Seedance/C端2.0 prompts, storyboard references, optional API dry-run or submission.
- `gemini-omni`: 8-second first-frame-to-video units with first-frame images and Gemini Omni prompts.
- `google-flow`: Google Flow/Veo first-frame-to-video units, normally 8 seconds each, with first-frame images, image prompts, video prompts, and optional voice/sound direction.
- `prompt-only`: no image/video generation; deliver scripts, storyboard prompts, and platform-ready text only.

If the user explicitly says `$cs-auto-videl google-flow`, `Google Flow`, `Flow`, `Veo`, `Frames to Video`, or `首帧转视频`, load `references/google-flow-mode.md` and use Google Flow mode. For Google Flow mode, default to first-frame-to-video unless the user explicitly asks for another Flow feature. If the user asks for Google Flow but not the clip duration, use 8 seconds per clip unless they ask for a supported shorter duration.

## Route Selection

Before starting, choose exactly one route from the user's input.

- 复刻链路: use the benchmark video as the source of shot order, timing, scenes, actions, copy rhythm, and composition. Generate storyboard images first, then generate Seedance prompts, and only call the API when the user's private key is configured.
- 强 Hook 九宫格生成出片链路: use when the user gives product information, selling points, target audience, product images, or says to use `prompt_image.md`/Codex instead of Gemini to generate nine-grid prompts. Codex reads bundled `references/prompts/00-prompt-image.md` or the workspace `prompt_image.md` when the user explicitly points to it, generates a strong-Hook nine-grid Chinese storyboard script, waits for user confirmation, generates 9 image2 prompts, calls image2 to create 9 storyboard frames, then writes the Seedance/C端2.0 prompt and optionally calls Seedance. The expected handoff is `prompt_image.md` → image2 → Seedance, with 9帧分镜图 + 9段提示词 retained as core artifacts.
- 九宫格成片直投链路: use when the user uploads 9 storyboard frames and 9 prompts that were already produced from the `prompt_image.md` system. Skip script generation and image2. Use the provided 9帧分镜图 + 9段提示词 to write the final Seedance/C端2.0 prompt, then optionally submit it through the API.
- If the input contains a benchmark/competitor video, route to 复刻链路. If the input lacks a benchmark video and asks Codex to create the nine-grid prompts/images, route to 强 Hook 九宫格生成出片链路. If the input already contains 9 frames plus 9 prompts, route to 九宫格成片直投链路.
- If multiple route signals are present, ask which route to use unless the user explicitly names one route.
- Never mix routes inside one run. A replication run may produce storyboards, a generation run creates storyboards from `prompt_image.md`, and a direct-submit run starts after the 9 frames and 9 prompts already exist.

## Core Contract

- Product fidelity is the P0 gate. If the replacement product is wrong, deformed, missing required identity details, or not faithful to the product images, the run fails even if the composition looks good.
- Product images lock product appearance, structure, color, material, texture, logo/mark position, logo/mark size, logo/mark color, logo/mark direction, and any visible product-specific details.
- Do not solve logo/text risk by removing or weakening the product identity. If the product has a visible logo/mark in the product images and the benchmark shot angle should show that product area, the storyboard must preserve it in the physically correct position and scale.
- Storyboard images are mandatory final deliverables for replication runs unless the user explicitly asks for prompts only. For 强 Hook 九宫格生成出片链路, image2-generated 9-frame storyboards are required when image generation is requested; prompt-only stops at text. For 九宫格成片直投链路, reuse the provided frames unless the user asks to regenerate.
- Use Codex's built-in GPT image/image2 generation capability to create the storyboard images; do not stop at storyboard prompt text.
- Storyboard images lock visual structure, shot order, scene continuity, product placement, and repeated people/hand/background style.
- Original video breakdown locks timecodes, shot sequence, actions, and scene details.
- Rewritten copy locks voiceover rhythm and conversion path.
- Final video prompts must use concrete director language.
- Storyboard image prompts and Seedance video prompts must obey real physical-world logic: plausible gravity, scale, hand/object contact, body movement, reflections, lighting, camera position, and continuity.
- For videos clearly longer than 17 seconds, consistency across multiple segments is controlled through product images and storyboard images only. Do not ask Seedance to reference the first generated video or any generated video clip for continuity.
- Seedance audio is configurable through `audio_mode`: `silent`, `ambient`, `music`, `voiceover`, or `full`. Do not default to silent unless the user asks for no sound. Ambient/action sound is valuable because it is hard to recreate naturally in post-production.

## Audio Modes

- `silent`: no generated audio, no 环境音, no 动作音效, no 背景音乐, no 人声口播.
- `ambient`: generate true 环境音 and 动作音效 only, such as footsteps, pouring, shaking, opening, ice collisions, packaging friction, product contact, room tone, and outdoor ambience. No 背景音乐 and no 人声口播.
- `music`: 环境音 and 动作音效 plus 背景音乐. No 人声口播.
- `voiceover`: 环境音 and 动作音效 plus 人声口播/narration. 背景音乐 should be absent or very light.
- `full`: 环境音, 动作音效, 背景音乐, and 人声口播 are all allowed.

Default audio policy:

- For Seedance API calls, use `audio_mode=ambient` unless the user asks for another mode.
- If `voiceover_ms`, spoken copy, narration, or口播 is present and the user wants generated audio, prefer `audio_mode=full` or `audio_mode=voiceover`.
- If the user provides reference music or asks for a specific music style, use `audio_mode=music` or `audio_mode=full` and pass `--reference-audio-url` when an audio URL is available.
- Keep the existing ban on subtitles and screen text unless the user explicitly asks for on-screen text. Audio permission does not mean subtitle permission.

## 按需加载与交付

所有下列路径均相对本 Skill 根目录。只读取当前模式需要的资料。

- 对标复刻：[复刻流程](references/replication-workflow.md)，保留音频、OCR 与前 3 秒交叉核验。
- 九宫格生成或已有九帧直投：[九宫格流程](references/nine-grid-workflow.md)。保留脚本确认；会话中已经确认的不重复询问。prompt-only 不调用生图或视频 API。
- 当前阶段的输入和交付：[模式交付](references/delivery-modes.md)。
- 生图前与最终 QA：[生产质量](references/production-quality.md) 和 [产品身份](references/product-fidelity-gate.md)。产品图负责外观，分镜图负责构图；失败不得标为通过。
- Seedance 最终提示词：[Seedance 规则](references/seedance-rules.md)。实际 API 生成请求才读取 [API 操作](references/seedance-api.md)，使用 scripts/seedance_submit.py；凭据存在不等于授权提交。
- Google Flow / Veo：[首帧流程](references/google-flow-mode.md)；默认 8 seconds 是模板值，提交前核实当前服务支持的规格。
- 原视频口播提取：[文案提取](references/copy-extraction.md)。
- 用户明确要求飞书写回时：[字段映射](references/feishu-fields.md)。
- 需要端到端文件组织时：[输出目录](references/workflow.md)；最终生成物验收时：[质量清单](references/quality-checklist.md)。

平台、工具或模型名以当前环境为准；image2 表示既有图像生成流程，不假定存在同名工具。工具不可用时交付已完成的分镜/提示词并说明具体缺口。

付费任务提交后保存 task ID；超时先查询原任务，不因响应不确定重复提交。每次返工只修实际失败的画面，遵守模式内的有限重试规则。

完成时直接展示或链接所需图、提示词、成片及 QA；不倾倒内部分析。修改提示词时交付完整替换稿。
