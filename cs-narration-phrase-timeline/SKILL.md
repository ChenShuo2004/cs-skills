---
name: cs-narration-phrase-timeline
description: "Use when the user needs a Chinese narration phrase timeline from real audio: phrase-timeline.json, 逐句或逐短语时间标注, Whisper word-boundary alignment, timed captions, or narration-driven infographic and motion-graphics timing. Requires the final narration audio and the exact spoken copy; do not use for estimated timing, generic editing, or MP4 rendering."
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# 口播短语时间表

## 目标与边界

将**真实口播音频**与实际朗读的中文稿对齐，交付按短语排序的 `phrase-timeline.json`。它为字幕、重点词、动态图文和 Motion Graphics 提供真实的毫秒与帧号边界。

这个 Skill 不生成配音、不按字数估算时间、不编辑时间线，也不导出 MP4。没有最终旁白音频时，不能把计划时长伪装成对齐结果。

## 输入与交付

需要：

- 最终旁白音频；若是音色克隆工作流，使用克隆完成后的音频，不使用参考音频。
- 与音频实际朗读内容一致的完整口播稿；不能用分镜提纲、摘要或事后改写稿替代。
- 可选：现有任务目录、目标帧率（默认 30 fps）和输出位置。

交付：

- `alignment.tokens.json`：真实语音识别的词级边界。
- `phrase-timeline.json`：短语到真实毫秒/帧的映射。
- 对齐结果摘要：音频总时长、全文覆盖率、失败原因或可用文件位置。

字段与验收要求见 [时间表结构](references/schema.md)。

## 工作流

1. **先找已有产物。** 如果项目任务目录已经有 `phrase-timeline.json`，先检查它是否来自最终音频且符合结构；核对音频与稿件的哈希或等效来源记录以及目标帧率；一致且有效时直接复用，避免重新识别。仅文件名相同不足以证明仍有效。
2. **选择正确入口。** 目标项目已有“动态信息图”或同类工作台时，优先让它在配音完成后自动生成时间表。只有用户已提供最终音频、需要独立产物时才走手动对齐。
3. **验证实现，不猜命令。** 手动执行前，确认目标项目实际存在音频对齐器、短语构建器、Node、FFmpeg/FFprobe 与项目 Python 环境。常见实现会有 `align.mjs` 与 `semantic_timeline.py`；不要假定某个旧的 CLI 文件仍存在。
4. **先对齐音频，再构建短语。** 音频对齐器先写词级时间戳；短语构建器再使用原文和这些时间戳生成结果。不要按字符数量、页面时长或预设语速补全缺失时间。
5. **严格验收。** 覆盖率过低、短语顺序不能匹配、输出缺少真实时间边界，或结果来自估算回退时，应明确失败并保留诊断信息，而不是交付不可靠的时间表。

## 结果使用

- 字幕与重点词：直接读取每个短语的起止毫秒或帧号。
- 信息图与 Motion Graphics：元素不得早于对应口播短语开始出现。
- 需要重新配音或改稿时：重新生成时间表；旧表不能复用于音频节奏已变化的版本。

## 完成检查

交付前确认：

- `timing_source` 是基于真实音频的对齐来源，且 `estimated_fallback_used` 为 `false`。
- `phrases` 按口播顺序排列，每条都有合法的起止时间与帧号。
- 全文覆盖率、单短语覆盖率和置信度已保留；低覆盖率不会被静默忽略。
- 口播稿、音频和生成文件中可能含有私密语音或文案；默认留在用户指定的本地任务目录，不上传或公开。
