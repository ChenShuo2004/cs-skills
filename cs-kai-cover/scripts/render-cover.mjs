#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WIDTH = 2500;
const HEIGHT = 1000;
const TITLE_LIMIT = 20;
const LINE_LIMIT = 10;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error("Usage: node render-cover.mjs --background <png> --title <Chinese title> --output <png> [--subtitle <text>] [--points <item · item>] [--font <font-file>]");
  process.exit(1);
}

function readArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) usage(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) usage(`Missing value for ${key}`);
    options[key.slice(2)] = value;
    index += 1;
  }
  return options;
}

function findFont(explicitFont) {
  if (explicitFont) {
    if (!fs.existsSync(explicitFont)) usage(`Font does not exist: ${explicitFont}`);
    return explicitFont;
  }
  const candidates = process.platform === "win32"
    ? ["C:/Windows/Fonts/msyhbd.ttc", "C:/Windows/Fonts/simhei.ttf"]
    : ["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc"];
  return candidates.find(candidate => fs.existsSync(candidate));
}

function splitTitle(input) {
  const rawLines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (rawLines.length > 2) usage("Title must fit within two lines.");
  const compact = rawLines.join("").replace(/\s/g, "");
  if (!compact) usage("Title cannot be empty.");
  if (compact.length > TITLE_LIMIT) usage(`Title has ${compact.length} characters; provide a display title of ${TITLE_LIMIT} characters or fewer.`);
  if (rawLines.length === 2) {
    if (rawLines.some(line => [...line].length > LINE_LIMIT)) usage(`Each title line must be ${LINE_LIMIT} characters or fewer.`);
    return rawLines;
  }
  if ([...compact].length <= LINE_LIMIT) return [compact];
  const characters = [...compact];
  const midpoint = Math.ceil(characters.length / 2);
  return [characters.slice(0, midpoint).join(""), characters.slice(midpoint).join("")];
}

function filterPath(filePath) {
  return path.resolve(filePath).replaceAll("\\", "/").replaceAll(":", "\\:").replaceAll("'", "\\'");
}

function run() {
  const options = readArgs(process.argv.slice(2));
  for (const required of ["background", "title", "output"]) {
    if (!options[required]) usage(`--${required} is required.`);
  }
  if (!fs.existsSync(options.background)) usage(`Background does not exist: ${options.background}`);
  const font = findFont(options.font);
  if (!font) usage("No CJK font was found. Pass --font with a Chinese-capable font file.");
  const titleLines = splitTitle(options.title);
  if (options.subtitle && [...options.subtitle.replace(/\s/g, "")].length > 42) usage("Subtitle must be 42 characters or fewer.");
  if (options.points && [...options.points.replace(/\s/g, "")].length > 42) usage("Points must be 42 characters or fewer.");

  const output = path.resolve(options.output);
  if (fs.existsSync(output)) usage(`Output already exists: ${output}. Choose a new output path to preserve the existing cover.`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cs-kai-cover-"));
  const titleFile = path.join(tempDirectory, "title.txt");
  const subtitleFile = path.join(tempDirectory, "subtitle.txt");
  const pointsFile = path.join(tempDirectory, "points.txt");
  fs.writeFileSync(titleFile, titleLines.join("\n"), "utf8");
  if (options.subtitle) fs.writeFileSync(subtitleFile, options.subtitle.trim(), "utf8");
  if (options.points) fs.writeFileSync(pointsFile, options.points.trim(), "utf8");

  const titleY = titleLines.length === 1 ? 350 : 255;
  const subtitleY = titleY + titleLines.length * 172 + 34;
  const fontPath = filterPath(font);
  const filters = [
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${WIDTH}:${HEIGHT}`,
    "drawbox=x=0:y=0:w=1500:h=1000:color=0xF5EFF5@0.92:t=fill",
    "drawbox=x=140:y=206:w=82:h=10:color=0x0059C0@1:t=fill",
    "drawbox=x=238:y=206:w=18:h=10:color=0xFF8A1F@1:t=fill",
    `drawtext=fontfile='${fontPath}':textfile='${filterPath(titleFile)}':fontcolor=0x111111:fontsize=132:line_spacing=26:x=140:y=${titleY}`,
  ];
  if (options.subtitle) {
    filters.push(`drawtext=fontfile='${fontPath}':textfile='${filterPath(subtitleFile)}':fontcolor=0x4B5563:fontsize=42:x=146:y=${subtitleY}`);
  }
  if (options.points) {
    filters.push(`drawtext=fontfile='${fontPath}':textfile='${filterPath(pointsFile)}':fontcolor=0x0059C0:fontsize=36:x=146:y=${subtitleY + 92}`);
  }
  filters.push(`drawtext=fontfile='${fontPath}':text='KAI':fontcolor=0x0059C0:fontsize=44:x=140:y=894`);

  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  const result = spawnSync(ffmpeg, ["-n", "-hide_banner", "-loglevel", "error", "-i", path.resolve(options.background), "-vf", filters.join(","), "-frames:v", "1", "-c:v", "png", output], { encoding: "utf8" });
  fs.rmSync(tempDirectory, { recursive: true, force: true });
  if (result.error) usage(`Could not run ffmpeg (${result.error.message}). Install ffmpeg or set FFMPEG_PATH.`);
  if (result.status !== 0) usage(result.stderr.trim() || "ffmpeg could not render the cover.");
  console.log(`Rendered ${WIDTH}x${HEIGHT} cover: ${output}`);
}

run();
