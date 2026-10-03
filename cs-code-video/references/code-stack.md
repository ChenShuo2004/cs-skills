# 代码路线与组合

原则：**先在 [director.md](director.md) 定隐喻和风格，再选能做到这种风格的最简单的代码**。能用一种做完就不混三种；要混就按「内容层 → 质感层 → 声音层」叠，每层单独能跑、单独能查。

## 七种代码

| 代码 | 擅长 | 不适合 |
|---|---|---|
| Canvas 2D | 像素风、扁平插画、手绘线条、粒子、图表 | 大量需要清晰排版的文字 |
| HTML / CSS / SVG | 界面动效、大字排版、卡片、图标描边 | 上万粒子、复杂质感 |
| WebGL 着色器 | 老电视弧面扫描线、胶片颗粒、光晕、水面；一般叠在 Canvas 上当质感层（本 skill 自带 `assets/crt.js`） | 直接画内容 |
| Three.js | 3D 产品转台、3D 字、点云、体素世界、等距小世界 | 写实人物；要还原实物就让用户给 3D 模型文件 |
| p5.js + p5.brush | 彩铅、水彩、蜡笔手绘 | 长片（笔刷慢，先测单帧耗时） |
| Remotion / HyperFrames | 多场景长片、读产品代码库；Remotion 按帧、HyperFrames 按时间线 | 十几秒的小动效（单个 HTML 更快） |
| Manim | 公式、坐标轴、图形变换，精准 | 设计感强的品牌动效 |

默认：**单个 HTML + `window.render(t)`**（`assets/template.html` 的骨架），内容用 Canvas 或 HTML/SVG，需要质感再开 `USE_CRT` 或自写着色器。

## 风格 → 组合速查

风格库的完整清单在 director.md ④，这里只记实现要点。

| 效果 | 组合要点 |
|---|---|
| 像素动画 | 128×96 这类小画布整数倍放大，`imageSmoothingEnabled=false`，坐标取整，约 24 色固定调色板；姿势按 8–12fps 量化，特效每帧都动 |
| 高级界面动效 | 只有一个形状不断变形、永不切镜；闭式弹簧（前沿/后沿用不同弹簧会被拉长）；光标真实点击拖拽驱动；卡在节拍网格；4 子帧运动模糊；合成界面音效 |
| 复古游戏 / 老电视 | Canvas 像素内容 → `crt.js`（弧面、扫描线、荧光点、色散、光晕） |
| 手绘 / 纸张 | Canvas 2D，笔触抖动种子 `floor(t*12)`；纸张纹理用带种子噪声预画到离屏画布，每帧贴一次 |
| 报纸拼贴 / 蓝图 | HTML/CSS + SVG：`stroke-dashoffset` 描线、SVG 滤镜做纸张和墨水晕染 |
| 跨年代历史片 | 每个年代换一种画法（像素 → 着色器 → Three.js），一条合成配乐贯穿，画面跟着音乐剪 |
| 知识叙事长片 | 一个贯穿全片的视觉主角（如一个发光的词）+ 旁白 + 合成配乐；Remotion 每场景一个组件 |
| 真人舞蹈 / 角色 | 视频模型出绿幕人物，代码做背景、大字、胶带、分屏、3D 环绕字，按拍子换 |
| 系列皮肤：像素解说 / 暗夜知识片 | 分别走 `cs-pixel-explainer` / `cs-knowledge-film`，只在系列续集时用（见 director.md ⑥） |

## 视频模型角色 + 代码场景

代码画不好写实人物和复杂舞蹈。分工：视频模型只出人物，其余全用代码。

1. 用视频模型生成人物片段，要求**纯绿色背景**、全身入镜、不出画。
2. 抠像：`ffmpeg -i dancer.mp4 -vf "chromakey=0x00FF00:0.16:0.08,despill=type=green" -c:v qtrle dancer.mov`（颜色值先抽一帧取样）。
3. 页面里用 `<video>` 按 t 设置 `currentTime` 再画进 Canvas；或在 ffmpeg 里把人物层 overlay 到代码渲染出来的背景层上。
4. 背景、大字、分屏按音乐节拍换，人物片段本身不改。

## 公开案例（学手法，不照搬素材）

- 像素巫师：纯 Canvas 2D，128×96 小画布、姿势参数化、状态机循环。
- 界面变形：HTML/CSS/SVG + 弹簧 + 节拍网格 + 运动模糊，全部样式在 `seek(t)` 里由时间算出。
- 电子游戏史：Canvas 像素 + WebGL CRT + Three.js 3D + Python 合成配乐，提示词只写想要什么效果。
- AI 发展史：Remotion + SVG/Canvas + 开源语音 + 合成配乐；先写 STORYBOARD.md，每个场景出静帧自检。

学到的手法记进 [signature.md](signature.md) 吸收清单。

来源：xilo《零基础入门 Opus5.5 做视频》；Kianzzz/xilo-opus-video（MIT）。
