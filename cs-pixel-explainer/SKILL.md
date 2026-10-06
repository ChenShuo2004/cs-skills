---
name: cs-pixel-explainer
description: "把中文口播文案做成像素风 + 坐标系隐喻 + 打字机字幕的动画解说视频（含 edge-tts 配音）：先问 5 项输入、写分镜表与 3 张关键帧等确认，再写 spec.json、配音、逐帧渲染 1080p mp4。用户给文案并要像素风 / 注意力赌博那种风格、或确认是像素解说系列续集时使用；独立单片和其他风格走 $cs-code-video，暗夜星空知识片走 $cs-knowledge-film。"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# cs-pixel-explainer：像素风动画解说视频

参考风格：夜晚像素街道 + 左上角「关系坐标」HUD + 打字机字幕 + 把道理抽象成坐标系/老虎机/网络图。
全部画面由代码绘制（Canvas），页面暴露 `window.render(t)`，Playwright 逐帧截图 + FFmpeg 合成 1080p MP4；配音用 edge-tts，每句真实时长驱动整条时间轴，字幕和动画自动对齐配音。

流程总览：**问 5 项输入 → 设计隐喻 → 分镜表（等确认）→ 3 张关键帧（等确认）→ 配音 → 逐场景制作自检 → 整片 → 交付**。

## 0. 引擎在哪

引擎 = `engine/` 目录下 5 个文件：`engine.html`（场景库）`timeline.mjs` `render.mjs` `tts.py` `配音.bat`。
按顺序找，找到一处即可，复制到工作目录 `~/pxe/engine/`：

1. 本 skill 目录：[`engine/`](engine/)（从 GitHub 安装时就在这里；没有就 `git clone https://github.com/ChenShuo2004/cs-skills`，目录 `cs-pixel-explainer/engine/`）
2. 用户电脑（已关联时）：读取用户提供的 engine 目录，通过当前可用文件工具获取；不假设固定电脑路径。
3. Project「陈硕 video」文档：`claude/pixel-explainer/engine.html` 等 → `project_read` 后写入文件

像素纯度参考实现：[`assets/reference-wizard.html`](assets/reference-wizard.html)（施法巫师，128×96 调色板索引缓冲、整数倍放大、10 张/秒姿势量化、预分配粒子池、固定步长重放的 render(t)、无缝循环）。新场景、新角色从它的写法起步。

运行依赖：node + playwright、ffmpeg、Noto CJK 字体；Playwright 需有 Chromium 浏览器，若未安装其自带浏览器，渲染脚本会尝试使用本机 Chrome。Claude Cowork 环境若已预装这些依赖，无需重复安装。配音需要 Python、`edge-tts` 和可访问语音服务的网络；`tts.py` 缺少 `edge-tts` 时会自动安装。
`配音.bat` 缺了就按下面内容重建（必须 CRLF 换行，UTF-8）：

```bat
@echo off
chcp 65001 >nul
cd /d %~dp0
where python >nul 2>nul && (python tts.py) || (py tts.py)
echo.
echo 配音完成后回到 Claude 说一声「配音好了」即可
pause
```

示例 spec：[`assets/example-spec.json`](assets/example-spec.json)（10 个场景全覆盖，写新 spec 前先读它）。

## 1. 开工先问 5 项输入（一条消息问完，没给的不编）

原材料里已经能确定的项直接写出来请用户确认，不重复问：

1. **主题**，以及看完以后希望观众记住的**一句话**（主题和这句话必须由用户给，可以帮忙改写，不能代填）
2. **时长和画幅**：__ 秒（本系列常见 90–180 秒），1920×1080 / 1080×1920 / 1080×1080，30 / 60 帧
3. **风格**：本系列锁定像素风；问有没有参考视频或截图、这支要不要换场景主题（夜晚街道 / 别的地点）
4. **配色和字体**：沿用系列调色板（黄=正向、红=负向、青=主角），还是这支换主色 #……
5. **声音**：用户提供的音乐文件（放项目目录，`bgm`）/ 代码合成芯片配乐 / 无配乐；要不要配音（默认要，男声 zh-CN-YunxiNeural）

用户回答「你定」的项才用默认值，并在分镜表顶部标注。无人值守时主题取自文案，其余用默认值，并在报告最前面列出假设。

## 2. 导演规则（每支都遵守）

- 整片一套风格、一套调色板；主角、NPC、HUD 在每个场景里长得一样。
- 每个场景只讲一件事；画面上的字少而大，每段文字（标题、标签、大字）至少停 2.5 秒；字幕每句 ≤ 22 字。
- 动画用缓动或弹簧，不用匀速（路人行走除外）。
- 转场从画面内容里长出来：地面塌陷 → 坠入 abyss、落地线变成 axes 的横轴、坐标点放大成下一场的角色。`pixelDissolve` 只作兜底，不要每场都用。
- 镜头跟着内容动：推近主角、拉远看全局、跟随奔跑；主体至少占画面三分之一。
- 禁止：居中大字 + 渐变背景的默认风格、所有元素同时淡入、满屏小字、任何看起来像模板的东西。

## 3. 像素纯度标准（新场景、新角色必须遵守；旧场景逐步迁移）

- 所有画面先画在固定的小逻辑画布（本引擎 480×270，独立镜头可用 128×96、240×135），再按**整数倍**放大到 1920×1080，`imageSmoothingEnabled = false`，CSS `image-rendering: pixelated`。
- 所有绘制对齐逻辑画布整数坐标；不用亚像素、抗锯齿、`createLinearGradient/RadialGradient`、`shadowBlur`、半透明叠色。渐变用色带 + Bayer 4×4 有序抖动；发光用 1 像素轮廓光或几圈抖动像素；闪光、变暗用调色板映射表整体换一级。
- 固定调色板约 24 色：夜空深蓝/深紫、角色暖色、3–4 个明亮的魔法/信号色。每个像素都来自调色板，最稳是画进 `Uint8Array` 索引缓冲再查表写 `ImageData`。
- 角色用矩形和像素串程序化搭建（约 24×32 逻辑像素），姿势做成参数（手臂高度、道具角度、头部倾斜、衣摆摆动），关键帧之间缓动插值，但时间按 8–12 张/秒量化、结果取整到像素网格 → 60fps 输出也像逐帧像素动画。
- 角色外一圈深色描边，再外一圈 1 像素轮廓光（按与光源距离分级换色）；剪影在背景上一眼可辨。
- 状态机做动作：待机（两帧上下晃）→ 蓄力 → 爆发（强光 + 屏幕震动 1–2 逻辑像素）→ 收招，循环片首尾帧完全一致。
- 粒子池预分配、循环复用，渲染循环里不 new 对象；粒子取整后再画；消失前按寿命走「白 → 信号色 → 暗色」。
- 字幕层允许在 1080p 上画（中文像素字太小会糊），但要硬边、调色板颜色、不加 shadowBlur。
- 已知技术债：现有 `engine.html` 的 `glow()`、`shadowBlur`、渐变背景、高分辨率叠加文字不符合本标准。动到哪个场景就把哪个场景改到标准，改完同步三处存档。

## 4. render(t) 纯度

- 画面只由 t 算出：不用计时器、CSS 动画、`Math.random()`；随机数带固定种子；帧和帧之间不保存状态。
- 需要累积的模拟（粒子）：用固定 60Hz 步长从场景（或循环）起点重放到 t；场景起点重置种子和粒子池。
- 字体加载完（`document.fonts.ready`）再截图，不然前几帧是默认字体。

## 5. 流程（按顺序做）

1. **问 5 项输入**（第 1 节），等回答。
2. **读文案 → 设计隐喻**（最重要，见第 6 节）。用户说「自己发挥」时，可以改写文案，让它更口语、更有钩子，但保留原意。
3. **写分镜表，等用户确认**（不写代码）。每个场景一块：
   ```
   镜头 [N]｜[开始–结束秒]（按每字 0.235 秒估）｜场景 type
   画面：构图、元素、文字（大字/标签/字幕）
   动作：进场、主要动作、出场（用哪些 events）
   镜头：推 / 拉 / 跟随 / 固定
   声音：配乐段落、音效（落在哪个动作上）
   转场：怎么从画面内容长到下一场
   ```
   有音乐时先测节拍（`cs-code-video` 的 `audio.py beats`），场景切换和关键动作落在拍点上。发出前对照第 2 节自查。
4. **写 `spec.json`**（第 7 节），放在 `~/pxe/<slug>/spec.json`。
5. **3 张关键帧，等用户确认风格**：开场第一眼、最关键的隐喻瞬间、结尾金句。`node engine/timeline.mjs <dir> && node engine/render.mjs <dir> --preview` 后挑 3 帧拼图给用户；自己先 Read 检查重叠、出框、文字太小、主体太小，修好再给。
6. **配音（在能访问语音服务的电脑上跑）**：
   - 把 `engine/tts.py`、`engine/配音.bat` 复制到 `<项目目录>/`，与 `spec.json` 放在一起。本机可联网时运行 `python3 tts.py`；Windows 也可双击 `配音.bat`。
   - 脚本生成 `audio/line_000.mp3…` 和 `audio/DONE`。确认 `DONE` 与句子数一致后，再运行 `timeline.mjs`，让真实配音时长驱动画面。
   - 如果使用 Claude Cowork 且它无法访问语音服务，可用 `device_commit_files` 将上述文件写到用户已连接的电脑，请用户运行配音，再用 `device_stage_files` 取回 `audio/`；不要假定每台电脑的盘符或目录相同。
   - 配音整段驱动时间轴，不要一句一句拼画面。
7. **逐场景自检**：每做完（或改完）一个场景，渲开头/中间/结尾 3 张静帧：文字有没有溢出、元素有没有重叠、画面够不够满，修好了再做下一个。
8. **声音**：音效放在画面动作发生的那一帧（时间点从 events 的 at 换算）；配乐和音效可用 `cs-code-video` 的 `audio.py sfx / music` 用 numpy 从零合成（像素风优先方波/三角波芯片音色）。听不到声音，就把混音波形画成图检查，确认没有削顶爆音、意外静音。
9. **正式渲染**：`node engine/timeline.mjs <dir> && node engine/render.mjs <dir>` → `video.mp4`（自带配音）+ `subtitles.srt`。2 核约 0.5–1× 实时，3 分钟视频约 6–10 分钟，用 `timeout 600000`，必要时 `--from/--to` 分段。
10. **交付**：抽 3–4 帧检查，提供 `video.mp4`、`subtitles.srt` 和项目目录的真实路径；在 Claude Cowork 中可再用 `SendUserFile` 或 `device_commit_files` 交付给用户。

没有配音也能出片：跳过第 6 步，timeline 按每字 0.235s 估算，输出无声版 + SRT。

## 6. 创作公式（这个风格好看的原因）

- **一个核心隐喻 + 一个二维坐标系**：X = 你能控制的投入（注意力/时间/钱），Y = 结果的极性（好/坏）。HUD 的 label/x/y/top/bottom 跟着换。
- **结构**（约 90–180 秒，25–40 句）：
  1. `street` 开场：标题大字（`sub:false` 的第一句念标题）→ 主角从 (0,0) 出发 → 全力投入（run/throw）→ 被拒绝（shield/reject）→ 塌陷（collapse）
  2. `abyss`：掉进深渊，落地，大字点题「敌人 (+100,-100)」；正向结局用 `tone:"gold"`
  3. `axes`：把故事抽象成坐标系：陌生人在原点、朋友塔在右上、主角在右下，虚线「高 X 消耗」，正/负箭头，原点画圈给反转金句
  4. `slot`：「你只能控制 X，Y 由 N 个变量决定」→ 转两次老虎机
  5. `card` × N：逐个解释变量（waves 同频/不同频，split 两种状态对比，beats 节奏合拍，quotes 越界阈值）
  6. `network` / `triangle`：给出方法（弱纽带、三元闭包、多点连接）
  7. `street`（friends>0，气泡）收尾 → `bigtext` 点阵金句
- **字幕**：每句 ≤ 22 字，一句一个意思；关键词用 `[y]黄[/y]` 正向、`[r]红[/r]` 负向/反转、`[c]青[/c]` `[g]绿[/g]`，每句最多 1–2 处。
- **反转句式**：「X 的悲剧不是失败，而是成功——」「A 的反面不是 B，是 C」「你以为在 X，其实在 Y」。
- 数字坐标要自洽：HUD 关键帧、axes 点位、abyss 的 sub 用同一套数字。

## 7. spec.json 参考（下面 `//` 只是说明，真实 JSON 不能写注释）

```json
{
  "title": "视频标题",
  "voice": "zh-CN-YunxiNeural",   // 男声叙述推荐；也可 zh-CN-YunjianNeural（更沉）/ zh-CN-XiaoxiaoNeural（女）
  "rate": "+4%",                  // 语速
  "hud": { "label": "关系坐标", "x": "注意力", "y": "情绪", "top": "友", "bottom": "敌" },
  "lineGap": 0.22, "sceneTail": 0.45,   // 可选：句间隔 / 场景尾巴（秒）
  "bgm": "bgm.mp3", "bgmVolume": 0.12,  // 可选：放在项目目录里的背景音乐
  "scenes": [ { "type": "...", "lines": [...], "props": {...}, "events": [...], "hud": [...], "showHud": true } ]
}
```

**lines**：字符串，或 `{ "text": "带[y]标记[/y]的字幕", "say": "念的内容（默认=去掉标记的 text）", "sub": false, "pause": 0.3 }`。

**时间锚点 `at`**：所有事件都用「本场景第几句」表示，`2` = 第 3 句开始时，`2.5` = 第 3 句念到一半，所以配音变长变短动画都跟着走。
**`hud`**：`[[at, x, y], ...]`，x∈[0,100]，y∈[-100,100]；只在 `showHud:true` 的场景显示（`hudFadeIn` 秒后淡入）。场景其他通用字段：`lead`（首句前留白秒）、`hold`（尾部额外停留）、`minDur`、`transition:"none"`。

### 场景与参数

| type | props | events（`do`） |
|---|---|---|
| `street` 夜晚街道 | `title{line1,line2,until,color}` 开场大字；`npc{x:330,enterAt:0.3,enter:false,color}`；`crowd`(10) 路人数；`friends` 主角身边朋友数；`heroX`(150)；`heroWalk:false` | `emote{text:"!",who:"hero"/"npc",color}`、`run{to}` 冲向 npc、`walk{to}`、`throw{item:"heart"/"gift"}`、`shield{label}` npc 红色六边形、`reject{label,push}` 弹开、`collapse` 地面塌陷坠落（下一场景接 abyss）、`bubble{who:"hero"/"npc"/朋友序号,text,dur}` |
| `abyss` 深渊 | `tone:"red"/"gold"`，`label` 大字，`sub` 小字，`landAt`(1.6 秒，0=不坠落直接站着) 落地时间，`labelAtLine` 用行锚点控制大字出现 | – |
| `axes` 坐标系 | `xLabel` `yLabel`；`points:[{x,y,kind:"people"/"tower"/"hero"/"dot",label,color,at,labelSide:"left"/"right"/"below"/"left-far"}]` | `link{from,to,label}` 两点虚线（竖线时标签竖排）、`polarity{up,down}` 右侧正负箭头、`ring{point,label,color}` 虚线圈 |
| `slot` 老虎机 | `title` `reels:[4 个名字]` `captions:[停下后每列说明]` `bet` `idle` | `spin{result:["✓","✗","?","✓"],value:"Y = +95",color}` |
| `card` 变量卡 | `mark:"✓"/"✗"/"?"` `title` `tag` `tagColor` `index:"1 / 4"`，`body` 见下 | – |
| `network` 关系网 | – | `strong{label,note}` 黄色强纽带、`weak{label,pulse}` 青色弱纽带 + 信息流、`info{title,rows:[[k,v]]}` |
| `triangle` 三元闭包 | `a` `b` 两端名字 | `link` A–B 连线、`break` 断开 B 变红、`addC{label,inner}` 出现 C 和金色三角、`note{side:"left"/"right"/"bottom",text}` |
| `bigtext` 点阵结尾 | `line1` `line2` `color` `people`(5) | – |

`card.body`：
- `{type:"waves", rows:[{a,b,match:true/false,label,at}]}`：两人之间的波形，同频/不同频
- `{type:"split", cols:[{title,sub:[..],people,boxes,note,meter,meterColor,at}]}`：左右两种状态对比
- `{type:"beats", rows:[{label,count,color,at}], verdict:"不合拍", verdictAt}`：节奏条对比
- `{type:"quotes", quotes:[{text,x,y,at}], meter:"接收阈值", meterAt}`：两句心声（主角约 x=360，对方约 x=1360）+ 阈值条充满后出现护盾

## 8. 注意

- 颜色：`yellow` `red` `cyan` `green` `purple` 或 `#hex`；字幕标记只有 y/r/c/g。
- 预览时只看 `preview.jpg`（每场景 2 帧），发现问题改 spec 或 engine，**不要**直接全量渲染试错。
- 新场景需求 → 在 `engine.html` 里加一个 `sceneXxx(sc, lt)` 并注册到 `SCENES`，按第 3 节像素纯度标准写，同步更新本文件表格和三处存档（用户电脑 / Project / GitHub）。
- 配音改了某句：删掉对应 `audio\line_XXX.mp3` 重新双击 `配音.bat`（已存在的会跳过）。
- 句子序号 = 所有场景 lines 按顺序展开后的下标，从 000 开始。
