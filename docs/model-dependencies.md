# 模型依赖与缓存复用

CS Skills 沿用宿主 Agent 的模型，没有绑定某个聊天模型或推理档位。安装 Skill 不会自动下载模型。逐技能依赖由 [模型注册表](../models/registry.json) 维护；本页说明实际运行条件。

## 哪些任务需要模型

| 技能 / 阶段 | 模型要求 | 下载方式 |
| --- | --- | --- |
| 路由、写作、调研、口播稿、制作蓝图、前端、代码整理、Ralph、版本与 Git 收尾 | 宿主 Agent 模型，以及对应搜索 / 浏览器 / CLI 工具 | 无本地模型权重要求 |
| `cs-video-download` 视频下载与归档 | Python 3.10+、curl、FFmpeg/ffprobe 和可用下载器或浏览器工具 | 不下载模型；只下载本次指定的视频 |
| `cs-codex-image` 内置生图与 Claude 接入 | 支持内置图片生成的 Codex CLI 与 ChatGPT 登录，MCP 需 Node 22+ / npm | 使用已有订阅额度，无 API Key，不下载权重 |
| `cs-xiaohuang-skill` 图片生成与编辑 | 可用的图像工具，不固定型号；角色参考随技能提供 | 按宿主工具使用 |
| `cs-auto-videl` 图像 / 视频生成 | 任务选择的图像工具或 Seedance / Gemini Omni / Google Flow；Ark 脚本的默认型号见源码 | 云端 / 网页服务，不下载权重；模型可用性以账号为准 |
| `cs-narration-phrase-timeline` 音频对齐 | 优先复用目标项目对齐器；选择 WhisperX 时可用下面的中文模型组合 | 显式选择后下载至 HF 缓存 |
| `cs-code-story-video` 渲染 | Remotion / FFmpeg 不需要生成模型；需词级对齐时复用上行组合 | 不为渲染下载模型 |
| `cs-digital-human-product-video-pipeline` 数字人 / TTS | 已配置的 ComfyUI 工作流与对应 checkpoint、本地 Fish/TTS 或原声 | 读取实际配置再确定型号；本库没有统一 checkpoint |

ComfyUI 与 Fish/TTS 是运行工具 / 后端名称，不能据此推断需要哪一份权重。预检时读取 workflow JSON 的模型加载节点，核对模型路径、文件与版本；云端 TTS 则核对服务配置。模型尚未确定时报告配置缺口，不下载一套猜测的模型。

## 可选中文 WhisperX 组合

下面是可复现的参考组合，适用于已选择 WhisperX / faster-whisper 的项目；不是全部 Skill 的必装项。

| ID | 用途 | 官方仓库 | 本清单文件大小合计 |
| --- | --- | --- | --- |
| `whisper-large-v3` | 语音识别（CTranslate2 转换版） | [Systran/faster-whisper-large-v3](https://huggingface.co/Systran/faster-whisper-large-v3) | 约 3.09 GB |
| `wav2vec2-zh` | 中文词级强制对齐 | [jonatasgrosman/wav2vec2-large-xlsr-53-chinese-zh-cn](https://huggingface.co/jonatasgrosman/wav2vec2-large-xlsr-53-chinese-zh-cn) | 约 1.28 GB |

模型仓库、commit、所需文件、大小和上游哈希于 **2026-10-06** 核对并锁定在注册表中。中文对齐型号来自 [WhisperX 上游实现](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py)，识别模型来源见 [faster-whisper](https://github.com/SYSTRAN/faster-whisper)。权重、许可证及使用条件以各模型仓库为准，权重不会随本仓库再分发。

这里只准备 ASR / 中文对齐文件。WhisperX 的 VAD、NLTK 数据、Python 包、PyTorch、CUDA 和目标项目的短语构建器仍需按实际版本检查；缓存校验通过不代表推理或完整流水线已经可用。

## 先检查，再下载

在仓库根目录运行，`python` 应是目标项目可用的 Python 3.12+ 解释器；Windows 上有多个 Python 时可以直接使用其完整路径。`list` 和 `check` 只用标准库，不安装包、不联网、不写缓存。

```powershell
# 查看逐技能需求和固定模型版本
python scripts/models.py list

# 离线检查参考组合：文件齐全 + 大小 + 全文件哈希
python scripts/models.py check --profile whisperx-zh

# 已经有独立模型目录时，检查并复用它（一次只能指定一个模型）
python scripts/models.py check --model whisper-large-v3 --model-dir ./my-whisper-model
```

确实选择该后端且有缺失文件时：

```powershell
python -m pip install -r models/requirements.txt
python scripts/models.py download --profile whisperx-zh

# 也可只准备中文对齐模型
python scripts/models.py download --model wav2vec2-zh
```

下载命令会再次检查：完整且哈希正确时输出 `action: reused`，不调用下载接口；仅缺失时只请求缺失文件；发现截断、占位或同大小损坏文件时停止，核对后才使用 `--repair` 单独重下这些文件。下载中断保留 HF 缓存，重跑时复用已完成文件；同一缓存内同一模型采用进程锁，锁持有期间第二个进程立即提示，不重复发起下载。

```powershell
python scripts/models.py download --model wav2vec2-zh --repair
```

不提供默认“全下载”：必须指定 `--model`、`--profile` 或显式 `--all`。`check` 完整时退出码为 `0`，缺失或校验失败为 `1`，配置 / 下载错误为 `2`，便于在生产前预检。下载后也会校验，失败不会标为完成。

## 缓存路径与运行时复用

优先级为 `--cache-dir` → `HF_HUB_CACHE`（兼容 `HUGGINGFACE_HUB_CACHE`）→ `HF_HOME/hub` → 系统默认 `~/.cache/huggingface/hub`（设置 `XDG_CACHE_HOME` 时跟随它）。沿用 [Hugging Face 标准缓存](https://huggingface.co/docs/huggingface_hub/en/guides/manage-cache)，不复制一份到每个 Skill。非标准目录使用 `--cache-dir` 或单模型 `--model-dir` 指定。

检查结果会返回固定 commit 的实际 snapshot 路径。把这个路径传给目标项目的模型加载器，或让目标项目使用同一个 HF 缓存及固定 revision；独立目录需明确配置给加载器。只运行下载脚本不会自动修改目标项目。若运行时仍使用另一个缓存或最新分支，可能再次下载。

注册表每个文件都固定大小和哈希：大权重使用上游 LFS SHA-256，小配置使用 Git blob SHA-1。每次检查读取全部文件，耗时与磁盘吞吐相关。已有缓存是其他版本时不会静默当作当前版本，也不自动复制、转换或删除旧缓存。运行时要求 safetensors 或其他后端时，应为对应格式另建固定清单；本组合的中文对齐权重为 PyTorch bin。

升级模型时需显式更新 commit、文件和上游哈希，并复跑回归；新增 Skill 需同步其依赖记录。`tests/test_models.py` 检查缓存复用、损坏、断点恢复、并发和清单覆盖，已接入统一回归。模型文件、密钥和用户声音保存在本地，GitHub 只发布清单、检测脚本和说明。
