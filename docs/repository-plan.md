# CS Skills Roadmap

## 当前状态

CS Skills 当前包含 16 个任务 skill，并采用单入口架构：

```text
用户目标 → cs-run → 一个下游 skill → 验证结果
```

主入口是 `$cs-run`，写作入口是 `$cs-writer`，调研入口是 `$cs-search-skill`。

## 仓库定位

这个仓库只保留真实项目中反复使用、目标稳定、可以验证的工作流。

每个 skill 都必须回答：

1. 目标是什么？
2. 输入是什么？
3. 输出是什么？
4. 核心流程是什么？
5. 怎么验证完成？

## Active Skills

### 总入口

- `cs-run`

负责读取项目上下文、生成 Goal Card、提出最小阻塞问题、选择下游 skill，并在用户要求时继续执行。

### 内容、视觉与电商视频

- `cs-writer`
- `cs-xiaohuang-skill`
- `cs-auto-videl`
- `cs-chatcut`
- `cs-web-promo-film`
- `cs-knowledge-film`
- `cs-code-video`
- `cs-pixel-explainer`

分别覆盖陈硕风格写作、小黄 / 有温度品牌 IP 的一致性延展和中文正文配图、电商短视频复刻与生成包、从内容想法到 ChatCut 制作与上手指引的收敛流程，把真实网页做成产品演示宣传片，把知识点做成暗夜星空风解说片，用代码逐帧做动画视频，以及把中文文案做成像素风解说片。

### 调研与决策

- `cs-search-skill`

负责产品、公司、技术、市场和竞品的深度研究，输出带来源、风险和行动建议的决策简报。

### 产品、工程与交付

- `cs-frontend-design`
- `cs-clean-code`
- `cs-ralph-runner`
- `cs-checkpoint-version`
- `cs-github-push`
- `cs-ending-time`

覆盖界面设计、工程质量、PRD 执行、版本回退、GitHub 推送与部署交付。

`cs-xiaohuang-skill` 是小黄 / 有温度品牌角色的唯一入口：它能稳定生成、编辑和延展 2D/3D、动作、联名、风格迁移和身份修复资产，也能将中文文章、帖子或方法论中的认知锚点转为小黄轻手绘正文配图；不做 ChatCut 策划、PPT 信息图或复杂架构图。

`cs-chatcut` 先把单个或一批内容想法收敛为一个可拍主题，再从主题和原始内容生成口播稿、素材清单、Motion Graphics 方案、声音方向和逐镜头表，并提供从策划到 ChatCut 工作台的上手指引；不直接修改 ChatCut 项目。

`cs-web-promo-film` 用 Playwright 采集真实页面长截图，再用 Remotion 做推进、滚动和点击，渲染 30–60 秒无音轨 mp4；不重绘产品界面，也不承接电商对标复刻或 ChatCut 时间线剪辑。

`cs-knowledge-film` 从口播稿出发，用 spec.json 描述场景与事件，edge-tts 逐句配音后按真实音频排时间轴，由 Canvas 引擎逐帧渲染出带双语字幕的 1080p mp4；专注“讲清一个知识点”，不做产品演示和真人口播。

`cs-code-video` 让页面暴露 `window.render(t)`，由 Playwright 逐帧截图、FFmpeg 合成 mp4，配乐与音效用 numpy 合成；开工先问 5 项输入，经风格卡、分镜表和 3 张关键帧确认后才渲整片，教程类视频默认走 KAI 教程片系列。

`cs-pixel-explainer` 是像素解说系列的引擎：spec.json 描述场景与事件，edge-tts 配音驱动时间轴，Canvas 逐帧渲染 1080p mp4 和 SRT；新场景按像素纯度标准（整数倍放大、固定调色板、动作按 8–12 张/秒量化）编写。

## 已退休范围

以下方向已经移出 active library：

- 自动剪辑、时间线编排、MP4 渲染。网页产品演示片走 `$cs-web-promo-film`，代码动画视频走 `$cs-code-video`，都不是剪辑已有素材的通用渲染能力的回归。
- 理想车主信息图。
- Open Design 设计产物。

相关目录保存在工作区外的退休归档中，不参与 skill 发现。

## 发布标准

每个 active skill 发布前必须满足：

1. `SKILL.md` 有合法 frontmatter。
2. `description` 能明确触发场景。
3. `agents/openai.yaml` 存在，默认 prompt 包含 `$skill-name`。
4. 不包含本机绝对路径、账号、访问密钥或私有资料。
5. 复杂规则放进 `references/`，保持 `SKILL.md` 可读。
6. 能说明目标、输入、输出、流程、边界和验证方式。

## 下一步

### P0：入口回归

用新会话验证：

- `$cs-run` 能把模糊产品任务路由到正确 skill。
- `$cs-run` 不会把退休的自动剪辑、理想信息图或 Open Design 任务误路由到其他 skill。
- `$cs-writer` 能直接完成提纲、文章、改稿和审稿。

### P1：真实任务回归

- `cs-writer`：用真实项目记录生成一篇文章。
- `cs-frontend-design`：完成一个页面设计和浏览器检查。
- `cs-clean-code`：对真实改动做小范围质量收尾。
- `cs-ralph-runner`：从 Markdown PRD 生成 dry-run。
- `cs-auto-videl`：走一条不消耗 API 额度的提示词或 Google Flow 链路。
- `cs-xiaohuang-skill`：用身份参考图生成 2D、3D 和多形态示例并检查角色 DNA；再用真实文章生成 shot list 和至少一张正文配图，验证小黄参与、留白和非 PPT 感。
- `cs-chatcut`：用一批真实内容想法完成选题排序，再用确认后的 brief 生成 ChatCut 素材筹备蓝图，并验证输出结构、上手指引与路由边界。
- `cs-web-promo-film`：用一个公开产品页走采集、运镜、渲染和抽帧验收，确认转场不接黑、无音轨、指针落在真实链接上。
- `cs-knowledge-film`：用 example-spec 走 timeline → preview → 全量渲染，确认字幕不压画面、事件与口播同步、有音轨。
- `cs-code-video`：用 template.html 渲一张静帧和一段 3 秒小样，再跑 qa.py，确认 render(t) 无帧间状态、字幕不溢出、波形无削顶。
- `cs-pixel-explainer`：用 example-spec 走 timeline → preview，确认每个场景无重叠出框；用 reference-wizard.html 验证循环首尾帧一致。
- `cs-ending-time`：完成验证、提交、推送和部署收尾。
- `cs-github-push`：完成精确暂存、提交、推送、远端 SHA 核验和按需创建 PR。

### P2：持续收束

- 新需求先进入 `$cs-run`，不要直接新增同义入口。
- 只有连续出现、边界稳定、输出可验证的任务，才拆成独立 skill。
- 每次新增 skill 都检查是否可以并入现有 skill。
