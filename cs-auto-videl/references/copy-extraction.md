# Copy Extraction Workflow

Use this workflow whenever the original copy affects script analysis, rewrite, or Seedance timing.

## Goal

Extract the real original copy with the lowest possible typo risk. Do not guess unclear words. If the source is uncertain, mark it for review instead of silently producing a wrong line.

## Source Priority

1. **Audio/voiceover transcription**: primary source when the video has spoken narration or口播.
2. **Subtitle/OCR review**: primary source when the video has no voiceover but has hard subtitles, and a verification source when both audio and subtitles exist.
3. **High-resolution frame crops**: used to verify short hooks, numbers, prices, brand names, and any visually ambiguous subtitles.
4. **User correction**: highest priority after the user corrects a line.

## Required Procedure

1. Check whether the video has audio and whether the audio contains口播/narration.
2. If there is口播, transcribe audio first. Keep original口语, pauses, numbers, prices, units, and repeated words.
3. If hard subtitles are visible, extract high-resolution frames or subtitle-area crops around subtitle changes.
4. Compare audio and subtitle text:
   - If they match, output one clean line.
   - If they differ but audio is clear, use audio and note no explanation in final output.
   - If they differ and neither is clear, output `待复核：...` or `听不清/看不清`.
5. Always recheck the first 3 seconds at higher resolution. A hook error changes the whole downstream workflow.
6. Do not use the small overview contact sheet as the only source for text.
7. Do not infer words from product category or selling logic. For example, do not change `贵不贵` into `臭不臭` because the product later talks about odor.

## Local Frame Review

When using local files, generate review frames around captions:

- Overview frames every 0.5 seconds for structure.
- Subtitle-area crops every 0.2-0.3 seconds for text-heavy videos.
- Extra crops for 0-3 seconds and any price/specification frames.

The helper script `scripts/extract_copy_review_frames.py` can create contact sheets for this review.

## Final Output

Only output:

```text
【视频文案提取】

第一句原文案
第二句原文案
第三句原文案
```

No explanation, no table, no rewrite suggestions.
