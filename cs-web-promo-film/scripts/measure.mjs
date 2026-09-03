// 实测元素坐标，供运镜落点和点击指针使用。
// 用法：node scripts/measure.mjs [capture.config.json]
//
// 加载路径必须与 capture.mjs 完全一致，否则量到的 y 与截图对不上。
// 这里用 deviceScaleFactor 1，产出的就是页面逻辑坐标，可直接填进 PromoFilm。
import { chromium } from 'playwright';
import { writeFile, readFile } from 'node:fs/promises';

const CONFIG = process.argv[2] ?? 'capture.config.json';
const cfg = JSON.parse(await readFile(CONFIG, 'utf8'));

const OUT = cfg.out ?? 'public/captures';
const VIEWPORT = cfg.viewport ?? { width: 1440, height: 900 };
const MAX_HEIGHT = cfg.maxHeight ?? 9000;

const walk = async (page, panel) => {
  for (let i = 0; i < 120; i += 1) {
    const atBottom = await page.evaluate((sel) => {
      const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
      const before = el.scrollTop;
      el.scrollTop = before + (el.clientHeight || window.innerHeight) * 0.7;
      return el.scrollTop === before;
    }, panel ?? null);
    await page.waitForTimeout(220);
    if (atBottom) break;
  }
  await page.evaluate((sel) => {
    const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
    el.scrollTop = 0;
  }, panel ?? null);
  await page.waitForTimeout(700);
};

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: cfg.locale ?? 'zh-CN',
    colorScheme: cfg.colorScheme ?? 'dark',
  });
  const result = {};

  for (const target of cfg.targets) {
    if (!target.needles?.length) continue;
    const { label, url, panel } = target;
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(target.settle ?? 3500);
    await walk(page, panel);

    const height = await page.evaluate((sel) => {
      const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
      return Math.max(el.scrollHeight, document.body.scrollHeight);
    }, panel ?? null);
    const tall = Math.min(Math.ceil(height) + 80, MAX_HEIGHT);
    await page.setViewportSize({ width: VIEWPORT.width, height: tall });
    await page.waitForTimeout(2500);
    await walk(page, panel);

    // 命中策略：包含该文案且面积最小的元素，避免量到外层容器。
    const boxes = await page.evaluate((needles) => {
      const found = {};
      for (const needle of needles) {
        const key = needle.replace(/\s+/g, '');
        let best = null;
        for (const el of document.querySelectorAll('div, span, a, h1, h2, h3, p, li, button')) {
          const text = (el.textContent ?? '').replace(/\s+/g, '');
          if (!text.includes(key)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) continue;
          const area = r.width * r.height;
          if (!best || area < best.area) best = { area, x: r.x, y: r.y, w: r.width, h: r.height };
        }
        if (best) {
          found[needle] = {
            x: Math.round(best.x),
            y: Math.round(best.y + window.scrollY),
            w: Math.round(best.w),
            h: Math.round(best.h),
          };
        }
      }
      return found;
    }, target.needles);

    result[label] = { viewport: tall, boxes };
    console.log(`\n### ${label}（逻辑高度 ${tall}）`);
    for (const needle of target.needles) {
      const box = boxes[needle];
      if (!box) {
        console.log(`  ${needle.padEnd(16)} 未命中，换更长的连续文案`);
        continue;
      }
      console.log(`  ${needle.padEnd(16)} x=${box.x} y=${box.y} w=${box.w} h=${box.h}  中心=(${box.x + Math.round(box.w / 2)}, ${box.y + Math.round(box.h / 2)})`);
    }
    await page.close();
  }

  await writeFile(`${OUT}/boxes.json`, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n已写入 ${OUT}/boxes.json`);
  await browser.close();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
