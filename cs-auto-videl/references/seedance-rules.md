# Seedance 2.0 Rules

## Core References

- Product images are the P0 product lock. They override storyboard images for product appearance whenever the storyboard has product drift, unclear identity detail, unclear logo/text, or minor deformation. Product images lock product appearance, color, shape, scale, material, texture, logo/mark/text/pattern placement, logo/mark/text/pattern size, logo/mark/text/pattern color, logo/mark/text/pattern direction, and category-specific visible details such as pendant, clasp, gemstone, connector, label, screen, button, cap, nozzle, packaging, or distinctive texture.
- Storyboard images lock shot order, composition, scene, lighting, hand/person style, and phone-shot texture.
- If a storyboard has missing, unclear, or misplaced product identity details but the user still wants Seedance API testing with their own configured API key, demote it to a structure-only storyboard. Do not let Seedance inherit any missing, wrong, misplaced, wrong-scale, wrong-material, or wrong-color product appearance from that storyboard.
- Original video breakdown locks timecode, action order, and visual events.
- Benchmark video shots lock the only allowed scene/action library. Product images do not create new shots; they only replace product appearance inside the benchmark video's existing shot structure.
- Rewritten copy locks voiceover rhythm and lip/action pacing.
- Real physical-world logic locks the action: gravity, scale, hand/object contact, body movement, reflections, shadows, camera direction, scene geography, and continuity must remain plausible.

## Segment Rules

- One storyboard image corresponds to one Seedance video segment.
- Each generated segment must be 15 seconds or less.
- Segment duration should match the original time range for that storyboard image as closely as practical.
- Do not compress 20+ seconds of source material into a 15 second segment.
- If there are multiple storyboard images, generate multiple video prompts and stitch later in CapCut.

## Reference Upload Logic

- Upload product images first.
- Upload the current segment storyboard after product images.
- For second and later segments, optionally upload the first storyboard image as an additional storyboard/style reference to maintain continuity.
- Do not upload or reference the first generated video, previous generated segment, or any generated video clip for continuity. Long-video consistency should be controlled through the product images and storyboard images only.
- Never upload the benchmark video as a Seedance reference unless the user explicitly changes the workflow.
- For Seedance API submission, proceed only when the user has configured their own private API key. Use `scripts/seedance_submit.py` and upload product images first, then the current segment storyboard image. Keep all images as `reference_image` for multimodal reference generation unless the user explicitly requests first-frame/last-frame generation. If no API key is configured, deliver the same prompt/image order for manual upload/generation.

## Restrictions

- No subtitles.
- No screen text.
- No background music.
- Do not request readable price text, package text, or new selling-point text in the generated image/video.
- Use product combination and visible physical actions to express price/specification/value only when the benchmark video already contains that same kind of combination/action shot. Otherwise leave price/specification/value for copy or post-production text.
- Do not describe impossible object motion, hands passing through products, sudden product shape/color changes, broken chain/cloth physics, inconsistent reflections, or camera cuts that contradict the storyboard.
- Do not add shots, scenes, actions, props, camera angles, backgrounds, or product presentation modes that are absent from the benchmark video, even if they appear in product references.
- Do not use the storyboard image to justify product drift. If storyboard structure is useful but the product in a cell is off, keep the storyboard composition and explicitly pull product appearance back to the product images.
- Do not remove, hide, or weaken a product identity detail merely because it is hard to render. If the benchmark-equivalent camera angle shows that detail, preserve it in the correct physical location and scale, using product images as the source of truth. If the product has no logo/text in the product images, do not invent one.
- If the storyboard contains missing, unclear, misplaced, wrong-scale, wrong-material, wrong-color, or wrong-category product identity details, explicitly name those as storyboard errors in the prompt and prohibit inheriting them. Final video QC must fail any generated shot that should show the relevant identity detail but lacks it or moves it to the wrong surface.
- For high-risk continuous actions, prefer a hard cut to a stable state instead of asking the model to simulate extraction, insertion, dressing, wrapping, opening, or count-changing motion.

## People And口播

- If the source is product-only, do not force a full-face达人.
- If the source is KOC/A-roll/B-roll口播, keep a random AI达人 from the storyboard, not the real source person's face.
- For口播 shots, include rewritten copy and request lip, gesture, expression, and pacing alignment.
- For non口播 product display, specify no human voice, no narration, and no background music.
