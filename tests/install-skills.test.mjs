import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("installer preserves conflicts, backs up updates, verifies files and skips duplicates", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "cs-install-test-"));
  const target = path.join(temp, "skills");
  const run = (...args) => spawnSync(process.execPath, [path.join(root, "scripts/install-skills.mjs"), "--target", target, ...args], { encoding: "utf8", windowsHide: true });
  try {
    assert.equal(run("--dry-run", "cs-run").status, 0);
    assert.equal(fs.existsSync(target), false);
    assert.equal(run("unknown-skill").status, 2);
    assert.equal(fs.existsSync(target), false);
    const first = run("cs-run", "cs-writer");
    assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(JSON.parse(first.stdout).skills.map((s) => s.action), ["installed", "installed"]);
    const installed = path.join(target, "cs-run/SKILL.md");
    const before = fs.statSync(installed).mtimeMs;
    const again = run("cs-run", "cs-writer");
    assert.equal(again.status, 0, again.stderr);
    assert.ok(JSON.parse(again.stdout).skills.every((s) => s.action === "unchanged"));
    assert.equal(fs.statSync(installed).mtimeMs, before);
    fs.writeFileSync(installed, "local custom copy");
    fs.writeFileSync(path.join(target, "cs-run/custom.txt"), "custom asset");
    assert.equal(run("--check", "cs-run").status, 1);
    assert.equal(run("cs-run").status, 1);
    assert.equal(fs.readFileSync(installed, "utf8"), "local custom copy");
    const updated = run("--update", "cs-run");
    assert.equal(updated.status, 0, updated.stderr);
    const backup = JSON.parse(updated.stdout).skills[0].backup;
    assert.equal(fs.readFileSync(path.join(backup, "SKILL.md"), "utf8"), "local custom copy");
    assert.equal(fs.readFileSync(path.join(backup, "custom.txt"), "utf8"), "custom asset");
    assert.equal(run("--check", "cs-run", "cs-writer").status, 0);
    // Windows 目录被应用持有时，模拟 EPERM，仍须先备份再同步文件。
    fs.writeFileSync(installed, "locked directory custom copy");
    fs.writeFileSync(path.join(target, "cs-run/extra.txt"), "extra asset");
    const preload = path.join(temp, "locked.cjs");
    fs.writeFileSync(preload, `const fs = require('node:fs'); const rename = fs.renameSync; fs.renameSync = function(from, to) { if (from === ${JSON.stringify(path.join(target, "cs-run"))}) { const error = new Error('locked'); error.code = 'EPERM'; throw error; } return rename.apply(this, arguments); };`);
    const locked = spawnSync(process.execPath, ["--require", preload, path.join(root, "scripts/install-skills.mjs"), "--target", target, "--update", "cs-run"], { encoding: "utf8", windowsHide: true });
    assert.equal(locked.status, 0, locked.stderr);
    const lockedBackup = JSON.parse(locked.stdout).skills[0].backup;
    assert.equal(fs.readFileSync(path.join(lockedBackup, "SKILL.md"), "utf8"), "locked directory custom copy");
    assert.equal(fs.readFileSync(path.join(lockedBackup, "extra.txt"), "utf8"), "extra asset");
    assert.equal(run("--check", "cs-run").status, 0);
    const foreign = path.join(temp, "foreign");
    fs.mkdirSync(foreign);
    fs.symlinkSync(foreign, path.join(target, "cs-kai-cover"), "junction");
    assert.equal(run("--update", "cs-kai-cover").status, 1);
    assert.equal(fs.realpathSync(path.join(target, "cs-kai-cover")), fs.realpathSync(foreign));
  } finally {
    assert.ok(path.dirname(temp) === os.tmpdir() && path.basename(temp).startsWith("cs-install-test-"));
    const foreignLink = path.join(target, "cs-kai-cover");
    if (fs.lstatSync(foreignLink, { throwIfNoEntry: false })?.isSymbolicLink()) fs.unlinkSync(foreignLink);
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
