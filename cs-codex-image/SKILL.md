---
name: cs-codex-image
description: "通过 Codex 内置生图生成或编辑图片，并将该能力接入 Claude Code、Claude 桌面版或其他本地 MCP Agent。用于 cs-codex-image、内置生图、不用 API Key 出图、Claude 调用 Codex 生图。固定 KAI 封面和小黄角色仍由对应品牌 Skill 决定视觉规范。"
---

# CS Codex Image

交付真实图片与保存路径，或可验证的 Claude 生图连接。使用已有 ChatGPT/Codex 登录；不切换到图片 API。复制 Skill 说明不会自动赋予其他宿主内置工具，Claude 需要下面的 MCP 桥接。

## 按当前宿主执行

- **Codex 已提供内置图片工具**：直接调用内置工具。新图描述主体、构图、用途、画风和文字；编辑图先查看目标，明确参考图角色与保持项。生成后查看图片，并将项目资产保存进项目目录。
- **Claude 或其他本地 Agent**：已连接 `codex-image` 时直接用 MCP；需要接入或工具缺失时，读取 [安装与恢复](references/setup.md)，运行随 Skill 提供的安装器。安装 Skill 本身不自动改 MCP 配置、不安装依赖或消耗出图额度。
- **只有 Skill，没有内置工具或可用 Codex**：完成只读预检并说明实际缺口。不要用 SVG、程序绘图或其他服务冒充内置生成，不索取 API Key。

品牌任务保留 `cs-kai-cover` 或 `cs-xiaohuang-skill` 的角色和排版规范；本 Skill 只承担内置出图与连接。生成流程不附加上传、发布或视频渲染。

## MCP 出图流程

1. 调用 `generate_image`：`prompt`、`aspect_ratio`（square / portrait / landscape）、`transparent_background`、可选的 `reference_images` 与 `output_dir`。每次一张；编辑时目标图放第一张，用绝对路径并在 prompt 指明保持项。
2. 保存 `job_id`，用 `get_image_job(job_id, wait_seconds=20)` 等待到 `completed` 或 `failed`。约一至三分钟是操作参考，实际以状态为准；任务会在八分钟后超时停止。
3. `completed` 后调用 `read_generated_image` 查看真实像素，检查主体、文字、保持项及透明背景要求；报告真实尺寸与保存路径。原文件与已存在输出不覆盖。
4. 作业失败先查看返回错误与已有任务。不要自动重提交相同请求；修正输入后再生成，或用户明确要求重试时继续。MCP 重连可查询原 job_id，不能因此重复出图。

`queued`、`running`、工具连接成功、配置已写入都不是出图成功。Skill 文件安装一致、MCP 可连接、Codex 实际生成和 Claude 模型真实调用分别报告。登录过期时由用户完成官方登录；已有任务未结束时不强制重启 Claude。

## 可复制调用

```text
$cs-codex-image 使用 Codex 内置生图，画一张奶油色背景的小黄鸟插画，正方形，无文字。完成后检查图片并告诉我保存路径。
```

```text
$cs-codex-image 把 Codex 内置生图接入 Claude，保留已有 MCP 配置；检查连接，并用一张图验证实际生成。使用当前登录，不使用 API Key。
```

交付：图片 / 已配置连接、实际后端、验证状态、保存路径和必要的恢复步骤。更详细的字段、检查命令与客户端边界见 [安装与恢复](references/setup.md)。
