#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const excluded = new Set(["node_modules", "__pycache__", ".git", "output", ".cache"]);
function files(folder) {
  const result = [];
  function walk(dir, prefix = "") {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (excluded.has(item.name) || item.name.startsWith(".env") || item.name.endsWith(".pyc")) continue;
      const relative = path.join(prefix, item.name);
      if (item.isSymbolicLink()) throw new Error(`Source contains a symbolic link: ${relative}`);
      if (item.isDirectory()) walk(path.join(dir, item.name), relative);
      else if (item.isFile()) result.push(relative);
    }
  }
  walk(folder);
  return result.sort();
}
function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function matches(source, destination) {
  if (!fs.existsSync(destination) || !fs.statSync(destination).isDirectory()) return false;
  const names = files(source);
  const existing = files(destination);
  return names.join("|") === existing.join("|") && names.every((name) => digest(path.join(source, name)) === digest(path.join(destination, name)));
}
function clone(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const name of files(source)) {
    const out = path.join(destination, name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(path.join(source, name), out);
  }
}

const args = process.argv.slice(2);
let target = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "skills");
let update = false, check = false, dryRun = false;
const requested = [];
try {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target") {
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error("--target requires a directory");
      target = args[++i];
    } else if (args[i] === "--update") update = true;
    else if (args[i] === "--check") check = true;
    else if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--help") {
      console.log("node scripts/install-skills.mjs [--target DIR] [--update | --check] [--dry-run] [cs-skill ...]\nDefault: all task skills to Codex. Same content is skipped. --update backs up changed directories. Auxiliary skills require an explicit name. No network or model downloads.");
      process.exit(0);
    } else if (args[i].startsWith("--")) throw new Error(`Unknown option: ${args[i]}`);
    else requested.push(args[i]);
  }
  if (check && (update || dryRun)) throw new Error("--check cannot be combined with --update or --dry-run");
  target = path.resolve(target);
  const registry = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/skill-registry.json"), "utf8"));
  const available = new Set(registry.skills.map((s) => s.name));
  const names = [...new Set(requested.length ? requested : registry.skills.filter((s) => !s.auxiliary).map((s) => s.name))];
  for (const name of names) {
    if (!/^cs-[a-z0-9-]+$/.test(name) || !available.has(name)) throw new Error(`Unknown skill: ${name}`);
    const source = path.join(root, name);
    if (!fs.existsSync(path.join(source, "SKILL.md"))) throw new Error(`Missing source: ${name}`);
    files(source); // 校验全部来源后才开始写入。
    const dest = path.join(target, name);
    const relation = path.relative(source, dest);
    if (relation === "" || (!relation.startsWith("..") && !path.isAbsolute(relation))) throw new Error("Installation target must be outside each source skill");
  }
  const reports = [];
  for (const name of names) {
    const source = path.join(root, name), dest = path.join(target, name);
    const stat = fs.existsSync(dest) || fs.lstatSync(dest, { throwIfNoEntry: false }) ? fs.lstatSync(dest) : null;
    if (stat?.isSymbolicLink()) {
      if (!fs.existsSync(dest) || fs.realpathSync(dest) !== fs.realpathSync(source)) {
        reports.push({ name, action: "conflict", reason: "foreign-link-kept" });
        continue;
      }
    }
    if (matches(source, dest)) {
      reports.push({ name, action: check ? "verified" : "unchanged", files: files(source).length });
      continue;
    }
    if (check) {
      reports.push({ name, action: "mismatch" });
      continue;
    }
    if (stat && (!update || stat.isSymbolicLink())) {
      reports.push({ name, action: "conflict", reason: "existing-directory-kept; use --update after review" });
      continue;
    }
    if (dryRun) {
      reports.push({ name, action: stat ? "would-update" : "would-install" });
      continue;
    }
    fs.mkdirSync(target, { recursive: true });
    const stage = path.join(target, `.cs-skills-stage-${name}-${crypto.randomUUID()}`);
    clone(source, stage);
    if (!matches(source, stage)) throw new Error(`Staging verification failed: ${name}`);
    let backup;
    let copiedInPlace = false;
    if (stat) {
      backup = path.join(target, ".cs-skills-backups", `${Date.now()}-${crypto.randomUUID()}`, name);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      try { fs.renameSync(dest, backup); }
      catch (error) {
        if (!["EPERM", "EBUSY"].includes(error.code)) throw error;
        // Windows 的运行中程序可能持有目录；先完整备份，再更新具体文件。
        fs.cpSync(dest, backup, { recursive: true, dereference: false, errorOnExist: true, force: false });
        const incoming = new Set(files(source));
        for (const relative of files(dest)) {
          if (incoming.has(relative)) continue;
          const moved = path.join(backup, ".removed-from-install", relative);
          fs.mkdirSync(path.dirname(moved), { recursive: true });
          fs.renameSync(path.join(dest, relative), moved);
        }
        clone(source, dest);
        fs.renameSync(stage, path.join(backup, ".verified-staging-copy"));
        copiedInPlace = true;
      }
    }
    try { if (!copiedInPlace) fs.renameSync(stage, dest); }
    catch (error) {
      if (backup && !fs.existsSync(dest)) fs.renameSync(backup, dest);
      throw error;
    }
    if (!matches(source, dest)) throw new Error(`Installed files differ: ${name}`);
    reports.push({ name, action: stat ? "updated" : "installed", files: files(source).length, ...(backup ? { backup } : {}) });
  }
  console.log(JSON.stringify({ version: registry.version, target, skills: reports }, null, 2));
  if (reports.some((r) => ["conflict", "mismatch"].includes(r.action))) process.exitCode = 1;
} catch (error) {
  console.error(`Install failed: ${error.message}`);
  process.exitCode = 2;
}
