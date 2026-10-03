// 用法：
//   node render.mjs <项目目录>                 → 渲染 <目录>/video.mp4（有 narration.wav 就自动合成配音）
//   node render.mjs <项目目录> --preview       → 每个场景抽 2 帧，输出 <目录>/preview.jpg 供检查
//   可选：--from 10 --to 30（只渲染片段） --workers 2 --fps 30
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/home/claude/.npm-global/lib/node_modules/playwright', `${process.env.HOME}/.npm-global/lib/node_modules/playwright`]) {
  try { ({ chromium } = require(p)); break; } catch { }
}
if (!chromium) { console.error('找不到 playwright'); process.exit(1); }

const args = process.argv.slice(2), dir = path.resolve(args[0] || '.');
const opt = k => { const i = args.indexOf('--' + k); return i > 0 ? args[i + 1] : undefined; };
const preview = args.includes('--preview');
const fps = +(opt('fps') || 30), workers = +(opt('workers') || Math.max(1, Math.min(4, os.cpus().length)));
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const engine = 'file://' + path.join(path.dirname(new URL(import.meta.url).pathname), 'engine.html');
const from = +(opt('from') || 0), to = Math.min(+(opt('to') || tl.total), tl.total);

const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('页面错误:', e.message));
  await page.goto(engine); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(([s, t]) => window.boot(s, t), [spec, tl]);
  return page;
}

if (preview) {
  const page = await newPage(), shots = [], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pv-'));
  tl.scenes.forEach((s, i) => { const d = s.end - s.start; shots.push(s.start + d * .35, s.start + d * .85); });
  for (const [i, t] of shots.entries()) { await page.evaluate(t => render(t), t); await page.screenshot({ path: path.join(tmp, `${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 80 }); }
  const cols = 4, rows = Math.ceil(shots.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', path.join(tmp, '*.jpg'), '-vf', `scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(dir, 'preview.jpg')]);
  console.log('预览:', path.join(dir, 'preview.jpg'), `（${shots.length} 帧，按场景顺序每场 2 帧）`);
  await browser.close(); process.exit(0);
}

// 并行分段渲染
const n = Math.round((to - from) * fps), per = Math.ceil(n / workers), parts = [];
let done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = w * per, b = Math.min(n, a + per); if (a >= b) return;
  const out = path.join(dir, `.part${w}.mp4`); parts[w] = out;
  const page = await newPage();
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'veryfast', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    await page.evaluate(t => render(t), from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (++done % 300 === 0) console.log(`${done}/${n} 帧  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}));
await browser.close();

const list = path.join(dir, '.parts.txt');
fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
const wav = path.join(dir, 'narration.wav'), out = path.join(dir, opt('out') || 'video.mp4');
const a = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
if (fs.existsSync(wav) && tl.hasAudio) {
  a.push('-ss', String(from), '-t', String(to - from), '-i', wav);
  if (spec.bgm && fs.existsSync(path.join(dir, spec.bgm))) {
    a.push('-stream_loop', '-1', '-i', path.join(dir, spec.bgm), '-filter_complex', `[2:a]volume=${spec.bgmVolume ?? 0.12}[b];[1:a][b]amix=inputs=2:duration=first:dropout_transition=0[aout]`, '-map', '0:v', '-map', '[aout]');
  } else a.push('-map', '0:v', '-map', '1:a');
  a.push('-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest');
} else a.push('-c', 'copy');
a.push(out);
execFileSync('ffmpeg', a);
parts.filter(Boolean).forEach(p => fs.unlinkSync(p)); fs.unlinkSync(list);
console.log(`完成: ${out}  (${(to - from).toFixed(1)}s, 用时 ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
