# 项目与镜头合同

## 工程位置与素材

`scripts/scaffold.mjs <项目名> [--output <新目录>]` 从 starter 建立新工程。已有工程直接检查并沿用，不让 scaffold 覆盖。源音频、角色图与参考视频保持原位；项目的 `public/` 中放工作副本，并在 `story.json` 记录相对路径和 SHA-256。默认角色为 `public/kai-pixel.png`；换角色时更新路径和哈希，封面与 A-roll 同时读取新角色。

只有内容方案时可保留 draft `story.json` 的 `audio: null`、空章节和空镜头。此状态用于继续写稿，不允许渲染成片或标记为精确时间表。`npm run render:*` 与 `npm run cover:*` 都会先执行 `--require-ready` 校验；普通 `npm run validate` 仍可报告 draft 状态。

## `story.json`

```json
{
  "schemaVersion": 1,
  "title": "视频标题",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "audio": {"file": "narration.wav", "sha256": "源文件SHA-256"},
  "character": {"file": "kai-pixel.png", "sha256": "角色副本SHA-256"},
  "theme": {"paper": "#E8E5DD", "ink": "#171615", "accent": "#FFB94D", "coverAccent": "#A62222", "stage": "#132942"},
  "cover": {"brand": "KAI", "series": "PIXEL ESSAY", "headline": "什么都没干", "highlight": "没干", "question": "这一天，白过了吗？", "eyebrow": "今天，"},
  "chapters": [{"id": "c1", "title": "归零", "startFrame": 0, "endFrame": 150}],
  "shots": [{"id": "s1", "chapterId": "c1", "kind": "card", "sceneId": "", "side": "left", "startFrame": 0, "endFrame": 21}]
}
```

`audio.file`、`character.file` 都相对项目 `public/`，不可指向其外部。哈希为 64 位十六进制。`cover.brand` 与 `cover.series` 随角色、账号和视觉风格调整，不能换了角色却保留 KAI 字样。章节与镜头均采用半开区间 `[startFrame,endFrame)`；第一段从 0 开始，最后一段结束于 `ceil(FFprobe 音频秒数 × fps)`，中间无重叠或空洞。镜头 `kind` 只能是 `card`、`aroll`、`broll`；每章首镜为 `card`，第二镜为全屏 `broll`。A-roll 的 `side` 是 `left`、`right`、`center` 之一。每个非 card 的 `sceneId` 必须在 `src/scenes.tsx` 注册；B-roll 不能借用 A-roll 背景。

音频或朗读稿一旦改变，重新核对哈希、短语时间表和所有受影响镜头。不能仅凭文件名沿用旧时码。动画在 `sceneId` 对应组件中按局部帧计算，组件可用 starter 的入场与像素定位原语；具体物件和事件必须根据当前故事重新实现。

## 默认出图

- 视频：1920×1080、30fps、H.264/AAC；音频只使用最终口播，默认无 BGM。
- 样片：开头两章；完整片：音频实际结束帧。没有第二章时先用开头主要 A/B 镜头组成可审查样片。
- 封面：3:4 的 1200×1600 和 4:3 的 1600×1200，保持同系列排版但各自重新布局，不裁切一张图充当两种规格。
- 字幕：默认不烧录；只有 `$cs-narration-phrase-timeline` 输出有效真实时码后才生成 SRT。对齐失败时在 QA 中记录，不能用预计时长伪造。
