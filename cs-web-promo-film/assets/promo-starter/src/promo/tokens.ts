// 视觉系统。换品牌只改这个文件。
// 默认是暖深色：底色取自近黑的产品卡，金色取自品牌题字。

export const C = {
  canvas: '#16130F',
  canvasDeep: '#0B0A09',
  gold: '#D9A24B',
  goldSoft: '#C08A4A',
  cream: '#F2EAE0',
  muted: '#98897B',
  hairline: 'rgba(242, 234, 224, 0.11)',
  chrome: '#1E1A17',
} as const;

export const GLOW = {
  warm: 'radial-gradient(1100px 720px at 78% 12%, rgba(217, 162, 75, 0.19), transparent 68%)',
  ember: 'radial-gradient(900px 700px at 12% 88%, rgba(150, 74, 40, 0.14), transparent 70%)',
  // 近黑的产品页放在近黑画布上会糊成一团，窗口后面这层暖光把它托起来。
  halo: 'radial-gradient(980px 660px at 64% 50%, rgba(217, 162, 75, 0.10), transparent 72%)',
  // 超过 0.40 的黑会吃掉四角内容。
  vignette: 'radial-gradient(1500px 900px at 50% 46%, transparent 46%, rgba(0, 0, 0, 0.40) 100%)',
} as const;

export const SHADOW = {
  window:
    '0 46px 130px rgba(0, 0, 0, 0.78), 0 0 110px rgba(217, 162, 75, 0.11), 0 0 0 1px rgba(242, 234, 224, 0.14)',
  pill: '0 10px 26px rgba(0, 0, 0, 0.35)',
} as const;

// 采集时的逻辑宽度。所有 panX / scroll 都是这套单位。
export const PAGE_WIDTH = 1440;

// height 填 capture.mjs 打印的逻辑高度，填错会在滚动到页面末尾时露白。
// grade 只是曝光：浅色页压到 0.93–0.95，切到近黑页面时才不闪。不改内容。
export const PAGES = {
  example: { file: 'captures/example.png', height: 1433, title: 'example.com', grade: 0.95 },
} as const;
