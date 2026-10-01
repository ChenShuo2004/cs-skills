// 用法：
//   node render.mjs <项目目录>              → 渲染 <目录>/video.mp4（自动混入配音 / 氛围铺底 / BGM）
//   node render.mjs <项目目录> --preview    → 每个场景抽 2 帧拼成 <目录>/preview.jpg，先看这张再全量渲染
//   node render.mjs <项目目录> --still 12.5 → 只导出第 12.5 秒的一帧 <目录>/still.png
//   只换声音：node render.mjs <项目目录> --remux  → 复用已渲染的 video.mp4 画面，重新混音（改完 score.py 后用）
//   可选：--from 10 --to 30（只渲染片段）  --workers 4  --fps 30  --out name.mp4
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execFileSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
let chromium;
const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright', 'playwright-core'].filter(Boolean);
try { candidates.push(path.join(execFileSync('npm', ['root', '-g'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')); } catch { }
for (const p of candidates) {
  try { ({ chromium } = require(p)); break; } catch { }
}
if (!chromium) { console.error('找不到 playwright：请在本项目安装 playwright，或设置 PLAYWRIGHT_MODULE 为模块目录'); process.exit(1); }

const args = process.argv.slice(2), dir = path.resolve(args[0] || '.');
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const preview = args.includes('--preview'), still = opt('still');
const fps = +(opt('fps') || 30), workers = +(opt('workers') || Math.max(1, Math.min(4, os.cpus().length)));
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const engine = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'engine.html')).href;
const base = pathToFileURL(dir).href;
const from = +(opt('from') || 0), to = Math.min(+(opt('to') || tl.total), tl.total);
if (!Array.isArray(spec.scenes) || !spec.scenes.length || !Array.isArray(tl.scenes) || tl.scenes.length !== spec.scenes.length) throw new Error('spec 与 timeline 场景不匹配，请重跑 timeline.mjs');
if (![fps, workers, from, to].every(Number.isFinite) || fps <= 0 || !Number.isInteger(workers) || workers < 1 || from < 0 || to <= from) throw new Error('无效的帧率、并行数或时间范围');

const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE || undefined, args: ['--font-render-hinting=none', '--allow-file-access-from-files'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('页面错误:', e.message));
  await page.goto(engine);
  await page.evaluate(async ([s, t, b]) => { await window.boot(s, t, b); }, [spec, tl, base]);
  return page;
}

if (still !== undefined) {
  if (!Number.isFinite(+still) || +still < 0 || +still > tl.total) throw new Error('单帧时间超出范围');
  const page = await newPage(); await page.evaluate(t => render(t), +still);
  await page.screenshot({ path: path.join(dir, 'still.png') }); console.log('单帧:', path.join(dir, 'still.png'));
  await browser.close(); process.exit(0);
}

if (preview) {
  const page = await newPage(), shots = [], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kf-'));
  tl.scenes.forEach(s => { const d = s.end - s.start; shots.push(s.start + d * .3, s.start + d * .8); });
  for (const [i, t] of shots.entries()) { await page.evaluate(t => render(t), t); await page.screenshot({ path: path.join(tmp, `${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 80 }); }
  const cols = 4, rows = Math.ceil(shots.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', path.join(tmp, '*.jpg'), '-vf', `scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(dir, 'preview.jpg')]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('预览:', path.join(dir, 'preview.jpg'), `（${shots.length} 帧，每个场景 30% / 80% 处各 1 帧）`);
  await browser.close(); process.exit(0);
}

const remux = args.includes('--remux');
// 并行分段渲染
const n = remux ? 0 : Math.round((to - from) * fps), per = Math.ceil(n / workers), parts = [];
let done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = w * per, b = Math.min(n, a + per); if (a >= b) return;
  const out = path.join(dir, `.part${w}.mp4`); parts[w] = out;
  const page = await newPage();
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'veryfast', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    await page.evaluate(t => render(t), from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (++done % 300 === 0) console.log(`${done}/${n} 帧  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  const code = await new Promise((resolve, reject) => { ff.on('error', reject); ff.on('close', resolve); });
  if (code !== 0) throw new Error(`ffmpeg 分段渲染失败：${out}（退出码 ${code}）`);
}));
await browser.close();

// 拼接 + 混音：配音(narration.wav) + 配乐音效(score.wav，由 score.py 生成；没有则退回简易氛围铺底) + BGM(spec.bgm，可选)，最终响度 -16 LUFS
const list = path.join(dir, '.parts.txt');
const srcVideo = remux ? path.join(dir, opt('video') || opt('out') || 'video.mp4') : null;
if (remux) { fs.copyFileSync(srcVideo, path.join(dir, '.src.mp4')); parts[0] = path.join(dir, '.src.mp4'); }
fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
const dur = to - from, out = path.join(dir, opt('out') || 'video.mp4');
const a = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list], mix = []; let k = 1;
const wav = path.join(dir, 'narration.wav');
if (fs.existsSync(wav) && tl.hasAudio) { a.push('-ss', String(from), '-t', String(dur), '-i', wav); mix.push(`[${k++}:a]aresample=44100,volume=1.0[n]`); }
const score = path.join(dir, 'score.wav');
if (spec.music !== false && fs.existsSync(score)) { a.push('-ss', String(from), '-t', String(dur), '-i', score); mix.push(`[${k++}:a]aresample=44100,volume=${spec.musicVolume ?? 1.0}[s]`); }
else if (spec.ambient !== false) {
  const v = spec.ambientVolume ?? 0.5;
  const expr = '0.05*sin(2*PI*110*t)*(0.6+0.4*sin(2*PI*0.07*t))+0.04*sin(2*PI*164.81*t)*(0.6+0.4*sin(2*PI*0.05*t+1))+0.03*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.031*t+2))+0.022*sin(2*PI*261.63*t)*(0.5+0.5*sin(2*PI*0.043*t+3))+0.012*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.023*t))';
  a.push('-f', 'lavfi', '-t', String(dur), '-i', `aevalsrc='${expr}':s=44100`);
  mix.push(`[${k++}:a]lowpass=f=900,aecho=0.8:0.7:700|1300:0.35|0.25,afade=t=in:d=3,afade=t=out:st=${Math.max(0, dur - 4)}:d=4,volume=${v}[m]`);
}
if (spec.bgm && fs.existsSync(path.join(dir, spec.bgm))) { a.push('-stream_loop', '-1', '-t', String(dur), '-i', path.join(dir, spec.bgm)); mix.push(`[${k++}:a]aresample=44100,volume=${spec.bgmVolume ?? 0.15}[b]`); }
if (mix.length) {
  const labels = mix.map(m => m.slice(m.lastIndexOf('['))).join('');
  a.push('-filter_complex', `${mix.join(';')};${labels}amix=inputs=${mix.length}:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=44100[aout]`, '-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(dur));
} else a.push('-c', 'copy');
a.push(out);
execFileSync('ffmpeg', a);
parts.filter(Boolean).forEach(p => fs.unlinkSync(p)); fs.unlinkSync(list);
console.log(`完成: ${out}  (${dur.toFixed(1)}s, 用时 ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
