/* =====================================================================
 * KAILayers · 把 GPT 出的图变成动画（Canvas 2D，画面只由 t 决定）
 *
 *   await KAILayers.load({ desk: 'images/s03_desk.png', av0: 'images/avatar_0.png', ... });
 *   const L = KAILayers, I = L.img;          // I.desk 就是加载好的图片
 *
 * 插画镜头（GPT 图为主）
 *   L.illustration(g, I.desk, k, { from:[1,0,0], to:[1.08,-.02,0], rect, radius, bg })   运镜：缩放 + 平移
 *   L.parallax(g, [{img, depth}], k, { push, pan })                                    分层视差（前景/角色/背景）
 * 讲解镜头（代码为主）
 *   L.grid(g, W, H)                                                                    深色网格底
 *   L.card(g, img, k, { x, y, w, h, label, radius, glow })                             素材卡片弹入，label 是底部标签
 *   L.promptBox(g, text, k, { x, y, w, h, title })                                     对话框逐字打出 + 发送按钮
 *   L.bigStep(g, n, title, sub, k, { x, y })                                           大号步骤数字
 *   L.avatar(g, [闭嘴, 半张, 张大], t, speaking, { x, y, r, color, side, glow })        头像对口型 + 说话线（KAI 猫：color 黄、side -1 放右下、glow 闪电时发光）
 * 字幕
 *   L.subtitle(g, text, { y, style: 'box' | 'plain', size })                           插画镜头用 box，讲解镜头用 plain
 * k：本镜头内 0→1 的进度（通常 = 镜头内时间 / 镜头时长）
 * ===================================================================== */
(function () {
  const C = { blue: '#0059C0', blue2: '#3270D6', white: '#F5EFF5', black: '#111111', lblue: '#8AC7F5', orange: '#FF8A1F',
    bg: '#0b0d10', grid: 'rgba(255,255,255,.045)', paper: '#f7f5f0', ink: '#f5f5f7', card: '#f1eee6' };
  const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const spring = (x, w = 14, z = .72) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };
  const rnd = s => { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const img = {};

  function load(map) {
    return Promise.all(Object.entries(map).map(([k, src]) => new Promise((ok, bad) => {
      const im = new Image(); im.onload = () => { img[k] = im; ok(); }; im.onerror = () => bad(new Error('图片加载失败：' + src)); im.src = src;
    })));
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  // 按 cover 方式把图片铺进矩形，s 缩放、px/py 平移（相对矩形宽高）
  function cover(g, im, x, y, w, h, s = 1, px = 0, py = 0) {
    const k = Math.max(w / im.width, h / im.height) * s, iw = im.width * k, ih = im.height * k;
    g.drawImage(im, x + (w - iw) / 2 + px * w, y + (h - ih) / 2 + py * h, iw, ih);
  }

  // ---------- 插画镜头 ----------
  function illustration(g, im, k, o = {}) {
    const W = g.canvas.width, H = g.canvas.height, S = Math.min(W / 1920, H / 1080);
    const { from = [1, 0, 0], to = [1.07, 0, 0], bg = C.paper, radius = 22, frame = true } = o;
    const rect = o.rect || (frame ? [40 * S, 30 * S, W - 80 * S, H - 170 * S] : [0, 0, W, H]);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W, H); }
    const e = ease(k), s = from[0] + (to[0] - from[0]) * e, px = from[1] + (to[1] - from[1]) * e, py = from[2] + (to[2] - from[2]) * e;
    g.save(); rr(g, ...rect, frame ? radius * S : 0); g.clip(); cover(g, im, ...rect, s, px, py); g.restore();
    if (frame) { g.save(); rr(g, ...rect, radius * S); g.lineWidth = 2 * S; g.strokeStyle = 'rgba(0,0,0,.55)'; g.stroke(); g.restore(); }
  }
  function parallax(g, layers, k, o = {}) {
    const W = g.canvas.width, H = g.canvas.height, { push = .06, pan = -.03 } = o, e = ease(k);
    for (const L of layers) { const d = L.depth ?? 0; cover(g, L.img, 0, 0, W, H, 1 + push * e * (1 + d), pan * e * d, 0); }
  }

  // ---------- 讲解镜头 ----------
  function grid(g, W, H, step = 60) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const S = Math.min(W / 1920, H / 1080); g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let x = 0; x < W; x += step * S) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += step * S) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  }
  function card(g, im, k, o) {
    const S = Math.min(g.canvas.width / 1920, g.canvas.height / 1080), { x, y, w, h, label, radius = 14, glow = false, delay = 0 } = o;
    const p = spring(k - delay, 15, .7); if (p <= 0) return;
    g.save(); g.translate(x + w / 2, y + h / 2 + (1 - p) * 40 * S); g.scale(.85 + .15 * p, .85 + .15 * p); g.globalAlpha = clamp(p * 1.4);
    const X = -w / 2, Y = -h / 2;
    if (glow) { g.shadowColor = C.lblue; g.shadowBlur = 30 * S; }
    rr(g, X - 3 * S, Y - 3 * S, w + 6 * S, h + 6 * S, radius * S); g.fillStyle = glow ? C.lblue : '#fff'; g.fill(); g.shadowBlur = 0;
    g.save(); rr(g, X, Y, w, h, (radius - 3) * S); g.clip(); cover(g, im, X, Y, w, h);
    if (label) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(X, Y + h - 46 * S, w, 46 * S);
      g.fillStyle = '#fff'; g.font = `700 ${26 * S}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, Y + h - 23 * S); }
    g.restore(); g.restore();
  }
  function promptBox(g, text, k, o) {
    const S = Math.min(g.canvas.width / 1920, g.canvas.height / 1080), { x, y, w, h = 190 * S, title = '', typeEnd = .6 } = o;
    const p = spring(k * 3, 16, .8); if (p <= 0) return;
    g.save(); g.globalAlpha = clamp(p); g.translate(0, (1 - p) * 30 * S);
    if (title) { g.fillStyle = C.ink; g.font = `600 ${30 * S}px ${FONT}`; g.textAlign = 'center'; g.fillText(title, x + w / 2, y - 26 * S); }
    rr(g, x, y, w, h, 20 * S); g.fillStyle = C.card; g.fill();
    const n = Math.floor([...text].length * clamp((k - .08) / typeEnd));
    g.fillStyle = '#222'; g.font = `600 ${32 * S}px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText([...text].slice(0, n).join('') + (n < [...text].length && Math.floor(k * 40) % 2 ? '|' : ''), x + 34 * S, y + 34 * S);
    g.fillStyle = '#777'; g.font = `400 ${20 * S}px ${FONT}`; g.fillText('+   Tools', x + 34 * S, y + h - 48 * S);
    const send = k > typeEnd + .1; g.fillStyle = send ? C.orange : '#c9c4b8';
    g.beginPath(); g.arc(x + w - 46 * S, y + h - 38 * S, 20 * S, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3 * S; g.beginPath(); g.moveTo(x + w - 46 * S, y + h - 28 * S); g.lineTo(x + w - 46 * S, y + h - 48 * S);
    g.moveTo(x + w - 54 * S, y + h - 40 * S); g.lineTo(x + w - 46 * S, y + h - 48 * S); g.lineTo(x + w - 38 * S, y + h - 40 * S); g.stroke();
    g.restore();
  }
  function bigStep(g, n, title, sub, k, o = {}) {
    const S = Math.min(g.canvas.width / 1920, g.canvas.height / 1080), { x = 760 * S, y = 380 * S } = o, p = spring(k * 3, 12, .85);
    g.save(); g.globalAlpha = clamp(p); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = C.orange; g.font = `300 ${220 * S * (.8 + .2 * p)}px ${FONT}`; g.fillText(String(n), x, y + 160 * S);
    g.fillStyle = '#c9ccd3'; g.font = `500 ${28 * S}px ${FONT}`; g.fillText(sub, x + 170 * S, y + 30 * S);
    g.fillStyle = C.ink; g.font = `700 ${56 * S}px ${FONT}`; g.fillText(title, x + 170 * S, y + 110 * S); g.restore();
  }
  // 头像：frames = [闭嘴, 半张, 张大]（GPT 一次出一条横排三格再切开）；speaking 时按种子节奏换嘴型
  function avatar(g, frames, t, speaking, o = {}) {
    const S = Math.min(g.canvas.width / 1920, g.canvas.height / 1080), { x = 150 * S, y = 900 * S, r = 78 * S, seed = 1, color = C.orange, side = 1, glow = 0 } = o;
    let f = 0;
    if (speaking) { const step = Math.floor(t * 9); const v = rnd(step * 1.7 + seed); f = v < .3 ? 0 : v < .65 ? 1 : 2; }
    const im = frames[Math.min(f, frames.length - 1)];
    const bob = speaking ? Math.sin(t * 9) * 2 * S : 0;
    g.save(); g.beginPath(); g.arc(x, y + bob, r, 0, 7); g.fillStyle = '#fbf6ee'; g.fill(); g.clip(); cover(g, im, x - r, y - r + bob, 2 * r, 2 * r); g.restore();
    g.save(); g.lineWidth = 3 * S; g.strokeStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x, y + bob, r, 0, 7); g.stroke(); g.restore();
    if (glow > 0) { g.save(); g.globalAlpha = glow; g.shadowColor = color; g.shadowBlur = 40 * S; g.lineWidth = 6 * S; g.strokeStyle = color;
      g.beginPath(); g.arc(x, y + bob, r + 4 * S, 0, 7); g.stroke(); g.restore(); }
    if (speaking) { g.save(); g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = 9 * S;
      [-.75, -.35, .05, .45].forEach((a, i) => { const L = (22 + 14 * rnd(Math.floor(t * 9) + i * 3.1)) * S, R = r + 18 * S, ca = side > 0 ? Math.cos(a) : -Math.cos(a);
        g.beginPath(); g.moveTo(x + ca * R, y + Math.sin(a) * R); g.lineTo(x + ca * (R + L), y + Math.sin(a) * (R + L)); g.stroke(); });
      g.restore(); }
  }

  // ---------- 字幕 ----------
  function subtitle(g, text, o = {}) {
    if (!text) return; const W = g.canvas.width, H = g.canvas.height, S = Math.min(W / 1920, H / 1080);
    const { y = H - 52 * S, style = 'plain', size = 34 } = o;
    g.save(); g.font = `600 ${size * S}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (style === 'box') { const w = g.measureText(text).width + 24 * S; g.fillStyle = '#111'; g.fillRect(W / 2 - w / 2, y - 26 * S, w, 52 * S); g.fillStyle = '#fff'; }
    else g.fillStyle = C.ink;
    g.fillText(text, W / 2, y); g.restore();
  }

  window.KAILayers = { C, img, load, cover, illustration, parallax, grid, card, promptBox, bigStep, avatar, subtitle, ease, spring, clamp };
})();
