[![中文](https://img.shields.io/badge/%E4%B8%AD%E6%96%87-e7f3ef?style=for-the-badge&labelColor=e7f3ef&color=3b8279)](README.md)
[![English](https://img.shields.io/badge/English-0d5d57?style=for-the-badge)](README.en.md)
[![Follow on X](https://img.shields.io/badge/Follow-%40ChenshuoAI-3b8279?style=for-the-badge&logo=x&logoColor=white)](https://x.com/ChenshuoAI)

🚀 **[Start with one goal](#installation)**

[![CS Skills workflow cover](assets/chenshuo-skills-cover.png)](#installation)

# CS Skills

**Agent Skills distilled from real projects**: describe a goal, choose the right workflow, execute it, and verify the result. Built for Codex and Claude Code; other agents that support `SKILL.md` can use individual Skills too.

The repository currently contains **16 task Skills**. Each can be installed separately. If you are unsure where to start, use [`cs-run`](cs-run/).

The workflow is simple: **`cs-run` selects one primary Skill; delivery steps are added only when needed.**

<img src="assets/cs-skills-pipeline.en.svg" alt="Goal and source material → cs-run → specialist Skill → verification → optional publishing" width="900">

| Skill | What it does |
| --- | --- |
| [**cs-run**](cs-run/) | Turns a rough goal into a Goal Card, reads project context, selects one primary Skill, and continues execution when requested. |
| [**cs-search-skill**](cs-search-skill/) | Researches products, companies, technology, markets, or competitors; separates facts from judgment and produces a sourced decision brief. |
| [**cs-writer**](cs-writer/) | Turns real project material into articles, product stories, tool reviews, or revisions while preserving concrete facts. |
| [**cs-xiaohuang-skill**](cs-xiaohuang-skill/) | Keeps the Xiaohuang brand character consistent across standard views, poses, 2D/3D variants, and illustrations for Chinese content; [see examples](cs-xiaohuang-skill/README.md). |
| [**cs-auto-videl**](cs-auto-videl/) | Breaks down ecommerce short videos into hooks, nine-grid storyboards, first frames, and Seedance／Flow／Veo prompt packages. |
| [**cs-chatcut**](cs-chatcut/) | Selects a filmable topic and prepares a Chinese voiceover script, assets, motion graphics, audio direction, and a shot-by-shot plan. |
| [**cs-web-promo-film**](cs-web-promo-film/) | Captures a real web page and uses Remotion moves, scrolling, and clicks to render a 30–60 second product demo MP4. |
| [**cs-knowledge-film**](cs-knowledge-film/) | Turns one concept into a night-sky style explainer with a script, scene spec, narration, bilingual subtitles, and MP4. |
| [**cs-code-video**](cs-code-video/) | Makes animated videos in code: asks five intake questions, proposes style cards and a storyboard, confirms three keyframes, then renders an MP4 frame by frame with synthesized music and optional GPT images and narration. |
| [**cs-pixel-explainer**](cs-pixel-explainer/) | Turns a Chinese script into a pixel-art explainer with coordinate-system metaphors, typewriter subtitles, edge-tts narration, and a 1080p MP4. |
| [**cs-frontend-design**](cs-frontend-design/) | Designs, builds, or reviews user-facing interfaces, including layout, interaction states, responsiveness, and browser checks. |
| [**cs-clean-code**](cs-clean-code/) | Reconciles requirements with code, documentation, business flow, and verification for a maintainable handoff. |
| [**cs-ralph-runner**](cs-ralph-runner/) | Converts a Markdown requirements document into a Ralph PRD and safely rehearses a Ralph／Codex build workflow in a local repository. |
| [**cs-checkpoint-version**](cs-checkpoint-version/) | Saves a restorable checkpoint before risky changes, including uncommitted work, and verifies the recovery point. |
| [**cs-github-push**](cs-github-push/) | Stages and pushes completed changes precisely, creates a PR when requested, and checks the remote commit SHA. |
| [**cs-ending-time**](cs-ending-time/) | Finishes web or app work that also requires deployment: verifies the change, delivers it through GitHub, and checks the live result. |

`cs-recover-skill` is a model execution calibration helper. It is not counted among the 16 task Skills and is excluded from the default install.

## Demo: improve a repository README with CS Skills

A README is the reader's entry point. This video uses an [actual CS Skills homepage redesign commit](https://github.com/ChenShuo2004/cs-skills/commit/0b27495ba82a9297eb4028ee443edb69b7a0ef31): `$cs-clean-code` checks `AGENTS.md`, the Skill directories, and the installer, then organizes the Chinese and English READMEs around positioning, workflow, Skill map, examples, and installation. It checks links and examples before `$cs-github-push` publishes the result.

[![Watch the CS Skills README optimization recording](assets/demos/readme-optimization/poster.jpg)](assets/demos/readme-optimization/demo.mp4)

**[Watch the 73-second screen recording with Fish Audio narration](assets/demos/readme-optimization/demo.mp4)** · [Narration, shot list, and reproduction notes](assets/demos/readme-optimization/VO.md)

Copy this prompt:

```text
$cs-clean-code Improve this repository's README. Check AGENTS.md, each Skill's actual behavior, and the installer first. Reorganize the page for a new reader, add real examples and copyable commands, update the English version, then validate relative links and examples.
```

## Demo: push a completed change to GitHub

[`cs-github-push`](cs-github-push/SKILL.md) handles a defined repository delivery: identify the files, run relevant checks, stage and commit precisely, check for remote changes, push, and compare local and remote commit SHAs. A local commit alone is not a remote delivery; a push alone is not a website deployment.

[![Watch the cs-github-push screen recording](assets/demos/cs-github-push-poster.jpg)](assets/demos/cs-github-push-demo.mp4)

**[Watch the 45-second screen recording (MP4)](assets/demos/cs-github-push-demo.mp4)** · [Narration and shot list](assets/demos/cs-github-push-script.md) · [Read the full Skill](cs-github-push/SKILL.md)

Example prompt for Codex or Claude Code:

```text
$cs-github-push Push the completed changes in cs-skills to GitHub. Inspect the scope, run relevant checks, commit only these files, then compare the local and remote SHAs. Report the branch, commit, and verification result.
```

Ask for a PR explicitly when you need one. Use [`cs-ending-time`](cs-ending-time/) when delivery also includes deploying a website or app. The recording shows the public repository and the commit that first added this Skill, with Chinese narration and captions.

## See a real output

For example, take a Chinese article through [`cs-writer`](cs-writer/) and then use [`cs-xiaohuang-skill`](cs-xiaohuang-skill/) to identify visual anchors, plan illustrations, and generate them:

```text
$cs-writer Turn these product development notes into an article with real details and steps readers can repeat.
$cs-xiaohuang-skill Find four ideas worth illustrating. Show me the shot list, then generate the images one by one.
```

This illustration is an existing example from the repository. See the [Xiaohuang Skill showcase](cs-xiaohuang-skill/README.md) for the character system and more examples.

<img src="cs-xiaohuang-skill/assets/examples/01-cognitive-anchor.png" alt="Xiaohuang illustration example: highlight one key action" width="680">

For a product prototype, start directly with:

```text
$cs-run Help me build a minimum viable tool for creators to manage AI workflows, and tell me how to verify it.
```

## Installation

Clone the repository and link the Skills into Codex or Claude Code:

```bash
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
./scripts/install.sh --codex
```

With no Skill names, the script installs all 16 task Skills. You can select individual Skills instead:

```bash
./scripts/install.sh --claude cs-run cs-writer  # Claude Code only
./scripts/install.sh --both cs-run               # Codex and Claude Code
./scripts/install.sh --codex --dry-run           # Preview only
./scripts/install.sh --codex --uninstall cs-run  # Remove a link to this repository
```

The script **never overwrites** existing directories or links from another source. Keep the clone at the same path; after `git pull`, start a new agent session to read the updated files. See `./scripts/install.sh --help` for all options.

To link one Skill manually:

```bash
mkdir -p "$HOME/.codex/skills"
ln -s "$PWD/cs-run" "$HOME/.codex/skills/cs-run"
```

Claude Code uses `$HOME/.claude/skills`. Installing `cs-run` alone does not install any specialist Skills.

## Requirements

| | Required? | Notes |
| --- | --- | --- |
| **Agent** | Yes | Codex, Claude Code, or another agent that reads `SKILL.md`. |
| **Git + Bash** | For cloning and the installer | The installer has been tested in a macOS Bash environment. Runtime requirements vary by Skill. |
| **Other services or renderers** | Depends on the Skill | Image, video, and deployment workflows may require additional tools or accounts; read that Skill's `SKILL.md`. |
| **GitHub write access** | Only for publishing | Required when `cs-github-push` or `cs-ending-time` pushes to a repository. |

## Repository conventions

Each Skill has its own directory and a `SKILL.md` entry point. `agents/openai.yaml` supplies Codex display metadata; detailed rules and tools stay with the Skill:

```text
cs-skills/
├── cs-run/
│   ├── SKILL.md
│   └── agents/openai.yaml
├── cs-<name>/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── references/       Detailed rules loaded when needed
│   ├── scripts/          Repeatable tools
│   ├── tests/            Checks for deterministic logic
│   └── assets/           Examples and source assets
├── scripts/              Repository installer and self-test
└── docs/                 Skill inventory and roadmap
```

When adding or changing a task Skill, keep the [`cs-run` routing](cs-run/SKILL.md), [Skill inventory](docs/skill-inventory.md), README, and installation guidance in sync. See [AGENTS.md](AGENTS.md) for maintainer rules. Test the installer without touching real Skill directories:

```bash
./scripts/test-install.sh
```

## Star history

[![CS Skills star history](https://api.star-history.com/svg?repos=ChenShuo2004/cs-skills&type=Date)](https://star-history.com/#ChenShuo2004/cs-skills&Date)

## License

[MIT](LICENSE) · [Changelog](CHANGELOG.md) · [Contributors](CONTRIBUTORS.md)
