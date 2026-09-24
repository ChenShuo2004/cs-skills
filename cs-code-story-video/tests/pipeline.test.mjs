import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, args, cwd) => spawnSync(process.execPath, [path.join(skillRoot, 'scripts', script), ...args], {cwd, encoding: 'utf8', windowsHide: true});
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function sixSecondWav(output) {
  const sampleRate = 48000;
  const samples = sampleRate * 6;
  const pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) pcm.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 2500), i * 2);
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44);
  fs.writeFileSync(output, wav);
}

test('scaffold, draft stop, audio-locked shots, stale audio, and SRT contract', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-code-story-video-'));
  const project = path.join(temp, 'project');
  try {
    const created = run('scaffold.mjs', ['测试叙事', '--output', project], temp);
    assert.equal(created.status, 0, created.stderr);
    const configPath = path.join(project, 'story.json');
    const draft = run('validate-story.mjs', [configPath], project);
    assert.equal(draft.status, 0, draft.stderr);
    assert.match(draft.stdout, /"status": "draft"/);
    const prematureRender = run('validate-story.mjs', [configPath, '--require-ready'], project);
    assert.notEqual(prematureRender.status, 0);
    assert.match(prematureRender.stderr, /Final narration audio is required/);

    const wav = path.join(project, 'public', 'narration.wav');
    sixSecondWav(wav);
    const story = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    story.audio = {file: 'narration.wav', sha256: hash(wav)};
    story.chapters = [
      {id: 'c1', title: '起点', startFrame: 0, endFrame: 90},
      {id: 'c2', title: '回望', startFrame: 90, endFrame: 180},
    ];
    story.shots = [
      {id: 's1', chapterId: 'c1', kind: 'card', sceneId: '', side: 'left', startFrame: 0, endFrame: 21},
      {id: 's2', chapterId: 'c1', kind: 'broll', sceneId: 'example-table', side: 'left', startFrame: 21, endFrame: 48},
      {id: 's3', chapterId: 'c1', kind: 'aroll', sceneId: 'example-note', side: 'left', startFrame: 48, endFrame: 90},
      {id: 's4', chapterId: 'c2', kind: 'card', sceneId: '', side: 'right', startFrame: 90, endFrame: 111},
      {id: 's5', chapterId: 'c2', kind: 'broll', sceneId: 'example-table', side: 'right', startFrame: 111, endFrame: 143},
      {id: 's6', chapterId: 'c2', kind: 'aroll', sceneId: 'example-note', side: 'right', startFrame: 143, endFrame: 180},
    ];
    fs.writeFileSync(configPath, JSON.stringify(story, null, 2) + '\n');
    const valid = run('validate-story.mjs', [configPath], project);
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /"durationInFrames": 180/);

    story.shots[2].startFrame += 1;
    fs.writeFileSync(configPath, JSON.stringify(story, null, 2) + '\n');
    const gap = run('validate-story.mjs', [configPath], project);
    assert.notEqual(gap.status, 0);
    assert.match(gap.stderr, /must start at frame 48/);
    story.shots[2].startFrame -= 1;

    const alternate = path.join(project, 'public', 'alternate.png');
    fs.copyFileSync(path.join(project, 'public', 'kai-pixel.png'), alternate);
    story.character = {file: 'alternate.png', sha256: hash(alternate)};
    story.cover.brand = 'NOVA';
    story.cover.series = 'CODE STORY';
    fs.writeFileSync(configPath, JSON.stringify(story, null, 2) + '\n');
    assert.equal(run('validate-story.mjs', [configPath], project).status, 0);

    const timeline = {
      schema_version: 2, fps: 30, audio_duration_ms: 6000, timing_source: 'test-fixture-only', estimated_fallback_used: false,
      source_coverage: 1,
      source_sha256: story.audio.sha256,
      phrases: [{text: '第一句', spoken_start_ms: 0, spoken_end_ms: 2100}, {text: '第二句', spoken_start_ms: 2300, spoken_end_ms: 5900}],
    };
    const timelinePath = path.join(project, 'derived', 'phrase-timeline.json');
    const srtPath = path.join(project, 'out', 'narration.srt');
    fs.writeFileSync(timelinePath, JSON.stringify(timeline));
    const srt = run('phrases-to-srt.mjs', [timelinePath, configPath, srtPath], project);
    assert.equal(srt.status, 0, srt.stderr);
    assert.match(fs.readFileSync(srtPath, 'utf8'), /00:00:02,300 --> 00:00:05,900/);
    delete timeline.source_sha256;
    fs.writeFileSync(timelinePath, JSON.stringify(timeline));
    assert.notEqual(run('phrases-to-srt.mjs', [timelinePath, configPath, srtPath], project).status, 0);
    timeline.source_sha256 = '0'.repeat(64);
    fs.writeFileSync(timelinePath, JSON.stringify(timeline));
    assert.notEqual(run('phrases-to-srt.mjs', [timelinePath, configPath, srtPath], project).status, 0);

    const bytes = fs.readFileSync(wav); bytes[100] ^= 0x01; fs.writeFileSync(wav, bytes);
    assert.notEqual(run('validate-story.mjs', [configPath], project).status, 0, 'changed audio must invalidate the story');
  } finally {
    if (path.dirname(temp) === os.tmpdir() && path.basename(temp).startsWith('cs-code-story-video-')) fs.rmSync(temp, {recursive: true, force: true});
  }
});
