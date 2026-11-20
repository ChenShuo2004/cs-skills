---
name: cs-pixel-explainer
description: "把中文口播文案做成像素风 + 坐标系隐喻 + 打字机字幕的动画解说视频（含 edge-tts 配音）：先问 5 项输入、写分镜表与 3 张关键帧等确认，再写 spec.json、配音、逐帧渲染 1080p mp4。用户给文案并要像素风 / 注意力赌博那种风格、或确认是像素解说系列续集时使用；独立单片和其他风格走 $cs-code-video，暗夜星空知识片走 $cs-knowledge-film。"
---

<!-- CS Skills · 陈硕 | https://github.com/ChenShuo2004/cs-skills -->

# CS 像素解说视频

参考风格：夜晚像素街道 + 左上角「关系坐标」HUD + 打字机字幕 + 把道理抽象成坐标系/老虎机/网络图。全部画面由 Canvas 绘制，页面暴露 `window.render(t)`，Playwright 逐帧截图 + FFmpeg 合成 1080p MP4；edge-tts 配音驱动真实时间轴。

总流程：**问 5 项输入 → 设计隐喻 → 分镜表（等确认）→ 3 张关键帧（等确认）→ 配音 → 逐场景自检 → 整片渲染 → 交付**。

## 0. 引擎与参考资源

引擎位于本 Skill 的 [`engine/`](engine/)（5 个文件：`engine.html`、`timeline.mjs`、`render.mjs`、`tts.py`、`配音.bat`），复制到项目工作目录（如 `<workdir>/engine/`）使用。若当前环境只有用户提供的 engine 目录，按用户路径读取，不假设固定本机路径。

- 像素纯度参考实现：[`assets/reference-wizard.html`](assets/reference-wizard.html)（新场景/角色从其写法起步）。
- 完整示例 spec：[`assets/example-spec.json`](assets/example-spec.json)。
- `spec.json` 字段与 8 种场景参数表：[`references/spec-reference.md`](references/spec-reference.md)。

依赖：Node.js + Playwright（含 Chromium 或本机 Chrome）、FFmpeg、Noto CJK 字体；配音需 Python 3、`edge-tts` 与联网能力（`tts.py` 缺 `edge-tts` 时会按需安装）。无配音也可跳过配音步骤，按每字 0.235s 估算输出无声版 + SRT。

## 1. 开工先问 5 项输入（一条消息问完，没给的不编）

原材料里已确定的项直接写出请用户确认，不重复问：

1. **主题与一句话结论**（必须由用户提供，可协助改写，不能代填）。
2. **时长与画幅**：默认 90–180 秒，1920×1080 / 1080×1920 / 1080×1080，30 / 60 fps。
3. **场景主题**：锁定像素风；有无参考图，是否换场景地点（默认夜晚街道）。
4. **配色**：沿用系列调色板（黄=正向、红=负向、青=主角）或指定主色。
5. **声音**：用户 BGM / 芯片合成配乐 / 无配乐；是否配音（默认 `zh-CN-YunxiNeural`）。

用户说「你定」或无人值守时才采用默认值，并在分镜表或报告顶部明示假设。

## 2. 导演规则与创作公式

- **一致与聚焦**：整片一套调色板与角色外观；每场只讲一件事；画面大字至少停 2.5 秒；字幕每句 ≤ 22 字，关键词用 `[y]`/`[r]`/`[c]`/`[g]` 标 1–2 处。
- **动作与转场**：除路人行走外用缓动或弹簧；转场尽量从内容长出（地面塌陷 → `abyss`、落地线 → `axes` 横轴），`pixelDissolve` 仅作兜底；主体至少占画面三分之一。
- **禁止**：居中大字 + 渐变背景、全元素同时淡入、满屏小字、模板化布局。
- **创作公式**：一个核心隐喻 + 一个二维坐标系（X = 可控投入，Y = 结果极性），数字坐标在 HUD / `axes` / `abyss` 间保持自洽。典型骨架：`street` 开场与塌陷 → `abyss` 坠落点题 → `axes` 抽象坐标 → `slot` 多变量老虎机 → `card` × N 逐项拆解 → `network`/`triangle` 给方法 → `street` 收尾 → `bigtext` 金句。

## 3. 像素纯度与 `render(t)` 规则

- **像素纯度**（新场景/角色必须遵守；旧 `engine.html` 涉及 `glow()`/`shadowBlur`/渐变处，动到哪场顺手迁移哪场）：先画在固定逻辑画布（引擎 480×270，独立镜头 128×96 或 240×135），整数倍放大、`imageSmoothingEnabled = false`、`image-rendering: pixelated`；对齐整数坐标，禁用亚像素、抗锯齿、`shadowBlur` 与 CSS 渐变（渐变用色带 + Bayer 4×4 抖动，发光用 1px 轮廓光或抖动像素）；固定 ~24 色调色板；角色约 24×32 逻辑像素、深色描边 + 1px 轮廓光、动作 8–12 张/秒量化；粒子池预分配复用；中文像素字过小易糊，字幕允许在 1080p 硬边绘制但禁用 `shadowBlur`。
- **`render(t)` 纯度**：画面只由 `t` 决定，禁用计时器、CSS 动画和无种子 `Math.random()`；累积粒子以固定 60Hz 步长从起点重放；`document.fonts.ready` 完成后再截图。

## 4. 执行流程

1. **问 5 项输入**并等待回答。
2. **读文案 → 设计隐喻**：用户允许自由发挥时可口语化改写，保留原意。
3. **写分镜表（等用户确认，不写代码）**：每场写清起止秒（按每字 0.235s 估）、场景 type、画面/文字、动作（events）、镜头、声音与转场；有音乐先测节拍（`cs-code-video` 的 `audio.py beats`）。
4. **写 `spec.json`**：读取 [`references/spec-reference.md`](references/spec-reference.md) 与 [`assets/example-spec.json`](assets/example-spec.json)，写入 `<项目目录>/spec.json`。
5. **3 张关键帧（等用户确认风格）**：运行 `node engine/timeline.mjs <dir> && node engine/render.mjs <dir> --preview`，先自己看 `preview.jpg` 修掉溢出/重叠/主体过小，再挑开场、核心隐喻、结尾 3 帧给用户确认。
6. **配音**：将 `engine/tts.py`（Windows 可一并拷 `engine/配音.bat`）放到 `<项目目录>/` 同级运行，生成 `audio/line_000.mp3…` 与 `audio/DONE`。核对 `DONE` 句数一致后重跑 `timeline.mjs`，让真实配音整段驱动时间轴。修改单句时删除对应 `audio/line_XXX.mp3` 重跑即可（序号从 000 按所有场景 `lines` 顺序展开）。
7. **逐场景自检与声音**：每改完一个场景看 `preview.jpg` 或抽 3 帧查错，不直接全量渲染试错；音效对齐 `events.at` 帧，芯片配乐/音效可用 `cs-code-video` 的 `audio.py sfx / music` 合成，听不到声音时画波形确认无削顶或意外静音。
8. **正式渲染与交付**：`node engine/timeline.mjs <dir> && node engine/render.mjs <dir>` 产出 `video.mp4` 与 `subtitles.srt`（长片可用 `--from/--to` 分段）。抽 3–4 帧实看验收后，交付成片、SRT 与项目目录真实路径。
