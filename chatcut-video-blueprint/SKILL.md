---
name: chatcut-video-blueprint
description: "Use when the user provides a video topic and source content and wants a ChatCut-ready production blueprint: a spoken script, prioritized media checklist, Motion Graphics plan, sound effects and music direction, and a shot-by-shot map. Use for planning materials before manual ChatCut assembly; do not use for direct timeline editing, importing, exporting, or ecommerce replication workflows."
---

# ChatCut Video Blueprint

## Purpose and boundary

Turn a complete video brief into a practical production blueprint that the user can use to collect media and assemble manually in ChatCut.

Keep this skill planning-only:

- Do not create, target, or modify a ChatCut project.
- Do not upload, import, export, render, or place assets on a timeline.
- Do not author Motion Graphic JSX or call ChatCut MCP tools.
- Do not invent a digital-human appearance, wardrobe, avatar, or acting design. Support a digital human only through the spoken script and delivery annotations.
- If the user asks for direct ChatCut execution, state that this skill produces the handoff blueprint and ask them to continue with the appropriate ChatCut editing workflow.

Use ChatCut terminology precisely: call animated visual layers **Motion Graphics**, distinguish transparent overlays from opaque full-frame beats, and describe timing in relation to the final spoken structure.

## Intake gate

Collect and verify the following brief before drafting the production output. Treat each field as required unless the user explicitly marks it as not applicable.

| Field | Required information |
| --- | --- |
| Topic and goal | What the video is about and what the viewer should understand or do |
| Source content | Raw copy, notes, transcript, product facts, reference URL, or other material to use |
| Platform | For example TikTok, Douyin, Shorts, Instagram Reels, or another destination |
| Duration | Target finished length, such as 30 seconds or 90 seconds |
| Aspect ratio | For example 9:16, 1:1, or 16:9 |
| Audience | Who is watching and what they already know |
| Tone and pace | For example calm, direct, educational, urgent, conversational, or high-energy |
| Visual style | Concrete reference, brand direction, or a named visual language |
| CTA | The intended next action, or the explicit value `无 CTA` |

Ask for all missing fields in one concise follow-up. Do not start writing the script or fabricate defaults while a required field is missing. Use optional context only after the gate is complete:

- Brand colors, fonts, logo, product images, or mandatory on-screen elements.
- Existing A-roll, B-roll, screenshots, charts, documents, or audio assets.
- Caption or subtitle requirements.
- Reference videos, stock sources, forbidden visuals, or copyright constraints.
- Required language, voice, pronunciation, or terminology.

## Workflow

Follow this order so every downstream recommendation is anchored to the spoken structure.

1. **Lock the brief.** Restate the platform, duration, ratio, audience, tone, visual direction, and CTA in one compact production header.
2. **Choose the story spine.** Define the hook, promise or problem, supporting points, conclusion, and CTA. Remove claims that are not supported by the source content and label unresolved facts as `待确认`.
3. **Write the spoken script.** Fit the copy to the target duration. Use natural spoken sentences, clear transitions, and delivery marks for pauses, emphasis, speed, and emotion. Treat the final script as the timing anchor for all other layers.
4. **Derive the media plan.** Request only media that explains, proves, illustrates, or rhythmically supports a specific line or shot. Separate must-have material from optional polish.
5. **Design Motion Graphics.** Give each graphic one viewer job, a concrete form, a speech anchor, a timing span, internal animation beats, background mode, and safe placement guidance. Use a coherent visual language across the video while allowing different editorial jobs to use different forms.
6. **Design the sound plan.** Specify a non-distracting BGM direction and event-level SFX. Keep speech as the anchor, BGM as the follower, and short editorial accents on their own sound layer unless the brief says otherwise.
7. **Build the shot map.** Join script, media, Motion Graphics, sound, and material IDs into one timeline table. Make inconsistencies visible before delivery.
8. **Run the quality gate.** Check duration, source fidelity, material usefulness, visual protection, sound clarity, and completeness of the handoff.

## Output contract

Return the following five sections in this order, followed by the shot-by-shot map. Keep the output practical and ready to hand to a human editor.

### 1. 制作策略

Include:

- Video goal and viewer promise.
- Platform, duration, aspect ratio, audience, tone, pace, and visual direction.
- One-sentence core takeaway.
- Story spine: `Hook → Problem/Promise → Key Points → Conclusion → CTA`.
- Recommended rhythm, chapter count, and approximate time budget per chapter.
- Important constraints, unresolved facts, and prohibited or unavailable assets.

Do not add a generic strategy paragraph that is not connected to the provided brief.

### 2. 素材总清单

Assign each material a stable ID such as `M01`, `M02`, and `M03`. Use a table with these columns:

`ID | 优先级 | 类型 | 具体内容 | 用途与出现时间 | 规格 | 获取方式 | 搜索关键词 | 版权/备注`

Use these priority values:

- `必需`: the edit cannot communicate the point or complete the shot without it.
- `可选`: useful for polish, pacing, or visual variety but removable without breaking meaning.
- `无需准备`: the moment can be covered by A-roll, a Motion Graphic, or the existing project surface.

Use these acquisition labels:

- `用户提供`: original footage, product files, brand assets, screenshots, or verified facts.
- `素材库搜索`: stock video, photos, icons, ambience, or sound effects.
- `AI 生成`: an image, video, voice, or graphic that can be generated from a separate prompt.
- `ChatCut 生成`: an asset that ChatCut can create after the user approves the blueprint.

For every `必需` or `可选` item, state the exact subject, action, framing, orientation, duration, and any protected text, logo, product, person, or document detail. Add useful Chinese and English search keywords when stock search is appropriate. Never call a material “相关画面” or “适当音效” without describing what it must show or sound like.

Do not request decorative media by default. Prefer one strong, understandable asset over a long list of generic B-roll. If a claim needs evidence, ask for the source or mark it `待确认` instead of inventing proof.

### 3. 口播稿

Deliver a complete, copyable spoken script rather than an outline. Include:

- Estimated character/word count and estimated speaking duration.
- Section labels for `Hook`, `主体`, `结论`, and `CTA`.
- Natural spoken punctuation and short paragraphs that map to visual beats.
- Delivery annotations such as `[停顿 0.3s]`, `[重读：关键词]`, `[加快]`, `[放慢]`, and `[语气：坚定]` only when they improve performance.
- A note for any pronunciation, number, brand name, or terminology that needs confirmation.

Keep the script faithful to the source content. Do not add unsupported statistics, testimonials, guarantees, or product capabilities. Make the copy usable for a digital human or voice-over without adding a separate avatar design section.

### 4. 画面视觉与 Motion Graphics

First decide whether each beat needs A-roll, B-roll, a still/image, a screen recording, a full-frame visual, or no additional layer. Then specify Motion Graphics only where they improve comprehension, orientation, emphasis, or pacing.

For every Motion Graphic, provide:

`MG编号 | 时间段 | 对应口播 | 观看任务 | 表现形式 | 屏幕内容 | 入场/停留/退出 | 背景 | 放置与保护 | 依赖素材`

Apply these rules:

- Give the graphic a viewer job, such as identity, key claim, list, comparison, process, chapter marker, quote, or abstract relationship.
- Describe a concrete form: name tag, emphasis treatment, step stack, diagram, chart, title beat, side treatment, or another justified form. Do not default to a card containing plain text.
- Tie the start and end to a spoken phrase or visual event. Describe internal beats with relative timing, for example `0.0–0.2s reveal`, `0.2–1.2s hold`, `last 0.2s exit`.
- Choose `透明叠加` for overlays over A-roll and `全屏不透明` for an intentional visual beat that replaces the footage. Do not silently cover the speaker with a full-screen design.
- Describe placement as a safe region or composition relationship, not a guessed fixed coordinate. Protect the face, head, mouth, hands, important products, logos, existing overlays, and the subtitle/caption band.
- State the exact text, number, icon, image, or data that must be present. If it is not known, write `待补充` rather than fabricating it.
- Keep one shared visual language across the video: palette, typography logic, density, motion tone, and material treatment. Let unrelated viewer jobs use different forms within that language.
- If no graphic improves the beat, write `不添加 MG` and explain why.

Do not output JSX, implementation code, guessed ChatCut asset IDs, or direct MCP actions.

### 5. 声音设计

#### BGM direction

Specify:

- Genre or instrumentation.
- Mood and energy curve.
- Approximate tempo or rhythmic feel.
- Role in the edit: intro sting, background bed, transition lift, or outro.
- Vocal policy, normally `no prominent lyrics` under speech.
- Search/generation keywords.
- Fade, loop, and ducking notes.

Keep the spoken voice intelligible. Treat narration/voice as the `anchor`, BGM as the `follower`, and use auto-ducking or manual level guidance under speech. Do not recommend a copyrighted song as though it were a free asset.

#### SFX event list

Use a table with:

`SFX编号 | 时间点/触发事件 | 音效 | 强度 | 作用 | 搜索关键词 | 混音备注`

Use specific editorial events such as hook hit, text reveal, step change, click, notification, product contact, transition whoosh, impact, room tone, or outro resolve. Keep SFX sparse and intentional. Leave a beat empty when silence helps the message.

### 6. 逐镜头总表

Use this exact column order:

`时间段 | 口播内容 | 画面/素材 | MG 动效 | BGM/SFX | 素材编号`

Keep every row internally consistent with the script. Reference material IDs and MG/SFX IDs instead of repeating vague descriptions. Use seconds in the user-facing table, and ensure the last row reaches the planned duration without leaving unexplained gaps.

## Material selection rules

Use the following filters before adding an item to the checklist:

1. Map the item to a specific spoken line or shot purpose.
2. Mark it `必需` only when removing it harms meaning, proof, continuity, or required brand identity.
3. Prefer user-owned source material for products, people, logos, claims, interfaces, and sensitive facts.
4. Flag aspect-ratio, framing, resolution, transparency, duration, and crop requirements.
5. Protect readable text, UI, logos, packaging, documents, and faces from accidental crop or replacement.
6. Separate visual source material from Motion Graphic content. A chart may need data verification even when its decorative background can be generated.
7. Avoid collecting B-roll in the first and last three seconds unless the brief explicitly makes it part of the opening or ending beat.
8. Use `待确认` for missing source facts, brand rules, or asset availability. Do not hide uncertainty inside a confident recommendation.

## Quality gate

Before returning the blueprint, verify all of the following:

- The brief is complete and restated accurately.
- The script has a clear hook, logical body, conclusion, and CTA or explicit `无 CTA`.
- The script's length is plausible for the target duration and the delivery annotations are usable.
- Every requested material has a purpose, priority, acquisition path, and search description.
- Every Motion Graphic has a viewer job, concrete form, timing, background mode, safe-area guidance, and material dependency.
- The sound plan includes a BGM direction and only intentional SFX events, with speech clarity protected.
- The shot map covers the planned duration and uses consistent IDs.
- No separate digital-human visual design section has been introduced.
- No ChatCut project mutation, MCP call, JSX, export promise, or invented asset ID appears in the answer.

## Route boundary

Use this skill for topic-to-blueprint requests such as educational shorts, personal-brand videos, product explainers, tutorials, announcements, and other videos where the user needs to gather media before assembling in ChatCut.

Route these requests elsewhere:

- Benchmark-video replication, ecommerce replacement, nine-grid storyboards, Seedance, Gemini Omni, Google Flow, or Veo packages: use `$auto-videl`.
- Actual ChatCut project creation, asset import, timeline editing, Motion Graphic authoring, captions, audio placement, verification, or export: use the matching ChatCut plugin workflow after this blueprint is approved.
