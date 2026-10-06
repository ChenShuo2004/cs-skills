# 制作规则

## 画面只由 t 决定

渲染器会按任意顺序、任意次数调用 `render(t)`：单帧预览、只重渲某一段、运动模糊子帧、多路并行。只要有一点状态藏在上一帧里（累加的位置、计时器、没设种子的随机数），重渲出来就会和上次不一样，并行拼接处还会跳。

- 随机：用 `rnd(seed)`，不用 `Math.random()`。
- 需要累积的模拟（粒子物理、水面）：用固定步长从 0 推到 t，或改成解析公式。循环片在每圈起点重置种子和粒子池，`render(t)` 只需从本圈起点重放 `t mod 周期`（参考 [`cs-pixel-explainer/assets/reference-wizard.html`](../assets/reference-wizard.html)）。
- CSS：不用 transition 和 animation，样式全在 `render(t)` 里直接写。
- 手绘抖动：笔触种子用 `floor(t * 12)`，每秒变 12 次像手绘动画，镜头运动仍每帧平滑。
- 页面约定：`window.render(t)`、`window.ready = true`（字体和资源加载完）、`window.DURATION`（秒）。

## 动画

- 缓动：`ease`（cubic in-out）够用，匀速很机械。
- 弹簧（闭式解，`template.html` 已带 `spring` / `springTo`）。四档，同一片里同类元素用同一档：

  | 用途 | 参数 |
  |---|---|
  | 按钮、开关、指示条前沿 | w 22–26，z 0.75–0.85 |
  | 卡片、容器、镜头 | w 14–16，z 0.7–0.75 |
  | 大字、3D、Logo 定版 | w 9–11，z 0.85–1 |
  | 吉祥物、贴纸 | w 16–20，z 0.4–0.5 |

  值多次改目标用 `springTo(t, [[t0,v0],[t1,v1],…])` 叠加，不要重启弹簧。
- 节拍：每拍 `60 / BPM` 秒；关键动作放拍点，最大变化放重拍（每小节第一拍）。
- 运动模糊：`render.mjs --subframes 4`，时间 ×4，只用在快速运动多的片子里。像素风不用。

## 版式与文字

- `template.html` 所有尺寸按 1920×1080 写再乘 `S`，换画幅只改 `--size`；每个画幅单独调位置，不要把 16:9 直接裁成竖屏。
- 一屏最多一句，至少停 2.5 秒；变形容器里的新旧文字要各有进出场，否则会叠在一起。
- 中文字体兜底串：`"PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif`。要不同机器渲染一致，就把字体文件放进项目用 `@font-face` 本地加载。截图前 `await document.fonts.ready`，否则前几帧是默认字体。
- 像素风中文：逻辑画布上至少 18px，先正常画，再按 alpha > 0.5 硬边化，颜色只用调色板里的。
- 被缩放的元素、渲染文字的元素，不加 `will-change`，否则文字糊。

## 像素纯度标准（选了像素风就全部遵守）

- 逻辑画布固定小尺寸（如 128×96、240×135、480×270），所有内容先画在离屏画布，再按**整数倍**放大到输出画面，居中，`imageSmoothingEnabled = false`，CSS `image-rendering: pixelated`。
- 所有绘制对齐逻辑画布整数坐标；不要亚像素、抗锯齿、`createLinearGradient/RadialGradient`、`shadowBlur`、`globalAlpha` 半透明。渐变用色带 + 有序抖动（Bayer 4×4），发光用 1 像素轮廓光或几圈抖动像素。
- 固定调色板约 16–32 色，每个像素都来自调色板。最稳的做法：画进 `Uint8Array` 调色板索引缓冲，最后查表写进 `ImageData`（参考实现就是这样）；闪光、变暗用「调色板映射表」整体换一级，不用半透明叠色。
- 角色用矩形和像素串程序化搭建，姿势做成参数（角度、抬手高度、头部倾斜、衣摆摆动）；参数平滑插值，但按 8–12 张/秒量化时间（`floor(t*10)/10`），再取整到像素网格，看起来才像逐帧像素动画。
- 角色描边：填色层外一圈深色描边，再外一圈 1 像素轮廓光（按与光源距离分级换色）。剪影在背景上必须一眼可辨。
- 粒子池预分配、循环复用，渲染循环里不 new 对象；粒子位置取整后再画；消失前按寿命走「白 → 魔法色 → 暗色」。
- 屏幕震动按逻辑像素算（1–2 px），在放大时乘倍数。
- 输出尺寸选逻辑分辨率的整数倍：128×96 → 1408×1056（11×）；要 1920×1080 就用 480×270（4×）或 240×135（8×）逻辑画布。
- 字幕层可以在输出分辨率上画（中文像素字太小会糊），但也要硬边、调色板颜色、不加 shadowBlur。

## Canvas / WebGL

- WebGL：`getContext('webgl2', { preserveDrawingBuffer: true })`，每帧画完 `gl.finish()`。云端无 GPU 时 `render.mjs` 已用 SwiftShader，慢 5–10 倍，先渲一帧确认着色器生效。
- 老电视质感：`crt.js` 放在 `index.html` 旁边，`template.html` 里 `USE_CRT = true`；参数 `curve scan mask vignette aberration glow noise flicker` 可调。

## 声音

- 音效：`audio.py sfx cues.json`，时间点直接从画面关键帧抄，每个音效落在动作发生的那一帧；8 种：click pop whoosh thud ding riser glitch type。
- 用户给了音乐：先 `audio.py beats` 得到 bpm / beats / downbeats / hits；状态变化放 beats，大变化放 downbeats，音效放 hits。
- 配乐：`audio.py music` 是小调鼓 + 贝斯 + 和弦铺底的底稿；片子重要时按项目改，纯正弦单薄，和弦要叠泛音和微失谐。像素风可改用方波/三角波芯片音色。
- 配音：`spec.json` → `tts.py`（edge-tts，需要能访问微软语音服务的电脑）→ `audio.py vo spec.json` 拼成 `vo.wav` + `timeline.js`，画面对旁白。不要一句一句分开拼画面。
- 混音：`mix … --len <成片秒数>` 先裁到成片时长；配音出现时音乐压到 0.2–0.3；输出双声道；`audio.py normalize` 到 -14 LUFS（误差 ±0.5，真峰值 ≤ -1 dBTP）。
- 检查：模型听不到声音，只能看 `audio.py check` 的波形图和响度数值：削顶、意外静音、低频一直轰。

## 渲染速度

- 先 `--draft --size 960x540` 看节奏（约快 2 倍），对了再出正式版。
- `--workers N` 多路并行，默认按 CPU 核数（最多 4）；2 核机器约快 15–20%，核数多提升更明显。
- 超过 10 分钟的渲染用 `--start/--duration` 分段，最后 `ffmpeg -f concat` 拼。
- 估算：单帧耗时 × 总帧数 × 子帧数 × 1.3。
