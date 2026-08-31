# phrase-timeline.json 结构

这是基于真实旁白音频的短语时间表。`timing_source` 应指向实际使用的音频对齐来源；`estimated_fallback_used` 必须为 `false`。

## 顶层字段

| 字段 | 含义 |
| --- | --- |
| `schema_version` | 当前为 `2` |
| `fps` | 帧率，默认 `30` |
| `audio_duration_ms` | 整段最终旁白的毫秒时长 |
| `source_coverage` | 原文被识别内容覆盖的比例 |
| `phrases` | 按口播顺序排列的短语数组 |

## `phrases[]` 字段

| 字段 | 含义 |
| --- | --- |
| `id` | 从 `p001` 起的稳定编号 |
| `order` | 从 1 起的口播顺序 |
| `text` | 原文短语，保留标点 |
| `normalized_text` | 去除标点后的对齐文本 |
| `source_start` / `source_end` | 该短语在规范化全文中的字符区间 |
| `spoken_start_ms` / `spoken_end_ms` | 真实音频的起止毫秒 |
| `start_frame` / `end_frame` | 由毫秒按帧率换算的帧边界 |
| `alignment_coverage` | 该短语的原文识别覆盖率 |
| `alignment_confidence` | 语音识别置信度 |
| `boundary_source` | 边界取得方式，例如 `character-match` |
| `recognized_boundary_text` | 用于确定边界的识别文本 |

短语通常按逗号、句号、问号等自然停顿拆分，书名号《》内的文字保持为一段。这是逐短语时间表，不是每个汉字一条记录。

## 上游对齐产物

词级对齐 JSON 至少应包含：

- `audioDurationMs`
- `captions[]`：每项包含文本、开始时间、结束时间和置信度
- `speechSegments[]`：有声区间

输出不具备这些真实音频证据时，应视为未完成，而不是作为字幕或动画的时间基准。
