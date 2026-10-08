# 统一证据包入口

在已安装的技能目录执行，或将命令中的 `scripts/prepare_review.py` 换成技能脚本的实际路径。输出必须是新/空目录，不覆盖上次证据。平台 ID：`xiaohongshu`、`douyin`、`bilibili`、`wechat_channels`；场景：`post`、`advertising`、`boost`、`commerce`、`course`、`live`。

```sh
# 稿件模式：UTF-8 文本，不需要媒体工具，不编造时码
python3 scripts/prepare_review.py --text ./draft.txt --platforms xiaohongshu douyin --out ./review-draft

# 只读预检：不创建输出、不执行识别、不下载模型
python3 scripts/prepare_review.py --video ./final.mp4 --out ./review-final --check

# 成片：显式复用已有 whisper.cpp 多语言 ggml 模型
python3 scripts/prepare_review.py --video ./final.mp4 --model ./ggml-small.bin --language zh --subtitle ./final.srt --out ./review-final

# 其他系统或已有本地识别结果：导入上游 evidence.json 列表
python3 scripts/prepare_review.py --evidence ./existing/evidence.json --platforms bilibili --out ./review-import

# 历史拒审/加热：显式选日期和场景；今天重发另建目录
python3 scripts/prepare_review.py --text ./draft.txt --scene boost --as-of 2026-09-07 --out ./review-historical
```

无 `--as-of` 时使用执行环境当前日期；助手应按用户所在日期显式传值，避免宿主时区差异。标题、简介和标签可在文本中用标签分段，助手保留这些标签的上下文。封面按原图检查，文本包不能代替图像识别。

视频缺少 whisper-cli/模型或 macOS OCR 能力时，上游提取器可保留部分证据；必须查 `extraction/manifest.json` 的失败和 coverage。`--check` 通过仅说明可准备证据，工具存在不证明模型、识别或视频解码成功。原片及所有输出仅保留本地。

输出 `review-context.json`、`evidence.json`、`candidates.json`、`review-pack.json`、`review-template.md`；视频另带原始 `extraction/`。包状态始终是 `prepared_requires_review`，不自动生成平台结论。助手读取全文、复核官方来源、回看原片后，另写 `review.md` 和按需 `edit-plan.json`，格式见 [交付合同](delivery.md)。

严格逐帧文字检查用 `--fps 0`，可能耗时较长。个人配置用 `--profile ./custom-profile.json`；仅用户明确选择才使用上游严格配置。中文模型不要使用 `.en`；CTranslate2/WhisperX 的 `model.bin` 不能当作 whisper.cpp ggml 模型传入。脚本不下载或转换模型。

新包只需标准库。框架回归依赖按 `requirements-dev.txt` 安装到独立 Python 环境，再执行：

```sh
python3 scripts/validate_framework.py
python3 scripts/test_candidates.py
python3 scripts/test_framework.py
python3 scripts/test_resource_paths.py
python3 -m unittest discover -s tests -v
```

这些检查验证软件行为与数据一致性，不是平台实际审核准确率测评。
