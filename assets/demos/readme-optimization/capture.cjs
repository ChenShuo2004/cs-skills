// Record real, public GitHub pages for the README optimization walkthrough.
// Requires Playwright and its FFmpeg helper. The result is written to RAW_VIDEO_DIR.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const here = __dirname;
const timeline = require(path.join(here, 'timeline.json'));
const rawDir = process.env.RAW_VIDEO_DIR || path.join(os.tmpdir(), 'cs-readme-recording');
fs.mkdirSync(rawDir, { recursive: true });

const urls = {
  before: 'https://github.com/ChenShuo2004/cs-skills/blob/caacd86de4b0ab23a0469eb5ea7506cb72a62630/README.md',
  after: 'https://github.com/ChenShuo2004/cs-skills/blob/main/README.md',
  clean: 'https://github.com/ChenShuo2004/cs-skills/blob/main/cs-clean-code/SKILL.md',
  rules: 'https://github.com/ChenShuo2004/cs-skills/blob/main/AGENTS.md',
  change: 'https://github.com/ChenShuo2004/cs-skills/commit/0b27495ba82a9297eb4028ee443edb69b7a0ef31',
};

async function navigate(page, url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(650);
    if (!(await page.locator('body').innerText()).includes("We're having a really bad day")) return;
  }
  throw new Error(`GitHub page remained unavailable: ${url}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: { width: 1600, height: 900 } },
  });

  // Warm the browser cache before the recorded take. These pages are all public.
  const warmup = await context.newPage();
  for (const url of new Set(Object.values(urls))) await navigate(warmup, url);
  await warmup.close();

  const page = await context.newPage();
  const started = Date.now();
  const until = async (seconds) => page.waitForTimeout(Math.max(0, started + seconds * 1000 - Date.now()));
  const scroll = (top) => page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top);
  const s = timeline.scenes;

  await navigate(page, urls.before);
  await until(5); await scroll(430);
  await until(s[0].end); await navigate(page, urls.clean);
  await until(13); await scroll(650);
  await until(s[1].end); await navigate(page, urls.rules);
  await until(s[2].end); await navigate(page, urls.after);
  await until(29); await scroll(1050);
  await until(s[3].end); await navigate(page, urls.before);
  await until(37); await scroll(1100);
  await until(s[4].end); await navigate(page, urls.after);
  await until(46); await scroll(1250);
  await until(49); await scroll(1750);
  await until(s[5].end); await navigate(page, urls.change);
  await until(56); await scroll(950);
  await until(s[6].end); await navigate(page, urls.after);
  await until(65); await scroll(1200);
  await until(timeline.total_seconds);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ videoPath, seconds: (Date.now() - started) / 1000 }));
})().catch((error) => { console.error(error); process.exit(1); });
