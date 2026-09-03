# 虚拟窗口相机与运镜

## 心智模型

画面上是一个仿浏览器窗口，窗口里贴着一张 1440 逻辑宽的页面长图。运镜就是四个数：

| 量 | 含义 | 单位 |
|---|---|---|
| `width` / `height` | 窗口在画布上的尺寸 | 成片像素 |
| `contentWidth` | 这张 1440 宽的页面被放大到多宽 | 成片像素 |
| `panX` | 横向看到页面的哪里 | 页面逻辑像素 |
| `scroll` | 纵向看到页面的哪里 | 页面逻辑像素 |

`pageScale = contentWidth / 1440`。`contentWidth` 变大就是推镜头，`scroll` 变化就是滚页面，`panX` 变化就是横移。

窗口在画布上的位置由外层 `div` 的 `left` / `top` 控制。

## 打关键帧

**所有几何量共用同一组 `stops`**。这是运镜连贯的关键——如果缩放和滚动各用一套时间点，镜头会飘。

```tsx
const stops = [195, 300, 470, 620, 760, 860, 1010];
const w            = track(frame, stops, [1030, 1030, 1030, 1180, 1180, 1180, 1180]);
const contentWidth = track(frame, stops, [1400, 1400, 1400, 2050, 2050, 2050, 2050]);
const panX         = track(frame, stops, [  55,   55,   55,   95,   95,  605,  605]);
const scroll       = track(frame, stops, [  40,  140,  640,  880,  880,  880,  880]);
```

读法：每一列是一个时刻的镜头状态。值不变的区间就是镜头静止，观众在读屏幕文案。

`track()` 用统一的相机曲线 `Easing.bezier(0.42, 0, 0.36, 1)`：两头缓、中间匀，像真人推轨。不要给相机用 ease-out-expo，长距离移动会显得急停。

## 一段镜头的标准结构

一个内容段落 6–8 秒，内部通常是三拍：

1. **落位**（0–1.5 秒）：窗口淡入 + 轻微上浮 + 从 0.95 缩放到 1。
2. **展示**（1.5–5 秒）：滚动或推进，把这一段要讲的板块带到画面中央，然后**停住**让文案读完。
3. **指向**（5–7 秒）：需要引出下一段时，高亮目标链接 → 指针入场 → 按下 → 转场。

镜头一直动的段落看着累，观众也读不进文案。停顿是必需的。

## 点击落点的换算

指针位置从实测坐标算，公式：

```
screenX = windowLeft + (pageX - panX) * pageScale
screenY = windowTop + CHROME_HEIGHT + (pageY - scroll) * pageScale
```

`CHROME_HEIGHT` 是窗口标题栏高度（starter 里是 38）。忘了加它，指针会整体偏上。

```tsx
const pageScale = 2050 / 1440;
const linkX = 660 + (755 - 605) * pageScale;
const linkY = 140 + 38 + (977 - 880) * pageScale;
```

点击的三个动作错开：高亮框先亮（40 帧渐入）→ 指针入场（30 帧）→ 按下（8 帧缩到 0.84）→ 指针退场。按下之后立刻转场，读起来才像「点了就跳走」。

指针只标注真实存在的链接，绝不画产品界面上没有的按钮。

## 段落之间：共享 CUT 区间

**这是最容易出错的地方。** 每个转场定义成一个共享区间，出场层在这个区间淡出，入场层在同一个区间淡入：

```tsx
const CUT = {
  openToRoom:  [182, 234],
  roomToMap:   [985, 1037],
  mapToTools:  [1400, 1452],
} as const;
```

每层的存在区间就是「上一个 CUT 的起点」到「下一个 CUT 的终点」：

```tsx
const FROM = CUT.openToRoom[0];
const UNTIL = CUT.roomToMap[1];
if (!inRange(frame, FROM, UNTIL)) return null;
const opacity = crossfade(frame, CUT.openToRoom, CUT.roomToMap);
```

`crossfade` 用近线性曲线 `Easing.bezier(0.4, 0, 0.6, 1)`，两层不透明度之和才接近 1。

用 ease-out 曲线做交叉淡化，两层之和会掉到 0.7 左右，**转场处闪一下黑**。这个瑕疵在预览里不明显，在大屏上很刺眼，而且看片子时容易被当成「节奏顿一下」而忽略。所以要用 luma-sweep 量，不要靠眼睛判断。

52 帧（60fps 下 0.87 秒）是舒服的转场长度。低于 30 帧显得仓促，高于 80 帧拖沓。

## 屏幕文案

文案区固定在左侧（`left: 128, width: 500`），窗口在右侧偏中。三层信息依次入场：

1. `Kicker`（小标，字距 0.36em）+ 一条渐变细线
2. `Title`（衬线体，46–62px）
3. `Body`（无衬线，300 字重，行高 1.95）+ 若干 `Pill`

错开时间：小标 4–30 帧，标题 16–46 帧，正文 34–66 帧，pills 从 58 帧起每个错开 16 帧。同时出现会糊成一块。

文案区间要和镜头动作对齐：**镜头在推进时不要换文案**。换文案的时机是镜头停住的那一刻。

## 明暗与氛围

深色片的画布分层（从底到顶）：

1. 纯色底 `#16130F`
2. 暖光 radial gradient（右上）
3. 余烬 radial gradient（左下）
4. **halo**：窗口后面一层暖光，近黑的产品页靠它才不会糊进背景
5. 内容层
6. vignette（不要超过 0.40 的黑，否则四角吃掉内容）

浅色页面通过 `PAGES[key].grade` 压曝光到 0.93–0.95。这是 `filter: brightness()`，只改亮度，不改内容。

## 工程结构

```
src/promo/
├── PromoFilm.tsx   # 分镜：各 Layer、CUT、文案调用
├── tokens.ts       # 配色、发光、投影、PAGES 元数据
├── fonts.ts        # 字体载入
├── anim.ts         # ease / glide / crossfade / band / stagger
├── ui.tsx          # Stage / Kicker / Title / Body / Pill / Rule
└── Window.tsx      # 虚拟窗口 + Pointer
```

除 `PromoFilm.tsx` 外都从 `assets/promo-starter/` 复制，改 `tokens.ts` 适配品牌即可。`PromoFilm.tsx` 是每个片子唯一需要真正手写的文件。

## 多画幅

横屏是默认。竖屏 / 3:4 是**同一条片子的第二套取景**，不是裁切：

| | 16:9 | 9:16 | 3:4 |
|---|---|---|---|
| 画布 | 1920×1080 | 1080×1920 | 1080×1440 |
| 文案 | 左侧栏 | 底部居中，距底 ≥168px（躲开平台控件） | 底部或顶部短句 |
| 窗口 | 右侧偏中，可整页宽 | 居中短窗口；三列网格改两列 | 居中，少留黑边 |
| 文件 | `PromoFilm.tsx` | `PromoFilmPortrait.tsx` | 可共用横屏或另写 |

`CUT`、字幕、数字口径三份必须一致。只改窗口几何和文案落点。

桌面三栏页在 1080 宽里塞三列会切掉半列。竖屏把网格收成两列，被挤掉的那一列后面单独推近补上。

全程浅色的片子不要套暖深色画布，也不要压 `grade`。画布用比页面略深略暖的颜色加投影分层即可。
