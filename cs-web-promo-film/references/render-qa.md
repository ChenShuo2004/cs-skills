# 渲染与验收

## 工程初始化

```bash
npm i remotion @remotion/cli @remotion/google-fonts react react-dom
npm i -D @types/react @types/react-dom typescript playwright
```

`src/Root.tsx` 注册合成，40 秒片就是 2400 帧：

```tsx
<Composition
  id="Promo"
  component={PromoFilm}
  durationInFrames={2400}
  fps={60}
  width={1920}
  height={1080}
/>
```

60fps 不是奢侈：运镜和滚动是连续位移，30fps 下会有明显频闪。

## 迭代时用静帧，不要每次渲全片

全片渲染要几分钟，改一个参数就重渲会浪费大量时间。调运镜时抽单帧：

```bash
npx.cmd remotion still src/index.ts Promo out/qa/f-0620.png --frame=620
```

一次抽一组关键帧（每段中点 + 每个转场中点），并排看。

## 渲染

```bash
npx.cmd tsc --noEmit
npx.cmd remotion render src/index.ts Promo out/promo.mp4 --concurrency=2
```

先过类型检查。Remotion 的报错在渲染中途抛出时很难定位，`tsc` 能提前拦掉大部分。出现 `EncodingError: The source image cannot be decoded` 时：把不可见层改成 `return null`（不要只把 opacity 调到 0），并用 `--concurrency=2`，不要降分辨率。

## 三项验收，缺一不可

### 1. 逐段看图

按分镜表，每段中点抽一张静帧，**实际打开图片看**。渲染成功不等于画面对。要看的：

- 四列网格、侧边栏、卡片有没有被裁掉半列
- 屏幕文案和窗口有没有叠压
- 指针是不是落在链接上（而不是旁边空白）
- 滚动位置有没有滚过页面末尾露出空白
- 浅色页和深色画布的衔接是否突兀

### 2. 亮度扫描

先抽缩略图，再扫：

```bash
npx.cmd remotion ffmpeg -i out/promo.mp4 -r 4 -s 480x270 out/qa/%04d.jpg
node scripts/luma-sweep.mjs out/qa
```

输出是每 0.25 秒一行的平均亮度柱状图。判据：

- **转场处不应出现局部低谷**。若某个转场帧的亮度明显低于两侧段落，就是接黑，回去检查 `crossfade` 的曲线和 `CUT` 区间是否严格共享。
- 全片明暗比控制在 4 倍以内。超过说明浅色页没压曝光，观众会被闪。
- 暗段平均亮度不宜低于 28，低于这个值在手机上基本看不清内容。

修完重渲再扫一次，确认低谷消失。

### 3. 规格核对

```bash
npx.cmd remotion ffprobe out/promo.mp4
```

确认：分辨率、帧率、总帧数 = 预期时长 × fps、以及**音轨状态**。

## 去掉静音音轨

Remotion 即使没有任何音频源也会写一条静音 AAC 轨。要交付无音轨版本：

```bash
npx.cmd remotion ffmpeg -i out/promo.mp4 -c:v copy -an out/promo-silent.mp4
```

`-c:v copy` 是关键，不重编码视频，画质无损、几秒完成。

## Remotion 自带 ffmpeg 的限制

它是精简构建，**很多滤镜被禁用**，包括 `fps` 和 `crop`。遇到 `No such filter` 时：

| 想做的事 | 不能用 | 改用 |
|---|---|---|
| 控制抽帧率 | `-vf fps=4` | `-r 4` |
| 裁切画面 | `-vf crop=...` | CSS `overflow: hidden` + 定位 |
| 缩放 | `-vf scale=...` | `-s 480x270` |

需要复杂滤镜时装系统 ffmpeg，不要在 Remotion 的 ffmpeg 上试。

## 常见画面问题与对应参数

| 现象 | 改哪里 |
|---|---|
| 网格被裁半列 | 提高 `contentWidth` 让整页宽入镜，或减小 `panX` |
| 内容太小看不清 | 提高 `contentWidth` 推进，同时相应增大 `panX` 保持主体居中 |
| 滚到页面末尾露白 | `tokens.ts` 的 `PAGES[key].height` 填错了，或 `scroll` 终值过大 |
| 窗口糊进背景 | 加强 `GLOW.halo` 和 `SHADOW.window` 的投影 |
| 转场闪黑 | `crossfade` 曲线不是近线性，或 `CUT` 区间没共享 |
| 浅色页刺眼 | 调低 `PAGES[key].grade` 到 0.93 |
| 文案没读完就切了 | 拉长该段 `stops` 的静止区间，或缩短文案 |
| 中文字体不对 | `fonts.ts` 没 `waitUntilDone()`，或没载入对应字重 |

## 交付说明要写什么

- 成片路径、分辨率、帧率、时长、有无音轨、文件体积
- 叙事顺序（一句话）
- 素材来源：每张截图对应哪个页面 URL
- 做过的处理：隐藏了哪些浮层、哪些页面压了曝光
- 已知边界：哪些内容未登录不渲染、哪些页面没有深色主题
- 改动入口：改时长/改文案/改运镜分别改哪个文件
