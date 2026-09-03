// 在截图里定位某种颜色的密集区间，用来精确裁出品牌题字或 logo。
//
// 用法：
//   node scripts/find-region.mjs public/captures/home.png gold
//   node scripts/find-region.mjs public/captures/home.png --rule "r>200&&g>200&&b>200" --scan 600
//
// 预设：gold（饱和金铜色笔画）、bright（近白）、dark（近黑）
// 输出列/行直方图，密集区间的边界就是裁切框。判据太松会把整块暖色背景算进去，
// 先跑一次看图，再收紧阈值，直到只剩一个明确区间。
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const [, , FILE, ...rest] = process.argv;
if (!FILE) {
  console.error('用法：node scripts/find-region.mjs <图片> [预设|--rule "表达式"] [--scan 逻辑高度] [--width 逻辑宽度]');
  process.exit(1);
}

const RULES = {
  gold: 'r > 165 && r - b > 95 && g - b > 35 && b < 130',
  bright: 'r > 215 && g > 215 && b > 215',
  dark: 'r < 60 && g < 60 && b < 60',
};

const arg = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? fallback : rest[i + 1];
};

const preset = rest.find((a) => !a.startsWith('--') && RULES[a]);
const rule = arg('rule', RULES[preset ?? 'gold']);
const SCAN = Number(arg('scan', 500));
const LOGICAL_WIDTH = Number(arg('width', 1440));
const BUCKET = Number(arg('bucket', 20));

const IMAGE = `data:image/png;base64,${(await readFile(FILE)).toString('base64')}`;

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  // file:// 图片进不了 canvas（跨源），所以用 base64 data URI 传进去。
  const result = await page.evaluate(
    async ({ src, rule, scan, logicalWidth, bucket }) => {
      const img = new Image();
      img.src = src;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const dsf = img.naturalWidth / logicalWidth;
      const scanHeight = Math.min(Math.round(scan * dsf), img.naturalHeight);
      const { data } = ctx.getImageData(0, 0, img.naturalWidth, scanHeight);

      const test = new Function('r', 'g', 'b', `return (${rule});`);
      const cols = new Array(Math.ceil(logicalWidth / bucket)).fill(0);
      const rows = new Array(Math.ceil(scan / bucket)).fill(0);
      let hits = 0;

      for (let y = 0; y < scanHeight; y += 2) {
        for (let x = 0; x < img.naturalWidth; x += 2) {
          const i = (y * img.naturalWidth + x) * 4;
          if (!test(data[i], data[i + 1], data[i + 2])) continue;
          hits += 1;
          cols[Math.floor(x / dsf / bucket)] += 1;
          rows[Math.floor(y / dsf / bucket)] += 1;
        }
      }

      return { dsf, hits, cols, rows, size: [img.naturalWidth, img.naturalHeight] };
    },
    { src: IMAGE, rule, scan: SCAN, logicalWidth: LOGICAL_WIDTH, bucket: BUCKET },
  );

  const show = (label, arr) => {
    const peak = Math.max(...arr);
    console.log(`\n${label}（峰值 ${peak}，每格 ${BUCKET} 逻辑像素）`);
    let first = null;
    let last = null;
    arr.forEach((v, i) => {
      if (v === 0) return;
      if (v > peak * 0.15) {
        if (first === null) first = i * BUCKET;
        last = (i + 1) * BUCKET;
      }
      console.log(`${String(i * BUCKET).padStart(5)} | ${'#'.repeat(Math.max(1, Math.round((v / peak) * 46)))} ${v}`);
    });
    console.log(`密集区间（占峰值 15% 以上）：${first} – ${last}`);
  };

  console.log(`图片 ${result.size[0]}x${result.size[1]}  deviceScaleFactor ${result.dsf}`);
  console.log(`判据 ${rule}`);
  console.log(`命中像素 ${result.hits}`);
  if (result.hits < 200) console.log('命中过少：判据太严，或扫描高度不够');
  show('列（逻辑 x）', result.cols);
  show('行（逻辑 y）', result.rows);

  await browser.close();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
