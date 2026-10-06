# CS Skills

**把想法推进到作品，把真实工作方法交给 AI。**

CS Skills 是陈硕（KAI）在产品开发、内容创作与视频制作中沉淀的 AI Agent 工作流集合。你提供目标和素材，Agent 按需选择能力，交付代码、文章、视觉资产或视频，并说明实际验证到了哪一步。

[快速开始](#快速开始) · [模型与下载](#模型与下载) · [技能清单](#技能清单) · [调用示例](#调用示例) · [环境与边界](#环境与边界) · [参与贡献](#参与贡献)

```text
说清目标 → $cs-run 选择路径 → 对应 Skill 执行 → 产物与验证结果
```

适合用 AI 做产品的独立开发者、同时处理代码与内容的创业者，以及希望把个人经验沉淀成可复用工作流的创作者。明确的单领域任务可以直接调用具体 Skill；跨领域任务由 `$cs-run` 串联，普通小任务直接执行，需要澄清时再补充计划。

## 快速开始

### 1. 安装需要的技能

在支持 Skill 安装的 Codex 会话中，复制下面的请求：

```text
帮我从 https://github.com/ChenShuo2004/cs-skills 的 codex/model-dependencies 分支安装 cs-run、cs-writer、cs-search-skill、cs-frontend-design 和 cs-clean-code。先检查仓库可用目录，保留本地已有的同名技能，遇到冲突先说明。
```

这组入口覆盖任务路由、写作、调研、页面开发和代码整理。需要视频或视觉能力时，从下方清单选择对应目录继续安装；也可以只安装一个：

```text
帮我安装这个 Skill：https://github.com/ChenShuo2004/cs-skills/tree/codex/model-dependencies/cs-xiaohuang-skill
```

`cs-run` 负责选择工作流，**不会自动安装下游技能或外部工具**。安装后在新会话中检查技能是否可用；Codex 中总入口的显示名为 `cs-skills`，调用名为 `$cs-run`。

手动安装时，先检查同名目录：文件内容一致则跳过，更新时备份本地定制再同步。将所选技能的完整目录放入 Codex 的技能目录（通常为 `~/.codex/skills/`），保留 `SKILL.md`、`agents/` 和附带资源。使用本地新增能力时，从对应工作树安装；远端可安装范围以所选分支的实际文件为准。

### 2. 给出目标、素材和验收条件

```text
$cs-run 这是我的产品想法和现有仓库。请先做出一个能本地使用的最小版本，完成核心流程，并用浏览器检查结果。
```

已经知道要什么时，直接调用：

```text
$cs-writer 把下面的真实项目记录写成一篇公众号文章，保留失败、过程和结果，不补造数据。
```

已有素材、工作目录、目标平台和完成标准越清楚，越容易直接进入执行。只要计划、文本或样片时，在请求里说明交付范围。

## 模型与下载

**大多数技能无需下载本地模型。** 写作、调研、代码与文本蓝图沿用宿主 Agent 模型；图像与视频生成按已配置的工具或服务执行，没有统一的聊天模型型号要求。

| 使用场景 | 模型需求 |
| --- | --- |
| 写作、前端、调研、口播稿、分镜、Git 收尾 | 无本地模型权重要求 |
| 小黄配图、电商图像与视频 | 宿主图像工具或任务选择的云端服务，不固定本地权重 |
| 中文音频对齐，已选择 WhisperX 后端 | 可选 `whisper-large-v3` + `wav2vec2-zh`，约 4.37 GB |
| Remotion 代码视频渲染 | 渲染不需要模型；词级对齐按需复用上行模型 |
| 数字人 / 本地 TTS | 从实际 ComfyUI / Fish 配置确定，未配置时报告缺口 |

逐技能依赖、固定版本、官方文件大小与哈希见 [模型注册表](models/registry.json)，完整操作见 [模型依赖说明](docs/model-dependencies.md)。GitHub 保存清单和脚本，权重使用本地共用缓存。

在本分支的完整仓库根目录运行（Python 3.12+）：

```powershell
python scripts/models.py list
python scripts/models.py check --profile whisperx-zh

# 选择 WhisperX 且确有缺失时才执行
python -m pip install -r models/requirements.txt
python scripts/models.py download --profile whisperx-zh
```

`check` 只读且不联网，验证固定版本的文件大小和完整哈希。`download` 先复查缓存，完整时输出 `reused`，只补缺失文件；损坏文件需显式 `--repair`，并发下载采用进程锁，中断后可继续复用已完成文件。已有自定义模型目录用 `--model-dir` 指定；加载器需使用相同缓存或检测返回的路径。ASR / 对齐模型齐全仍需检查 VAD、Python/GPU 和目标项目实现。

只下载某个 Skill 目录时不包含根目录的模型管理脚本；需要它时可保留一份完整仓库，共享使用，不为每个 Skill 克隆一份。

## 技能清单

本分支收录 **15 个技能**，名称与 [注册表](tests/fixtures/skill-registry.json) 对齐。点击名称查看完整工作流。

### 总入口

| Skill | 什么时候用 | 交付什么 |
| --- | --- | --- |
| [$cs-run](cs-run/SKILL.md) | 不确定选哪个技能，或需要跨领域完成任务 | 推荐路径、按需目标卡、各阶段产物与验证结果 |

### 产品与工程

| Skill | 什么时候用 | 交付什么 |
| --- | --- | --- |
| [$cs-frontend-design](cs-frontend-design/SKILL.md) | 设计、实现或评审页面、工具与仪表盘 | 页面实现、交互与浏览器检查 |
| [$cs-clean-code](cs-clean-code/SKILL.md) | 整理代码、定位实现问题、同步文档 | 范围明确的修改、必要测试与交付说明 |
| [$cs-ralph-runner](cs-ralph-runner/SKILL.md) | 将 Markdown 需求转成 Ralph 计划或构建任务 | PRD、overview、构建结果与运行日志 |
| [$cs-checkpoint-version](cs-checkpoint-version/SKILL.md) | 大改前保存版本，或恢复已有检查点 | 可恢复的本地 checkpoint 与核对结果 |
| [$cs-ending-time](cs-ending-time/SKILL.md) | 已完成实现，需要验证、提交或发布收尾 | 验证报告，以及已授权的 Git / 部署结果 |

### 写作、调研与视觉

| Skill | 什么时候用 | 交付什么 |
| --- | --- | --- |
| [$cs-writer](cs-writer/SKILL.md) | 写 X 短帖、长文、项目复盘，或修改已有稿件 | 成稿、提纲、改写或审稿意见 |
| [$cs-search-skill](cs-search-skill/SKILL.md) | 调研产品、公司、技术、市场与竞品 | 有来源的比较、风险和决策建议 |
| [$cs-xiaohuang-skill](cs-xiaohuang-skill/SKILL.md) | 延展小黄 / 有温度 IP，或为中文文章配图 | 2D/3D 角色资产、联名、风格迁移与手绘正文配图 |

小黄的角色参考、示例和调用方式见 [小黄 IP 与正文配图介绍](cs-xiaohuang-skill/README.md)。

### 口播与视频

| Skill | 什么时候用 | 交付什么 |
| --- | --- | --- |
| [$cs-personal-ip-script](cs-personal-ip-script/SKILL.md) | 将真实项目、经历或现场观察写成个人 IP 口播 | 60–90 秒可录稿、独立演绎标注与事实待确认项 |
| [$cs-chatcut-video-blueprint](cs-chatcut-video-blueprint/SKILL.md) | 筛选选题、写剧本，或给已有稿件补分镜和提示词 | 中文剧本、逐镜分镜、逐图提示词与素材清单 |
| [$cs-code-story-video](cs-code-story-video/SKILL.md) | 用代码制作角色讲述与全屏事件场景组成的叙事视频 | Remotion 工程、16:9 样片与成片、3:4 / 4:3 封面与 QA |
| [$cs-digital-human-product-video-pipeline](cs-digital-human-product-video-pipeline/SKILL.md) | 将已确认产品包做成数字人产品介绍视频 | 环境预检、可审批样片、剪辑与包装工程、成片 QA |
| [$cs-narration-phrase-timeline](cs-narration-phrase-timeline/SKILL.md) | 将最终口播音频与实际朗读稿对齐 | 词级边界、`phrase-timeline.json` 与覆盖率报告 |
| [$cs-auto-videl](cs-auto-videl/SKILL.md) | 复刻电商短视频，制作九宫格分镜或平台生成包 | 分镜图、首帧图、Seedance / Gemini Omni / Flow 提示词与按需生成结果 |

选题、口播和制作蓝图可以先交付文本；精确音频对齐与叙事视频渲染需要最终录音。数字人产品视频先交样片，经用户确认后进入批量或全片生产。

## 调用示例

### 产品：实现 → 检查 → 交付

```text
$cs-run 基于这个仓库做一个客户反馈页面，包含提交、列表和状态筛选。完成后检查桌面和手机上的核心流程，交付本地可用版本。
```

按需要串联 `$cs-frontend-design` 与 `$cs-clean-code`。需要提交、推送或部署时，在请求里明确动作和目标，由 `$cs-ending-time` 完成交付。

### 内容：调研 → 文章 → 视觉

```text
$cs-run 基于我的项目记录，调研其中涉及的技术方案，再写成一篇适合 X Article 的文章。区分实测与外部资料；文章完成后，给出小黄正文配图规划，暂时只交文本。
```

调研由 `$cs-search-skill` 完成，写作由 `$cs-writer` 接续，视觉部分使用 `$cs-xiaohuang-skill`。指定只做规划时，交付构图与提示词。

### 视频：真实经历 → 口播 → 分镜

```text
$cs-run 用我提供的真实项目素材写一条 60–90 秒个人 IP 口播，并附逐镜分镜、每张图可直接复制的图片提示词和必要的动作提示词。台词与制作说明分开；还没有录音，先交文本包。
```

`$cs-personal-ip-script` 成稿后，由 `$cs-chatcut-video-blueprint` 补齐制作文本。已有稿件可以直接调用后者。交付结构见 [文本包模板](cs-chatcut-video-blueprint/assets/self-media-package.md)。

### 成片：最终音频 → 场景工程 → 样片与完整版

```text
$cs-code-story-video 这里是最终口播音频、实际朗读稿和角色图。请制作 16:9 叙事视频，用独立全屏场景演出关键事件，交付两章样片、完整版、可编辑工程和双比例封面。
```

有准确录音后建立真实时间轴，再制作与检查样片。只有主题时先完成口播和场景方案；若要求“样片确认后继续”，就在该节点等待。

### 数字人产品视频：确认产品包 → 样片审批 → 生产

```text
$cs-digital-human-product-video-pipeline 这是确认后的 product-pack.json。请预检制作环境，先生成一条样片；我确认后再进入 batch。
```

用产品事实和证据素材限定内容，ChatCut 负责剪辑，Remotion 负责包装；交付时检查时间线、关键帧、音频与编码规格。

## 环境与边界

每个技能以 `SKILL.md` 为入口，详细规则与脚本按当前阶段读取。其他支持读取 `SKILL.md` 的 Agent 可以复用工作流，但发现方式、工具接口与权限需要按宿主适配；Codex 的显示配置在 `agents/openai.yaml` 中。

| 任务 | 所需能力或输入 |
| --- | --- |
| 写作、选题与分镜文本 | 原始素材和可读取的技能文件；文本蓝图可独立于 ChatCut 交付 |
| 有来源的调研 | 搜索与网页读取能力；不可访问的来源需说明 |
| 页面开发与体验检查 | 项目运行环境及浏览器工具 |
| 封面、角色与正文配图 | 图像生成 / 编辑工具、随技能提供的角色参考与所需字体 |
| 代码叙事视频 | Node.js、Remotion、FFmpeg / FFprobe、最终音频与角色素材 |
| 数字人产品视频 | 已确认产品包，以及对应的 ChatCut、FFmpeg、ComfyUI、Fish / TTS、Remotion 配置 |
| 真实音频对齐 | 最终录音、实际朗读稿与可用的词级对齐工具 |
| Ralph 构建与远端交付 | 可用 CLI、仓库环境，以及对应动作的授权 |

安装 Skill 不代表以上工具已经就绪。执行时先核对真实环境，缺配置就说明具体缺口，不把提示词、蓝图或静态检查当作已经生成的媒体或生产结果。

工作流遵循几条共同约定：

- 以真实素材和产品事实为依据，写作与视觉不补造经历、数据或产品证据。
- 源素材保持只读，产出可检查的派生文件；修改已有工程时保留无关内容。
- 沿用会话已有授权；“优化”“写稿”“做计划”本身不包含推送、发布或部署。
- 精确时间轴来自最终音频；静态检查、脚本回归、实际运行与人工审阅分别报告。

本库没有任意素材的通用自动剪辑、理想车主信息图或 Open Design 专用入口；电商视频、代码叙事与数字人产品视频各有明确范围。

## 参与贡献

欢迎把经过真实任务验证的方法沉淀进来。新增技能前，先判断能否扩展现有入口；独立能力需要写清触发场景、输入、产物、边界与完成标准。

```text
cs-skills/
├── cs-run/                  # 总入口与路由
├── cs-*/                    # 各领域技能
│   ├── SKILL.md             # 触发条件与核心工作流
│   ├── agents/openai.yaml   # Codex 显示与默认调用文案
│   ├── references/          # 按需读取的详细规则（可选）
│   ├── assets/              # 参考与模板（可选）
│   ├── scripts/             # 可重复执行的脚本（可选）
│   └── tests/               # 必要的回归测试（可选）
├── docs/                    # 清单、维护计划与验收记录
├── models/                  # 模型依赖、版本、官方大小与哈希
├── scripts/                 # 全库校验与模型检查 / 下载入口
└── tests/fixtures/          # 注册表、路由案例与契约
```

新增或调整入口时，同步更新 `cs-run` 路由、README、[技能清单](docs/skill-inventory.md)、[仓库计划](docs/repository-plan.md)、注册表和相关路由案例。提交或发布前在仓库根目录运行：

```powershell
node scripts/validate-skills.mjs
node scripts/run-regression.mjs
```

回归脚本需要可用的 Python；需要指定解释器时，设置 `CS_SKILLS_PYTHON` 后运行。静态校验检查结构、资源引用、路由与契约，回归脚本检查可执行逻辑；它们不等同于模型在新会话中的实际表现。发布候选还需完成 [新会话人工验收](docs/evals/README.md)。[GitHub Actions](.github/workflows/skill-quality.yml) 在 PR、`main` 推送和手动触发时执行统一检查。

当前 v0.6 的工作方式与验收记录见 [优化记录](docs/evals/v0.6.0.md)：小任务直接执行，复杂任务按阶段加载资料，用户明确设置的确认点持续有效。

## 作者与许可

由陈硕（KAI）与伙伴共同维护，贡献与署名见 [贡献者说明](CONTRIBUTORS.md)。

[更新日志](CHANGELOG.md) · [陈硕 KAI](https://everlightai.top) · [MIT License](LICENSE)
