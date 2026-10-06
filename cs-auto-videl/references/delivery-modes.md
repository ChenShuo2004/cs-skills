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
