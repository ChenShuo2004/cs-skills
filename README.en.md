# CS Skills

Reusable Agent workflows from real product, content and video projects by Chen Shuo (KAI). Give the Agent your goal, source material and acceptance criteria; receive artifacts with an honest account of what was verified.

**main: 25 task skills and 1 optional execution helper. Latest packaged release: v0.7.0 with 22 task skills.** Supports Codex; other Agents that read SKILL.md can reuse the workflows with their own tools.

[中文](README.md) · [Download v0.7.0](https://github.com/ChenShuo2004/cs-skills/releases/tag/v0.7.0)

## Install or update

Node.js 22+, on Windows, macOS or Linux:

```sh
git clone https://github.com/ChenShuo2004/cs-skills.git
cd cs-skills
node scripts/install-skills.mjs
```

For an existing clone, run `git pull --ff-only`, then:

```sh
node scripts/install-skills.mjs --update
node scripts/install-skills.mjs --check
```

Identical content is skipped. Changed directories are backed up before replacement; installed files are verified with SHA-256. No models or runtime packages are downloaded. Backups remain in `.cs-skills-backups/` under the destination.

Choose a subset or a different host:

```sh
node scripts/install-skills.mjs --update cs-run cs-writer
node scripts/install-skills.mjs --target "$HOME/.claude/skills" --update
node scripts/install-skills.mjs --dry-run
```

The Bash symlink installer remains available: `./scripts/install.sh --codex`, `--claude`, or `--both`. It preserves existing directories and foreign links. Keep the source clone for linked installs.

On Windows, native symlinks require appropriate permissions. If unavailable, use the Node installer; Bash will fail explicitly rather than silently copy directories.

Open a new Agent session after installation and confirm the skills are listed. File consistency alone does not prove session discovery.

## Choose a workflow

Use `$cs-run` for unclear or multi-stage goals, or invoke a specific skill directly.

| Skill | Purpose |
| --- | --- |
| [cs-run](cs-run/SKILL.md) | Task routing |
| [cs-writer](cs-writer/SKILL.md) | Chinese writing and revision |
| [cs-search-skill](cs-search-skill/SKILL.md) | Source-backed research |
| [cs-guoshen](cs-guoshen/SKILL.md) | Pre-publication draft/video risk review, evidence locators and minimal edits |
| [cs-video-download](cs-video-download/SKILL.md) | Download and verify videos in ~/Downloads/Videdown, with source records |
| [cs-codex-image](cs-codex-image/SKILL.md) | Codex built-in image generation/editing and a local Claude MCP bridge |
| [cs-kai-cover](cs-kai-cover/SKILL.md) | KAI article covers |
| [cs-xiaohuang-skill](cs-xiaohuang-skill/SKILL.md) | Xiaohuang IP and article illustrations |
| [cs-personal-ip-script](cs-personal-ip-script/SKILL.md) | Personal project narration |
| [cs-chatcut-video-blueprint](cs-chatcut-video-blueprint/SKILL.md) | Scripts, storyboards and image prompts |
| [cs-chatcut](cs-chatcut/SKILL.md) | ChatCut onboarding and planning |
| [cs-auto-videl](cs-auto-videl/SKILL.md) | Ecommerce reference and generation packages |
| [cs-code-story-video](cs-code-story-video/SKILL.md) | Narration-driven Remotion story videos |
| [cs-code-video](cs-code-video/SKILL.md) | Code animation and Vibe science videos |
| [cs-web-promo-film](cs-web-promo-film/SKILL.md) | Real webpage product demos |
| [cs-knowledge-film](cs-knowledge-film/SKILL.md) | Fixed night-sky explainer series |
| [cs-pixel-explainer](cs-pixel-explainer/SKILL.md) | Fixed pixel explainer series |
| [cs-digital-human-product-video-pipeline](cs-digital-human-product-video-pipeline/SKILL.md) | Digital-human product videos |
| [cs-narration-phrase-timeline](cs-narration-phrase-timeline/SKILL.md) | Real-audio phrase alignment |
| [cs-frontend-design](cs-frontend-design/SKILL.md) | Frontend design and implementation |
| [cs-clean-code](cs-clean-code/SKILL.md) | Code and documentation cleanup |
| [cs-ralph-runner](cs-ralph-runner/SKILL.md) | Ralph PRD execution |
| [cs-checkpoint-version](cs-checkpoint-version/SKILL.md) | Recoverable checkpoints |
| [cs-github-push](cs-github-push/SKILL.md) | Scoped GitHub delivery |
| [cs-ending-time](cs-ending-time/SKILL.md) | Validation and release or app deployment |

[cs-recover-skill](cs-recover-skill/SKILL.md) is an execution helper, included in the archive and installed only when explicitly named.

## Models and verification

Most skills use the host Agent model without a fixed model name. Images and video services follow actual project configuration. Optional WhisperX Chinese alignment can use the pinned ASR and alignment files in [models/registry.json](models/registry.json).

```sh
python scripts/models.py check --profile whisperx-zh
# Only when this backend is selected and files are missing:
python -m pip install -r models/requirements.txt
python scripts/models.py download --profile whisperx-zh
```

Checks are read-only and offline. Valid caches are reused; only missing files are requested. Damaged files require explicit `--repair`. Model weights stay local. See [dependency notes](docs/model-dependencies.md).

```sh
python -m pip install -r cs-guoshen/requirements-dev.txt
node scripts/run-regression.mjs
python scripts/package-release.py
```

The regression runner needs Python 3.12+ and PowerShell. Use CS_SKILLS_PYTHON to select the interpreter. Archive files have a per-file hash manifest and a separate package checksum. Structural, script and file checks do not prove fresh-session model behavior or final media quality.

[License](LICENSE) · [Changelog](CHANGELOG.md) · [Contributors](CONTRIBUTORS.md)

## Codex built-in images in Claude

The new Skill is on main and is not included in the existing v0.7.0 release archive.

```bash
node scripts/install-skills.mjs --target "$HOME/.claude/skills" --update cs-codex-image
node cs-codex-image/scripts/install.mjs --target both
node cs-codex-image/scripts/install.mjs --target both --check
```

Use `$cs-codex-image` in a new Claude session. The bridge uses the existing ChatGPT/Codex login, without an API key. Desktop configuration currently supports macOS. Installation, MCP connectivity, actual generation and Claude model invocation are separate checks. See [setup and recovery](cs-codex-image/references/setup.md).

## Star History

[![CS Skills Star History](https://api.star-history.com/svg?repos=ChenShuo2004/cs-skills&type=Date)](https://star-history.com/#ChenShuo2004/cs-skills&Date)

## Publication risk review

`cs-guoshen` adapts [huangbai-AI/guoshen](https://github.com/huangbai-AI/guoshen) under MIT, preserving upstream attribution and rule verification dates. It adds draft review, a local preparation CLI, revision checks and edit handoff. Candidate scans never guarantee platform approval. Available on main, outside the existing v0.7.0 archive. See [usage and dependencies](cs-guoshen/references/workflow.md).
