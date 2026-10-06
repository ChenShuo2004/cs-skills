#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
temp_root="$(mktemp -d)"
trap 'rm -rf "$temp_root"' EXIT
export CS_SKILLS_CODEX_DIR="$temp_root/codex"
export CS_SKILLS_CLAUDE_DIR="$temp_root/claude"

case "$(uname -s)" in
  MINGW*|MSYS*)
    export MSYS="${MSYS:-} winsymlinks:nativestrict"
    if ! ln -s "$repo_root/cs-run" "$temp_root/link-probe" 2>/dev/null; then
      "$repo_root/scripts/install.sh" --codex --dry-run cs-run >/dev/null
      [[ ! -e "$CS_SKILLS_CODEX_DIR" ]]
      mkdir -p "$CS_SKILLS_CODEX_DIR/cs-run"
      if "$repo_root/scripts/install.sh" --codex cs-run >/dev/null 2>&1; then
        echo "Expected existing-directory conflict" >&2; exit 1
      fi
      if "$repo_root/scripts/install.sh" --codex unknown-skill >/dev/null 2>&1; then
        echo "Expected unknown-skill rejection" >&2; exit 1
      fi
      node --test "$repo_root/tests/install-skills.test.mjs"
      echo "Bash arguments/conflicts/dry-run and Node installer passed; native symlink operations unavailable on this Windows host."
      exit 0
    fi
    rm "$temp_root/link-probe"
    ;;
esac

"$repo_root/scripts/install.sh" --both cs-run cs-writer >/dev/null
[[ "$(readlink "$CS_SKILLS_CODEX_DIR/cs-run")" == "$repo_root/cs-run" ]]
[[ "$(readlink "$CS_SKILLS_CLAUDE_DIR/cs-writer")" == "$repo_root/cs-writer" ]]

"$repo_root/scripts/install.sh" --both cs-run cs-writer >/dev/null

"$repo_root/scripts/install.sh" --codex --uninstall cs-run >/dev/null
[[ ! -e "$CS_SKILLS_CODEX_DIR/cs-run" && ! -L "$CS_SKILLS_CODEX_DIR/cs-run" ]]
[[ -L "$CS_SKILLS_CLAUDE_DIR/cs-run" ]]

mkdir "$CS_SKILLS_CODEX_DIR/cs-run"
if "$repo_root/scripts/install.sh" --codex cs-run >/dev/null 2>&1; then
  echo "Expected existing-directory conflict" >&2
  exit 1
fi
[[ -d "$CS_SKILLS_CODEX_DIR/cs-run" ]]

"$repo_root/scripts/install.sh" --codex --dry-run cs-github-push >/dev/null
[[ ! -e "$CS_SKILLS_CODEX_DIR/cs-github-push" ]]

ln -s "$temp_root/foreign-skill" "$CS_SKILLS_CODEX_DIR/cs-github-push"
if "$repo_root/scripts/install.sh" --codex --uninstall cs-github-push >/dev/null 2>&1; then
  echo "Expected foreign-link conflict" >&2
  exit 1
fi
[[ -L "$CS_SKILLS_CODEX_DIR/cs-github-push" ]]

if "$repo_root/scripts/install.sh" --codex not-a-skill >/dev/null 2>&1; then
  echo "Expected unknown-skill rejection" >&2
  exit 1
fi

echo "Installer checks passed: linking, idempotence, uninstall, foreign-link protection, dry-run, validation."
