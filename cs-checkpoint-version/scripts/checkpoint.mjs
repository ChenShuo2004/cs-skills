#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function runGit(repoPath, args, { binary = false } = {}) {
  const result = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: binary ? "buffer" : "utf8",
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`git ${args.join(" ")} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = binary ? result.stderr.toString("utf8") : result.stderr;
    const stdout = binary ? result.stdout.toString("utf8") : result.stdout;
    throw new Error(`git ${args.join(" ")} failed with exit code ${result.status}: ${(stderr || stdout).trim()}`);
  }
  return result.stdout;
}

function safeSlug(value) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "checkpoint";
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function writeUtf8(filePath, text) {
  fs.writeFileSync(filePath, text, "utf8");
}

function nonEmptyFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

// --- Minimal zero-dependency ZIP writer & reader (DEFLATE / STORE) ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function createZip(zipPath, entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const posixName = name.replace(/\\/g, "/");
    const nameBuf = Buffer.from(posixName, "utf8");
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const deflated = zlib.deflateRawSync(raw);
    const useDeflate = deflated.length < raw.length;
    const payload = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(raw);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, nameBuf, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(raw.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    central.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(zipPath, Buffer.concat([...chunks, centralBuf, eocd]));
}

function extractZip(zipPath, destDir) {
  const buf = fs.readFileSync(zipPath);
  const rootReal = path.resolve(destDir);

  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error(`Invalid ZIP archive: ${zipPath}`);

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  let cursor = buf.readUInt32LE(eocdOffset + 16);

  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`Corrupted ZIP central directory in ${zipPath}`);
    }
    const method = buf.readUInt16LE(cursor + 10);
    const expectedCrc = buf.readUInt32LE(cursor + 16);
    const compressedSize = buf.readUInt32LE(cursor + 20);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localOffset = buf.readUInt32LE(cursor + 42);
    const entryName = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString("utf8").replace(/\\/g, "/");
    cursor += 46 + nameLen + extraLen + commentLen;

    if (!entryName || entryName.endsWith("/")) continue;

    const targetPath = path.resolve(rootReal, entryName);
    const rel = path.relative(rootReal, targetPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(`Unsafe ZIP entry escapes repository: ${entryName}`);
    }

    if (buf.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Corrupted ZIP local header for ${entryName}`);
    }
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const compressed = buf.subarray(dataStart, dataStart + compressedSize);

    let raw;
    if (method === 0) raw = compressed;
    else if (method === 8) raw = zlib.inflateRawSync(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method} for ${entryName}`);

    if (crc32(raw) !== expectedCrc) {
      throw new Error(`CRC mismatch while extracting ${entryName}`);
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, raw);
  }
}

export function saveCheckpoint({ repo = process.cwd(), slug = "checkpoint", outputRoot } = {}) {
  const repoRoot = runGit(repo, ["rev-parse", "--show-toplevel"]).trim();
  const baseOut = outputRoot ? path.resolve(outputRoot) : path.join(repoRoot, ".codex-checkpoints");
  const normalizedSlug = safeSlug(slug);
  const stamp = formatTimestamp();
  let checkpointPath = path.join(baseOut, `${stamp}-${normalizedSlug}`);
  for (let suffix = 1; fs.existsSync(checkpointPath); suffix++) {
    checkpointPath = path.join(baseOut, `${stamp}-${normalizedSlug}-${suffix}`);
  }

  fs.mkdirSync(checkpointPath, { recursive: true });

  const branch = runGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  const head = runGit(repoRoot, ["rev-parse", "HEAD"]).trim();
  const headShort = runGit(repoRoot, ["rev-parse", "--short", "HEAD"]).trim();
  const statusPorcelainRaw = runGit(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const statusLongRaw = runGit(repoRoot, ["status", "--short", "--branch"]);
  const stagedPatch = runGit(repoRoot, ["diff", "--binary", "--cached", "--"], { binary: true });
  const unstagedPatch = runGit(repoRoot, ["diff", "--binary", "--"], { binary: true });
  const untrackedRaw = runGit(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"], { binary: true });
  const untrackedFiles = untrackedRaw
    .toString("utf8")
    .split("\0")
    .filter((item) => item.length > 0);

  const statusEntries = statusPorcelainRaw
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  writeUtf8(path.join(checkpointPath, "status.txt"), statusLongRaw);
  writeUtf8(path.join(checkpointPath, "status-porcelain.txt"), statusPorcelainRaw);
  fs.writeFileSync(path.join(checkpointPath, "staged.patch"), stagedPatch);
  fs.writeFileSync(path.join(checkpointPath, "unstaged.patch"), unstagedPatch);
  writeUtf8(
    path.join(checkpointPath, "untracked-files.txt"),
    untrackedFiles.length ? `${untrackedFiles.join("\n")}\n` : "",
  );

  const untrackedZip = path.join(checkpointPath, "untracked.zip");
  const zipEntries = [];
  for (const relPath of untrackedFiles) {
    const absPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(absPath)) continue;
    const stat = fs.lstatSync(absPath);
    if (!stat.isFile()) continue;
    zipEntries.push({ name: relPath, data: fs.readFileSync(absPath) });
  }
  if (zipEntries.length > 0) {
    createZip(untrackedZip, zipEntries);
  }

  const metadata = {
    schema_version: 1,
    created_at: new Date().toISOString(),
    repo_root: repoRoot,
    branch,
    head,
    head_short: headShort,
    slug: normalizedSlug,
    status_entries: statusEntries.length,
    staged_patch: "staged.patch",
    unstaged_patch: "unstaged.patch",
    untracked_files: untrackedFiles.length,
    untracked_archive: zipEntries.length > 0 ? "untracked.zip" : null,
    restore_hint: "node scripts/checkpoint.mjs restore --repo <repo> --checkpoint <checkpoint-path> --force",
  };
  writeUtf8(path.join(checkpointPath, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

  return { checkpointPath, metadata };
}

export function listCheckpoints({ repo = process.cwd(), outputRoot } = {}) {
  const repoRoot = runGit(repo, ["rev-parse", "--show-toplevel"]).trim();
  const baseOut = outputRoot ? path.resolve(outputRoot) : path.join(repoRoot, ".codex-checkpoints");
  if (!fs.existsSync(baseOut)) return [];

  return fs
    .readdirSync(baseOut, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const fullPath = path.join(baseOut, d.name);
      const metaPath = path.join(fullPath, "metadata.json");
      let metadata = null;
      if (fs.existsSync(metaPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        } catch {
          metadata = null;
        }
      }
      return { name: d.name, path: fullPath, metadata };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function restoreCheckpoint({ repo = process.cwd(), checkpoint, force = false, cleanUntracked = false } = {}) {
  if (!force) {
    throw new Error("Restore rewrites the working tree. Re-run with --force after confirming the checkpoint path.");
  }
  if (!checkpoint) {
    throw new Error("Missing required --checkpoint path.");
  }

  const repoRoot = runGit(repo, ["rev-parse", "--show-toplevel"]).trim();
  const checkpointPath = path.resolve(checkpoint);
  const metadataPath = path.join(checkpointPath, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Missing checkpoint metadata: ${metadataPath}`);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (!metadata.head) {
    throw new Error("Checkpoint metadata does not include a base head.");
  }

  let preRestorePath = null;
  const currentStatus = runGit(repoRoot, ["status", "--porcelain=v1"]).trim();
  if (currentStatus.length > 0) {
    const saved = saveCheckpoint({ repo: repoRoot, slug: "pre-restore" });
    preRestorePath = saved.checkpointPath;
  }

  runGit(repoRoot, ["reset", "--hard", metadata.head]);
  if (cleanUntracked) {
    runGit(repoRoot, ["clean", "-fd", "-e", ".codex-checkpoints/"]);
  }

  const stagedPatch = path.join(checkpointPath, "staged.patch");
  const unstagedPatch = path.join(checkpointPath, "unstaged.patch");
  const untrackedZip = path.join(checkpointPath, "untracked.zip");

  if (nonEmptyFile(stagedPatch)) {
    runGit(repoRoot, ["apply", "--whitespace=nowarn", stagedPatch]);
    runGit(repoRoot, ["apply", "--cached", "--whitespace=nowarn", stagedPatch]);
  }
  if (nonEmptyFile(unstagedPatch)) {
    runGit(repoRoot, ["apply", "--whitespace=nowarn", unstagedPatch]);
  }
  if (fs.existsSync(untrackedZip)) {
    extractZip(untrackedZip, repoRoot);
  }

  return { checkpointPath, preRestorePath, metadata };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--force") opts.force = true;
    else if (arg === "--clean-untracked") opts.cleanUntracked = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--repo") opts.repo = rest[++i];
    else if (arg === "--slug") opts.slug = rest[++i];
    else if (arg === "--output-root") opts.outputRoot = rest[++i];
    else if (arg === "--checkpoint") opts.checkpoint = rest[++i];
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return { command, opts };
}

function printHelp() {
  console.log([
    "Usage:",
    "  node scripts/checkpoint.mjs save [--repo DIR] [--slug NAME] [--output-root DIR] [--json]",
    "  node scripts/checkpoint.mjs list [--repo DIR] [--output-root DIR] [--json]",
    "  node scripts/checkpoint.mjs restore [--repo DIR] --checkpoint DIR --force [--clean-untracked] [--json]",
  ].join("\n"));
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isCli) {
  try {
    const { command, opts } = parseArgs(process.argv.slice(2));
    if (!command || command === "--help" || command === "-h" || opts.help) {
      printHelp();
      process.exit(0);
    }
    if (command === "save") {
      const result = saveCheckpoint(opts);
      if (opts.json) console.log(JSON.stringify(result, null, 2));
      else console.log(result.checkpointPath);
    } else if (command === "list") {
      const items = listCheckpoints(opts);
      if (opts.json) console.log(JSON.stringify(items, null, 2));
      else {
        for (const item of items) {
          const branch = item.metadata?.branch ?? "?";
          const head = item.metadata?.head_short ?? "?";
          console.log(`${item.name}\t${branch}@${head}\t${item.path}`);
        }
      }
    } else if (command === "restore") {
      const result = restoreCheckpoint(opts);
      if (opts.json) console.log(JSON.stringify(result, null, 2));
      else {
        if (result.preRestorePath) console.log(`Pre-restore checkpoint: ${result.preRestorePath}`);
        console.log(`Restored checkpoint: ${result.checkpointPath}`);
      }
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Checkpoint error: ${error.message}`);
    process.exit(1);
  }
}
