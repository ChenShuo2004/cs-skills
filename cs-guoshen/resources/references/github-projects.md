# GitHub 类似项目比较

检索及阅读时间：2026-09-06。以下是能力与适配评估，不是平台官方审核依据，也不是准确率测试。未用星数代表可信度。此技能的提取和候选扫描脚本为独立编写，没有复制这些项目的规则库或业务代码。

| 项目 | 与本任务的关系 | 实际核查与采用结论 |
|---|---|---|
| [JuneYaooo/self-media-compliance-review](https://github.com/JuneYaooo/self-media-compliance-review) | 最接近：分平台视频预检技能，含音轨、抽帧、证据报告 | 已下载阅读工具源码、规则来源与 MIT 许可。参考证据分层和场景区分；其默认抽样较稀且转写依赖可选命令，不能直接满足严格零网址扫描 |
| [XshuiAi/media-publish-check](https://github.com/XshuiAi/media-publish-check) | 多平台发布审核技能 | 已读项目说明。它的严格平台名称策略不能等同官方禁令；本技能只把用户明确提出的地址限制作为自定义要求 |
| [xutongxue233/AI-sensitive-word-detection-system](https://github.com/xutongxue233/AI-sensitive-word-detection-system) | 视频语音、字幕、文字识别、语义复核及时间轴 | 已读说明，完整服务较重；只借鉴“候选再复核”思路。无外部字幕才走部分识别路径的设计不能照搬，本任务要始终联合独立语音与画面证据。未核准可复制许可，未复制代码 |
| [CCCpan/chinese-sensitive-words-mcp](https://github.com/CCCpan/chinese-sensitive-words-mcp) | 多平台敏感词线索与替换建议 | 已读说明；词表适合候选召回，不能代替上下文。统一改成“私信我”仍可能导流，不作为默认整改 |
| [YaoFANGUK/video-subtitle-extractor](https://github.com/YaoFANGUK/video-subtitle-extractor) | 本地硬字幕提取 | 已读说明，适合字幕辅助；单独使用会漏字幕区域以外的网址 |
| [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 中文图片文字识别底座 | 已读官方说明，作为跨平台本地识别后备；不内含三个平台的规则判断 |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 带时间信息的本地语音转写 | 已读官方说明，可在无 whisper-cli 时使用；不负责审核政策 |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | 本机已有、适合苹果电脑的本地语音转写 | 已核对官方说明、模型下载来源和本机命令。本技能直接调用它，避免额外部署完整网站 |

还检索到 [aureate7/sensitive-word-checker](https://github.com/aureate7/sensitive-word-checker) 和 [SexyAhri/DocCompliance](https://github.com/SexyAhri/DocCompliance)，前者偏词库，后者偏企业文档，未作为本视频技能的基础。

如果以后做批量上传、多人确认、时间轴编辑的网页系统，可以进一步评估完整视频审核工作台。当前目标是在对话中发视频就检查，因此优先保留轻量本地提取和可维护的分平台规则。
