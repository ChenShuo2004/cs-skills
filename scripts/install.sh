#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
target_mode=""
action="install"
dry_run=false
requested=()

usage() {
  cat <<'EOF'
Usage: ./scripts/install.sh (--codex | --claude | --both) [--dry-run] [--uninstall] [skill ...]

Without skill names, installs every task skill (cs-recover-skill is excluded).
Existing files and links from another source are never overwritten.

Examples:
  ./scripts/install.sh --codex
  ./scripts/install.sh --both cs-run cs-writer
  ./scripts/install.sh --claude --dry-run
  ./scripts/install.sh --codex --uninstall cs-run

Optional destination overrides: CS_SKILLS_CODEX_DIR, CS_SKILLS_CLAUDE_DIR.
EOF
}

while (($#)); do
  case "$1" in
    --codex|--claude|--both)
      if [[ -n "$target_mode" ]]; then
        echo "Choose exactly one target: --codex, --claude, or --both." >&2
        exit 2
      fi
      target_mode="$1"
      ;;
    --uninstall) action="uninstall" ;;
    --dry-run) dry_run=true ;;
    --help|-h) usage; exit 0 ;;
    --*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) requested+=("$1") ;;
  esac
  shift
done

if [[ -z "$target_mode" ]]; then
  usage >&2
  exit 2
fi

if ((${#requested[@]} == 0)); then
  for source in "$repo_root"/cs-*/SKILL.md; do
    [[ -f "$source" ]] || continue
    name="$(basename "$(dirname "$source")")"
    [[ "$name" == cs-recover-skill ]] && continue
    requested+=("$name")
  done
fi

for name in "${requested[@]}"; do
  if [[ ! "$name" =~ ^cs-[a-z0-9-]+$ || ! -f "$repo_root/$name/SKILL.md" ]]; then
    echo "Unknown skill: $name" >&2
    exit 2
  fi
done

destinations=()
case "$target_mode" in
  --codex) destinations+=("${CS_SKILLS_CODEX_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}") ;;
  --claude) destinations+=("${CS_SKILLS_CLAUDE_DIR:-$HOME/.claude/skills}") ;;
  --both)
    destinations+=("${CS_SKILLS_CODEX_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}")
    destinations+=("${CS_SKILLS_CLAUDE_DIR:-$HOME/.claude/skills}")
    ;;
esac

conflicts=0
for destination in "${destinations[@]}"; do
  for name in "${requested[@]}"; do
    source="$repo_root/$name"
    link="$destination/$name"
    if [[ "$action" == install ]]; then
      if [[ -L "$link" && "$(readlink "$link")" == "$source" ]]; then
        echo "Already installed: $link"
      elif [[ -e "$link" || -L "$link" ]]; then
        echo "Conflict (kept existing): $link" >&2
        conflicts=1
      elif [[ "$dry_run" == true ]]; then
        echo "Would link: $link -> $source"
      else
        mkdir -p "$destination"
        ln -s "$source" "$link"
        echo "Linked: $link -> $source"
      fi
    elif [[ -L "$link" && "$(readlink "$link")" == "$source" ]]; then
      if [[ "$dry_run" == true ]]; then
        echo "Would remove link: $link"
      else
        rm "$link"
        echo "Removed link: $link"
      fi
    elif [[ -e "$link" || -L "$link" ]]; then
      echo "Conflict (kept existing): $link" >&2
      conflicts=1
    else
      echo "Not installed: $link"
    fi
  done
done

exit "$conflicts"
