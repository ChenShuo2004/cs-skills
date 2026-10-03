# CS Skills README 优化教程

当前展示的是约 73 秒的 16:9 **代码渲染教程**：Canvas 的 `render(t)` 逐帧画出前后对照、检查项、阅读路径和可复制命令，再叠加真实页面截图作证据。主题是如何用现有的 [`cs-clean-code`](../../../cs-clean-code/SKILL.md) 优化仓库 README。画面使用 [`caacd86` 时的旧版](https://github.com/ChenShuo2004/cs-skills/blob/caacd86de4b0ab23a0469eb5ea7506cb72a62630/README.md)、[首页改版提交 `0b27495`](https://github.com/ChenShuo2004/cs-skills/commit/0b27495ba82a9297eb4028ee443edb69b7a0ef31) 和主分支截图；主分支截图只代表制作时的页面。旧版的 14 个 Skill 与当前的 16 个 Skill 是不同时间的仓库状态；视频比较的是阅读路径，不把数量变化归因于 README 优化。

配音使用 Fish Audio `s2.1-pro-free` 和用户提供的音色 ID `80c0495688fb4b749527a039c74eb2dd`。API 密钥只从本机私有文件读取，没有加入仓库或视频。X 上的 [WorkBuddy 教程](https://x.com/XiaohuiAI666/status/2105974340798005663)提供了“具体案例 → 操作步骤 → 验收”的讲解参考；本片的功能与画面事实来自 CS Skills 仓库。

| 镜头 | 画面 | 讲解重点 |
| --- | --- | --- |
| 1 | 旧版与新版页面并排 | 第一眼能否找到入口 |
| 2 | 大字号目标卡与 KAI 猫 | 给出可验收的 README 优化目标 |
| 3 | `AGENTS.md` 截图 + 三项检查卡 | 先核对功能、目录和命令 |
| 4 | 五段阅读路径逐项出现 | 定位 → 工作流 → Skill 地图 → 案例 → 安装 |
| 5 | 历史 README + 问题卡 | 对照优化前的入口分布 |
| 6 | 当前 README + 路径卡 | 对照优化后的阅读顺序 |
| 7 | 真实首页改版提交 + 验收卡 | 检查链接、命令和远端提交 |
| 8 | 大字号可复制提示词 + KAI | 把方法用于其他仓库 |

完整逐段口播与时间码见 [`narration.json`](narration.json) 和 [`timeline.json`](timeline.json)。重新渲染前应核对当前 README、Skill 路由和页面链接，避免历史画面被误当作当前状态。需要 Python 3、Node.js、Playwright、Chrome 和 FFmpeg。生成步骤：

```bash
FISH_API_KEY_FILE=/path/to/private-key python3 fish_narrate.py
NARRATION_OUT_DIR=audio python3 make_audio.py
node render-code.mjs code-film.html demo-v2.mp4 \
  --size 1920x1080 --fps 30 --duration 73.24 --workers 4 --audio audio/mix.wav
node render-code.mjs code-film.html keyframe.png --still 48
```

[`fish_narrate.py`](fish_narrate.py) 从私有文件读取密钥；[`make_audio.py`](make_audio.py) 用时间轴拼接逐句配音并合成轻音效；[`code-film.html`](code-film.html) 提供可复现的 `render(t)` 画面；[`render-code.mjs`](render-code.mjs) 用 Playwright 逐帧截图，再经 FFmpeg 编码。`source/` 中是制作时的公开页面证据图和已有 KAI 角色资产。密钥、原始录屏和逐句音频都不提交到仓库。旧版录屏仍保存在 [`demo.mp4`](demo.mp4)，便于比较升级前后的观看体验。
