# Seedance 2.0 API Integration

Use this reference when the user asks Codex to generate the final Seedance video through the API, not only write prompts.

This shared package does not include any API key. API generation only works after the recipient configures their own Seedance/Volcano Ark key locally. Without a key, complete the normal workflow by delivering storyboard images and Seedance prompts for manual upload/generation.

For 九宫格直出链路, also load `references/grid-to-video-workflow.md`. Submit with `--reference-mode grid-storyboard` so the request prompt uses the nine-grid contract instead of the replication product-image/storyboard split.

## Security

- Never write the Ark API key into `SKILL.md`, prompt files, generated reports, Git commits, or shared outputs.
- Never include a real `seedance.env` file or real API key in a ZIP, GitHub repo, copied skill folder, or shared team package.
- `scripts/seedance_submit.py` reads `ARK_API_KEY` from the environment, from a private env file passed by `--env-file`, or automatically from `$HOME/.codex/secrets/seedance.env` when that file exists.
- Recommended private env file path: `$HOME/.codex/secrets/seedance.env`.
- The env file must contain `ARK_API_KEY=...`.
- Optional env overrides:
  - `ARK_BASE_URL=https://ark.cn-beijing.volces.com`
  - `SEEDANCE_MODEL=doubao-seedance-2-0-260128`
- Each recipient must use their own account/API key. Do not share a root/master key.
- Model IDs, durations, account permissions, quota, and regional routes can change. If API calls fail, check the current Volcano Ark/Seedance documentation and the recipient account's enabled models before editing the workflow.

## API Shape

- Create task: `POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`
- Query task: `GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{id}`
- Default model: `doubao-seedance-2-0-260128`
- Use `Authorization: Bearer $ARK_API_KEY`.
- If the account is using another Ark/ModelArk route, set `ARK_BASE_URL` and `SEEDANCE_MODEL` in the private env file instead of editing the skill.
- Use `content` with one text item plus image items.
- For Seedance 2.0 multimodal reference video generation, pass all product images first and the storyboard image last, each image item with `role: "reference_image"`.
- Use `ratio: "9:16"`, `duration: 15` or the segment duration, `resolution: "720p"` by default, and `watermark: false`.
- Audio is controlled by `--audio-mode`: `silent`, `ambient`, `music`, `voiceover`, or `full`. Default is `ambient`, which sets `generate_audio: true` and asks for realistic environment/action sound. Use `silent` only when the user explicitly wants no sound.
- Use `--reference-audio-url` when the user provides reference music/audio; the script passes it as `{"type":"audio_url","role":"reference_audio"}`.

## Reference Image Order

For a normal replication run:

1. Product image 1
2. Product image 2
3. Product image 3, if provided
4. More product images, if provided
5. Current segment storyboard image

The prompt should name this order plainly. Product images are the only product appearance source. The storyboard image locks shot order, composition, scene, light, hand/foot style, and action rhythm only.

## Identity-Detail-Deficient Storyboard Handling

If the generated storyboard has missing, unclear, or misplaced product identity details but the user still wants to test Seedance API generation with their own configured API key:

- Do not call the storyboard product-fidelity-passed.
- Submit it only as a structure reference.
- Prepend the generic product appearance lock block through `scripts/seedance_submit.py` default behavior.
- Add a product-specific lock with `--product-lock` or `--product-lock-file` when the product has details that need stronger wording, such as visible logo/mark, pendant/clasp, gemstone, bottle cap/nozzle, label, screen, button, packaging structure, or distinctive texture.
- In the Seedance prompt, explicitly state that the storyboard's missing, unclear, misplaced, wrong-scale, wrong-material, wrong-color, or wrong-category product details are storyboard errors and must not be inherited.
- Final video product identity/logo QC becomes the hard P0 gate. If any shot that should show a product identity detail lacks it or moves it to the wrong surface, the final video fails.

The script prepends a default generic product-lock block unless `--no-product-lock-prefix` is set. Do not disable this for identity-sensitive products.

## Example

```bash
python3 $HOME/.codex/skills/auto-videl/scripts/seedance_submit.py \
  --prompt-file outputs/seedance_video_prompts.md \
  --reference-image inputs/product_images/4X6A0367.JPG \
  --reference-image inputs/product_images/4X6A0400.JPG \
  --reference-image inputs/product_images/4X6A0471.JPG \
  --reference-image outputs/storyboard_images/storyboard_01.png \
  --reference-note "@图片1-3=产品图，@图片4=分镜图。产品图锁外观，分镜图只锁镜头结构。" \
  --product-lock-file internal/product_lock.md \
  --output-dir outputs/seedance \
  --duration 15 \
  --ratio 9:16 \
  --resolution 720p \
  --audio-mode ambient \
  --poll
```

Use `--dry-run` first when validating the payload without spending credits. A dry run does not prove the API key, quota, model access, or account permissions; confirm those with one low-cost real generation on the recipient machine.

## Nine-Grid Direct Example

```bash
python3 $HOME/.codex/skills/auto-videl/scripts/seedance_submit.py \
  --prompt-file outputs/nine_grid_seedance_prompt.md \
  --reference-image inputs/storyboard_grid.png \
  --reference-mode grid-storyboard \
  --reference-note "@图片1=用户提供的3x3九宫格分镜图，按从上到下、从左到右读取。" \
  --output-dir outputs/seedance \
  --duration 9 \
  --ratio 9:16 \
  --resolution 720p \
  --audio-mode full \
  --dry-run
```

## Audio Mode Examples

Environment/action sound only:

```bash
python3 $HOME/.codex/skills/auto-videl/scripts/seedance_submit.py \
  --prompt-file outputs/seedance_video_prompts.md \
  --reference-image outputs/storyboard_images/frame_01.png \
  --output-dir outputs/seedance \
  --duration 9 \
  --audio-mode ambient \
  --dry-run
```

Voiceover, music, and environment/action sound:

```bash
python3 $HOME/.codex/skills/auto-videl/scripts/seedance_submit.py \
  --prompt-file outputs/seedance_video_prompts.md \
  --reference-image outputs/storyboard_images/frame_01.png \
  --reference-audio-url "https://example.com/reference-music.mp3" \
  --output-dir outputs/seedance \
  --duration 9 \
  --audio-mode full \
  --audio-instruction "女生音色，轻快广告音乐，保留真实动作音效。" \
  --dry-run
```
