# CS Skills README 优化教程

这支约 73 秒的 16:9 录屏使用公开 GitHub 页面，讲解如何用现有的 [`cs-clean-code`](../../../cs-clean-code/SKILL.md) 优化仓库 README。视频把 [`caacd86` 时的旧版](https://github.com/ChenShuo2004/cs-skills/blob/caacd86de4b0ab23a0469eb5ea7506cb72a62630/README.md)、[首页改版提交 `0b27495`](https://github.com/ChenShuo2004/cs-skills/commit/0b27495ba82a9297eb4028ee443edb69b7a0ef31) 与当前首页作为画面证据。旧版的 14 个 Skill 与当前的 16 个 Skill 是不同时间的仓库状态；视频比较的是阅读路径，不把数量变化归因于 README 优化。

配音使用 Fish Audio `s2.1-pro-free` 和用户提供的音色 ID `80c0495688fb4b749527a039c74eb2dd`。API 密钥只从本机私有文件读取，没有加入仓库或视频。X 上的 [WorkBuddy 教程](https://x.com/XiaohuiAI666/status/2105974340798005663)提供了“具体案例 → 操作步骤 → 验收”的讲解参考；本片的功能与画面事实来自 CS Skills 仓库。

| 镜头 | 画面 | 讲解重点 |
| --- | --- | --- |
| 1 | 历史 README 首页 | 长文档仍可能让新人找不到入口 |
| 2 | `cs-clean-code/SKILL.md` | 给出清楚的 README 优化目标 |
| 3 | `AGENTS.md` | 先核对功能、目录、命令和数量 |
| 4 | 当前 README 工作流图 | 按读者路径重排信息 |
| 5 | 历史 README 技能表 | 对照优化前的入口分布 |
| 6 | 当前 README 技能地图 | 对照优化后的阅读顺序 |
| 7 | 真实首页改版提交 | 检查链接和示例，再推送核验 |
| 8 | 当前 README 与提示词 | 给出可复制的调用方式 |

完整逐段口播与时间码见 [`narration.json`](narration.json) 和 [`timeline.json`](timeline.json)。重新录制前应核对当前 README、Skill 路由和页面链接，避免历史画面被误当作当前状态。需要 Python 3、Playwright、Chrome、FFmpeg 和 Playwright 的 FFmpeg helper。生成步骤：

```bash
FISH_API_KEY_FILE=/path/to/private-key python3 fish_narrate.py
node make_cards.cjs
node capture.cjs  # 记录输出的 videoPath
RAW_VIDEO_FILE=/path/to/recording.webm python3 render.py
```

[`fish_narrate.py`](fish_narrate.py) 从私有文件读取密钥；[`capture.cjs`](capture.cjs) 录制公开 GitHub 页面；[`make_cards.cjs`](make_cards.cjs) 生成透明字幕卡；[`render.py`](render.py) 合成配音、字幕、MP4 与封面。密钥、原始录屏和逐句音频都不提交到仓库。
