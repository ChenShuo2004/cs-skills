import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const [timelineArg, storyArg, outputArg] = process.argv.slice(2);
if (!timelineArg || !storyArg || !outputArg) {
  console.error('Usage: node scripts/phrases-to-srt.mjs <phrase-timeline.json> <story.json> <output.srt>');
  process.exit(1);
}
const timeline = JSON.parse(fs.readFileSync(path.resolve(timelineArg), 'utf8'));
const story = JSON.parse(fs.readFileSync(path.resolve(storyArg), 'utf8'));
if (timeline.schema_version !== 2 || timeline.estimated_fallback_used !== false || !timeline.timing_source || !Array.isArray(timeline.phrases) || !timeline.phrases.length) throw new Error('A valid real-audio schema v2 phrase timeline is required.');
if (!story.audio || story.fps !== timeline.fps) throw new Error('Story audio and timeline fps must be present and match.');
if (!Number.isFinite(timeline.source_coverage) || timeline.source_coverage < 0 || timeline.source_coverage > 1) throw new Error('Timeline source_coverage must be a number from 0 to 1.');
if (!Number.isFinite(timeline.audio_duration_ms) || timeline.audio_duration_ms <= 0) throw new Error('Timeline audio_duration_ms must be positive.');
if (!/^[a-fA-F0-9]{64}$/.test(timeline.source_sha256 ?? '') || timeline.source_sha256.toLowerCase() !== story.audio.sha256?.toLowerCase()) throw new Error('Timeline source audio hash is missing or differs from story audio.');
const audioPath = path.join(path.dirname(path.resolve(storyArg)), 'public', story.audio.file);
const actualHash = crypto.createHash('sha256').update(fs.readFileSync(audioPath)).digest('hex');
if (actualHash !== timeline.source_sha256.toLowerCase()) throw new Error('The current audio file differs from the aligned source.');
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioPath], {encoding: 'utf8', windowsHide: true});
const actualDurationMs = Number(probe.stdout?.trim()) * 1000;
if (probe.error || probe.status !== 0 || !Number.isFinite(actualDurationMs)) throw new Error(`FFprobe failed: ${probe.error?.message ?? probe.stderr?.trim()}`);
if (Math.abs(actualDurationMs - timeline.audio_duration_ms) > 40) throw new Error('Timeline duration differs from the current audio by more than 40 ms.');
const stamp = (ms) => {
  const n = Math.max(0, Math.round(ms));
  const h = Math.floor(n / 3600000);
  const m = Math.floor(n / 60000) % 60;
  const s = Math.floor(n / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
};
let previousEnd = 0;
const cues = timeline.phrases.map((phrase, index) => {
  const start = phrase.spoken_start_ms;
  const end = phrase.spoken_end_ms;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < previousEnd - 20 || !phrase.text?.trim()) throw new Error(`Invalid real phrase boundary at ${index + 1}.`);
  if (end > timeline.audio_duration_ms + 30) throw new Error(`Phrase ${index + 1} extends past the audio.`);
  previousEnd = end;
  return `${index + 1}\n${stamp(start)} --> ${stamp(end)}\n${phrase.text.trim()}\n`;
});
fs.mkdirSync(path.dirname(path.resolve(outputArg)), {recursive: true});
fs.writeFileSync(path.resolve(outputArg), cues.join('\n') + '\n', 'utf8');
console.log(JSON.stringify({cues: cues.length, output: path.resolve(outputArg), sourceHashVerified: true, sourceCoverage: timeline.source_coverage}, null, 2));
