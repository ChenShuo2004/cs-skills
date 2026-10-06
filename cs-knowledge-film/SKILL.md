---
name: cs-knowledge-film
description: "制作明确要求暗夜星空、衬线双语字幕与金色光点风格的知识解说片，或用户显式调用 $cs-knowledge-film：从概念与画面隐喻设计，到口播、场景 spec、配音和 1080p 渲染。普通科普视频不默认套用这一视觉模板；网页产品演示、ChatCut 策划和电商视频复刻各用对应 skill。"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# CS 暗夜知识片

把一个抽象概念讲成一部安静、克制、有电影感的知识短片。本 skill 的暗夜星空视觉是用户选择这一风格时使用的实现，不是所有知识视频的默认视觉。先找到选题的核心问题与可见的动作，再决定使用现有场景、扩展场景，或为该题材另做画面。

## 交付

- 一个项目目录：`spec.json`（唯一需要手写的文件）、`audio/`、`timeline.json`、`subtitles.srt`、`preview.jpg`、`video.mp4`。
- 视频默认 1920×1080、30fps、H.264 + AAC；可选中文配音（edge-tts）+ `score.py` 生成的配乐与音效（参照原片：A 小调低音长音、温暖和弦铺底、玻璃钟琴、与画面事件逐一对齐的打字/转轮/呼啸/撞击声，-16 LUFS）；画面内置中英双语字幕，同时导出 `subtitles.srt`。
- 不上传、不发布。BGM 只用用户提供的文件（`spec.bgm`）。

## 风格速查（细节见 [references/style.md](references/style.md)）

- 底色近黑带一点藏蓝，慢速闪烁的星空，暗角 + 轻微颗粒。
- 字体：中文宋体/衬线（Noto Serif SC），英文 Lora 斜体；**不用黑体**。
- 颜色只有三种语义：**金**＝重点/惊奇/答案，**冰蓝**＝结构/线条/已知，**绯红**＝噪声/错误/被排除。
- 左上角章节标签 `01 猜 THE GUESS`；底部中文字幕 + 英文斜体小字。
- 动效慢：淡入 0.6–1s、缓出曲线；光点有辉光和呼吸感；不要弹跳、不要转场特效。

## 工作流

### 1. 先定三件事

缺了才问，能自己判断就不问：

1. **主题与一句话结论**（这支片子最后让观众记住哪一句）
2. **时长**（默认 2–3 分钟；每分钟约 220–250 字口播）
3. **是否需要英文字幕**（默认要，和参考片一致）

### 2. 写口播稿（见 [references/script.md](references/script.md)）

先提炼一句话结论、主要误解和适合这个题目的画面隐喻，再设计钩子与章节。可参考“体验式钩子 → 标题 → 3–5 章 → 回到开头收束”，但故事结构由内容决定，不必重复参考片的章节或结尾。

每句 8–25 字，一句一个意思，适合被逐句打在字幕上。数字和史实要核对，不编造。

### 3. 拆场景写 `spec.json`（见 [references/spec.md](references/spec.md)）

把 [assets/example-spec.json](assets/example-spec.json) 当作格式示例，不复制其中的场景顺序或视觉隐喻。先列出每章要让观众看见的变化，再选现有场景类型；现有类型表达不了时，按 [references/spec.md](references/spec.md) 的扩展说明新增场景。

| 概念形态 | 场景类型 |
| --- | --- |
| 预期 / 猜下一个字 / 填空 | `typewriter` |
| 候选词概率、采样、温度 | `probs` |
| 片名 | `title` |
| 二分、度量、量化 | `numberline` |
| 罕见事件、时间、希望、灯火 | `landscape`（烽火、时间条、弧线、灯） |
| 日常 vs 罕见新闻 | `city`（夜景、下雪、头条） |
| 公式、定义 | `formula` |
| 语言、冗余、噪声、压缩 | `textplay` |
| 传输、编码、信道 | `signal` / `probe` |
| 同样数据不同意义 | `compare` |
| 信息茧房、同质化 | `cards` |
| 名人原话 | `quote` |
| 真实图片（星图、照片） | `image` |
| 停顿、提问 | `orb` / `blank` |

事件时间用 `"L2"`（本场第 2 句开始）、`"L2e"`（第 2 句结束）、`"L2+0.5"` 锚定到口播，配音变长变短都不会错位。

### 4. 配音 → 时间轴 → 预览 → 渲染

把 [scripts/](scripts/) 下 4 个文件放在任意位置，项目目录里只放 `spec.json`：

```bash
python scripts/tts.py  <项目目录>          # 逐句配音 audio/line_XXX.mp3（需联网，免费）
node   scripts/timeline.mjs <项目目录>     # 按真实音频长度排时间轴，拼 narration.wav + subtitles.srt
python scripts/score.py <项目目录>         # 按场景和事件生成配乐 + 音效 score.wav（改了 spec 就重跑）
node   scripts/render.mjs <项目目录> --preview   # 每场 2 帧拼成 preview.jpg —— 必须先看
node   scripts/render.mjs <项目目录> --still 42  # 单帧排查
node   scripts/render.mjs <项目目录>              # 全量渲染 video.mp4
node   scripts/render.mjs <项目目录> --remux      # 只换声音：复用已渲染画面重新混音
```

依赖：Node 18+、`playwright`（含 Chromium）、ffmpeg、Python 3；配音需安装 `edge-tts`，程序配乐需安装 `numpy scipy`。已有 Chrome 的环境可用 `CHROME_EXECUTABLE` 指向其可执行文件，`PLAYWRIGHT_MODULE` 可指向现有的 Playwright 模块目录。在目标环境中显式安装依赖，脚本不会自动修改 Python 环境。没有配音时 timeline 按字数估算，可以先出无声版确认画面；修改文案或音色后重跑 `tts.py`，它会只更新变化的句子。

### 5. 验收（见 [references/qa.md](references/qa.md)）

必须**实际看** `preview.jpg`，再抽查关键事件帧（数字揭晓、灯亮、遮罩出现）。常见问题：字幕压住画面元素、事件早于对应口播、文字超出画面、辉光过曝成灰屏。

## 边界

- 本 skill 负责“讲清一个知识点”的解说片；真人口播、直播切片、产品演示不在范围。
- 不把别人的原片文案照搬进新片；参考的是结构和视觉语言，文案自己写。
- 图片素材只用用户提供或可合法使用的（公共领域 / CC），在 spec 里记录来源。
