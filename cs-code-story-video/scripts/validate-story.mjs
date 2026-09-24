import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const configPath = path.resolve(process.argv[2] ?? 'story.json');
const requireReady = process.argv.includes('--require-ready');
const projectDir = path.dirname(configPath);
const errors = [];
let story;
try { story = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
catch (error) { console.error(`Cannot read story.json: ${error.message}`); process.exit(1); }

const requireCondition = (okay, message) => {if (!okay) errors.push(message);};
const isFrame = (value) => Number.isInteger(value) && value >= 0;
const hashFile = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const assetPath = (file, label) => {
  if (typeof file !== 'string' || !file || path.isAbsolute(file) || file.includes('..') || file.includes('/') || file.includes('\\')) {
    errors.push(`${label}.file must be a filename inside public/.`);
    return null;
  }
  const resolved = path.join(projectDir, 'public', file);
  if (!fs.existsSync(resolved)) {errors.push(`${label} file does not exist: ${file}`); return null;}
  return resolved;
};
const checkAsset = (asset, label) => {
  if (!asset || typeof asset !== 'object') {errors.push(`${label} is required.`); return null;}
  const file = assetPath(asset.file, label);
  if (!file) return null;
  const actual = hashFile(file);
  requireCondition(typeof asset.sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(asset.sha256), `${label}.sha256 must be a SHA-256 hex digest.`);
  if (asset.sha256?.toLowerCase() !== actual) errors.push(`${label} hash differs from story.json; refresh the asset provenance and dependent timing or layout.`);
  return file;
};

requireCondition(story.schemaVersion === 1, 'schemaVersion must be 1.');
requireCondition(story.fps === 30 && story.width === 1920 && story.height === 1080, 'v1 supports 1920x1080 at 30fps.');
requireCondition(typeof story.title === 'string' && story.title.trim(), 'title is required.');
for (const field of ['paper', 'ink', 'accent', 'coverAccent', 'stage']) requireCondition(/^#[0-9a-fA-F]{6}$/.test(story.theme?.[field] ?? ''), `theme.${field} must be a hex color.`);
for (const field of ['brand', 'series', 'headline', 'question', 'eyebrow']) requireCondition(typeof story.cover?.[field] === 'string' && story.cover[field].trim(), `cover.${field} is required.`);
requireCondition(typeof story.cover?.highlight === 'string', 'cover.highlight must be a string.');
checkAsset(story.character, 'character');

if (!story.audio) {
  if ((story.chapters?.length ?? 0) || (story.shots?.length ?? 0)) errors.push('Audio is missing but timed chapters or shots already exist.');
  if (requireReady) errors.push('Final narration audio is required before rendering.');
  if (errors.length) {console.error(errors.join('\n')); process.exit(1);}
  console.log(JSON.stringify({status: 'draft', message: 'No final narration audio. Complete the script and wait for recording before timing or rendering.'}, null, 2));
  process.exit(0);
}

const audioFile = checkAsset(story.audio, 'audio');
let audioDuration = NaN;
if (audioFile) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioFile], {encoding: 'utf8', windowsHide: true});
  if (probe.error || probe.status !== 0) errors.push(`FFprobe failed: ${probe.error?.message ?? probe.stderr?.trim()}`);
  else audioDuration = Number(probe.stdout.trim());
}
requireCondition(Number.isFinite(audioDuration) && audioDuration > 0, 'Audio duration must be measurable and positive.');
const finalFrame = Number.isFinite(audioDuration) ? Math.ceil(audioDuration * 30 - 1e-8) : -1;

const chapters = story.chapters;
const shots = story.shots;
requireCondition(Array.isArray(chapters) && chapters.length > 0, 'At least one chapter is required.');
requireCondition(Array.isArray(shots) && shots.length > 0, 'At least one shot is required.');
if (Array.isArray(chapters) && Array.isArray(shots) && chapters.length && shots.length) {
  const ids = new Set();
  let chapterCursor = 0;
  for (const chapter of chapters) {
    requireCondition(typeof chapter.id === 'string' && chapter.id.trim() && !ids.has(chapter.id), `Chapter id must be unique: ${chapter.id}`);
    ids.add(chapter.id);
    requireCondition(typeof chapter.title === 'string' && chapter.title.trim(), `Chapter ${chapter.id} needs a title.`);
    requireCondition(isFrame(chapter.startFrame) && isFrame(chapter.endFrame) && chapter.endFrame > chapter.startFrame, `Chapter ${chapter.id} has invalid frame boundaries.`);
    requireCondition(chapter.startFrame === chapterCursor, `Chapter ${chapter.id} must start at frame ${chapterCursor}.`);
    chapterCursor = chapter.endFrame;
    const members = shots.filter((shot) => shot.chapterId === chapter.id);
    requireCondition(members.length >= 2 && members[0].kind === 'card' && members[1].kind === 'broll', `Chapter ${chapter.id} must open with card then full-screen B-roll.`);
    requireCondition(members[0]?.startFrame === chapter.startFrame && members.at(-1)?.endFrame === chapter.endFrame, `Chapter ${chapter.id} shot coverage differs from chapter boundaries.`);
  }
  requireCondition(chapterCursor === finalFrame, `Last chapter must end at measured audio frame ${finalFrame}, got ${chapterCursor}.`);
  const shotIds = new Set();
  let shotCursor = 0;
  for (const shot of shots) {
    requireCondition(typeof shot.id === 'string' && shot.id.trim() && !shotIds.has(shot.id), `Shot id must be unique: ${shot.id}`);
    shotIds.add(shot.id);
    requireCondition(ids.has(shot.chapterId), `Shot ${shot.id} has unknown chapterId.`);
    requireCondition(['card', 'aroll', 'broll'].includes(shot.kind), `Shot ${shot.id} has invalid kind.`);
    requireCondition(['left', 'right', 'center'].includes(shot.side), `Shot ${shot.id} has invalid side.`);
    requireCondition(isFrame(shot.startFrame) && isFrame(shot.endFrame) && shot.endFrame > shot.startFrame, `Shot ${shot.id} has invalid frame boundaries.`);
    requireCondition(shot.startFrame === shotCursor, `Shot ${shot.id} must start at frame ${shotCursor}.`);
    shotCursor = shot.endFrame;
    if (shot.kind !== 'card') requireCondition(typeof shot.sceneId === 'string' && shot.sceneId.trim(), `Shot ${shot.id} needs a registered sceneId.`);
    const chapter = chapters.find((item) => item.id === shot.chapterId);
    if (chapter) requireCondition(shot.startFrame >= chapter.startFrame && shot.endFrame <= chapter.endFrame, `Shot ${shot.id} crosses a chapter boundary.`);
  }
  requireCondition(shotCursor === finalFrame, `Last shot must end at measured audio frame ${finalFrame}, got ${shotCursor}.`);
}

if (errors.length) {console.error(`Story validation failed:\n- ${errors.join('\n- ')}`); process.exit(1);}
console.log(JSON.stringify({status: 'ready', audioDurationSeconds: audioDuration, durationInFrames: finalFrame, chapters: chapters.length, shots: shots.length, audioSha256: story.audio.sha256.toLowerCase()}, null, 2));
