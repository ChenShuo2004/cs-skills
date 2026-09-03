// 扫描全片平均亮度，找转场接黑。
//
// 先抽缩略图（Remotion 自带 ffmpeg 禁用了 fps 滤镜，用 -r 控制帧率）：
//   npx.cmd remotion ffmpeg -i out/promo.mp4 -r 4 -s 480x270 out/qa/%04d.jpg
// 再扫：
//   node scripts/luma-sweep.mjs out/qa [抽帧帧率]
import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';

const DIR = process.argv[2] ?? 'out/qa';
const FPS = Number(process.argv[3] ?? 4);

const main = async () => {
  const files = (await readdir(DIR)).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  if (!files.length) {
    console.error(`${DIR} 里没有图片，先用 ffmpeg 抽帧`);
    process.exit(1);
  }

  const images = [];
  for (const file of files) {
    const ext = file.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    images.push(`data:image/${ext};base64,${(await readFile(`${DIR}/${file}`)).toString('base64')}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const lumas = await page.evaluate(async (srcs) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const out = [];
    for (const src of srcs) {
      const img = new Image();
      img.src = src;
      await img.decode();
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      out.push(sum / (data.length / 4));
    }
    return out;
  }, images);
  await browser.close();

  const peak = Math.max(...lumas);
  const floor = Math.min(...lumas);

  lumas.forEach((luma, i) => {
    const seconds = (i / FPS).toFixed(2);
    const bar = '#'.repeat(Math.max(0, Math.round((luma / peak) * 44)));
    // 局部低谷 = 比前后两侧都暗一截，这才是转场接黑；整段偏暗是设计选择。
    const prev = lumas[i - 1] ?? luma;
    const next = lumas[i + 1] ?? luma;
    const dip = luma < prev * 0.94 && luma < next * 0.94;
    const flags = [dip ? '  <-- 局部低谷' : '', luma < 28 ? '  <-- 过暗' : ''].join('');
    console.log(`${seconds.padStart(6)}s ${luma.toFixed(1).padStart(6)} | ${bar}${flags}`);
  });

  console.log(`\n峰值 ${peak.toFixed(1)}  谷值 ${floor.toFixed(1)}  明暗比 ${(peak / Math.max(floor, 1)).toFixed(1)} 倍`);
  if (peak / Math.max(floor, 1) > 4) console.log('明暗比超过 4 倍：浅色页需要压曝光');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
