# 自媒体剧本与分镜提示词集成记录

日期：2026-10-02。本页记录实现阶段的结构与资源验证；GitHub 交付采用独立分支 `codex/self-media-script-prompts`，实际提交和远端 SHA 由交付报告核对。独立新会话行为验收未执行。

## 集成方式

- 保留现有技能数量与调用名称，扩展 `cs-chatcut-video-blueprint`，UI 名称改为“CS 自媒体剧本与制作蓝图”。
- `cs-personal-ip-script` 继续负责真实项目口播；要求分镜分图提示词时连续交给蓝图技能，只有口播请求仍保持精简。
- 更新 `cs-run`、UI 元数据、注册表、README、技能清单、仓库计划与核心资源契约。
- 新增故事方法、镜图提示词规范和文本包模板；修正旧蓝图参考中“默认等口播确认”的冲突，以用户明确设置的检查点为准。
- 在原有未提交工作树上做增量修改。交付时按任务开始前的快照分离共享文件改动，排除未完成的 KAI 封面注册等无关内容，保留原工作区。

## 已执行验证

| 检查 | 实际结果 | 能证明什么 |
| --- | --- | --- |
| `node scripts/validate-skills.mjs` | 通过 | 注册、路由、UI、引用与 fixture 结构完整 |
| `node --test tests/skill-resources.test.mjs` | 5/5 通过 | 递归资源检查器能处理缺失、跨目录、编码和循环等情况 |
| Skill Creator `quick_validate.py` | 源目录 3/3，本机副本 3/3 通过 | 目标技能的命名与 frontmatter 结构有效 |
| 本机资源递归核对 | 三个目标技能通过 | 单独安装后引用可解析 |
| 源目录与本机文件 SHA-256 | 三个技能、11 个文件、0 不一致 | 本轮同步文件一致 |
| `git -c core.whitespace=cr-at-eol diff --check` | 通过 | 改动无该检查报告的空白错误 |
| `node scripts/run-regression.mjs` | GitHub 交付分支通过 | 包含静态结构、资源、代码叙事视频、产品包、电商 12 项与 checkpoint 回归 |

本机同步仅覆盖本轮涉及的蓝图、个人 IP 与总入口技能，覆盖前已备份现有同名文件，保留没有对应源文件的额外内容。没有声称其余注册技能均已本机安装。当前会话旧上下文不会因磁盘更新自动重载。

实现阶段没有修改可执行生产脚本，只运行文本技能、打包和引用检查；后续 GitHub 交付在独立工作树补跑全库回归并通过。脚本回归不等于实际媒体生产或独立新会话行为验收。

## 新增行为验收场景

以下位于 `tests/fixtures/routing-cases.json`。它们是可执行的人工验收请求与观察标准，本轮只验证 fixture 完整性，没有启动独立模型会话。

| 场景 | 状态 | 重点 |
| --- | --- | --- |
| `self-media-script-package` | 未执行 | 完整剧本、分镜、每图完整提示词；无录音只给预计时长 |
| `personal-ip-script-and-prompts` | 未执行 | 从口播连续交接，不再问是否继续，不生媒体 |
| `self-media-existing-script-prompts` | 未执行 | 保留原文，只补点名分镜与图片提示词 |
| `self-media-recording-evidence` | 未执行 | 真实录屏缺口，不用 AI 图伪造界面与结果 |
| `self-media-first-and-last-frame` | 未执行 | 首尾帧瞬间与动作过程分开、保持持物连续 |

保留原有口播限定、用户选题检查点与无 BGM 蓝图场景，作为不扩张范围的对照。

## 使用与边界

```text
$cs-run 基于我的真实项目素材写个人 IP 口播，并附分镜、每张图可复制的图片提示词与需要动态镜头的动作提示词。暂时没有录音，只做文本。
```

静态检查和文件一致性不证明新会话自动路由、提示词生成效果、人物连续性或传播表现。实际素材生成与生产仍使用用户授权且可用的匹配工具。

建议提交信息：`feat: integrate self-media scripts and shot prompts`
