# CS Skills Roadmap

## 当前状态

CS Skills 当前包含 14 个 active skill，并采用单入口架构：

```text
用户目标 → cs-run → 按阶段选择所需 skill → 验证结果
```

主入口 `$cs-run` 采用显式优先：用户明确调用、需要选择 Skill、需要规划跨域任务或目标无法归类时使用；明确的写作、调研和执行请求直接进入对应 Skill。

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

负责读取必要上下文、按需澄清目标、选择每阶段的能力并连续完成已授权任务。

### 内容、视觉与电商视频

- `cs-writer`
- `cs-xiaohuang-skill`
- `cs-auto-videl`
- `cs-personal-ip-script`
- `cs-chatcut-video-blueprint`
- `cs-digital-human-product-video-pipeline`
- `cs-narration-phrase-timeline`

分别覆盖陈硕风格写作、小黄 / 有温度品牌 IP 的一致性延展和中文正文配图、电商短视频复刻与生成包、真实项目到个人 IP 实战口播、从内容想法到 ChatCut 制作蓝图的收敛流程、数字人产品视频的预检到最终验收，以及最终口播的真实短语时间对齐。

### 调研与决策

- `cs-search-skill`

负责产品、公司、技术、市场和竞品的深度研究，输出带来源、风险和行动建议的决策简报。

### 产品、工程与交付

- `cs-frontend-design`
- `cs-clean-code`
- `cs-ralph-runner`
- `cs-checkpoint-version`
- `cs-ending-time`

覆盖界面设计、工程质量、PRD 执行、版本回退和最后一公里交付。

`cs-xiaohuang-skill` 是小黄 / 有温度品牌角色的唯一入口：它能稳定生成、编辑和延展 2D/3D、动作、联名、风格迁移和身份修复资产，也能将中文文章、帖子或方法论中的认知锚点转为小黄轻手绘正文配图；不做 ChatCut 策划、PPT 信息图或复杂架构图。

`cs-chatcut-video-blueprint` 先把单个或一批内容想法收敛为一个可拍主题，再从主题和原始内容生成口播稿、素材清单、Motion Graphics 方案、声音方向和逐镜头表；不直接修改 ChatCut 项目。

`cs-personal-ip-script` 将真实项目、经历或现场观察收敛为 60–90 秒的实战判断型个人 IP 口播，分离可朗读台词与演绎标注，要求可回链的事实锚点；不负责选题池、分镜、配音、真实音频对齐或剪辑。

`cs-digital-human-product-video-pipeline` 接收确认后的产品包或蓝图交接，按 plan、sample、batch 预检与编排数字人、产品证据、ChatCut 剪辑、Remotion 包装和成片 QA；用户确认样片前不允许批量或发布。

`cs-narration-phrase-timeline` 将最终旁白音频和实际朗读稿对齐为逐短语的真实毫秒/帧号数据，供字幕、重点词和动态图文使用；不生成配音、不估算时长、不剪辑或渲染 MP4。

## 已退休范围

以下方向已经移出 active library：

- 自动剪辑、通用时间线编排、MP4 渲染；真实音频的短语时间对齐与有产品包、样片审批和最终 QA 的数字人产品视频流水线除外。
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
7. `node scripts/validate-skills.mjs` 通过；有脚本回归的 skill 同时通过 `node scripts/run-regression.mjs`。
8. 发布版本使用全新会话完成 `docs/evals/<version>.md` 中的人工验收。

## 版本演进（历史规则以当前 SKILL.md 为准）

### v0.3.0：稳定性与可回归质量体系

- 所有 active Skill 通过统一静态契约检查。
- 四条核心链路通过自动场景契约，并在发布前使用新会话完成人工验收。
- `cs-run` 显式优先；Git、PR、预览部署和生产部署均采用逐项明确授权。
- 生产部署锁脚本与并发测试延后到下一版本；保留现有生产安全规则。

### v0.4.0：高频 Skill 执行合同

- `$cs-frontend-design` 固化 Build、Iterate、Review 三种模式；每次界面实现提供 Page Spec、State Matrix 与可复查的验证证据。
- `$cs-clean-code` 固化 Cleanup Diagnostic Card、风险范围闸门及 Requirement → Implementation → Verification 映射，避免“看起来更干净”却无法证明业务正确。
- `$cs-run` 固化冲突请求的优先级和多步骤交接；交付动作始终落在主任务完成后的单独授权步骤。
- 为三项能力新增自动契约和路由案例；发布前真人验收覆盖其实际输出质量。

### v0.5.0：数字人产品视频流水线

- 新增 `$cs-digital-human-product-video-pipeline`，把产品事实、口播、配音、数字人、产品场景、ChatCut、Remotion 和最终验收统一为可恢复的七阶段流程。
- 用 product-pack.json、passed/degraded/blocked 预检、sample-then-batch 审批和 QA 报告保证生产可追溯，不猜测本地接口或凭据。
- 只将明确的数字人产品介绍视频作为窄范围例外，通用自动剪辑仍保持退休。

### v0.6.0：按当前模型能力简化执行

- 全部 14 个入口按实际决策价值整理，移除通用教程与重复确认。
- 保留专用资产、脚本、数据合同和真实验收；长细节按阶段读取。
- 修正 Ralph no-commit/dry-run 语义、按需工具预检与恢复。
- 增加递归资源验证和可观察行为案例；详见 docs/evals/v0.6.0.md。

### P0：入口回归

用新会话验证：

- `$cs-run` 能把模糊产品任务路由到正确 skill。
- `$cs-run` 不会把退休的自动剪辑、理想信息图或 Open Design 任务误路由到其他 skill。
- `$cs-writer` 能直接完成提纲、文章、改稿和审稿。

### P1：真实任务回归

- `cs-writer`：用真实项目记录生成一篇文章。
- `cs-frontend-design`：完成一个页面设计和浏览器检查。
- `cs-clean-code`：对真实改动做小范围质量收尾。
- `cs-ralph-runner`：从 Markdown PRD 生成 overview；只在要求执行时运行 no-commit build。
- `cs-auto-videl`：走一条不消耗 API 额度的提示词或 Google Flow 链路。
- `cs-personal-ip-script`：用真实 AI 创业项目写一条 60–90 秒口播，验证场景、判断、证据、动作和收束齐全，且无编造与强制 CTA。
- `cs-xiaohuang-skill`：用身份参考图生成 2D、3D 和多形态示例并检查角色 DNA；再用真实文章生成 shot list 和至少一张正文配图，验证小黄参与、留白和非 PPT 感。
- `cs-chatcut-video-blueprint`：用一批真实内容想法完成选题排序，再用确认后的 brief 生成 ChatCut 素材筹备蓝图，并验证输出结构与路由边界。
- `cs-digital-human-product-video-pipeline`：用确认产品包完成真实预检与一条样片；检查事实追溯、无 BGM、PIP 回退、样片审批和导出 QA，缺少本地生成配置时准确停止。
- `cs-narration-phrase-timeline`：用最终音频与逐字稿生成短语时间表，验证顺序、真实时间边界、覆盖率与无估算回退。
- `cs-ending-time`：完成验证、提交、推送和部署收尾。

### P2：持续收束

- 新的模糊或跨域需求先进入 `$cs-run`；已经明确属于一个 active Skill 的请求直接进入该 Skill，不新增同义入口。
- 只有连续出现、边界稳定、输出可验证的任务，才拆成独立 skill。
- 每次新增 skill 都检查是否可以并入现有 skill。
