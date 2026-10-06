## 强 Hook 九宫格生成出片链路 Workflow

1. Load bundled `references/prompts/00-prompt-image.md`. If the user explicitly provides or edits a workspace `prompt_image.md`, use that workspace file as the creative source of truth for chain 2.
2. Generate the Chinese nine-grid storyboard script from product information. The first 3 Hook cells must follow the 强 Hook rules in `prompt_image.md`: clear 停滑点, amplified pain point or curiosity, visible product/solution turn by cell 3, and internal Hook自检评分. If the Hook is weak, rewrite the first 3 cells before showing the script.
3. Before image generation, use the user's confirmation of the storyboard script; an existing confirmation remains valid. If still unconfirmed, show the script and wait. In prompt-only mode, deliver the requested text without image or video calls.
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
