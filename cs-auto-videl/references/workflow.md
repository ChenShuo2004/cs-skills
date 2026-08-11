# Workflow

## Purpose

Turn a benchmark Douyin ecommerce short video plus product assets into final production assets:

- Actual storyboard images generated with Codex image generation.
- Rewritten imitation copy/script aligned to the chosen storyboard cells.
- Seedance 2.0 video prompts that use the generated storyboard images as segment references.
- Optional Seedance API submission only when the user has configured their own private API key.
- Optional internal/archive analysis if explicitly needed.
- Optional Feishu asset record.

## Recommended Local Workspace

Use a project folder per benchmark/product pair:

```text
inputs/
  benchmark.mp4
  product_info.md
  product_image_notes.md
  product_images/
internal/
  01_video_breakdown.md
  02_copy_extract.txt
  03_script_framework.md
  04_replication_blueprint.md
  05_copy_rewrite.txt
  06_storyboard_generation_prompts.md
outputs/
  copy_rewrite.md
  storyboard_images/
    storyboard_01.png
    storyboard_02.png
    storyboard_03.png
  seedance_video_prompts.md
  seedance/                 # optional, only when using the user's own API key
  feishu_record_payload.json
```

Temporary analysis folders such as `frames/`, `copy_review/`, OCR crops, and overview contact sheets should be treated as scratch space. During testing, delete them after the storyboard images and video prompts are ready unless the user asks to preserve them for debugging.

## Execution Notes

- Run the full analysis chain internally, but do not make intermediate analysis the default final deliverable.
- The default final deliverables are generated storyboard image files plus `copy_rewrite.md` and `seedance_video_prompts.md`.
- Product fidelity/no deformation is the first acceptance gate for generated storyboards. If the replacement product is wrong, deformed, or missing required visible identity details, the run fails even if the storyboard looks polished or compositionally close.
- Generate the whole storyboard once and QC it cell by cell. If only 1-2 cells need repair, do one targeted regeneration. If many cells drift or P0 product fidelity still fails, stop and report failure rather than continuing automatic retries.
- Do not keep raw extracted frames and subtitle-review sheets by default; they are only analysis scratch files and can accumulate local disk usage.
- Prefer concrete visual descriptions over abstract strategy.
- Product image notes are the source of truth for product image order and usage.
- Feishu can remain the asset management system even when Codex runs the workflow locally.
- When the blueprint plans multiple storyboard images, generate and save all of them in `outputs/storyboard_images/` during the same run unless the user asks to generate only one. Do not stop at storyboard prompt text.
- Most workflows should produce 1-3 storyboard images because each corresponds to a video segment of at most 15 seconds.
- For videos clearly longer than 17 seconds, use multiple storyboard images to maintain product, scene, person/hand style, lighting, and shot-order consistency across segments.
- For benchmark videos around 15-17 seconds, default to compressing the final output into one 15-second Seedance segment and one 9:16 storyboard image. Shorten repeated holds and low-value transitions; do not fill cells by adding any shot, action, prop, camera angle, background, or product presentation that the benchmark video does not contain.
- Treat product references as appearance locks, not shot-source material. Product images decide what the replacement product looks like inside each original shot; they do not authorize new scenes, props, packaging, layouts, tests, gestures, or presentation modes unless the benchmark video already contains that same shot function.
- For logo/mark-sensitive products, product identity is not optional. Do not hide, remove, or weaken the logo/mark to avoid AI text risk; preserve it when the benchmark-equivalent camera angle should reveal the logo-bearing side.

## Future Extensions

- Feishu API sync can upload generated text, images, videos, labels, and status.
- Seedance API integration can submit prompts, poll jobs, download videos, and write results back to Feishu only when the user configures their own API key locally. Shared packages must not include real keys.
