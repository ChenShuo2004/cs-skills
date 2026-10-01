// 用法：node timeline.mjs <项目目录>
// 读取 <目录>/spec.json 与 <目录>/audio/line_XXX.mp3（没有音频就按字数估算时长）
// 输出 <目录>/timeline.json、<目录>/narration.wav（有配音时）、<目录>/subtitles.srt
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const dir = path.resolve(process.argv[2] || '.');
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
const SR = 24000, GAP = spec.lineGap ?? 0.35, TAIL = spec.sceneTail ?? 0.8, LEAD = spec.lead ?? 0.8;
const plain = s => String(s ?? '').replace(/\[\/?[gcirdw]\]/g, '');

const lines = [];
spec.scenes.forEach((sc, si) => (sc.lines || []).forEach(l => {
  const o = typeof l === 'string' ? { text: l } : l;
  lines.push({ scene: si, text: o.sub === false ? '' : o.text, en: o.en || '', say: o.say ?? plain(o.text), pause: o.pause ?? 0 });
}));

let hasAudio = lines.length > 0;
lines.forEach((l, i) => {
  const f = path.join(dir, 'audio', `line_${String(i).padStart(3, '0')}.mp3`);
  if (fs.existsSync(f) && fs.statSync(f).size > 0) {
    l.pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-f', 's16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
    l.dur = l.pcm.length / 2 / SR;
  } else { hasAudio = false; l.dur = Math.max(1.6, [...l.say].length * (spec.readSpeed ?? 0.25)); }
});

// 排时间轴：场景首句前留 lead，句间留 GAP(+pause)，场景末尾留 TAIL(+hold)
let t = LEAD; const scenes = [];
spec.scenes.forEach((sc, si) => {
  const start = si === 0 ? 0 : t;
  t += sc.lead ?? 0.4;
  lines.filter(l => l.scene === si).forEach(l => { l.start = +t.toFixed(3); t += l.dur; l.end = +t.toFixed(3); t += GAP + l.pause; });
  t += TAIL + (sc.hold ?? 0);
  if (sc.minDur && t - start < sc.minDur) t = start + sc.minDur;
  scenes.push({ start: +start.toFixed(3), end: +t.toFixed(3), type: sc.type });
});
const total = +t.toFixed(3);

if (hasAudio) {
  const buf = Buffer.alloc(Math.ceil(total * SR) * 2);
  lines.forEach(l => l.pcm.copy(buf, Math.floor(l.start * SR) * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  fs.writeFileSync(path.join(dir, 'narration.wav'), Buffer.concat([h, buf]));
}
const out = { total, hasAudio, scenes, lines: lines.map(({ pcm, ...l }) => l) };
fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(out, null, 2));

const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
fs.writeFileSync(path.join(dir, 'subtitles.srt'), out.lines.filter(l => l.text).map((l, i) => `${i + 1}\n${ts(l.start)} --> ${ts(l.end)}\n${plain(l.text)}${l.en ? '\n' + l.en : ''}\n`).join('\n'));
console.log(`timeline: ${lines.length} 句, ${scenes.length} 场景, 总长 ${total}s, 配音: ${hasAudio ? '有' : '无（按字数估算，先跑 tts.py 再重跑本脚本）'}`);
