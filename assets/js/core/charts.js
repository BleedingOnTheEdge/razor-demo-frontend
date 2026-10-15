/* ============================================================
   RAZOR CLOUD — High-Performance Canvas Chart Engine
   Apple Light Theme · High Precision · Retina (HiDPI) Support
   ============================================================ */
(function() {
  function hexToRgba(c, a) {
    if (!c) return `rgba(0, 113, 227, ${a})`;
    if (c.startsWith('#')) {
      let hex = c.slice(1);
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const num = parseInt(hex, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`;
    }
    if (c.startsWith('rgba')) {
      return c.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${a})`);
    }
    if (c.startsWith('rgb')) {
      return c.replace(/rgb\(([^)]+)\)/, `rgba($1, ${a})`);
    }
    return c;
  }

  function setupCanvas(cv) {
    if (!cv) return { ctx: null, w: 0, h: 0 };
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, r.width * dpr);
    cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function drawArea(cv, data, color, opt = {}) {
    if (!cv || !data || data.length < 2) return;
    const { ctx, w, h } = setupCanvas(cv);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const isRtl = (window.i18n && window.i18n.currentCulture === 'fa-IR');
    const pad = { t: 14, r: isRtl ? 48 : 14, b: 18, l: isRtl ? 14 : 48 };
    const iw = w - pad.l - pad.r;
    const ih = h - pad.t - pad.b;

    let mn = Math.min(...data), mx = Math.max(...data);
    if (opt.baseline != null) {
      mn = Math.min(mn, opt.baseline);
      mx = Math.max(mx, opt.baseline);
    }
    if (mn === mx) { mn -= 1; mx += 1; }
    const rng = mx - mn;

    const X = i => isRtl
      ? (pad.l + iw * (1 - i / (data.length - 1)))
      : (pad.l + iw * (i / (data.length - 1)));

    const Y = v => pad.t + ih * (1 - (v - mn) / rng);

    // Apple subtle grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#86868b';
    ctx.font = '10px JetBrains Mono, SF Mono, Menlo, monospace';
    ctx.textAlign = isRtl ? 'left' : 'right';

    for (let g = 0; g <= 4; g++) {
      const y = pad.t + ih * g / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();

      const val = mx - rng * g / 4;
      const textVal = opt.money ? ('$' + Math.round(val).toLocaleString()) : val.toFixed(opt.dec ?? 2);
      const textX = isRtl ? (w - pad.r + 6) : (pad.l - 6);
      ctx.fillText(textVal, textX, y + 3);
    }

    // Baseline indicator
    if (opt.baseline != null) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, Y(opt.baseline));
      ctx.lineTo(w - pad.r, Y(opt.baseline));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Soft translucent gradient area fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ih);
    grad.addColorStop(0, hexToRgba(color, 0.15));
    grad.addColorStop(1, hexToRgba(color, 0.01));

    ctx.beginPath();
    ctx.moveTo(X(0), Y(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(X(i), Y(data[i]));
    }
    ctx.lineTo(X(data.length - 1), pad.t + ih);
    ctx.lineTo(X(0), pad.t + ih);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(X(0), Y(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(X(i), Y(data[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Last point indicator dot
    const lx = X(data.length - 1), ly = Y(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(color, 0.25);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawLine(cv, data, color) {
    if (!cv || !data || data.length < 2) return;
    const { ctx, w, h } = setupCanvas(cv);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const pad = { t: 12, r: 12, b: 16, l: 40 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    let mn = Math.min(...data), mx = Math.max(...data);
    if (mn === mx) mn -= 1;
    const rng = mx - mn || 1;

    const X = i => pad.l + iw * (i / (data.length - 1));
    const Y = v => pad.t + ih * (1 - (v - mn) / rng);

    // Subtle Apple grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const y = pad.t + ih * g / 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(X(0), Y(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
      ctx.beginPath();
      ctx.arc(X(i), Y(data[i]), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDonut(cv, segs, label) {
    if (!cv) return;
    const { ctx, w, h } = setupCanvas(cv);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 8, r = R - 12;
    const tot = segs.reduce((a, s) => a + s.v, 0);
    let a = -Math.PI / 2;

    segs.forEach(s => {
      const ang = s.v / tot * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a, a + ang);
      ctx.arc(cx, cy, r, a + ang, a, true);
      ctx.closePath();
      ctx.fillStyle = s.c;
      ctx.fill();
      a += ang;
    });

    // Apple High-Contrast Center Typography
    ctx.fillStyle = '#1d1d1f';
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.t, cx, cy - 6);
    ctx.fillStyle = '#86868b';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
    ctx.fillText(label.s, cx, cy + 12);
  }

  function drawSpark(cv, data, color) {
    if (!cv || !data || data.length < 2) return;
    const { ctx, w, h } = setupCanvas(cv);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    let mn = Math.min(...data), mx = Math.max(...data);
    const rng = (mx - mn) || 1;
    const X = i => w * i / (data.length - 1);
    const Y = v => h - 2 - (h - 4) * (v - mn) / rng;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hexToRgba(color, 0.18));
    g.addColorStop(1, hexToRgba(color, 0.01));

    ctx.beginPath();
    ctx.moveTo(0, Y(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, Y(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function setGauge(el, pct, color) {
    if (!el) return;
    el.style.background = `conic-gradient(${color} ${pct * 3.6}deg, #e5e5ea 0)`;
  }

  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function walk(n, start, drift, vol, seed) {
    const r = mulberry32(seed);
    let v = start;
    const o = [];
    for (let i = 0; i < n; i++) {
      v *= (1 + (r() - 0.5 + drift) * vol);
      o.push(v);
    }
    return o;
  }

  window.setupCanvas = setupCanvas;
  window.drawArea = drawArea;
  window.drawLine = drawLine;
  window.drawDonut = drawDonut;
  window.drawSpark = drawSpark;
  window.setGauge = setGauge;
  window.mulberry32 = mulberry32;
  window.walk = walk;
})();
