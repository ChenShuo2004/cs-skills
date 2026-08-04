# CS Skills

![CS Skills hero](assets/cs-skills-hero.png)

CS Skills 是陈硕在真实项目里沉淀的 AI Agent 工作流。它不是提示词收藏夹，而是一个从目标出发、自动路由、验证结果的精简 skill 库。

当前仓库保留 **10 个 active skill**。唯一主入口是 `$cs-run`：先理解目标，再把任务交给最合适的下游 skill。

## 快速开始

安装主入口：

```text
帮我安装这个 skill：https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run
```

安装后，直接说目标即可：

```text
$cs-run 我想把一个想法做成可以上线的产品，帮我拆解并开始执行。
```

也可以直接调用明确的下游 skill：

```text
$cs-writer 把这份项目记录写成一篇有观点、有细节的文章。
$search-skill 调研这个产品和主要竞品，给我一份有来源的决策简报。
$frontend-design 设计并实现这个页面，最后做浏览器验证。
$clean-code 检查这次实现，整理代码、文档和测试。
$ending-time 这个功能已经完成，帮我验证、提交、推送和部署。
```

## Skill 总览

| 目标 | 推荐入口 | 输出 |
| --- | --- | --- |
| 不知道该怎么开始或该用哪个 skill | `$cs-run` | Goal Card、路由结果、下一步执行 |
| 写文章、改稿、提纲、项目故事 | `$cs-writer` | 角度、提纲、文章、改写稿或审稿意见 |
| 产品、公司、技术、市场或竞品深度调研 | `$search-skill` | 来源、竞品对比、风险和决策建议 |
| 抖音/电商短视频复刻、分镜和生成包 | `$auto-videl` | 分镜图、首帧图、Seedance/Flow/Veo 提示词和 QC |
| ChatCut 主题视频的素材筹备与制作蓝图 | `$chatcut-video-blueprint` | 口播稿、素材清单、Motion Graphics、声音方向和逐镜头表 |
| 大改前保存回退点 | `$checkpoint-version` | 可恢复的本地 checkpoint |
| 前端页面、工具、仪表盘设计与评审 | `$frontend-design` | UI 方案、实现约束和浏览器验证清单 |
| 代码清理、重构、文档同步和质量检查 | `$clean-code` | 有边界的修改、验证命令和交付说明 |
| Markdown PRD 转 Ralph 并 dry-run | `$ralph-runner` | Ralph PRD、overview、dry-run 日志 |
| 验证、提交、推送、PR 或部署收尾 | `$ending-time` | 交付验证报告和 GitHub/Vercel 结果 |

## `$cs-run` 路由原则

`cs-run` 是唯一总入口，负责：

1. 读取当前项目上下文和已有文档。
2. 把模糊请求整理成 Goal Card。
3. 只询问会改变执行结果的阻塞问题。
4. 选择一个主 skill，并在用户要求执行时直接继续。
5. 根据输出和验证标准确认是否完成。

已经退休的能力不会被自动路由：

- 自动剪辑、时间线渲染、MP4 导出体系。
- 理想车主信息图体系。
- Open Design 设计产物体系。

`auto-videl` 只处理电商短视频创意、分镜、首帧和生成包，不等同于通用自动剪辑。

## 仓库结构

```text
cs-skills/
  README.md
  LICENSE
  assets/
  docs/
  auto-videl/
  chatcut-video-blueprint/
  checkpoint-version/
  clean-code/
  cs-run/
  cs-writer/
  ending-time/
  frontend-design/
  ralph-runner/
  search-skill/
```

每个 skill 尽量保持自包含：

- `SKILL.md`：触发说明和核心工作流。
- `agents/openai.yaml`：UI 展示文案和默认 prompt。
- `references/`：需要时再读取的详细规则。
- `scripts/`：可重复执行的确定性脚本。
- `tests/`：关键脚本或契约的回归测试。

## 维护标准

新增 skill 前先确认：

1. 它解决的是稳定目标，而不是一次性提示词。
2. `description` 能清楚说明触发场景。
3. 有明确的输入、输出、边界和验证方式。
4. 不重复已有 skill 的入口职责。
5. 不包含本机绝对路径、私有资料或密钥。

## 视觉资产

![CS Skills code animation](assets/skill-code-animation.svg)

![Skill growth curve](assets/skill-growth-curve.svg)
