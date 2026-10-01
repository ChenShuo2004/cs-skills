# spec.json 格式

完整示例：[../assets/example-spec.json](../assets/example-spec.json)（10 个场景、约 2 分钟）。

## 顶层

```json
{
  "title": "信息论 · 意外才值钱",
  "voice": "zh-CN-YunjianNeural",
  "rate": "-6%",
  "pitch": "-2Hz",
  "music": true,
  "musicVolume": 1.0,
  "progression": ["Am9", "Fmaj7", "Am9", "Dm9", "Cmaj7", "Fmaj7", "Em7", "Am9"],
  "ambient": true,
  "ambientVolume": 0.5,
  "bgm": "bgm.mp3",
  "bgmVolume": 0.15,
  "subSize": 38,
  "lineGap": 0.35,
  "sceneTail": 0.8,
  "palette": { "gold": "#f2c77c" },
  "scenes": []
}
```

- 推荐音色：`zh-CN-YunjianNeural`（沉稳男声）、`zh-CN-YunxiNeural`（年轻男声）、`zh-CN-XiaoxiaoNeural`（女声）。
- `bgm` 是项目目录内的文件，不存在则忽略。
- 配乐：`score.py` 按 `progression` 给每个场景分配一个和弦（可在场景里用 `"chord": "Dm9"` 覆盖，`"musicLevel": 0.6` 调这一场的铺底音量），并把每个事件映射成音效；有 `score.wav` 时不再使用简易 `ambient` 铺底。可用和弦：Am9、Fmaj7、Dm9、Cmaj7、Em7、Gsus。
- 无配音（纯字幕）版本：不跑 tts.py，用 `"readSpeed": 0.2`（秒/字）控制每句停留时长。

## 场景通用字段

```json
{
  "type": "numberline",
  "chapter": { "no": "01", "zh": "猜", "en": "THE GUESS" },
  "stars": 0.55,
  "props": {},
  "events": [{ "at": "L2", "do": "ask" }],
  "lines": [{ "text": "中文字幕，可含 [g]金色[/g]", "en": "English subtitle", "say": "可选：与字幕不同的朗读文本", "pause": 0.3, "sub": false }],
  "lead": 0.4,
  "hold": 0,
  "minDur": 0
}
```

- `chapter`：设一次会延续到后续场景；`false` 隐藏。
- `lines` 可以是字符串（没有英文）或对象。`sub: false` 只朗读不上字幕。
- **时间锚点** `at`：数字（本场景秒数）、`"L2"`（第 2 句开始，从 1 数）、`"L2e"`（第 2 句结束）、`"L2+0.6"`、`"end-1"`。

## 通用事件（任何场景可用）

| do | 字段 | 效果 |
| --- | --- | --- |
| `stat` | `text`, `color`, `dim` | 左上角依次追加一行数据，如 `无事 p = 364/365 → 0.004 bit` |
| `caption` | `text`, `y`, `until` | 顶部居中小字，如 `1948 · CLAUDE E. SHANNON · BELL LABS` |
| `flash` | `color`, `amount` | 短暂整屏闪光（慎用） |

## 场景类型

### typewriter —— 打字机 / 老虎机 / 填空

```json
"props": { "y": 0.4, "size": 68, "beats": [
  { "text": "床前明月", "at": 0.3, "cps": 5.5,
    "slot": { "options": ["光","霜","亮"], "pick": "光", "spin": 1.2, "color": "cyan" },
    "meter": { "bits": 0.1, "max": 10, "label": "≈ 0 bit" } },
  { "text": "窗外下起了", "at": "L3", "blank": true }
]}
```
后一个 beat 出现时前一个淡出。`slot` 在句尾滚动候选字后停在 `pick`；`blank` 画一个闪烁的金色空位；`meter` 是“惊奇度量条”。

### title —— 片名

`"props": { "title": "信息论", "sub": "惊奇之学", "kicker": "INFORMATION THEORY · …", "hitAt": 1.4, "size": 120 }`，建议 `lines: []` + `minDur: 5.5`。

### numberline —— 数轴二分查找

`"props": { "min": 1, "max": 1024, "target": 693, "formula": "log₂ 1024 = 10 bits" }`

事件：`ask`（中间出现“？”光团）、`search`（`at` → `until` 之间自动完成全部二分，带问题、是/否、红色排除区、缩放、比特串）、`reveal`（揭晓数字 + formula）。

### landscape —— 山脉 / 烽火 / 时间条 / 弧线灯火

```json
"props": {
  "ridges": 4, "top": 0.52,
  "beacons": [{ "x": 0.8, "y": 0.52, "s": 1.2 }],
  "timeline": { "label": "一年 · 365 天", "y": 0.72 },
  "arc": { "left": "早已知道", "right": "早已知道", "top": "你最不确定的地方", "topAt": "L2", "y": 0.66 }
}
```
事件：`light {beacon}`、`travel {from,to,dur}`（时间条光点）、`orb {from,to,dur}`（弧线上的光点，0=左端 1=右端）、`lamp {x,y,label,sub,s}`（点亮一盏灯）。

### city —— 城市夜景

`"props": { "windows": 0.1 }`；事件：`snow`、`headline {text,x,y}`。

### formula —— 公式逐行

`"props": { "y": 0.28, "gap": 96, "rows": [{ "text": "惊奇 = −log₂ p", "at": 0.3, "size": 54, "color": "gold", "sub": "AVERAGE SURPRISE" }] }`

写法：下标用 Unicode（`log₂`、`p₁`），减号用 `−`。

### probs —— 候选词概率条（讲大模型 / 采样 / 温度）

`"props": { "context": "我今天中午想吃", "items": [{ "t": "火锅", "p": 0.41 }, { "t": "面", "p": 0.22 }], "y": 0.42 }`

示例中的概率是画面示意，并非从某个模型读取的真实分布。正式内容若使用实测概率，应写明模型、提示词、采样设置和数据来源；否则在片中标明“示意”。

事件：`show`（概率条依次长出）、`pick {index, color, flagAt}`（选中的词飞到句尾；`flagAt` 到点后变绯红，表示“选错了/编的”，配乐同时响起不和谐音）、`temp {value, label}`（按温度重算分布：p^(1/T) 再归一化，右上角出现“稳—野”滑杆）。

### textplay —— 文字实验

`"props": { "text": "下一站是终点站…", "y": 0.38, "size": 50, "box": true }`

| 事件 | 字段 | 效果 |
| --- | --- | --- |
| `scramble` / `replace` | `to`, `dur` | 逐字翻转成新句子 / 整句替换（压缩前后） |
| `dim` | `keep: "研究,汉字"`, `color` | 只保留关键词高亮，其余变暗 |
| `mask` | `chars: "终点,随身"` 或 `idx: [3,4]` | 红色噪声块遮住字 |
| `bars` | `values?`, `label` | 每个字的惊奇柱状图 |
| `wave` | `noise: 0–1`, `label` | 字下方的波形，平静 → 噪声 |
| `ring` | `label` | 冰蓝椭圆光环（“冗余是铠甲”） |
| `note` | `text`, `dy`, `color` | 字下方注释 |

### signal —— 比特流

`"props": { "bits": "1011001001" }`；事件：`noise {amount}`（红色误码）、`ecc {label}`（第二行冗余码）、`formula {text, sub}`（如 `C = B log₂(1 + S/N)`）。

### probe —— 远方探测器

`"props": { "label": "旅行者1号  [d]VOYAGER 1[/d]", "sub": "≈ 20 W", "earth": "地球  [d]EARTH[/d]" }`；事件：`decode {text}`。

### compare —— 左右对比

`"props": { "left": { "text": "萨耘综辑瞪捧栋", "bits": "112 bits", "color": "ice", "note": "乱码：意外，却什么都没说" }, "right": { "text": "春风又绿江南岸", "bits": "112 bits" } }`；事件：`swap {side, text, note}`。

### cards —— 推荐流

`"props": { "colors": ["red","green","violet","gold"], "value": "2.60 bits" }`；事件：`same {color, value, label, level}` 卡片同质化、惊奇条归零。

### sources —— 出处连线（讲幻觉 / RAG / 事实核查）

`"props": { "claims": [{ "t": "水在 100°C 沸腾", "src": "物理课本" }, { "t": "鲁迅说“躺平也是智慧”", "src": null }], "y": 0.6, "sourcesY": 0.27 }`

事件：`link {index}`（从句子向上长出冰蓝连线，接上出处卡片后点亮金色）、`miss {index, label}`（连线摇摆着找不到出处，变红，出现“？”）。

### quote / image / orb / blank

- `quote`：`{ "text": "\"The semantic aspects…\"\n…", "by": "— C. E. SHANNON, 1948" }`
- `image`：`{ "src": "cmb.jpg", "w": 0.5, "ellipse": true, "zoom": 0.06, "caption": "…" }`（图片放项目目录）
- `orb`：`{ "color": "amber", "text": "可选的大字", "textAt": 1 }`
- `blank`：只有星空和字幕；`{ "ridges": 3 }` 可加远山。

## 新增场景类型

在 `scripts/engine.html` 里加 `SCENES.xxx = X => { … }`。`X.lt` 是场景内秒数，`X.at(v)` 解析锚点，`X.evs('name')` 取事件（已解析 `t`），画面必须只由 `X.lt` 决定（不用 `Math.random`，用 `rng(seed)`）。
