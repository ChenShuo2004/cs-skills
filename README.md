[![中文](https://img.shields.io/badge/%E4%B8%AD%E6%96%87-0d5d57?style=for-the-badge)](README.md)
[![English](https://img.shields.io/badge/English-e7f3ef?style=for-the-badge&labelColor=e7f3ef&color=3b8279)](README.en.md)
[![关注作者 X](https://img.shields.io/badge/%E5%85%B3%E6%B3%A8%E4%BD%9C%E8%80%85-%40ChenshuoAI-3b8279?style=for-the-badge&logo=x&logoColor=white)](https://x.com/ChenshuoAI)

# CS Skills

**把真实项目中反复使用的方法，做成可安装、可执行、可验收的 Agent 工作流。** 面向 Codex 和 Claude Code；其他支持 `SKILL.md` 的 Agent 也可以按需使用。

<img src="assets/chenshuo-skills-cover.png" alt="CS Skills：从输入与创作到检查交付的工作流" width="900">

现有 **16 个任务 Skill**。知道要做什么但不知道选哪个，就从 [`cs-run`](cs-run/) 开始；它会整理目标并路由到一个主 Skill。每个 Skill 都能单独安装。

[立即开始](#立即开始) · [按目标选择](#按目标选择) · [真实演示](#真实演示) · [安装与维护](#安装与维护)

## 立即开始

```bash
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
./scripts/install.sh --codex   # Claude Code 改用 --claude；两者都用 --both
```

打开新的 Agent 会话，直接说目标：

```text
$cs-run 帮我把这次项目经历写成一篇有真实细节、可复制步骤的文章。
```

已有明确任务，也可以直接调用对应 Skill。例如，制作来源可核查的知识短片：

```text
$cs-code-video 用 Vibe 知识模式，把「为什么天空是蓝的」做成科普视频。先查证来源、做三张风格样图和前 10 秒样片，再制作整片。
```

这套视频流程已并入 [`cs-code-video` 的 Vibe 模式](cs-code-video/references/vibe-knowledge.md)，无需安装另一个同名知识视频 Skill。

## 按目标选择

<img src="assets/cs-skills-pipeline.svg" alt="目标与素材 → cs-run → 专项执行 → 验证结果 → 按需发布" width="900">

`cs-run` 只选择一个主 Skill；需要提交、推送或部署时，再追加交付步骤。

| 目标 | Skill | 主要交付物 |
| --- | --- | --- |
| 不知道从哪里开始 | [`cs-run`](cs-run/) | Goal Card、合适的主 Skill 与执行结果 |
| 写文章、提纲、项目故事 | [`cs-writer`](cs-writer/) | 有事实细节的内容草稿或改稿 |
| 调研产品、技术、市场或竞品 | [`cs-search-skill`](cs-search-skill/) | 带来源的决策简报 |
| 延展“小黄”角色或为文章配图 | [`cs-xiaohuang-skill`](cs-xiaohuang-skill/) | 角色资产、配图 shot list 与插画 |
| 策划一条 ChatCut 视频 | [`cs-chatcut`](cs-chatcut/) | 选题、口播、素材和逐镜头蓝图 |
| 做电商视频对标和生成包 | [`cs-auto-videl`](cs-auto-videl/) | Hook、九宫格、首帧及视频模型提示词 |
| 把真实网页拍成产品演示片 | [`cs-web-promo-film`](cs-web-promo-film/) | Remotion 工程与 MP4 |
| 做代码动画或 Vibe 知识科普片 | [`cs-code-video`](cs-code-video/) | 分镜、样片、可重渲工程与 MP4；Vibe 模式附来源表 |
| 做固定暗夜星空系列解说片 | [`cs-knowledge-film`](cs-knowledge-film/) | 场景 spec、配音、双语字幕与 MP4 |
| 做固定像素风解说系列 | [`cs-pixel-explainer`](cs-pixel-explainer/) | 像素动画、配音、SRT 与 MP4 |
| 设计或实现产品界面 | [`cs-frontend-design`](cs-frontend-design/) | 可用界面与浏览器检查 |
| 清理代码、核对文档与实现 | [`cs-clean-code`](cs-clean-code/) | 小范围修订与验证记录 |
| 把 Markdown 需求转成 Ralph 工作流 | [`cs-ralph-runner`](cs-ralph-runner/) | Ralph PRD 与安全预演 |
| 大改前保存回退点 | [`cs-checkpoint-version`](cs-checkpoint-version/) | 可恢复的本地 checkpoint |
| 提交、推送或开 PR | [`cs-github-push`](cs-github-push/) | 精确提交与远端 SHA 核验 |
| 完成 Web／App 部署收尾 | [`cs-ending-time`](cs-ending-time/) | 验证、GitHub 交付与上线检查 |

视频 Skill 按**素材和成片方式**选：真实网页用 `cs-web-promo-film`；电商对标与视频模型提示词用 `cs-auto-videl`；ChatCut 策划用 `cs-chatcut`；代码生成画面用 `cs-code-video`。暗夜星空与像素解说是各自固定系列。详细边界见 [技能清单](docs/skill-inventory.md)。`cs-recover-skill` 是执行校准辅助项，不计入 16 个任务 Skill，也不参与默认安装。

## 真实演示

### 优化 README

[这次首页改版的原始案例](https://github.com/ChenShuo2004/cs-skills/commit/0b27495ba82a9297eb4028ee443edb69b7a0ef31)展示了如何核对 `AGENTS.md`、Skill 目录和安装脚本，再整理中英文入口并检查链接。

<a href="assets/demos/readme-optimization/demo-v2.mp4"><img src="assets/demos/readme-optimization/poster.jpg" alt="观看 CS Skills README 优化代码动画教程" width="680"></a>

[观看 73 秒教程](assets/demos/readme-optimization/demo-v2.mp4) · [口播、分镜和复现说明](assets/demos/readme-optimization/VO.md)

### 推送到 GitHub

[`cs-github-push`](cs-github-push/)会核对范围、精确提交并比对远端 SHA。本地 commit、远端推送与网站上线是三个不同状态。

<a href="assets/demos/cs-github-push-demo.mp4"><img src="assets/demos/cs-github-push-poster.jpg" alt="观看 cs-github-push 录屏讲解" width="680"></a>

[观看 45 秒录屏](assets/demos/cs-github-push-demo.mp4) · [口播与分镜](assets/demos/cs-github-push-script.md)

更多实际视觉产物见 [小黄 Skill 展示页](cs-xiaohuang-skill/README.md)。

## 安装与维护

不指定名称时，安装全部 16 个任务 Skill；也可以只装需要的：

```bash
./scripts/install.sh --claude cs-run cs-code-video  # 只装到 Claude Code
./scripts/install.sh --both cs-run                    # 同时装到 Codex 和 Claude Code
./scripts/install.sh --codex --dry-run                # 预览，不修改文件
./scripts/install.sh --codex --uninstall cs-run       # 移除指向本仓库的链接
```

脚本不会覆盖已有目录或其他来源的链接。软链接依赖克隆目录的位置；保留该目录，日后 `git pull` 后重开 Agent 会话即可读取更新。只安装 `cs-run` 不会自动安装下游 Skill。目标目录分别是 `$HOME/.codex/skills` 和 `$HOME/.claude/skills`；全部参数见 `./scripts/install.sh --help`。

Agent 是使用 Skill 的基本条件。克隆与安装需要 Git 和 Bash；视频、图像及部署 Skill 的额外依赖写在各自的 `SKILL.md`，GitHub 推送还需要目标仓库写权限。

每个 Skill 以 `SKILL.md` 为入口，Codex 展示信息放在 `agents/openai.yaml`，详细规则和工具按需放入 `references/`、`scripts/`、`assets/`。调整任务 Skill 时同步 [`cs-run` 路由](cs-run/SKILL.md)、[技能清单](docs/skill-inventory.md)和中英文 README；协作规则见 [AGENTS.md](AGENTS.md)。安装脚本可用 `./scripts/test-install.sh` 在临时目录自测。

[MIT 许可](LICENSE) · [更新日志](CHANGELOG.md) · [贡献者](CONTRIBUTORS.md) · [Star 趋势](https://star-history.com/#ChenShuo2004/cs-skills&Date)
