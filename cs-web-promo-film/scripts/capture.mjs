// 采集页面长截图。用法：node scripts/capture.mjs [capture.config.json]
//
// 关键点：很多应用在内层容器里滚动，fullPage 只能截到一屏。
// 这里改为「滚到底触发懒加载 → 读 scrollHeight → 把 viewport 撑到那么高 → 再滚一遍 → 截图」。
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

const CONFIG = process.argv[2] ?? 'capture.config.json';
const cfg = JSON.parse(await readFile(CONFIG, 'utf8'));

const OUT = cfg.out ?? 'public/captures';
const VIEWPORT = cfg.viewport ?? { width: 1440, height: 900 };
const DSF = cfg.deviceScaleFactor ?? 2;
const OVERLAY_TEXTS = cfg.overlayTexts ?? [];
const MAX_HEIGHT = cfg.maxHeight ?? 9000;

const walk = async (page, panel) => {
  for (let i = 0; i < 120; i += 1) {
    const atBottom = await page.evaluate((sel) => {
      const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
      const before = el.scrollTop;
      el.scrollTop = before + (el.clientHeight || window.innerHeight) * 0.7;
      return el.scrollTop === before;
    }, panel ?? null);
    await page.waitForTimeout(240);
    if (atBottom) break;
  }
  await page.evaluate((sel) => {
    const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
    el.scrollTop = 0;
  }, panel ?? null);
  await page.waitForTimeout(800);
};

const contentHeight = (page, panel) =>
  page.evaluate((sel) => {
    const el = (sel ? document.querySelector(sel) : null) ?? document.scrollingElement ?? document.body;
    return Math.max(el.scrollHeight, document.body.scrollHeight);
  }, panel ?? null);

// 付费墙、cookie 条、站方广告都是 fixed/sticky。只隐藏矮浮层，避免误伤整页容器。
const hideOverlays = (page, needles) =>
  page.evaluate((texts) => {
    if (!texts.length) return [];
    const hidden = [];
    for (const el of document.querySelectorAll('div, section, aside, header, footer')) {
      const style = getComputedStyle(el);
      if (style.position !== 'fixed' && style.position !== 'sticky') continue;
      const text = el.innerText ?? '';
      if (!texts.some((t) => text.includes(t))) continue;
      if (el.getBoundingClientRect().height > 400) continue;
      el.style.setProperty('display', 'none', 'important');
      hidden.push(text.replace(/\s+/g, ' ').slice(0, 40));
    }
    return hidden;
  }, needles);

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DSF,
    locale: cfg.locale ?? 'zh-CN',
    colorScheme: cfg.colorScheme ?? 'dark',
  });

  const summary = [];

  for (const target of cfg.targets) {
    const { label, url, panel } = target;
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForTimeout(target.settle ?? 3500);

      await walk(page, panel);

      const tall = Math.min(Math.ceil(await contentHeight(page, panel)) + 80, MAX_HEIGHT);
      await page.setViewportSize({ width: VIEWPORT.width, height: tall });
      await page.waitForTimeout(2500);
      // 撑高后可能触发新一批懒加载，必须再滚一遍。
      await walk(page, panel);

      const hidden = await hideOverlays(page, OVERLAY_TEXTS);
      await page.waitForTimeout(700);

      await page.screenshot({ path: `${OUT}/${label}.png` });
      summary.push({ label, height: tall });
      console.log(`${label}\t逻辑高度=${tall}\t像素=${VIEWPORT.width * DSF}x${tall * DSF}\t隐藏=[${hidden.join(' / ')}]`);
    } catch (error) {
      console.log(`${label}\t失败\t${error.message.split('\n')[0]}`);
    }
    await page.close();
  }

  await browser.close();

  console.log('\n填进 tokens.ts 的 PAGES：');
  for (const { label, height } of summary) {
    const key = label.replace(/-(.)/g, (_, c) => c.toUpperCase());
    console.log(`  ${key}: { file: 'captures/${label}.png', height: ${height}, title: '', grade: 1 },`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
