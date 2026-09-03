# 采集页面与实测坐标

## 环境

```bash
npm i -D playwright
npx playwright install chromium
```

Windows 上 Playwright 常去找沙箱空目录，报 `Executable doesn't exist`。先指到本机已装的浏览器，再考虑重装：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH="$env:LOCALAPPDATA\ms-playwright"
node scripts/capture.mjs
```

仍找不到再跑 `npx playwright install chromium`。不要手改缓存路径。

## 采集口径

固定这套参数，之后所有坐标换算都依赖它：

| 参数 | 值 | 原因 |
|---|---|---|
| 逻辑宽度 | 1440 | 桌面主流宽度，四列网格不会塌成三列 |
| `deviceScaleFactor` | 2 | 推进镜头时不糊 |
| `locale` | `zh-CN` | 中文站点的字体与排版 |
| `colorScheme` | 按片子色调 | 深色片选 `dark`，浅色片选 `light` |

## 三个必须处理的问题

### 1. 内层滚动容器让 `fullPage` 失效

大量应用（FlowUs、Notion 类、各种后台）把滚动放在内层 `div` 上，`document.scrollingElement` 不动，`fullPage: true` 只能截到一屏。

不要试图注入 CSS 去解开滚动容器（会破坏布局）。用**撑高 viewport**：

1. 在真实滚动容器上逐屏 `scrollTop += clientHeight * 0.7`，滚到底触发懒加载。
2. 滚回顶部，读 `scrollHeight`。
3. `setViewportSize({ width: 1440, height: scrollHeight + 80 })`。
4. 再滚一遍（撑高后可能又触发新的懒加载）。
5. 截图。

`scripts/capture.mjs` 里的 `walk()` 就是这个流程，`panel` 字段指定内层容器选择器。

### 2. 懒加载图片

滚到底一次不够，撑高 viewport 后要再滚一遍。两轮之间各留 800ms 以上。截图前再等 700ms 让最后一批图片解码完。

### 3. 浮层遮挡

付费墙、cookie 条、站方广告都是 `position: fixed/sticky`。采集前按文案关键词隐藏：

```js
const OVERLAY_TEXTS = ['购买完整内容', '免费使用', '接受全部 Cookie'];
```

`hideOverlays()` 只隐藏高度小于 400px 的 fixed/sticky 元素，避免误伤整页容器。**隐藏的东西要记录并在交付说明里写出来**，这是诚实边界，不是需要藏起来的操作。

## 配置文件

工程根放 `capture.config.json`：

```json
{
  "out": "public/captures",
  "viewport": { "width": 1440, "height": 900 },
  "colorScheme": "dark",
  "overlayTexts": ["购买完整内容", "免费使用"],
  "targets": [
    { "label": "brand-home", "url": "https://example.com/home" },
    { "label": "room-theme", "url": "https://example.com/theme", "panel": ".main-panel" }
  ]
}
```

`panel` 只在页面用内层滚动时填。

## 采完之后

`capture.mjs` 会打印每张图的实际像素尺寸。把**逻辑高度**（像素高度 ÷ deviceScaleFactor）填进 `tokens.ts`：

```ts
export const PAGES = {
  brandHome: { file: 'captures/brand-home.png', height: 1433, title: 'example.com', grade: 0.95 },
} as const;
```

`height` 填错会导致滚动镜头在页面末尾露出空白。`grade` 是曝光系数，深色页填 1，浅色页填 0.93–0.95。

## 实测元素坐标

运行 `node scripts/measure.mjs`，它按 `capture.config.json` 里每个 target 的 `needles`（文案关键词数组）找元素，产出 `public/captures/boxes.json`：

```json
{
  "room-theme": {
    "viewport": 2089,
    "boxes": { "知命图谱": { "x": 755, "y": 977, "w": 80, "h": 23 } }
  }
}
```

匹配策略是「包含该文案且面积最小的元素」，所以关键词要足够独特。找不到时换更长的连续文案。

**加载路径必须和 capture.mjs 完全一致**（同样的滚动、同样的撑高），否则量到的 y 坐标和截图对不上。`measure.mjs` 用 `deviceScaleFactor: 1`，产出的就是逻辑坐标，直接可用。

## 从截图里裁品牌题字

需要把页面上的 logo 或书法题字当作片头字标时，不要目测裁切框。用 `node scripts/find-region.mjs <图片> <色彩预设>` 做像素直方图：

它按颜色条件筛出目标像素，输出列/行分布柱状图，密集区间就是裁切边界。金色题字的判据示例：

```js
const isStroke = r > 165 && r - b > 95 && g - b > 35 && b < 130;
```

判据太松会把整个暖色 banner 都算进去。先跑一次看柱状图，再收紧阈值，直到只剩一个明确的密集区间。

注意：Playwright 的 `page.evaluate` 里 `file://` 图片进不了 canvas（跨源）。脚本用 Node 读文件转 base64 data URI 再传进去。

## 不要采会过期的内容

日更模块、黄历、个性化推荐、登录后才有的书架不要入镜。取景时用短窗口把视口压在稳定板块上，或在采集后确认截图里没有日期。

片中要报的数字（专题数、工具数、节点数）当场从页面读出，写进片子常量和交付说明，并记下采集日期。产品改了数量，先重拉再改常量，不要凭上次记忆重渲。
