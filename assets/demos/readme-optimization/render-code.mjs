// 通用 render(t) 渲染器：Playwright 逐帧截图 → ffmpeg 编码 MP4（可多进程并行）
// 用法：
//   node render.mjs index.html out.mp4 --size 1920x1080 --fps 30 [--duration 30] [--start 0]
//                   [--audio mix.wav] [--subframes 4] [--workers 2] [--draft]
//   node render.mjs index.html still.png --still 2.0 --size 1920x1080
// 页面约定：window.render(t) 画出第 t 秒；资源加载完设 window.ready = true；可选 window.DURATION
// --workers N：把时间轴切成 N 段并行渲染再无损拼接（默认 = CPU 核数，最多 4）
// --draft：JPEG 截图 + 快速编码，用来看节奏的低清小样
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }

const [input, output, ...rest] = process.argv.slice(2);
if (!input || !output) { console.log('usage: node render.mjs index.html out.mp4|still.png [options]'); process.exit(1); }
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const flag = k => rest.includes('--' + k);
const [W, H] = opt('size', '1920x1080').split('x').map(Number);
const fps = Number(opt('fps', 30));
const start = Number(opt('start', 0));
const still = opt('still', null);
const audio = opt('audio', null);
const sub = Math.max(1, Number(opt('subframes', 1)));
const draft = flag('draft');
const url = 'file://' + path.resolve(input);
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });

const launchOptions = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
let browser;
try {
  browser = await chromium.launch(launchOptions);
} catch (error) {
  if (!/Executable doesn't exist/.test(error.message)) throw error;
  browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
}
let pageErrors = 0;
async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => { pageErrors++; if (pageErrors <= 5) console.error('\n[page error]', e.message); });
  await page.goto(url);
  await page.waitForFunction(() => window.ready === true && typeof window.render === 'function', null, { timeout: 60000 });
  return page;
}
const shot = async (page, t) => {
  await page.evaluate(async t => { await window.render(t); }, t);
  return page.screenshot(draft ? { type: 'jpeg', quality: 88 } : { type: 'png' });
};

const first = await openPage();
if (still !== null) {
  fs.writeFileSync(output, await shot(first, Number(still)));
  console.log('still →', output);
  await browser.close(); process.exit(pageErrors ? 2 : 0);
}

const duration = Number(opt('duration', await first.evaluate(() => window.DURATION || 5)));
const frames = Math.round(duration * fps);
const workers = Math.max(1, Math.min(Number(opt('workers', Math.min(4, os.cpus().length))), Math.ceil(frames / fps)));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
const vf = sub > 1 ? ['-vf', `tmix=frames=${sub},framestep=${sub}`] : [];
const enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', draft ? '26' : '18', '-preset', draft ? 'veryfast' : 'medium', '-r', String(fps), '-threads', '1'];

let done = 0;
const t0 = Date.now();
const tick = () => { if (done % fps === 0 || done === frames) process.stdout.write(`\r${done}/${frames} 帧  ${((Date.now() - t0) / 1000).toFixed(0)}s  (${workers} 路并行)`); };

async function renderChunk(k, page) {
  const a = Math.floor(frames * k / workers), b = Math.floor(frames * (k + 1) / workers);
  const out = path.join(tmp, `part${k}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-thread_queue_size', '64', '-f', 'image2pipe', '-framerate', String(fps * sub), '-i', '-',
    ...vf, ...enc, out], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = a; i < b; i++) {
    for (let s = 0; s < sub; s++) {
      const buf = await shot(page, start + (i + s / sub) / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    done++; tick();
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  return out;
}

const pages = [first, ...await Promise.all(Array.from({ length: workers - 1 }, openPage))];
const parts = await Promise.all(pages.map((p, k) => renderChunk(k, p)));
await browser.close();

fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
const mux = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt')];
if (audio) mux.push('-ss', String(start), '-t', String(duration), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
mux.push('-c:v', 'copy', '-movflags', '+faststart', output);
execSync('ffmpeg ' + mux.map(x => JSON.stringify(x)).join(' '), { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });

const sec = (Date.now() - t0) / 1000;
console.log(`\n完成 → ${output}  用时 ${sec.toFixed(0)}s  单帧 ${(sec / frames).toFixed(3)}s${pageErrors ? `  ⚠ 页面报错 ${pageErrors} 次` : ''}`);
process.exit(pageErrors ? 2 : 0);
