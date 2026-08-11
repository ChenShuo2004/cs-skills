# Google Flow Mode

Use this reference when the target platform is Google Flow, Veo, Frames to Video, or first-frame-to-video.

## Goal

Prepare production-ready ecommerce short-video units for Google Flow/Veo. The default package is:

- 8-second clip units.
- One first-frame image per clip.
- One first-frame image prompt per clip.
- One Google Flow video prompt per clip.
- Optional voiceover and sound direction.

Do not assume Codex can directly operate the user's Google Flow account. Flow is usually a browser product with login, credits, model availability, and feature names that can change. Deliver files and prompts by default; only drive the browser if the user explicitly asks.

## Ask First

If the user asks for video generation but does not name the target platform, ask which output mode to use:

- Google Flow/Veo first-frame-to-video.
- Gemini Omni first-frame-to-video.
- Seedance/C端2.0.
- Prompt-only.

If the user has already named Google Flow, do not ask again unless a blocking detail is missing. Default to first-frame-to-video and 8 seconds per clip.

Ask only when needed:

- Clip count if the source is long and the user did not say how many clips to produce.
- Whether to generate first-frame images now or only write first-frame prompts when image generation is unavailable or the user only wants prompts.
- Whether the video should include generated audio, voiceover, music, or only natural environment/action sound.

## Clip Design

One Google Flow clip should carry one selling point. For ecommerce, prefer:

1. Hook / stop-scroll first visual.
2. One clear product action or proof.
3. One visual payoff.
4. Optional short voiceover line.

For multi-clip packages, split by selling point instead of forcing a continuous long scene:

- Clip 1: stop-scroll effect or product reveal.
- Clip 2: core feature proof.
- Clip 3: variants/modes/use cases.
- Clip 4: installation/trust/CTA.

## First-Frame Image Rules

The first frame is the visual anchor. It should look like the opening frame of the requested video, not a poster.

First-frame images must:

- Be 9:16 vertical for Douyin/TikTok/Reels style output.
- Contain no subtitles, price text, CTA text, QR codes, UI overlays, or watermarks.
- Show the product/scene in the exact opening composition.
- Lock product category, color, material, scale, placement, and physically plausible lighting.
- Avoid screens or readable UI unless the video is about an interface and the text is intentionally controlled.

For product-sensitive work, generate or select a first frame that can be used as a structure reference while product reference images remain the product-appearance source of truth.

## Video Prompt Rules

Write the Google Flow prompt as an instruction to animate the uploaded first frame:

- Start with: "Use the uploaded image as the exact first frame."
- State duration: "Generate an 8-second 9:16 vertical video."
- Preserve the first frame's composition, object positions, product identity, lighting, and scene geometry.
- Describe motion from 0-8 seconds in 2-4 beats.
- Specify camera motion, product action, lighting change, and audio/voiceover if needed.
- Ban text generation and unwanted artifacts.

Do not write placeholders such as `@图片X`, `0:XX`, `continue`, or "replace later". Use concrete time ranges such as `0-2s`, `2-5s`, `5-8s`.

## Output Folder Shape

When writing files, use this structure under the task output directory:

```text
google-flow/
  01_clip_name/
    first_frame.png
    first_frame_prompt.md
    flow_video_prompt.md
    voiceover.txt
```

If the user wants a compact package, a single `google_flow_prompts.md` is acceptable, but image files should still be named clearly:

```text
01_open_door_first_frame.png
02_touch_sync_first_frame.png
```

## Prompt Template

First-frame image prompt:

```text
Use case: ads-marketing
Asset type: first-frame still for an 8-second Google Flow/Veo video
Primary request: <one-sentence clip goal>
Input references: <product image role and any benchmark/source image role>
Scene/backdrop: <opening scene>
Subject: <product and visible action state>
Composition: 9:16 vertical, <camera angle>, <what is foreground/background>
Lighting/style: photorealistic phone-shot, <lighting>
Product constraints: <appearance and placement locks>
Avoid: text, captions, price labels, QR codes, watermarks, <category-specific artifacts>
Output: one clean 9:16 vertical first-frame image, no text.
```

Google Flow video prompt:

```text
Use the uploaded image as the exact first frame. Generate an 8-second 9:16 vertical video.

Preserve the first frame's product identity, composition, camera angle, interior/scene geometry, and lighting logic. Do not add subtitles, text, price labels, QR codes, logos, watermarks, or UI overlays.

0-2s: <opening movement while keeping the first-frame structure>.
2-5s: <main product action/proof>.
5-8s: <payoff/end state>.

Audio: <environment/action sound, music, voiceover, or silent>.
Product constraints: <what must remain physically correct>.
Avoid: <failure modes>.
```

## QC

Before delivery, check:

- Each clip is 8 seconds unless the user chose another duration.
- Each clip has one first-frame image or first-frame prompt.
- The video prompt explicitly says to use the uploaded image as the exact first frame.
- The prompt bans text/captions/watermarks when the user did not request them.
- The product remains physically plausible and does not drift into another category.
- The output can be pasted into Google Flow without extra explanation.
