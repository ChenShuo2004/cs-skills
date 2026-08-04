---
name: auto-videl
description: "Use when the user types $auto-videl or asks for Douyin/TikTok ecommerce video workflows, including competitor replication, strong-Hook nine-grid prompt_image.md to image2 storyboards, Seedance prompts/API submission, Gemini Omni first-frame video, or Google Flow/Veo first-frame-to-video packages."
---

# auto Videl

This is the user's local `auto Videl` skill, invoked as `$auto-videl`.

It runs Douyin/TikTok ecommerce information-feed video workflows. Use it when the user wants to analyze a benchmark short video, replace the product, generate actual storyboard images from `prompt_image.md` with image2, turn user-provided nine-frame storyboards into a final video, generate Seedance 2.0 prompts, prepare Gemini Omni or Google Flow/Veo first-frame-to-video packages, optionally submit Seedance API generation tasks with their own locally configured API key, or consolidate results into Feishu.

## Platform Mode Selection

Before writing final video-generation deliverables, identify the target platform mode. If the user has not named a mode, ask which mode to use before producing final prompts or images:

- `seedance`: Seedance/C端2.0 prompts, storyboard references, optional API dry-run or submission.
- `gemini-omni`: 8-second first-frame-to-video units with first-frame images and Gemini Omni prompts.
- `google-flow`: Google Flow/Veo first-frame-to-video units, normally 8 seconds each, with first-frame images, image prompts, video prompts, and optional voice/sound direction.
- `prompt-only`: no image/video generation; deliver scripts, storyboard prompts, and platform-ready text only.

If the user explicitly says `$auto-videl google-flow`, `Google Flow`, `Flow`, `Veo`, `Frames to Video`, or `首帧转视频`, load `references/google-flow-mode.md` and use Google Flow mode. For Google Flow mode, default to first-frame-to-video unless the user explicitly asks for another Flow feature. If the user asks for Google Flow but not the clip duration, use 8 seconds per clip unless they ask for a supported shorter duration.

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
- Storyboard images are mandatory final deliverables for replication runs unless the user explicitly asks for prompts only. For 强 Hook 九宫格生成出片链路, image2-generated 9-frame storyboards are mandatory. For 九宫格成片直投链路, the user-provided 9 frames are the storyboard images and do not need to be regenerated unless the user asks.
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

## Final Deliverables

For 复刻链路, final user-facing delivery should contain only:

- The actual generated storyboard image file(s), one image per planned Seedance segment.
- The rewritten imitation copy/script, aligned to the final storyboard order.
- The final Seedance 2.0 video generation prompt(s), one prompt per storyboard image/segment.
- If the user has configured their own Seedance/Ark API key and asks Codex to generate video through the API: the downloaded Seedance MP4 file(s) and the video QC result.

Keep breakdowns, copy extraction, script framework, replication blueprint, copy rewrite, OCR sheets, and frame reviews as internal working material. Do not surface them in the final response unless the user explicitly asks for the full analysis, debug evidence, Feishu writeback, or a reusable archive.

For 强 Hook 九宫格生成出片链路, final user-facing delivery should contain only:

- The confirmed Chinese nine-grid storyboard script generated from `prompt_image.md`.
- The 9 image2 prompts/JSON, including voiceover fields when present.
- The generated 9 storyboard frames and optional 3x3 overview grid.
- The final Seedance/C端2.0 video generation prompt generated from the 9 storyboard frames and 9 prompts.
- If API generation is requested and the user's private key is configured: the downloaded Seedance MP4 file and the video QC result.
- If no API key is configured: the 9 frames, 9 prompts, final Seedance prompt, and exact reference-image order for manual C端2.0/Seedance upload.

For 九宫格成片直投链路, final user-facing delivery should contain only:

- The final Seedance/C端2.0 video generation prompt generated from the user-provided 9 frames and 9 prompts.
- If API generation is requested and the user's private key is configured: the downloaded Seedance MP4 file and the video QC result.
- If no API key is configured: the prompt and exact reference-image order for manual C端2.0/Seedance upload.

Do not surface replication-only breakdown artifacts during 强 Hook 九宫格生成出片链路 or 九宫格成片直投链路 because they are not part of those routes.

For Google Flow mode, final user-facing delivery should contain only:

- One folder per clip, or a clear list if no files are created.
- The first-frame image file for each 8-second unit.
- The first-frame image prompt used to generate or revise that frame.
- The Google Flow/Veo video prompt for each clip, written for first-frame-to-video.
- Optional voiceover and sound direction when the clip should use generated audio.
- A short upload/use order: first upload the product/reference image(s), then the matching first-frame image, then paste the video prompt.

## Default Inputs

For 复刻链路, ask for or locate these inputs:

- Benchmark video file.
- Product information.
- Product image files.
- Product image notes describing image order and use.
- Optional existing storyboard images.
- Optional Feishu table field names or target record.

For 强 Hook 九宫格生成出片链路, ask for or locate these inputs:

- Product name, selling points, target audience, and optional visual reference style.
- Product image files and product image notes when product appearance must be locked.
- Optional language/voiceover requirement, such as Bahasa Melayu.
- Optional audio mode: `ambient` by default, or `silent`, `music`, `voiceover`, `full`.
- Optional target duration and whether to call the API or only output prompts.
- For Google Flow mode: desired clip count, clip duration if not 8 seconds, whether to generate first-frame images now or only write first-frame prompts, and whether voice/sound should be included.

For 九宫格成片直投链路, ask for or locate these inputs:

- 9 storyboard frame images, preferably as separate images in shot order.
- 9 prompts produced from the `prompt_image.md` system, including voiceover fields if present.
- Optional product information, product images, and product image notes if the grid does not fully lock product appearance.
- Optional target duration, voiceover/copy, language, audience, audio mode, and whether to call the API or only output prompts.

## 复刻链路 Workflow

1. Inspect the video with frame extraction when working locally. For ecommerce information-feed videos, use dense enough sampling to catch short hand/product actions.
2. Run video breakdown with `references/prompts/01-video-breakdown.md`.
3. Extract original copy with `references/prompts/02-copy-extract.md`. For any video that affects copywriting, use the multi-source procedure in `references/copy-extraction.md`: audio transcription plus subtitle/OCR frame review plus first-3-second verification.
4. Run script framework analysis with `references/prompts/03-script-framework.md`.
5. Run replication blueprint with `references/prompts/04-replication-blueprint.md`.
6. Run copy rewrite with `references/prompts/05-copy-rewrite.md`.
7. Run storyboard image prompt generation with `references/prompts/06-storyboard-prompt.md`.
8. Before generating storyboard images, build an internal product-fidelity contract from the product images and notes: product category, shape, color, length/proportion, material/texture, structure, seams, special panels, logo/mark/text/pattern position, logo/mark/text/pattern size, logo/mark/text/pattern color, logo/mark/text/pattern direction, and any category-specific identity details such as pendant, clasp, gemstone, connector, label, packaging, screen, button, cap, nozzle, or texture. Use `references/product-fidelity-gate.md`.
9. Generate every actual storyboard image planned by the blueprint in the same run with Codex image generation, not only the first one. If the blueprint plans 2 storyboards, generate 2 images; if it plans 3 storyboards, generate 3 images. The generated image count must equal the storyboard count. If a storyboard contains a visible person or KOC/口播 character, generate sequentially: create and save storyboard 1 first, then generate storyboard 2+ using the product image(s) and the actual generated storyboard 1 as visual/style references when the image tool supports references. Do not treat text-only "continue the same person" as sufficient if the tool supports image references.
10. After each generated storyboard image, run a per-cell quality check before writing final Seedance prompts: first P0 product fidelity/no deformation, then logo/mark physical logic, then real-world physics, then benchmark-frame similarity. If the product fails P0, do not accept the image as final.
11. Apply the finite retry rule: generate the whole storyboard once and QC once. If only 1-2 cells have correctable issues, regenerate once with targeted corrections. If many cells drift, or the same P0 product-fidelity issue remains after one targeted retry, mark the run failed and report the exact reason instead of continuing automatic retries.
12. Run Seedance video prompt generation with `references/prompts/07-seedance-video-prompt.md` only after storyboard QC. If the storyboard has wrong product type, wrong product shape, serious deformation, wrong color/variant, or many cells that no longer match the benchmark, stop and report failure. If the storyboard's only remaining issue is missing/unclear/misplaced product identity detail while product images clearly lock the correct product, and the user explicitly wants Seedance API testing with their own configured API key, mark the storyboard as structure-only and write the Seedance prompt so product images are the only product appearance source; do not call that storyboard product-fidelity-passed.
13. If the user asks for final video generation through Seedance API, first confirm they have configured their own private API key in the local environment or `$HOME/.codex/secrets/seedance.env`. Never use or request a shared packaged key. Then load `references/seedance-api.md`, submit the prompt/product images/storyboard image with `scripts/seedance_submit.py`, poll the task, download the MP4, and run video QC. If no API key is configured, deliver the storyboard image(s) and final Seedance prompts for manual upload/generation instead. The final video fails if any shot that should show a product identity detail, including logo/mark/text/pattern, pendant, clasp, gemstone, connector, label, packaging detail, screen, button, cap, nozzle, or distinctive texture, lacks it or moves it to the wrong physical surface.
14. If requested, prepare a Feishu writeback package using `references/feishu-fields.md`.
15. During testing, clean temporary analysis files after the final outputs are ready. Keep the generated storyboard images, final Seedance video prompts, downloaded videos, and video QC result; delete extracted frames, subtitle/OCR review sheets, overview contact sheets, and other temporary inspection files unless the user explicitly asks to preserve them.

## 强 Hook 九宫格生成出片链路 Workflow

1. Load bundled `references/prompts/00-prompt-image.md`. If the user explicitly provides or edits a workspace `prompt_image.md`, use that workspace file as the creative source of truth for chain 2.
2. Generate the Chinese nine-grid storyboard script from product information. The first 3 Hook cells must follow the 强 Hook rules in `prompt_image.md`: clear 停滑点, amplified pain point or curiosity, visible product/solution turn by cell 3, and internal Hook自检评分. If the Hook is weak, rewrite the first 3 cells before showing the script.
3. Stop and ask the user to confirm or revise the Chinese storyboard script. Do not generate image2 prompts before confirmation.
4. After confirmation, generate the pure JSON required by `prompt_image.md`: 9 image2 `prompt_text` values plus `voiceover_tone` and `voiceover_ms` when applicable.
5. Call Codex image2/image generation to create exactly 9 storyboard frames, one per prompt, preserving the shared `global_style`. Save the 9 frames in shot order and optionally create a 3x3 overview grid for review.
6. QC the 9 storyboard frames against the confirmed script and product images. If 1-2 frames are correctable, regenerate those frames once with targeted fixes. If the Hook frames no longer read as strong Hook, regenerate the weak Hook frames before continuing.
7. Run `references/prompts/08-nine-grid-video-prompt.md` to write the final Seedance/C端2.0 prompt from the 9 storyboard frames, 9 prompts, voiceover/copy, product information, and product images.
8. If the user only wants prompts or no API key is configured, deliver the generated frames, image2 JSON, final Seedance prompt, selected `audio_mode`, and exact reference-image order for manual upload.
9. If the user asks Codex to generate video through the API, submit through `scripts/seedance_submit.py` with `--reference-mode grid-storyboard` and `--audio-mode` set from the user request or the default policy, passing product images first if provided, then the 9 storyboard frames in order. Use `--reference-audio-url` when the user provides reference music/audio. Use `--dry-run` before a paid call unless the user explicitly asks to submit directly.
10. Poll and download the video only after confirming `ARK_API_KEY` exists in the environment or `$HOME/.codex/secrets/seedance.env`. Never request or store a shared packaged key.
11. Run video QC against the 9 frames and 9 prompts. The output fails if it skips/reorders shots, weakens the Hook, invents new scenes, breaks product identity, adds subtitles/screen text that were not requested, or violates physical-world logic.

## 九宫格成片直投链路 Workflow

1. Load `references/grid-to-video-workflow.md`.
2. Verify the user provided 9 storyboard frames and 9 prompts generated from the `prompt_image.md` system. If only a 3x3 overview grid is provided, ask whether to use it as the structure reference or request the separate 9 frames.
3. Do not regenerate the Chinese script and do not call image2 unless the user explicitly asks to repair or remake frames.
4. Run `references/prompts/08-nine-grid-video-prompt.md` to write one final Seedance/C端2.0 prompt. The prompt must follow the 9 provided frames in order, preserve the 9 prompts' intent, and keep all shots physically plausible.
5. If the user only wants a prompt or no API key is configured, deliver the prompt, selected `audio_mode`, and the exact reference-image order for manual upload.
6. If the user asks Codex to generate video through the API, submit through `scripts/seedance_submit.py` with `--reference-mode grid-storyboard` and `--audio-mode` set from the user request or the default policy, passing product images first if provided, then the 9 storyboard frames in order. Use `--reference-audio-url` when the user provides reference music/audio. Use `--dry-run` before a paid call unless the user explicitly asks to submit directly.
7. Poll and download the video only after confirming `ARK_API_KEY` exists in the environment or `$HOME/.codex/secrets/seedance.env`. Never request or store a shared packaged key.
8. Run video QC against the 9 frames and 9 prompts. The output fails if it skips/reorders shots, invents new scenes, breaks product identity, adds subtitles/screen text that were not requested, or violates physical-world logic.

## When To Load References

- Load `references/workflow.md` for end-to-end file organization and output naming.
- Load `references/product-fidelity-gate.md` before storyboard prompt generation, storyboard QC, any regeneration decision, and Seedance prompt writing for soft goods/logo-sensitive products.
- Load `references/seedance-rules.md` before writing or reviewing Seedance prompts.
- Load `references/seedance-api.md` when the user asks to submit or poll Seedance API generation tasks and has their own API key configured.
- Load `references/prompts/00-prompt-image.md` for 强 Hook 九宫格生成出片链路 before generating Chinese storyboard scripts or image2 prompts; use workspace `prompt_image.md` only when the user explicitly points to it.
- Load `references/grid-to-video-workflow.md` and `references/prompts/08-nine-grid-video-prompt.md` for 九宫格成片直投链路 and for the Seedance prompt step of 强 Hook 九宫格生成出片链路.
- Load `references/google-flow-mode.md` whenever the target output is Google Flow, Veo, Frames to Video, first-frame-to-video, or Google Flow Gemini Omni.
- Load `references/copy-extraction.md` before extracting or correcting original video copy.
- Load `references/quality-checklist.md` before finalizing outputs or diagnosing drift.
- Load only the specific prompt file needed for the current step.
- Load `references/feishu-fields.md` when mapping outputs back to Feishu.

## Quality Gates

Before moving to the next step:

- Video breakdown should describe real visible elements, actions, composition, lighting, and texture without inventing scene details.
- Replication blueprint should filter detailed shots into key storyboards rather than copying every shot blindly.
- Storyboard generation must preserve the product-fidelity contract before anything else. Product category, color, shape, scale, length/proportion, material, texture, seams, structure, logo/mark/text/pattern placement, and category-specific identity details must match the product images.
- A storyboard with a product that is missing required visible identity details, has a misplaced logo/mark/text/pattern or category-specific detail, has the wrong variant/color/shape, or is deformed is a failed storyboard, even if the benchmark composition is similar.
- Identity-detail logic is physical, not decorative: decide per cell whether the relevant product surface should be visible from that camera angle. If visible, preserve logo/mark/text/pattern and category-specific details in the correct physical place and orientation; if not visible, do not invent them on the front, back, underside, package, body, prop, or wrong side.
- Each storyboard image corresponds to one future Seedance video segment.
- Each storyboard image must be 9:16 and at most 12 cells. It normally covers at most 15 seconds of original video, except benchmark videos around 15-17 seconds, which default to one compressed 15-second storyboard/video segment.
- No key storyboard should cross segment boundaries; if a key action spans the boundary, move it wholly into the next segment or split it naturally.
- Storyboard prompts should not force new captions, screen text, price text, or package text unless those were clearly part of the source structure.
- Storyboard prompts and generated storyboard images must be one-to-one with the benchmark video's actual shots. Do not add, replace, reorder, or reinterpret any shot, scene, action, prop, background, camera angle, or product presentation that is absent from the benchmark video. Product references only replace the product's appearance inside the source shot structure; they never create new shot content.
- Storyboard QC must compare each generated cell against the corresponding original frame/keyframe for framing, camera angle, product position, body-part position, hand action, prop relationship, scene structure, and product scale. Do not accept a generic product-ad cell that does not match the benchmark shot function.
- For benchmark videos around 15-17 seconds, default to one 15-second Seedance segment and one 9:16 storyboard image unless the user explicitly asks to preserve the full duration or split segments. Compress only by shortening low-value holds and transitions, never by adding, replacing, reordering, or redesigning any shot.
- The generated storyboard image count must equal the storyboard count in the replication blueprint. Do not stop after the first storyboard when more are planned.
- For multi-segment KOC/person storyboards, the actual first storyboard image locks the person: gender, age range, face style, hair, outfit, hand style, posture, environment, lighting, and phone-shot texture. Later storyboards must use that actual image as a visual reference, not only a text instruction.
- Seedance prompts must not request subtitles, screen text, background music, or any generated-video reference.
- Seedance prompts must be physically plausible and should not describe impossible hand positions, object intersections, sudden product shape changes, broken gravity, inconsistent camera direction, or discontinuous scene geography.
- Seedance prompts must simplify high-risk continuous physical actions. If object count, hand contact, or body support could drift, describe a hard cut to an already-stable state rather than a continuous extraction, insertion, transformation, or morphing action.
- Seedance prompts must include a per-shot physical-state contract for soft goods and body-part shots: visible contact points, number of hands/feet/body parts, support direction, object count before/after, and what must not appear.
- Seedance prompts must explicitly say that product images override storyboard images for product appearance whenever the generated storyboard image has any product drift, unclear identity detail, unclear logo/text, or minor deformation. Storyboard images lock composition and scene; product images lock the product.
- For API video generation with an identity-detail-deficient storyboard, treat the storyboard as structure-only: product images are the only product appearance source, and the prompt must explicitly say that missing, unclear, misplaced, wrong-scale, wrong-material, wrong-color, or wrong-category product details in the storyboard are errors and must not be inherited. The final downloaded video must still pass product identity/logo QC.

## Local Video Analysis Guidance

Codex analyzes videos through frame extraction and visual inspection rather than native continuous video viewing. For typical ecommerce videos with 1-2 second shots, this is sufficient when sampling is dense enough.

Recommended approach:

- First inspect duration, resolution, and frame rate.
- If `ffprobe` or `ffmpeg` is not on the default command path, locate a bundled/local ffmpeg and continue. Missing `ffprobe` is not a blocker; `ffmpeg -i` can still reveal duration, streams, resolution, and frame rate, and the same ffmpeg binary can extract frames.
- Extract overview frames every 0.5-1 second.
- Extract denser frames around fast actions or suspected cut points.
- Build a contact sheet when the user needs visual verification.
- Use audio transcription plus subtitle/OCR frame review for copy extraction. Never rely only on small contact-sheet subtitles for first-3-second copy.
- Treat frame sheets and OCR review images as temporary files. Remove them after storyboard images and video prompts are finalized.

## Artifact Retention

Default testing policy:

- Keep: generated storyboard images, rewritten imitation copy/script, final Seedance video prompts, downloaded Seedance videos, final video QC records, and optional Feishu payloads.
- Delete after use: `frames/`, `copy_review/`, overview contact sheets, selected-frame review sheets, subtitle/OCR crops, temporary image contact sheets, and other local analysis scratch files.
- If the user asks to debug a bad result, temporarily keep the review frames needed for comparison, then clean them after diagnosis.

Default final retention should prioritize `outputs/storyboard_images/`, `outputs/copy_rewrite.md`, `outputs/seedance_video_prompts.md`, and when API generation is requested, `outputs/seedance/`. A full `run_output.md` is optional internal/archive material, not the default user-facing deliverable.

## Output Style

Keep responses practical and short. For ordinary replication runs, the final response should point to/show the generated storyboard image(s) and provide or link the final Seedance prompt(s). Do not summarize all internal analysis unless asked. When the user asks to modify a prompt, output the complete replacement prompt, not just a diff.
