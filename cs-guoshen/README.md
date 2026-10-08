# CS 过审预检

在录制前检查稿件，在发布前联合语音、字幕和画面检查小红书、抖音、B站、视频号风险，给出依据、真实定位和最小修改清单。

```text
用 $cs-guoshen 检查这份 AI 教程稿在小红书和抖音的风险，保留核心观点，给我最小修改版。
用 $cs-guoshen 检查这条成片，标出需修改的口播、字幕与画面，说明检查覆盖。
用 $cs-guoshen 对照上次报告复查新版，逐项说明是否已修复。
```

在 CS Skills 仓库根目录安装：

```sh
node scripts/install-skills.mjs --update cs-guoshen
node scripts/install-skills.mjs --check cs-guoshen
```

[运行说明](references/workflow.md)提供稿件/证据/视频的一键准备命令。稿件模式只需 Python 3.11+ 标准库；视频模式需要 FFmpeg、whisper.cpp 多语言模型及 macOS Vision/Swift。其他系统可导入已有本地识别结果。安装不会下载模型。

脚本产生候选和报告模板；实际判断由助手核官方来源、上下文和原始素材。没有平台内部审核接口，不承诺过审、不推断通过率、不自动发布或公开案例。

基于 [huangbai-AI/guoshen](https://github.com/huangbai-AI/guoshen) 优化，保留 [MIT 许可](LICENSE)、原作者版权与规则核查日期。详见 [改造说明](references/upstream.md)。本技能在 main 新增，不包含在旧版 v0.7.0 发布包中。
