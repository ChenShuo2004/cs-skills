# 更新日志

## 未发布

- 新增 CS Skills README 优化录屏教程：真实仓库改版前后对比、`$cs-clean-code` 调用示例、Fish Audio S2.1 中文音色配音，以及可复现的脚本和分镜。
- 为 `$cs-github-push` 增加中英文 README 使用示例、公开 GitHub 页面录屏讲解（中文配音与字幕）、封面和可复用口播分镜。
- 新增 `$cs-code-video`：用代码做动画视频（render(t) 逐帧 + FFmpeg + numpy 配乐），含导演层、KAI 签名层、KAI 教程片系列、GPT 出图 × 代码动画、3D/2D KAI 角色组件、CRT 后期层；开工先问 5 项输入，经分镜表与 3 张关键帧确认后再渲整片。
- 新增 `$cs-pixel-explainer`：像素风 + 坐标系隐喻 + 打字机字幕的解说片引擎（spec.json → edge-tts → Canvas 逐帧渲染 1080p mp4 + SRT），附 10 场景示例 spec 和像素纯度参考实现（施法巫师，128×96 调色板索引缓冲、固定步长重放的 render(t)）。
- 将两个新 Skill 接入 `$cs-run` 路由、README、技能清单和仓库规划；任务 skill 数量由 14 更新为 16。
- 参照 shuohao-skills 的阅读顺序重排首页：语言与作者入口、封面、工作流图、两列 Skill 总表、真实示例、安装、前置条件和仓库约定；新增英文版 README 与中英双语流程图。
- 增加可重复运行的 Codex／Claude Code 软链接安装脚本：支持按需安装、预览、卸载，并保护已有 Skill；加入临时目录自测。
- 优化仓库 README 的上手路径：可执行安装命令、技能地图、真实任务示例和仓库约定保持一致。
- 增加根目录 `AGENTS.md`，固化 Skill 与路由、清单、安装脚本和 GitHub 交付的同步规则。
- 重写仓库 README：用一句话定位、快速开始、技能地图、典型用法和仓库约定组织首页内容。
- 新增 `$cs-github-push`：专门处理 GitHub 提交、推送、PR 与远端核验；将 GitHub-only 路由从 `$cs-ending-time` 拆出，任务 skill 数量由 13 更新为 14。
- 新增 `$cs-knowledge-film`：把知识点做成暗夜星空 + 衬线双语字幕 + 金色光点隐喻的知识解说片（spec.json → edge-tts 配音 → Canvas 逐帧渲染 mp4），含 14 种场景类型与示例 spec。
- 将 `$cs-knowledge-film` 接入 `$cs-run` 路由、README、技能清单和仓库规划；active skill 数量由 12 更新为 13。
- 新增 `$cs-web-promo-film`：把真实网页做成 30–60 秒产品演示宣传片（Playwright 长截图 + Remotion 运镜 + 可交付 mp4）。
- 将 `$cs-web-promo-film` 接入 `$cs-run` 路由、技能清单和仓库规划；active skill 数量由 11 更新为 12。
- 将 `$cs-you-wendu-ip` 完整合并到 `$cs-xiaohuang-skill`；小黄成为“有温度”品牌 IP 与中文正文配图的唯一入口。
- 合并角色 DNA、媒介与形态、品牌提示词、QA 规则和示例资产；采用单一干净身份参考图，避免角色标准分叉。
- 将 `$cs-xiaohuang-skill` 的完整介绍与示例移入 skill 二级页面，根 README 只保留入口。
- 删除 8 张错误的小黄流程图；按小黄参考形象重绘 7 张带中文手写标注的原创示例图。

## v0.2.0 · 2026-08-09

### 新增

- 新增 `cs-you-wendu-ip`，用于稳定生成、修改和延展“有温度”固定品牌角色。
- 增加角色 DNA、媒介与形态、结构化提示词和 QA 检查四份按需参考。
- 增加角色原始参考图、2D 标准图、连接场景、3D 软胶和四形态结构示例。
- 增加 `有温度 IP` 16:9 仓库封面与 README 展示区。
- 根据视觉反馈将仓库封面改为无标题、无副标题的纯插画版本，只保留角色演变与连接叙事。

### 集成

- 将 `$cs-you-wendu-ip` 接入 `$cs-run` 路由、技能清单和仓库规划。
- active skill 数量由 10 更新为 11。

### 验证

- 使用 Skill Creator 校验器检查目录、frontmatter 和 `agents/openai.yaml`。
- 检查项目内图片格式、尺寸、README 相对链接和本机绝对路径泄漏。

## v0.1.0 · 2026-08-05

CS Skills 的首个公开版本，面向使用 Codex 构建产品、自动化工作流和 SaaS 的独立开发者。

### 包含内容

- 新增 `cs-run` 主入口，用一句话澄清目标并路由到合适的工作流。
- 整理产品设计、前端开发、代码质量、内容创作、深度调研、视频制作和交付收尾等技能。
- 增加可移植的作者信息、源码地址和兼容性元数据，方便跨 Agent 复用。
- 优化 README、技能展示名和安装指引。

### 安装

```text
帮我安装这个 skill：https://github.com/ChenShuo2004/cs-skills/tree/main/cs-run
```

推荐将整个仓库作为 skill 集合安装，并根据需要启用具体下游 skill。
