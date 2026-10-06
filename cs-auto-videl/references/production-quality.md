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
- Seedance prompts must not request subtitles or screen text unless requested. Background music follows audio_mode; never use generated-video references for continuity.
- Seedance prompts must be physically plausible and should not describe impossible hand positions, object intersections, sudden product shape changes, broken gravity, inconsistent camera direction, or discontinuous scene geography.
- Seedance prompts must simplify high-risk continuous physical actions. If object count, hand contact, or body support could drift, describe a hard cut to an already-stable state rather than a continuous extraction, insertion, transformation, or morphing action.
- Seedance prompts must include a per-shot physical-state contract for soft goods and body-part shots: visible contact points, number of hands/feet/body parts, support direction, object count before/after, and what must not appear.
- Seedance prompts must explicitly say that product images override storyboard images for product appearance whenever the generated storyboard image has any product drift, unclear identity detail, unclear logo/text, or minor deformation. Storyboard images lock composition and scene; product images lock the product.
- For API video generation with an identity-detail-deficient storyboard, treat the storyboard as structure-only: product images are the only product appearance source, and the prompt must explicitly say that missing, unclear, misplaced, wrong-scale, wrong-material, wrong-color, or wrong-category product details in the storyboard are errors and must not be inherited. The final downloaded video must still pass product identity/logo QC.

## Local Video Analysis Guidance

Use the available video-understanding tools; when continuous video input is unavailable, analyze videos through frame extraction and visual inspection. For typical ecommerce videos with 1-2 second shots, this is sufficient when sampling is dense enough.

Recommended approach:

- First inspect duration, resolution, and frame rate.
- If `ffprobe` or `ffmpeg` is not on the default command path, locate a bundled/local ffmpeg and continue. Missing `ffprobe` is not a blocker; `ffmpeg -i` can still reveal duration, streams, resolution, and frame rate, and the same ffmpeg binary can extract frames.
- Extract overview frames every 0.5-1 second.
- Extract denser frames around fast actions or suspected cut points.
- Build a contact sheet when the user needs visual verification.
- Use audio transcription plus subtitle/OCR frame review for copy extraction. Never rely only on small contact-sheet subtitles for first-3-second copy.
- Treat frame sheets and OCR review images as temporary files. Remove them after storyboard images and video prompts are finalized.

## Artifact Retention

Only clean scratch files created by this run, after resolving their paths inside its own output directory. Preserve source files and earlier runs. Default testing policy:

- Keep: generated storyboard images, rewritten imitation copy/script, final Seedance video prompts, downloaded Seedance videos, final video QC records, and optional Feishu payloads.
- Delete after use: `frames/`, `copy_review/`, overview contact sheets, selected-frame review sheets, subtitle/OCR crops, temporary image contact sheets, and other local analysis scratch files.
- If the user asks to debug a bad result, temporarily keep the review frames needed for comparison, then clean them after diagnosis.

Default final retention should prioritize `outputs/storyboard_images/`, `outputs/copy_rewrite.md`, `outputs/seedance_video_prompts.md`, and when API generation is requested, `outputs/seedance/`. A full `run_output.md` is optional internal/archive material, not the default user-facing deliverable.
