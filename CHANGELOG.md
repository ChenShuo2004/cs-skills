# 更新日志

## 未发布

### v0.4.0：高频工作流执行合同

- 为 `$cs-frontend-design` 增加 Build / Iterate / Review 模式、Page Spec、State Matrix 与验证证据格式。
- 为 `$cs-clean-code` 增加 Cleanup Diagnostic Card、风险范围闸门与 Requirement → Implementation → Verification 映射。
- 为 `$cs-run` 增加多目标优先级和跨 Skill 交接表，确保“整理后提交”“做完后部署”等请求不会越权并行执行。
- 扩展自动契约、路由案例与发布前人工验收，覆盖上述行为。

## v0.3.0 · 2026-08-12

### 稳定性

- 将 `$cs-run` 调整为显式优先入口，明确任务直接进入下游 skill。
- 分离 `$cs-clean-code` 的本地质量职责与 `$cs-ending-time` 的交付职责；Git、PR、预览部署和生产部署采用逐项明确授权。
- 为 ChatCut 蓝图和小黄正文配图固化不可越界与默认确认边界。

### 质量体系

- 新增零依赖 Node 静态验证器、核心链路契约与路由案例。
- 新增统一回归命令，覆盖静态检查、`cs-auto-videl` Python 回归和 `cs-checkpoint-version` PowerShell 恢复测试。
- 新增 Windows GitHub Actions 质量门槛及 v0.3.0 发布前真人验收清单。

### 兼容性

- 所有 active `SKILL.md` frontmatter 仅保留 `name` 与 `description`，提升跨 Agent 兼容性。

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
