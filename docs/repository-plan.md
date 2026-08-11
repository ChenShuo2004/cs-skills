# CS Skills Roadmap

## 当前状态

CS Skills 当前包含 11 个 active skill，并采用单入口架构：

```text
用户目标 → cs-run → 一个下游 skill → 验证结果
```

主入口是 `$cs-run`，写作入口是 `$cs-writer`，调研入口是 `$search-skill`。

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
- `you-wendu-ip`
- `auto-videl`
- `chatcut-video-blueprint`

分别覆盖陈硕风格写作、有温度品牌 IP 的一致性延展、电商短视频复刻与生成包，以及 ChatCut 视频素材筹备蓝图。

### 调研与决策

- `search-skill`

负责产品、公司、技术、市场和竞品的深度研究，输出带来源、风险和行动建议的决策简报。

### 产品、工程与交付

- `frontend-design`
- `clean-code`
- `ralph-runner`
- `checkpoint-version`
- `ending-time`

覆盖界面设计、工程质量、PRD 执行、版本回退和最后一公里交付。

`chatcut-video-blueprint` 只负责从主题和原始内容生成口播稿、素材清单、Motion Graphics 方案、声音方向和逐镜头表，不直接修改 ChatCut 项目。

## 已退休范围

以下方向已经移出 active library：

- 自动剪辑、时间线编排、MP4 渲染。
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
- `you-wendu-ip`：用身份参考图生成 2D、3D 和多形态示例，并检查角色 DNA 是否漂移。
- `frontend-design`：完成一个页面设计和浏览器检查。
- `clean-code`：对真实改动做小范围质量收尾。
- `ralph-runner`：从 Markdown PRD 生成 dry-run。
- `auto-videl`：走一条不消耗 API 额度的提示词或 Google Flow 链路。
- `chatcut-video-blueprint`：用完整 brief 生成一份 ChatCut 素材筹备蓝图，并验证输出结构与路由边界。
- `ending-time`：完成验证、提交、推送和部署收尾。

### P2：持续收束

- 新需求先进入 `$cs-run`，不要直接新增同义入口。
- 只有连续出现、边界稳定、输出可验证的任务，才拆成独立 skill。
- 每次新增 skill 都检查是否可以并入现有 skill。
