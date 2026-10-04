---
name: cs-code-video
description: "用代码做动画视频：页面暴露 render(t)，Playwright 逐帧截图 + FFmpeg 合成 mp4，可接合成配乐、出图和配音。通用模式先明确主题、规格、风格和声音，出风格卡、分镜与关键帧后逐镜制作；Vibe知识大赏模式额外查证来源、记录真实素材许可、先渲 10 秒样片。触发词包括 $cs-code-video、用代码做视频、知识解说动画、Vibe知识大赏、来源可核查的代码科普片、KAI 教程片、像素动画、片头。固定暗夜星空系列用 cs-knowledge-film，固定像素解说系列用 cs-pixel-explainer；真实网页演示、电商视频和 ChatCut 策划各用对应 skill。"
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex, Claude and any agent that supports SKILL.md; needs node + playwright, ffmpeg, python3 + numpy"
  credits: "Workflow distilled from xilo's article on making videos with Opus and Kianzzz/xilo-opus-video (MIT)"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# CS 代码视频

模型不直接生成视频。它写一个网页，网页暴露 `window.render(t)` 画出第 t 秒，脚本逐帧截图，再用 FFmpeg 合成 mp4。配乐和音效用 numpy 合成，配音用 edge-tts。

一句话提示词做视频是抽卡，效果不可控，也复现不了。本 skill 的做法：**先把规划摆到用户面前，确认了再动手**。5 项输入 → 导演层 → 三张风格卡 → **分镜表（等确认）** → **3 张关键帧（等确认）** → `brief.md` → 逐镜头制作 → 自评 ≥8 分 → 交付。

用户明确要 **Vibe 知识大赏或来源可核查的代码科普片**时，按 [references/vibe-knowledge.md](references/vibe-knowledge.md) 的六步模式执行。它在研究、真实素材、输入默认值、KAI 角色和 10 秒样片上的规则优先于下文通用模式；渲染和 QA 仍用本 skill 的工具。

**管线固定，画面不固定。** 渲染、配音、混音、QA 每次一样；画面语言每次从选题里长出来，再套上陈硕的签名层。不要先拿模板再塞内容。

## 交付边界

- 默认值（只在用户明确说「你定」或无人值守时才用，并写进风格卡让用户改）：单个 HTML 工程 + 一支 mp4，1920×1080、30fps、30 秒、代码合成配乐、不配音。
- 通用模式的画面由代码生成，或由 GPT 按资产清单出图后代码做动画（见 hybrid.md）；不从网上下载图片或视频素材。Vibe 知识模式可使用来源和许可可追溯的真实证据图，按对应参考文件记录。
- GPT 出图要花钱：真正出图前先 `gen_image.py --dry-run` 把张数和模型给用户看，确认后再出。
- 通用模式的事实来自用户给的原材料，不确定的不写；Vibe 知识模式必须主动联网核对，建立逐条来源表。
- 参考视频只学结构、节奏和手法，不照搬别人的素材、外观和文案；学到的手法记进 `signature.md` 的吸收清单。
- 不上传、不发布。
- 路由：真实网页演示片 → `$cs-web-promo-film`；电商对标复刻、Seedance/Flow 生成包 → `$cs-auto-videl`；剪辑已有素材、ChatCut 策划 → `$cs-chatcut`。**教程类视频默认做成 KAI 教程片**（见 tutorial.md）。像素解说（`cs-pixel-explainer`）和暗夜知识片（`cs-knowledge-film`）是**系列皮肤**，只在用户确认是该系列续集时使用，见 director.md ⑥。

## 导演铁律（每支片都适用，写进 brief 的 `<direction>`）

1. 整片一套风格、一套配色；同一个角色或元素在每个镜头里长得一样。
2. 每个镜头只讲一件事；画面上的字少而大，每段文字至少停 2.5 秒。
3. 动画用缓动或弹簧，不用匀速。
4. 转场从画面内容里长出来（一条线变成下一个场景的地平线、一个点放大成下一场的月亮），不用默认淡入淡出。
5. 镜头跟着内容动：推近、拉远、跟随，主体在画面里足够大（至少三分之一）。
6. 禁止：居中大字 + 渐变背景的默认风格、所有元素同时淡入、满屏小字、任何看起来像模板的东西；每支片再按情况补充。

## 先读什么

按阶段读最少的资料：

- 想画面、配风格、出风格卡：[references/director.md](references/director.md)，开工前同时看 [style-log.md](style-log.md)
- Vibe 知识大赏、来源可核查的代码科普片：[references/vibe-knowledge.md](references/vibe-knowledge.md)
- 陈硕的个人风格（不变层）：[references/signature.md](references/signature.md)
- 选代码路线、绿幕人物：[references/code-stack.md](references/code-stack.md)
- **教程类视频 → KAI 教程片**：[references/tutorial.md](references/tutorial.md)（系列皮肤，结构和画风已锁定，跳过风格卡）
- GPT 出图 × 代码动画（镜头类型、分工、角色一致性、提示词）：[references/hybrid.md](references/hybrid.md)
- 写 brief：[references/brief-template.md](references/brief-template.md)
- 制作规则（render(t)、弹簧、字体、WebGL、像素纯度、声音、渲染速度）：[references/craft-rules.md](references/craft-rules.md)
- 自评和验收：[references/qa.md](references/qa.md)

把 [scripts/](scripts/) 和 [assets/](assets/) 拷到工程目录。`assets/template.html` 只提供骨架（render(t)、弹簧、时间表、字幕函数），顶部的 `STYLE` 和全部镜头都按风格卡重写，不要沿用模板自带的配色和示例镜头。

## 工具

```bash
node scripts/render.mjs index.html out/final.mp4 --size 1920x1080 --fps 30 [--duration 30] [--start 0] [--audio audio/mix.wav] [--subframes 4] [--workers 2] [--draft]
node scripts/render.mjs index.html qa/s1.png --still 2.0                 # 单帧
python3 scripts/audio.py sfx cues.json audio/sfx.wav                    # [{"t":1.2,"type":"click|pop|whoosh|thud|ding|riser|glitch|type","gain":1}]
python3 scripts/audio.py music audio/music.wav --bpm 120 --bars 16
python3 scripts/audio.py beats music.mp3 > source/beats.json            # bpm / beats / downbeats / hits
python3 scripts/audio.py vo spec.json                                   # 逐句配音 → audio/vo.wav + timeline.js
python3 scripts/audio.py mix audio/mix0.wav audio/vo.wav audio/music.wav:0.25 audio/sfx.wav:0.8 --len 30   # --len = 成片时长
python3 scripts/audio.py normalize audio/mix0.wav audio/mix.wav         # -14 LUFS ±0.5，真峰值 ≤ -1 dBTP
python3 scripts/qa.py out/final.mp4 qa                                  # 抽帧、手机抽帧、切镜连续帧、波形、打分表
python3 scripts/gen_image.py assets.json --dry-run | --draft | --final | --pick id=2 | --export-md   # GPT 出图（在有 OPENAI_API_KEY 的电脑上跑）
```

- `assets/template.html`：render(t) 骨架，自带缓动、闭式弹簧 `spring/springTo`、带种子随机、版式缩放 `S`、`STYLE` 风格变量、可关闭的打字机字幕；有 `timeline.js` 时按配音时长自动排镜头。
- `assets/layers.js`：把 GPT 图变成动画：`illustration`（运镜）、`parallax`（分层视差）、`grid` / `card` / `promptBox` / `bigStep`（讲解界面）、`avatar`（头像对口型）、`subtitle`（box / plain 两种字幕）。用法见 hybrid.md 第三节。
- `assets/kai-boy-3d.js`：主角 KAI 男孩 3D 版，`KaiBoy3D(w,h).render({t, yaw, mode, pose, expr, bg})`。每支片的主角，和 KAI 猫同框时都用透明底叠加。
- `assets/kai-cat-3d.js`：宠物 KAI 猫 3D 版（WebGL2 光线步进，零依赖），`KaiCat3D(w,h).render({t, yaw, mode, pose, expr, bg})`，白模 / 上色两种模式，透明底可叠进任何画面。
- `assets/kai-cat.js`：KAI 猫代码版角色组件，`drawKaiCat(g, {x, y, size, t, pose, expr, style})`，4 种姿势、5 种表情、4 种画风。每支片都要出场，规则见 signature.md 第五节。
- `assets/crt.js`：WebGL2 老电视后期层，`template.html` 里 `USE_CRT = true` 即开。只在风格卡选了复古质感时用。
- `assets/voice/`：`tts.py` + `配音.bat`（Windows 双击即可），读同目录 `spec.json` 逐句生成 `audio/line_XXX.mp3`。
- 像素风参考实现：[`../cs-pixel-explainer/assets/reference-wizard.html`](../cs-pixel-explainer/assets/reference-wizard.html)（调色板索引缓冲、整数倍放大、10 张/秒姿势量化、固定步长重放的 render(t)），像素复古风格从它起步。

依赖：node + playwright、ffmpeg、python3 + numpy、中文字体（Noto Sans CJK 等）；出图另需 `pip install openai pillow` 和 `OPENAI_API_KEY`。

## 工作方式

### 1. 通用模式先明确 5 项输入（Vibe 知识模式按专用参考文件）

接受三种原材料，可以混着给：想法、原内容（文章、口播稿、产品网址、代码库）、参考视频。先用一条消息问清下面 5 项，**用户没给的不要自己编**；原材料里已经能确定的项直接写出来请用户确认，不重复问：

1. **主题**，以及看完以后希望观众记住的**一句话**；顺带问：这是某个系列的续集（沿用风格），还是独立单片？
2. **时长和画幅**：__ 秒，1920×1080 / 1080×1920 / 1080×1080，30 / 60 帧
3. **风格**：像素 / 扁平插画 / 界面动效 / 彩铅手绘 / 复古电视 / 3D / 让我按选题提方案；有参考视频或截图就发来
4. **配色和字体**：主色 #……，字体 ……（也可以「按风格卡定」）
5. **声音**：用户提供的音乐文件 / 代码合成配乐；要不要配音

- 主题和那一句话必须由用户给，模型只能帮忙改写，不能代填。
- 用户回答「你定」的项，才在风格卡里给默认值并标注「待确认」。
- 无人值守时：主题来自原材料，其余用交付边界里的默认值，并在报告最前面列出所有假设。
- 给了音乐就先 `audio.py beats` 测节拍；给了参考视频：抽帧拼图 `ffmpeg -i ref.mp4 -vf "fps=1,scale=320:-1,tile=6x5" -frames:v 1 source/ref-sheet.png`，或直接 `qa.py ref.mp4 source/ref` 拿抽帧和切镜点。写下它的**手法**（镜头结构、节奏、转场、隐喻方式），不是外观。值得长期用的手法补进 `signature.md` 吸收清单。

### 2. 导演层 → 三张风格卡

按 [references/director.md](references/director.md) 走：核心冲突 → A 稳妥 / B 跨界 / C 疯狂三个隐喻 → 各配一种风格 → 套 KAI 签名层 → 三张风格卡。

- 三张卡的隐喻必须不同；用户在第 3 项指定了风格时，三张卡共用这个风格，只比隐喻和镜头；否则风格至少两种不同。只换配色不算不同方案。
- 单片不能和 `style-log.md` 里最近 3 支用同一种风格（用户指定风格时除外）。
- 卡片下面写推荐哪张、一句理由，等用户选（可以混搭）。

### 3. 分镜表（等用户确认）

选定风格卡后先写分镜表，**不写代码**。每个镜头一块，格式固定：

```
镜头 [N]｜[开始–结束秒]
画面：构图、元素、文字（文字 ≤ 一句，停留 ≥ 2.5 秒）
动作：进场、主要动作、出场（缓动或弹簧，写明哪一档）
镜头：推 / 拉 / 跟随 / 固定
声音：这一段的音乐和音效（音效写到具体动作）
转场：怎么从画面内容里长到下一个镜头
```

- 有音乐：先分析节拍，镜头切换和关键动作都标出落在第几拍，重拍放最大的变化。
- 有配音：按旁白句子排镜头，时间先按每字 0.235 秒估。
- 标出签名动作所在的镜头。
- 自查一遍导演铁律（每镜一件事、字停留、转场不是淡入淡出、主体够大），再发给用户，**等确认**。

### 4. 3 张关键帧（等用户确认）

分镜表确认后，预览页从 `template.html` 骨架起步，按风格卡重写 `STYLE`，只做 3 个最能代表全片的瞬间（通常：开场第一眼、签名动作那一刻、收尾定版）：

- `render.mjs previews/plan.html previews/k1.png --still <t>` × 3，拼成一张给用户看风格。
- 卖点在运动本身（变形、卡点、转场）时，额外出 2–4 秒小样：`--duration 3 --draft`。
- 自己先看一遍，字溢出、挤、空的先修，再给用户；不满意就回到风格卡换方向。
- 用单帧耗时估算正式渲染时间。

### 5. 写 brief.md

按 [references/brief-template.md](references/brief-template.md) 把 7 块全部填实（`<structure>` 直接放确认过的分镜表）。之后的制作严格按它来；用户只要提示词时，交 brief.md 即结束。

### 6. 出图（用到 GPT 图时）

按 [references/hybrid.md](references/hybrid.md)：从 brief 的分镜表整理 `assets.json`（每镜要哪张图、参考哪个角色）→ `--dry-run` 给用户确认张数 → `--draft` 每张 2 个候选 → 用户挑图（`--pick`）或 `--final` 出定稿。没有 Key 就 `--export-md` 导出提示词，用户在 ChatGPT 手动出图后放进 `images/`。图片到齐再进入下一步。

### 7. 逐镜头制作

- 画面只由 t 决定（规则见 craft-rules.md）：不用计时器，随机数带固定种子，帧和帧之间不保存状态。用到 GPT 图时页面先 `KAILayers.load({...})`，字体和资源加载完再设 `window.ready = true`，之后才截图。
- 用了 WebGL：先渲一帧确认着色器真的生效，再往下做。
- 有配音：写 `spec.json`（`scenes[{id, lines}]`，`id` 对应 template 里 SHOTS 的 id），在能访问语音服务的电脑上跑 `assets/voice/配音.bat` 或 `python tts.py`，拿回 `audio/` 后 `audio.py vo spec.json` 整段合成，画面对旁白，不要一句一句拼。
- 没配音：先定节拍网格，镜头按拍排。
- 音效放在画面动作发生的那一帧：`cues.json` 的时间点直接从镜头关键帧抄。
- **每做完一个镜头渲 3 张静帧**（开头/中间/结尾）自己检查：文字有没有溢出、元素有没有重叠、画面够不够满、主体够不够大，修好了再做下一个镜头。
- 30 秒以上先出 `--draft --size 960x540` 看节奏，对了再精修。

### 8. 渲染与自评

1. 混音：`mix --len <成片秒数>` → `normalize`（先裁到成片时长再调响度，否则裁掉安静尾巴后会偏响）。
2. 听不到声音：用 `audio.py check` 把波形画成图自己看，确认没有削顶爆音、意外静音、低频一直轰。
3. 正式渲染：`render.mjs … --audio audio/mix.wav`。
4. `qa.py out/final.mp4 qa`，按 [references/qa.md](references/qa.md) 8 项打分，列最严重的 3 个问题和时间点，只重渲出问题的那几秒，重复到每项 ≥8。

### 9. 交付

报告：成片路径、`brief.md`、`qa/review_log.md`、关键创作决定、已知不足、渲染用时、需要用户核对的事实。

收尾三件事：在 `style-log.md` 最上面追加一行；效果好的风格卡存成模板；踩到的新坑补进 craft-rules.md。

## 验证

- 渲染器退出码 0，没有页面报错（有报错时退出码为 2，并打印前 5 条）。
- 分镜表和 3 张关键帧都经过用户确认（无人值守时在报告里写明跳过）。
- `qa.py` 打分表每项 ≥8，验收清单全部勾上。
- 规格与 brief 一致：时长、画幅、帧率、声音。
- 波形图已看过，无削顶。
- `style-log.md` 已追加。
