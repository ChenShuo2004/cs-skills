# 使用指南

将仓库放入 Codex 技能目录；已有同名目录时先备份：

```sh
git clone https://github.com/huangbai-AI/guoshen.git ~/.codex/skills/guoshen
```

新建对话，发送视频并说：

> 用 $guoshen 检查这条视频在小红书、抖音、B站、视频号的发布风险，标出原文、时间点、依据和改法。

也可以只指定一个平台，或补充“这是商业合作”“只是加热失败”。审核结果分别标记：明确风险、需复核、按你的要求修改、未发现明显问题、未检查。不会给虚构的通过率。

当前提取工具使用 Python 3、FFmpeg、whisper.cpp 的 whisper-cli 与多语言模型；全画面文字和二维码识别使用 macOS Vision，需要 Swift。模型不随仓库发布。其他系统的接入方案见 [提取说明](../resources/references/extraction.md)，当前不会自动切换工具。

```sh
python3 scripts/build_review_context.py --platforms xiaohongshu douyin bilibili wechat_channels --as-of 2026-10-07 --out /tmp/review-context.json
python3 scripts/extract_video.py /视频路径.mp4 --out /空的证据目录 --model /模型路径.bin
python3 scripts/scan_candidates.py /证据目录/evidence.json --out /证据目录/candidates.json
```

日期改为实际审核日期。脚本提取证据、召回线索；**AI 助手结合完整上下文复核并写报告**，不是跑完命令就自动得出违规结论。独立运行脚本的接入方需要自行提供这一步。[完整审核流程](ai-review.md) 写明输入、核查顺序、提示词和输出要求。

默认约每秒两帧并补场景切换；严格排查闪现地址使用 `--fps 0` 逐帧识别，仍需回看小字与模糊画面。未完成全片检查时不能声称“零网址”。

## 可选的严格地址模式

默认配置不强制禁用所有网址。仅在用户明确要求时，使用 [严格地址配置](../resources/profiles/strict-address.json)：

```sh
python3 scripts/scan_candidates.py /证据目录/evidence.json --profile resources/profiles/strict-address.json --out /证据目录/candidates.json
```

配置区别见 [配置说明](../resources/profiles/README.md)。命令均从仓库根目录执行；审核日期以当次任务为准，示例日期不代表规则已重新核实。

[返回文档导航](README.md) · [返回首页](../README.md)
