# `spec.json` 与场景参数参考

下面示例中的 `//` 仅为注释说明，真实 JSON 不允许写注释。写新 `spec.json` 前请同时参照 [`assets/example-spec.json`](../assets/example-spec.json)。

## 顶层结构

```json
{
  "title": "视频标题",
  "voice": "zh-CN-YunxiNeural",
  "rate": "+4%",
  "hud": { "label": "关系坐标", "x": "注意力", "y": "情绪", "top": "友", "bottom": "敌" },
  "lineGap": 0.22,
  "sceneTail": 0.45,
  "bgm": "bgm.mp3",
  "bgmVolume": 0.12,
  "scenes": [
    { "type": "...", "lines": ["..."], "props": {}, "events": [], "hud": [], "showHud": true }
  ]
}
```

- `voice`：男声推荐 `zh-CN-YunxiNeural`；可选 `zh-CN-YunjianNeural`（更沉）或 `zh-CN-XiaoxiaoNeural`（女声）。
- `lines`：支持纯字符串，或对象 `{ "text": "带[y]标记[/y]的字幕", "say": "实际朗读内容（默认去标记后的 text）", "sub": false, "pause": 0.3 }`。
- **时间锚点 `at`**：以“本场景第几句”计（0 起始），`2` = 第 3 句开头，`2.5` = 第 3 句中段，随真实配音自动伸缩。
- **`hud`**：`[[at, x, y], ...]`，`x ∈ [0, 100]`、`y ∈ [-100, 100]`；仅在 `showHud: true` 场景显示（`hudFadeIn` 秒后淡入）。
- **场景通用字段**：`lead`（首句前留白秒）、`hold`（尾部停留秒）、`minDur`、`transition: "none"`。
- **颜色与字幕标记**：颜色支持 `yellow`、`red`、`cyan`、`green`、`purple` 或 `#hex`；字幕标记仅支持 `[y]`、`[r]`、`[c]`、`[g]`。

## 场景类型与参数

| type | props | events（`do`） |
| --- | --- | --- |
| `street` 夜晚街道 | `title{line1,line2,until,color}` 开场大字；`npc{x:330,enterAt:0.3,enter:false,color}`；`crowd`(10) 路人数；`friends` 朋友数；`heroX`(150)；`heroWalk:false` | `emote{text:"!",who:"hero"/"npc",color}`、`run{to}`、`walk{to}`、`throw{item:"heart"/"gift"}`、`shield{label}`、`reject{label,push}`、`collapse`（下接 `abyss`）、`bubble{who:"hero"/"npc"/朋友序号,text,dur}` |
| `abyss` 深渊 | `tone:"red"/"gold"`、`label` 大字、`sub` 小字、`landAt`(1.6 秒，0=不坠落直接站着)、`labelAtLine` | – |
| `axes` 坐标系 | `xLabel`、`yLabel`；`points:[{x,y,kind:"people"/"tower"/"hero"/"dot",label,color,at,labelSide:"left"/"right"/"below"/"left-far"}]` | `link{from,to,label}`（竖线时标签竖排）、`polarity{up,down}` 右侧正负箭头、`ring{point,label,color}` 虚线圈 |
| `slot` 老虎机 | `title`、`reels:[4 个名字]`、`captions:[停下后每列说明]`、`bet`、`idle` | `spin{result:["✓","✗","?","✓"],value:"Y = +95",color}` |
| `card` 变量卡 | `mark:"✓"/"✗"/"?"`、`title`、`tag`、`tagColor`、`index:"1 / 4"`、`body`（见下） | – |
| `network` 关系网 | – | `strong{label,note}` 黄色强纽带、`weak{label,pulse}` 青色弱纽带 + 信息流、`info{title,rows:[[k,v]]}` |
| `triangle` 三元闭包 | `a`、`b` 两端名字 | `link` A–B 连线、`break` 断开 B 变红、`addC{label,inner}` 出现 C 与金色三角、`note{side:"left"/"right"/"bottom",text}` |
| `bigtext` 点阵结尾 | `line1`、`line2`、`color`、`people`(5) | – |

## `card.body` 变体

- `{type:"waves", rows:[{a,b,match:true/false,label,at}]}`：两人波形，同频/不同频对比。
- `{type:"split", cols:[{title,sub:[..],people,boxes,note,meter,meterColor,at}]}`：左右两种状态对比。
- `{type:"beats", rows:[{label,count,color,at}], verdict:"不合拍", verdictAt}`：节奏条对比。
- `{type:"quotes", quotes:[{text,x,y,at}], meter:"接收阈值", meterAt}`：两句心声（主角约 x=360，对方约 x=1360）+ 阈值条充满后出现护盾。

## 扩展新场景

新场景在 `engine/engine.html` 新增 `sceneXxx(sc, lt)` 并注册到 `SCENES`，严格遵守 `SKILL.md` 中的像素纯度标准，并同步更新本表。
