# ChenShuo Skills Roadmap

## 当前状态

ChenShuo Skills 已发布为公开 GitHub 仓库：

[ChenShuo2004/chenshuo-skills](https://github.com/ChenShuo2004/chenshuo-skills)

当前包含 14 个已发布 skill，按 Goal Mode 组织：

- 自动剪辑
- 内容写作
- 理想车主信息图
- 前端产品设计
- Open Design 设计产物
- Ralph PRD 执行
- 代码质量和交付收尾
- 目标澄清和 skill 路由

## 仓库定位

ChenShuo Skills 是陈硕在真实项目里沉淀的 AI Agent 工作流集合。

它的核心不是“提示词收藏”，而是“目标驱动的工作流入口”。每个 skill 都必须回答：

1. 目标是什么？
2. 输入是什么？
3. 输出是什么？
4. 核心流程是什么？
5. 怎么验证完成？

## 首版 Skill

### 自动剪辑组

- `auto-cutting`
- `auto-cutting-prd`
- `auto-cutting-ralph`
- `auto-render-video`

目标：把自动剪辑从“想法”推进到“需求、计划、执行、验证”的闭环。

### 内容与信息图组

- `happy-writer`
- `li-auto-infographic-suite`
- `li-auto-minimal-infographic`
- `li-info`

目标：把真实项目素材转成可发布内容，并支持理想车主信息图生产。

### 设计、工程与执行组

- `goal-mode`
- `frontend-design`
- `open-design`
- `ralph-runner`
- `clean-code`
- `ending-time`

目标：支持目标澄清、前端体验设计、设计产物生成、PRD 执行、工程质量检查和最终交付收尾。

## 发布标准

每个 skill 发布前必须满足：

1. `SKILL.md` 有合法 frontmatter。
2. `description` 能明确触发场景。
3. `agents/openai.yaml` 存在，且默认 prompt 包含 `$skill-name`。
4. 不包含本机绝对路径、账号、访问密钥、私有资料或不可公开链接。
5. 复杂规则放到 `references/`，不要堆在 `SKILL.md`。
6. 能说明目标、输入、输出、流程和验证方式。

## 下一阶段

### P0：安装验证

用新会话逐个测试关键安装链接：

```text
帮我安装这个 skill：https://github.com/ChenShuo2004/chenshuo-skills/tree/main/happy-writer
```

重点验证：

- 能否安装。
- 是否按描述触发。
- `references/` 是否能被按需读取。
- `agents/openai.yaml` 是否展示正常。
- `$goal-mode` 是否能在没有平台 Goal UI 时生成任务卡。

### P1：真实任务回归

用真实任务验证这些核心 skill：

- `happy-writer`：用一份项目素材生成文章。
- `clean-code`：对一个真实代码改动做收尾。
- `auto-render-video`：用 render-plan 生成并验证 MP4。
- `frontend-design`：对一个本地 UI 做实现和浏览器检查。

### P2：补案例

后续可以新增 `examples/`，但不要在首版塞太多样例。

建议案例：

- `examples/happy-writer-project-post.md`
- `examples/clean-code-handoff.md`
- `examples/auto-render-video-plan.json`
- `examples/frontend-design-review.md`

### P3：发布体验优化

- README 已增加更短的安装区、功能全景、带陈硕署名的 hero 图、代码动画和增长曲线图。
- 给每个 skill 增加一句“适合 / 不适合”。
- 根据真实安装反馈调整触发语。

## 风险与待确认

1. `li-auto-*` 相关 skill 依赖用户本地素材库，公开仓库只保留流程，不包含私有素材。
2. `open-design` 依赖用户本地 Open Design 项目，路径必须由使用者提供或现场解析。
3. `ralph-runner` 依赖本地 Ralph/Codex 环境，默认只做 dry-run 和 no-commit。
4. `auto-render-video` 依赖 FFmpeg/FFprobe 或目标项目已有渲染链路。
5. `happy-writer` 和 `clean-code` 需要真实任务继续打磨触发边界。
