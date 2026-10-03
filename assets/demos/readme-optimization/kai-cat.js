/* =====================================================================
 * KAI 猫 · 代码版角色组件（Canvas 2D）
 * 用法：
 *   drawKaiCat(g, { x, y, size, t, pose, expr, style, dir, seed })
 *   x, y   脚底中心坐标（像素）
 *   size   角色总高度（像素，含耳机）
 *   t      秒；驱动眨眼、呼吸、摆尾、手绘抖动。画面只由 t 决定
 *   pose   'stand' 站立 | 'build' 双爪举在胸前（Build 时刻）| 'wave' 挥手 | 'point' 指向前方
 *   expr   'smile' 微笑 | 'happy' 眯眼笑 | 'wow' 惊讶 | 'think' 思考 | 'focus' 专注（闪电眼发光）
 *   style  'flat' 平面 | 'line' 手绘线稿 | 'pixel' 像素 | 'mono' 黑白剪影 + 信号色
 *   dir    1 正常 | -1 镜像
 * 识别点（任何风格都不能丢）：黄色耳机 + 白闪电、红色闪电瞳孔、胸前蓝色 KAI
 * ===================================================================== */
(function () {
  const KAI = {
    fur: '#55555a', furDark: '#3b3b40', cream: '#f4eedf',
    yellow: '#fcc23c', yellowDark: '#e3a01c', cushion: '#3f4048',
    red: '#e5262b', blue: '#2f80f5', blueDark: '#1d5cc0', white: '#ffffff', ink: '#17171a',
    blush: 'rgba(242,128,128,.5)', paper: '#f4f1ea',
  };
  const rnd = s => { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---------- 动画参数（全部由 t 算出，没有帧间状态） ----------
  function anim(t, seed) {
    const cyc = 3.1 + rnd(seed) * .8, ph = (t + rnd(seed + 1) * 3) % cyc;
    return {
      blink: ph < .14 ? Math.sin(ph / .14 * Math.PI) : 0,             // 0 睁 → 1 闭
      breathe: Math.sin(t * 2.4) * .012,                                // 身体轻微起伏
      tail: Math.sin(t * 1.8 + seed) * .16,                             // 尾巴摆动
      ear: ((t + seed) % 4.3) < .18 ? Math.sin(((t + seed) % 4.3) / .18 * Math.PI) : 0,  // 偶尔抖耳朵
    };
  }

  // ---------- 闪电（单位坐标，中心 0,0，高 1） ----------
  const BOLT = [[.08, -.5], [-.3, .08], [-.02, .08], [-.2, .5], [.32, -.1], [.04, -.1], [.32, -.5]];
  function boltPath(g, cx, cy, h, rot = 0, wx = 1) {
    const c = Math.cos(rot), s = Math.sin(rot);
    g.beginPath();
    BOLT.forEach(([bx, by], i) => { bx *= wx; const X = cx + (bx * c - by * s) * h, Y = cy + (bx * s + by * c) * h; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
    g.closePath();
  }

  function drawKaiCat(g, o = {}) {
    const { x = 0, y = 0, size = 300, t = 0, pose = 'stand', expr = 'smile', style = 'flat', dir = 1, seed = 1 } = o;
    if (style === 'pixel') return drawPixel(g, o);
    const u = size / 100, A = anim(t, seed);
    const LINE = style === 'line', MONO = style === 'mono', FLAT = style === 'flat';
    const jit = LINE ? Math.floor(t * 12) : 0;                        // 手绘抖动：每秒 12 次
    const INK = MONO ? '#f2f2f2' : KAI.ink;                           // 五官线条色
    let n = 0;
    // 形状：构建路径 → 按风格上色。keep=true 时保留原色（识别色）
    const shape = (build, fill, keep = false) => {
      n++; g.save();
      if (LINE) g.translate((rnd(jit * 31 + n) - .5) * .8, (rnd(jit * 17 + n * 3) - .5) * .8);
      build();
      let f = fill;
      if (LINE && !keep) f = KAI.paper;
      if (MONO && !keep) f = '#111';
      if (f) { g.fillStyle = f; g.fill(); }
      if (LINE) { g.strokeStyle = KAI.ink; g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke(); }
      else if (FLAT && fill === KAI.fur) { g.strokeStyle = KAI.furDark; g.lineWidth = .9; g.lineJoin = 'round'; g.stroke(); }
      else if (MONO && !keep) { g.strokeStyle = '#e8e8e8'; g.lineWidth = .9; g.lineJoin = 'round'; g.stroke(); }
      g.restore();
    };
    const ell = (cx, cy, rx, ry, r = 0) => () => { g.beginPath(); g.ellipse(cx, cy, rx, ry, r, 0, Math.PI * 2); };

    g.save(); g.translate(x, y); g.scale(dir * u, u);
    // 单位坐标：脚底 y=0，向上为负，全高约 100
    const hy = -55;                                                   // 头中心

    // 1. 尾巴
    g.save(); g.translate(15, -12); g.rotate(A.tail); g.lineCap = 'round';
    const tailPath = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(12, 3, 20, -4, 19, -17); g.bezierCurveTo(18.5, -24, 12.5, -26, 10.5, -21.5); };
    tailPath(); g.strokeStyle = LINE ? KAI.ink : MONO ? '#e8e8e8' : KAI.furDark; g.lineWidth = LINE ? 7.6 : 7.2; g.stroke();
    tailPath(); g.strokeStyle = LINE ? KAI.paper : MONO ? '#111' : KAI.fur; g.lineWidth = LINE ? 5 : 5.4; g.stroke();
    g.restore();

    // 2. 耳机头梁（在耳朵后面）
    g.save(); g.lineCap = 'round';
    const band = (r, a0, a1) => { g.beginPath(); g.arc(0, hy - 1, r, Math.PI * a0, Math.PI * a1); };
    band(33.5, 1.05, 1.95); g.strokeStyle = LINE ? KAI.ink : KAI.yellowDark; g.lineWidth = 7.4; g.stroke();
    band(33.5, 1.05, 1.95); g.strokeStyle = KAI.yellow; g.lineWidth = 5.6; g.stroke();
    band(30.6, 1.34, 1.66); g.strokeStyle = MONO ? '#333' : LINE ? KAI.ink : KAI.cushion; g.lineWidth = 3.6; g.stroke();
    g.restore();

    // 3. 脚
    [-1, 1].forEach(s => {
      shape(ell(s * 8.4, -4, 7.8, 4.8), KAI.fur);
      if (!MONO) { g.strokeStyle = LINE ? KAI.ink : KAI.furDark; g.lineWidth = .6; g.lineCap = 'round';
        [-2.2, 2.2].forEach(dx => { g.beginPath(); g.moveTo(s * 8.4 + dx, -1.4); g.lineTo(s * 8.4 + dx, -3.2); g.stroke(); }); }
    });

    // 4. 身体（梨形，顶部藏在头下面）
    g.save(); g.translate(0, -5); g.scale(1, 1 + A.breathe);
    shape(() => { g.beginPath(); g.moveTo(-16, 0); g.bezierCurveTo(-23, -8, -20, -26, -11, -32); g.lineTo(11, -32);
      g.bezierCurveTo(20, -26, 23, -8, 16, 0); g.quadraticCurveTo(0, 3, -16, 0); g.closePath(); }, KAI.fur);
    g.restore();

    // 5. 胸前 KAI
    g.save(); if (dir < 0) g.scale(-1, 1);
    g.font = `900 10px "Arial Rounded MT Bold","Nunito","Helvetica Neue",Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ky = pose === 'build' ? -14.5 : -17;
    if (FLAT) { g.fillStyle = KAI.blueDark; g.fillText('KAI', 0, ky + .7); }
    g.fillStyle = MONO ? KAI.yellow : KAI.blue; g.fillText('KAI', 0, ky);
    if (LINE) { g.strokeStyle = KAI.ink; g.lineWidth = .45; g.strokeText('KAI', 0, ky); }
    g.restore();

    // 6. 手臂
    const arm = (ax, ay, rot, len = 6.8) => {
      g.save(); g.translate(ax, ay); g.rotate(rot); shape(ell(0, 0, 4.3, len), KAI.fur);
      if (!MONO) { g.strokeStyle = LINE ? KAI.ink : KAI.furDark; g.lineWidth = .5; [-1.3, 1.3].forEach(dx => { g.beginPath(); g.moveTo(dx, len - .4); g.lineTo(dx, len - 2); g.stroke(); }); }
      g.restore();
    };
    const wv = Math.sin(t * 7) * .22;
    if (pose === 'build') { const k = Math.sin(t * 5) * .08; arm(-13.5, -30, 2.55 + k, 5.8); arm(13.5, -30, -2.55 - k, 5.8); }
    else if (pose === 'wave') { arm(-17, -20, .35); arm(18, -32, -2.6 + wv); }
    else if (pose === 'point') { arm(-17, -20, .35); arm(20, -24, -1.9); }
    else { arm(-17, -20, .35); arm(17, -20, -.35); }

    // 7. 耳朵
    [-1, 1].forEach(s => {
      g.save(); g.translate(s * 19, hy - 13); g.rotate(s * .28 + (s > 0 ? A.ear * .22 : 0)); g.scale(s, 1);
      shape(() => { g.beginPath(); g.moveTo(-11, 6); g.quadraticCurveTo(-5, -14, -1, -17); g.quadraticCurveTo(3, -16, 11, 5); g.closePath(); }, KAI.fur);
      shape(() => { g.beginPath(); g.moveTo(-6, 3); g.quadraticCurveTo(-3, -9, -.8, -11); g.quadraticCurveTo(2, -10, 6, 3); g.closePath(); }, MONO ? '#333' : KAI.cream, !MONO);
      g.restore();
    });

    // 8. 头
    shape(() => { g.beginPath(); g.moveTo(-31.5, hy + 1); g.bezierCurveTo(-32.5, hy - 33, 32.5, hy - 33, 31.5, hy + 1);
      g.bezierCurveTo(30.5, hy + 27, -30.5, hy + 27, -31.5, hy + 1); g.closePath(); }, KAI.fur);

    // 9. 耳罩
    [-1, 1].forEach(s => {
      shape(ell(s * 32.2, hy + 3, 4.6, 12.5), MONO ? '#333' : KAI.cushion, true);
      shape(ell(s * 37.2, hy + 3, 6.8, 14.4), KAI.yellow, true);
      if (FLAT) { g.save(); g.beginPath(); g.ellipse(s * 37.2, hy + 3, 6.8, 14.4, 0, 0, Math.PI * 2); g.clip();
        g.fillStyle = 'rgba(160,90,0,.16)'; g.beginPath(); g.ellipse(s * 37.2 + s * 3.5, hy + 5, 5, 15, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.save(); boltPath(g, s * 38, hy + 3, 8.5, .1); g.fillStyle = KAI.white; g.fill();
      if (LINE) { g.strokeStyle = KAI.ink; g.lineWidth = .45; g.stroke(); } g.restore();
    });

    // 10. 脸
    const eyeY = hy + 2;
    if (FLAT) [-1, 1].forEach(s => { g.fillStyle = KAI.blush; g.beginPath(); g.ellipse(s * 19.5, hy + 11, 4.6, 2.9, 0, 0, Math.PI * 2); g.fill(); });
    if (LINE) [-1, 1].forEach(s => { g.strokeStyle = KAI.red; g.lineWidth = .5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(s * 19.5 + i * 1.6 - 2.6, hy + 12.5); g.lineTo(s * 19.5 + i * 1.6 - 1.2, hy + 9.5); g.stroke(); } });
    // 眉毛
    [-1, 1].forEach(s => {
      const lift = expr === 'wow' ? -2.5 : 0, tilt = expr === 'think' && s > 0 ? -2.4 : expr === 'focus' ? 1.4 : 0;
      g.strokeStyle = INK; g.lineWidth = 1.45; g.lineCap = 'round'; g.beginPath();
      g.moveTo(s * 7.5, eyeY - 13 + lift + (expr === 'focus' ? 1.6 : 0)); g.quadraticCurveTo(s * 11.5, eyeY - 15.6 + lift, s * 16, eyeY - 13.6 + lift + tilt); g.stroke();
    });
    // 眼睛
    const closed = expr === 'happy' ? 1 : A.blink, look = expr === 'think' ? [1.8, -2.4] : [0, 0];
    [-1, 1].forEach(s => {
      const ex = s * 11.6, ey = eyeY;
      if (closed > .85) {
        g.strokeStyle = INK; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath();
        if (expr === 'happy') { g.moveTo(ex - 5.5, ey + 2); g.quadraticCurveTo(ex, ey - 5, ex + 5.5, ey + 2); }
        else { g.moveTo(ex - 5.5, ey + 1); g.quadraticCurveTo(ex, ey + 4, ex + 5.5, ey + 1); }
        g.stroke(); return;
      }
      const rx = expr === 'wow' ? 8.8 : 8.2, ry = Math.max(.6, (expr === 'wow' ? 10.6 : 9.8) * (1 - closed));
      g.save(); g.beginPath(); g.ellipse(ex, ey, rx, ry, s * -.08, 0, Math.PI * 2);
      g.fillStyle = KAI.white; g.fill();
      g.strokeStyle = LINE ? KAI.ink : 'rgba(0,0,0,.3)'; g.lineWidth = LINE ? .8 : .6; g.stroke();
      g.clip();
      const ix = ex + look[0] + s * .3, iy = ey + look[1] + .6;
      if (expr === 'focus') { g.shadowColor = KAI.red; g.shadowBlur = 5 * u; }
      boltPath(g, ix, iy + .4, expr === 'wow' ? 12.5 : 16, .02, 1.15);
      g.fillStyle = KAI.red; g.fill(); g.shadowBlur = 0;
      g.fillStyle = KAI.white; g.beginPath(); g.arc(ix + 1.6, iy - 4.4, 1.3, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    // 鼻子、嘴
    g.fillStyle = INK; g.beginPath(); g.moveTo(-1.7, hy + 7.4); g.lineTo(1.7, hy + 7.4); g.quadraticCurveTo(.4, hy + 9.6, 0, hy + 9.6); g.quadraticCurveTo(-.4, hy + 9.6, -1.7, hy + 7.4); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath();
    if (expr === 'wow') { g.fillStyle = MONO ? '#f2f2f2' : '#3a1618'; g.ellipse(0, hy + 13, 2.3, 2.9, 0, 0, Math.PI * 2); g.fill(); }
    else if (expr === 'think') { g.moveTo(-2.4, hy + 12.2); g.lineTo(2.6, hy + 11.6); g.stroke(); }
    else { const w = expr === 'happy' ? 1.25 : 1; g.moveTo(-4.2 * w, hy + 10.4); g.quadraticCurveTo(-2.1 * w, hy + 13.2, 0, hy + 10.4); g.quadraticCurveTo(2.1 * w, hy + 13.2, 4.2 * w, hy + 10.4); g.stroke(); }

    g.restore();
  }

  // ---------- 像素风：画到小画布 → 硬边 + 量化 → 无平滑放大 ----------
  const pixCache = {};
  function drawPixel(g, o) {
    const { x = 0, y = 0, size = 300, px = 6 } = o;
    const h = Math.max(24, Math.round(size / px)), w = Math.round(h * 1.15), key = w + 'x' + h;
    const c = pixCache[key] || (pixCache[key] = Object.assign(document.createElement('canvas'), { width: w, height: h }));
    const q = c.getContext('2d'); q.clearRect(0, 0, w, h);
    drawKaiCat(q, { ...o, style: 'flat', x: w / 2, y: h - 1, size: h * .97 });
    const d = q.getImageData(0, 0, w, h), p = d.data;
    for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0;   // 硬边
    q.putImageData(d, 0, 0);
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(c, Math.round(x - w * px / 2), Math.round(y - h * px), w * px, h * px); g.restore();
  }

  window.KAI_COLORS = KAI;
  window.drawKaiCat = drawKaiCat;
  window.drawBolt = (g, cx, cy, h, color = KAI.yellow, rot = .12) => { boltPath(g, cx, cy, h, rot); g.fillStyle = color; g.fill(); };
})();
