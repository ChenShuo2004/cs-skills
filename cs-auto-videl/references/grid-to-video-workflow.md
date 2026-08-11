# Nine-Grid Frames To Video Workflow

Use this reference for the 九宫格成片直投链路: the user already has 9 storyboard frame images and 9 prompts produced from the `prompt_image.md` system, and wants Codex to turn them into a Seedance/C端2.0 video without analyzing a benchmark video or calling image2 again.

## Route Contract

- Input source is the user's 9 frame images plus 9 prompts, not a benchmark video.
- The 9 frame images lock shot order, composition, subject position, action beats, scene, lighting, texture, and visual style.
- The 9 prompts lock shot purpose, voiceover/copy rhythm, emotional progression, product selling points, and conversion logic.
- Do not run video breakdown, copy extraction, script framework analysis, replication blueprint, `prompt_image.md` script generation, or Codex image2 generation unless the user explicitly changes routes or asks to repair frames.
- Do not invent new scenes, props, products, characters, text overlays, captions, subtitles, packaging displays, price cards, or CTA shots that are not present in the frames/prompts.

## Required Inputs

1. 9 storyboard frame images in shot order.
2. 9 prompts from `prompt_image.md`, ideally with `voiceover_tone` and `voiceover_ms`.
3. Optional product images and product notes when the grid alone is not enough to lock product identity.
4. Optional duration, target language, voiceover/copy, and API/manual delivery preference.

If frames exist but prompts are missing, ask for the 9 prompts. If prompts exist but frames are missing, ask for the 9 frames.

## Prompt Generation

Use `references/prompts/08-nine-grid-video-prompt.md`.

The final prompt must:

- Produce one 9:16 vertical ecommerce short video.
- Read frames in the provided shot order. If the user provides a 3x3 overview grid instead of 9 separate frames, read cells from top-left to bottom-right.
- Map each frame/prompt pair to one time range and one shot description.
- Include the user's prompt/voiceover rhythm when provided.
- Preserve the frames' visual style and shot intent.
- Keep physical-world logic explicit for hand/product/body actions.
- Ban subtitles, screen text, background music, and generated-video references unless the user explicitly requested them.
- Avoid placeholder tokens such as `@图片X`, `0:XX`, `TBD`, or "continue writing".

## API Submission

When the user asks for API generation and a private key is configured, run a dry run first:

```bash
python3 $HOME/.codex/skills/cs-auto-videl/scripts/seedance_submit.py \
  --prompt-file outputs/nine_grid_seedance_prompt.md \
  --reference-image inputs/frame_01.png \
  --reference-image inputs/frame_02.png \
  --reference-image inputs/frame_03.png \
  --reference-image inputs/frame_04.png \
  --reference-image inputs/frame_05.png \
  --reference-image inputs/frame_06.png \
  --reference-image inputs/frame_07.png \
  --reference-image inputs/frame_08.png \
  --reference-image inputs/frame_09.png \
  --reference-mode grid-storyboard \
  --reference-note "@图片1-9=用户提供的9帧分镜图，按分镜1到分镜9读取。" \
  --output-dir outputs/seedance \
  --duration 9 \
  --ratio 9:16 \
  --resolution 720p \
  --dry-run
```

For a real generation, remove `--dry-run` and add `--poll`.

If product images are also provided, pass them before the 9 frame images and explain the image order in `--reference-note`; keep `--reference-mode grid-storyboard` so the script uses the nine-grid direct contract. Add `--product-lock` or `--product-lock-file` when product identity details need reinforcement.

## QC

The generated video passes only if:

- All 9 frame/prompt pairs are represented in order.
- Shot timing and pacing match the user's 9 prompts and voiceover/copy.
- Product category, color, shape, logo/label/packaging details, and count stay consistent with the grid and any product references.
- Hand/product/body actions are physically plausible.
- No unrequested subtitles, screen text, watermark-like text, extra CTA cards, new scenes, or extra products appear.
