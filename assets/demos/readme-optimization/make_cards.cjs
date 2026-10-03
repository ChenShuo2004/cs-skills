// Render transparent, readable captions over the real browser recording.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const outDir = process.env.CARD_OUT_DIR || path.join(os.tmpdir(), 'cs-readme-cards');
fs.mkdirSync(outDir, { recursive: true });

const cards = [
  ['README 很长，入口却不清楚', '真实案例：先看旧版仓库首页'],
  ['调用 $cs-clean-code', '目标：让新人知道是什么、怎么用、怎么验证'],
  ['先核对仓库事实', 'AGENTS.md、SKILL.md、安装脚本：能力与数字都要对得上'],
  ['按阅读路径重排', '定位 → 工作流 → Skill 地图 → 案例 → 安装'],
  ['优化前：信息齐，入口分散', '旧版 README 需要在多张表和多段说明之间找重点'],
  ['优化后：先理解，再动手', '当前 README 把工作流、真实案例和复制命令放到前面'],
  ['验证后再推送', '检查链接与示例 → GitHub 推送 → 核对远端 SHA'],
  ['复制这句就能开始', '$cs-clean-code 优化 README：核对事实、重排结构、验证链接'],
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  for (let i = 0; i < cards.length; i++) {
    const [title, subtitle] = cards[i];
    await page.setContent(`<html lang="zh"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;background:transparent;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","STHeiti",sans-serif}
      .tag{position:absolute;top:26px;right:32px;padding:10px 18px;border-radius:10px;background:rgba(8,35,35,.91);color:#d8fff2;font-size:20px;font-weight:700;letter-spacing:.06em}
      .card{position:absolute;left:30px;right:30px;bottom:26px;height:164px;padding:24px 30px;display:flex;gap:26px;align-items:center;border-radius:18px;background:rgba(7,28,30,.94);border:1px solid rgba(83,218,169,.65);box-shadow:0 16px 42px rgba(0,0,0,.29);color:#fff}
      .num{flex:none;width:72px;height:72px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:#42bd9b;color:#052723;font-size:34px;font-weight:800}
      .title{font-size:38px;font-weight:800;line-height:1.15}.subtitle{margin-top:12px;color:#d4f0e8;font-size:25px;line-height:1.25}
      </style><body><div class="tag">CS SKILLS · README 优化教程</div><div class="card"><div class="num">${String(i + 1).padStart(2, '0')}</div><div><div class="title">${title}</div><div class="subtitle">${subtitle}</div></div></div></body></html>`);
    await page.screenshot({ path: path.join(outDir, `card-${String(i + 1).padStart(2, '0')}.png`), omitBackground: true });
  }
  await browser.close();
  console.log(outDir);
})().catch((error) => { console.error(error); process.exit(1); });
