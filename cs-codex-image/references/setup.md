# 安装、检查与恢复

## 前置条件

- Node.js 22+ 与 npm。
- 可工作的当前 Codex CLI，支持 `exec --ignore-user-config`、`--no-daemon` 和 `image_generation` 功能。
- Codex 已使用 ChatGPT 登录，账号实际可使用内置生图。登录状态检查不能证明令牌尚未过期或额度充足，真实生成才能验证当前请求。
- Claude Code 或能加载本地 STDIO MCP 的客户端。Claude 桌面配置安装器当前仅支持 macOS；macOS 以外的真实生图未验收。

没有本地模型权重需要下载。内置生成使用 Codex 的实际额度。固定模型型号不写入 Skill；默认使用 Codex CLI 默认模型，需要沿用已知可用模型时用 `--model` 指定。

## 安装 Skill 与连接工具是两件事

在完整 cs-skills 仓库根目录安装到 Claude Code：

```bash
node scripts/install-skills.mjs --target "$HOME/.claude/skills" --update cs-codex-image
```

再配置图片 MCP（在仓库根目录）：

```bash
# 只读预检与预览，不安装 npm 包、不写配置、不出图
node cs-codex-image/scripts/install.mjs --dry-run

# 明确要接入 Claude 时运行；复制运行时、npm ci、备份并合并配置
node cs-codex-image/scripts/install.mjs --target both
node cs-codex-image/scripts/install.mjs --target both --check
```

单独安装 Skill 后，从真实 Skill 目录运行 `node scripts/install.mjs`。不要假定当前项目就是 Skill 目录。

目标可选 `claude-code`、`claude-desktop`、`both`。Claude Code 写入用户级 `.claude.json`；桌面版写入 macOS 的 `Library/Application Support/Claude/claude_desktop_config.json`。其他字段和 MCP 保留；同名外部服务器冲突会停止。变化前保留配置备份；原有本工具运行时文件变化时也会备份。

桌面版等现有任务结束后重启，Claude Code 打开新会话或用 `/mcp` 重连。写配置后 `--check` 验证子进程和三项工具；这仍不能证明已打开的 Claude 会话加载成功。

## 工具输入与输出

| 工具 | 参数 | 结果 |
| --- | --- | --- |
| `generate_image` | 必填 `prompt`；`aspect_ratio`；`transparent_background`；最多五张绝对路径 `reference_images`；可选绝对路径 `output_dir` | 立即返回 `job_id` 与 queued 状态 |
| `get_image_job` | `job_id`、`wait_seconds`（0–20） | 实际状态、失败原因或完成图片路径、尺寸与字节数 |
| `read_generated_image` | `job_id` | 真实 PNG 像素与文件信息，供 Agent 看图 |

尺寸由内置工具实际输出；aspect_ratio 是构图指令，不承诺精确像素。要求透明背景时出图后须检查 alpha，不能凭请求字段断定已有透明通道。

编辑时把目标图放第一张，在 prompt 逐项描述“改什么、保留什么”。同一 job_id 可在重连后继续查询。后台只有内置生图与参考图查看能力；禁用 shell、外部连接器、插件、浏览器和子 Agent，移除 `OPENAI_API_KEY` 并忽略用户 API/provider 配置。不自动降级为图片 API。

运行时在用户目录的 `.local/share/cs-codex-image-mcp`；任务在 `.local/share/cs-codex-image/jobs`；默认图片在 `Pictures/Codex-Claude/<job_id>`。日志与参考图路径属于本地任务数据，不随 Skill 上传或提交到仓库。

## 明确请求真实验证时

以下命令实际生成一张图片并消耗内置额度，不在安装或检查时自动运行：

```bash
node cs-codex-image/scripts/smoke.mjs --prompt "奶油色背景的小黄鸟插画，正方形，无文字"
```

可加 `--reference` 与绝对路径验证编辑。它通过实际安装的 MCP 完成提交、状态查询与图片预览；不会调用 Claude 模型。要验证 Claude 自己使用工具，需在新 Claude 会话发送真实生图请求，并确认调用与最终 PNG。

## 登录与故障

- Codex 登录失效：用安装器报告的 Codex 可执行文件运行 `login`，由用户完成官方 ChatGPT 登录。API-key 登录与本 Skill 路线不匹配，会明确拒绝。
- Claude Code OAuth 过期：运行 `claude auth login`，由用户登录。`claude mcp get codex-image` 显示 Connected 不代表 Claude 模型登录有效。
- 不可用的旧全局 codex：安装器优先检查应用内可执行文件，再尝试 PATH；不会替换全局命令。`CS_CODEX_BIN` 可明确指定已有可执行文件，指定值无效时停止。
- `failed`：查看该任务的 `job.json`、`stderr.log` 和 `events.jsonl`。修正原因或输入后再提交，不因重连重复生成。
- 已有其他 `codex-image` 配置：保留现场，先识别它的来源，不删除其他工具来抢占名称。

环境变量：`CS_CODEX_BIN`、`CS_CODEX_MODEL`、`CS_IMAGE_DATA_DIR`、`CODEX_HOME`。它们可以放在客户端 MCP 的 `env` 中。自定义 CODEX_HOME 必须保留对应登录；不要复制或公开 auth.json。

只移除本工具时，Claude Code 可用 `claude mcp remove codex-image -s user`；桌面版只删除 mcpServers 中的 codex-image 项。输出和原图保留。

官方接口说明：[Codex 内置生图](https://learn.chatgpt.com/docs/image-generation)、[非交互运行](https://developers.openai.com/codex/noninteractive)、[Claude Code MCP](https://code.claude.com/docs/en/mcp)。接口随客户端版本可能变化，遇到未知 flag 先核对该版本帮助，不绕过错误改走付费 API。
