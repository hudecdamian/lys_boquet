const stage = document.getElementById('stage');
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

const src = document.createElement('canvas');
const sx = src.getContext('2d');

const low = document.createElement('canvas');
const lx = low.getContext('2d', { willReadFrequently: true });

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eo = t => 1 - Math.pow(1 - t, 3);

function rng(a) {
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = {
  red: ['#4a0808', '#c8191c', '#ff6048', '#f0b030'],
  white: ['#b8b060', '#ece4d4', '#ffffff', '#a8541a'],
  yellow: ['#9a5a10', '#e8b428', '#fff08a', '#a05a10'],
  pink: ['#5a1448', '#c64fb8', '#f2a0e6', '#f0c040'],
  mag: ['#4a0e40', '#a8309a', '#e070c8', '#f0b030'],
  cream: ['#a8601e', '#e8cfae', '#fff3e0', '#8a3a10'],
  tan: ['#4a2410', '#a8714a', '#e0b088', '#6a2a10'],
  dark: ['#240404', '#7a0f12', '#c02a2a', '#f4b838'],
  green: ['#1f5a18', '#5aa83a', '#a8e070', '#000000']
};

const VW = 100;
const VH = 130;

const F = [
  ['green', 42, 5, 14, 0, 1, 1],
  ['dark', 65, 3, 14, 0, 1, 1],
  ['tan', 51.5, 12, 14, 0.2, 0.75],
  ['white', 27, 23.5, 12, -0.5, 0.8],
  ['yellow', 72.5, 22.5, 14, 0.3, 0.8],
  ['mag', 77, 47, 15, 0.2, 0.85],
  ['dark', 80.5, 95, 13.5, -0.3, 0.75],
  ['yellow', 22, 46, 15, 0.1, 0.8],
  ['yellow', 21, 88, 15, -0.4, 0.8],
  ['red', 49, 36, 24, 0.15, 0.8],
  ['pink', 33, 63, 23, -0.35, 0.85],
  ['white', 65, 70, 21, 0.1, 0.85],
  ['cream', 48.5, 86, 21, 0, 0.9]
];

const R = rng(7);
const DUR = 2.4;
const BL = 2.6;
const STEP = 0.13;
const END = (F.length - 1) * STEP + DUR + 0.1 + BL + 0.2;

const fl = F.map((f, i) => {
  const bx = 40 + R() * 8;
  const by = 127;

  return {
    pal: P[f[0]],
    tx: f[1],
    ty: f[2],
    size: f[3],
    rot: f[4],
    tilt: f[5],
    bud: !!f[6],
    bx,
    by,
    cx: (bx + f[1]) / 2 + (R() - 0.5) * 16,
    cy: by + (f[2] - by) * 0.55,
    d: i * STEP,
    pet: Array.from({ length: 6 }, () => ({
      da: (R() - 0.5) * 0.14,
      lm: 0.92 + R() * 0.14,
      cu: (R() - 0.5) * 1.4,
      ph: R() * 6.3,
      sp: Array.from({ length: 26 }, () => [
        0.06 + 0.6 * R() * R() + 0.03,
        (R() - 0.5) * 0.9,
        0.22 + R() * 0.4
      ])
    }))
  };
});

const L0 = Array.from({ length: 15 }, (_, k) => ({
  x: 42 + R() * 6,
  y: 126,
  a: -Math.PI * (0.07 + (0.86 * k) / 14) + (R() - 0.5) * 0.12,
  L: 20 + R() * 16,
  W: 2.2 + R() * 1.4,
  b: (R() - 0.5) * 12,
  d: 0.3 + k * 0.08
}));

const q = (f, t) => [
  (1 - t) * (1 - t) * f.bx + 2 * (1 - t) * t * f.cx + t * t * f.tx,
  (1 - t) * (1 - t) * f.by + 2 * (1 - t) * t * f.cy + t * t * f.ty
];

const qd = (f, t) => [
  2 * (1 - t) * (f.cx - f.bx) + 2 * t * (f.tx - f.cx),
  2 * (1 - t) * (f.cy - f.by) + 2 * t * (f.ty - f.cy)
];

function leaf(x, y, a, L, W, bend, g) {
  if (g <= 0.01) return;
  L *= g;
  W *= g;
  bend *= g;

  sx.save();
  sx.translate(x, y);
  sx.rotate(a);

  const gr = sx.createLinearGradient(0, 0, L, 0);
  gr.addColorStop(0, '#1f6b1c');
  gr.addColorStop(1, '#9be25a');

  sx.fillStyle = gr;
  sx.beginPath();
  sx.moveTo(0, 0);
  sx.bezierCurveTo(L * 0.3, -W, L * 0.7, -W * 0.9 + bend, L, bend);
  sx.bezierCurveTo(L * 0.7, W * 0.9 + bend, L * 0.3, W, 0, 0);
  sx.fill();

  sx.strokeStyle = 'rgba(220,255,160,.6)';
  sx.lineWidth = 0.45;
  sx.beginPath();
  sx.moveTo(0, 0);
  sx.quadraticCurveTo(L * 0.5, bend * 0.4, L, bend);
  sx.stroke();

  sx.restore();
}

function petal(len, wid, pal, pt) {
  const N = 16;
  const top = [];
  const bot = [];
  const cu = pt.cu * len * 0.22;

  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const hw = wid * 1.5 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.85) * (1 + 0.05 * Math.sin(u * 17 + pt.ph));
    const oy = cu * u * u * u;
    top.push([u * len, oy - hw]);
    bot.push([u * len, oy + hw]);
  }

  const g = sx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, pal[0]);
  g.addColorStop(0.2, pal[0]);
  g.addColorStop(0.55, pal[1]);
  g.addColorStop(1, pal[2]);

  sx.fillStyle = g;
  sx.beginPath();
  top.forEach((p, i) => (i ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1])));
  for (let i = N; i >= 0; i--) {
    sx.lineTo(bot[i][0], bot[i][1]);
  }
  sx.closePath();
  sx.fill();

  sx.strokeStyle = pal[2];
  sx.globalAlpha = 0.4;
  sx.lineWidth = 0.3;
  sx.stroke();
  sx.globalAlpha = 1;

  for (const fr of [-0.55, 0.55]) {
    sx.strokeStyle = 'rgba(0,0,0,.15)';
    sx.lineWidth = 0.25;
    sx.beginPath();
    for (let i = 2; i <= N - 2; i++) {
      const cy = (top[i][1] + bot[i][1]) / 2;
      const hw = (bot[i][1] - top[i][1]) / 2;
      if (i > 2) {
        sx.lineTo(top[i][0], cy + fr * hw);
      } else {
        sx.moveTo(top[i][0], cy + fr * hw);
      }
    }
    sx.stroke();
  }

  sx.strokeStyle = 'rgba(0,0,0,.3)';
  sx.lineWidth = 0.7;
  sx.beginPath();
  for (let i = 1; i <= N - 3; i++) {
    const cy = (top[i][1] + bot[i][1]) / 2;
    if (i > 1) {
      sx.lineTo(top[i][0], cy);
    } else {
      sx.moveTo(top[i][0], cy);
    }
  }
  sx.stroke();

  sx.strokeStyle = 'rgba(255,255,255,.3)';
  sx.lineWidth = 0.3;
  sx.beginPath();
  for (let i = 1; i <= N - 3; i++) {
    const cy = (top[i][1] + bot[i][1]) / 2 + wid * 0.28;
    if (i > 1) {
      sx.lineTo(top[i][0], cy);
    } else {
      sx.moveTo(top[i][0], cy);
    }
  }
  sx.stroke();

  sx.fillStyle = pal[0];
  sx.globalAlpha = 0.85;
  for (const s of pt.sp) {
    sx.beginPath();
    sx.arc(s[0] * len, s[1] * wid + cu * s[0] * s[0] * s[0], s[2], 0, 6.283);
    sx.fill();
  }
  sx.globalAlpha = 1;
}

function flower(f, sp, o) {
  const b = clamp((sp - 0.8) / 0.2);
  if (b <= 0) return;

  const p = q(f, sp);
  const dv = qd(f, sp);
  const ang = Math.atan2(dv[1], dv[0]);
  const pal = f.pal;
  const s = f.size;
  const x = p[0];
  const y = p[1];

  if (o < 0.14) {
    const m = 1 + o * 2;
    const L = s * 0.5 * b * m;
    const W = s * 0.15 * b * m;

    sx.save();
    sx.translate(x, y);
    sx.rotate(ang);
    sx.fillStyle = pal[1];
    sx.beginPath();
    sx.ellipse(L * 0.5, 0, L * 0.5, W, 0, 0, 6.283);
    sx.fill();

    sx.strokeStyle = pal[2];
    sx.globalAlpha = 0.5;
    sx.lineWidth = 0.35;
    sx.beginPath();
    sx.moveTo(0, 0);
    sx.lineTo(L, 0);
    sx.stroke();
    sx.restore();
    return;
  }

  const k = (o - 0.14) / 0.86;
  const len = s * 1.3 * (0.6 + 0.4 * k);
  const wid = len * (0.1 + 0.07 * k);

  sx.save();
  sx.translate(x, y);
  sx.rotate(f.rot);
  sx.scale(1, f.tilt);

  for (let pass = 0; pass < 2; pass++) {
    for (let j = pass; j < 6; j += 2) {
      const pt = f.pet[j];
      sx.save();
      sx.rotate((j * Math.PI) / 3 + pt.da);
      petal(len * pt.lm * (pass ? 0.95 : 1), wid * (pass ? 1.2 : 1), pal, pt);
      sx.restore();
    }
  }

  const gl = sx.createRadialGradient(0, 0, 0, 0, 0, len * 0.3);
  gl.addColorStop(0, pal[0]);
  gl.addColorStop(0.5, pal[0] + 'aa');
  gl.addColorStop(1, pal[0] + '00');
  sx.fillStyle = gl;
  sx.beginPath();
  sx.arc(0, 0, len * 0.3, 0, 6.283);
  sx.fill();

  if (k > 0.4) {
    const e = (k - 0.4) / 0.6;
    sx.lineWidth = 0.35;

    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI) / 3 + 0.45 + f.pet[j].da;
      const r = len * (0.62 + 0.16 * (j % 2)) * e;
      const c = Math.cos(a);
      const n = Math.sin(a);
      const px = c * r;
      const py = n * r;

      sx.strokeStyle = pal[2];
      sx.beginPath();
      sx.moveTo(0, 0);
      sx.quadraticCurveTo(c * r * 0.5 - n * r * 0.12, n * r * 0.5 + c * r * 0.12, px, py);
      sx.stroke();

      sx.fillStyle = pal[3];
      sx.beginPath();
      sx.ellipse(px, py, s * 0.13, s * 0.055, a, 0, 6.283);
      sx.fill();
    }

    const pr = len * 0.95 * e;
    sx.strokeStyle = pal[2];
    sx.lineWidth = 0.4;
    sx.beginPath();
    sx.moveTo(0, 0);
    sx.lineTo(Math.cos(-0.6) * pr, Math.sin(-0.6) * pr);
    sx.stroke();

    sx.fillStyle = pal[2];
    sx.beginPath();
    sx.arc(Math.cos(-0.6) * pr, Math.sin(-0.6) * pr, s * 0.06, 0, 6.283);
    sx.fill();
  }

  sx.restore();
}

const SR = rng(99);
const stars = Array.from({ length: 30 }, () => [SR(), SR(), 0.6 + SR() * 0.9, 0.45 + SR() * 0.5]);

let cols = 0;
let rows = 0;
let cwp = 0;
let chp = 0;
let SX = 1;
let SY = 1;
let OX = 0;
let OY = 0;
let cur = 0;
let raf = 0;
let t0 = 0;
let last = 0;
let dprc = 1;

function layout() {
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  dprc = dpr;

  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));

  const Bh = Math.min(r.height, (r.width * VH) / VW) * 0.97;
  chp = Math.max(2.4 * dpr, (Bh * dpr) / 270);
  cwp = chp * 1.35;
  cols = Math.max(1, Math.floor(cv.width / cwp));
  rows = Math.max(1, Math.floor(cv.height / chp));

  low.width = cols;
  low.height = rows;
  src.width = cols * 4;
  src.height = rows * 4;

  lx.imageSmoothingEnabled = true;
  lx.imageSmoothingQuality = 'high';

  const u = (Bh * dpr) / VH;
  SX = (u * 4) / cwp;
  SY = (u * 4) / chp;
  OX = (src.width - VW * SX) / 2;
  OY = (src.height - VH * SY) / 2;
}

function ascii() {
  lx.clearRect(0, 0, cols, rows);
  lx.drawImage(src, 0, 0, cols, rows);
  const d = lx.getImageData(0, 0, cols, rows).data;

  ctx.fillStyle = '#050605';
  ctx.fillRect(0, 0, cv.width, cv.height);

  const xo = (cv.width - cols * cwp) / 2;
  const yo = (cv.height - rows * chp) / 2;
  const h = chp * 0.66;
  const dy = chp * 0.15;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      const a = d[i + 3] / 255;
      if (a < 0.12) continue;

      const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
      const v = clamp(a * 0.55 + lum * 0.6);
      const k = (0.55 + 0.45 * a) * 1.12;

      ctx.fillStyle = `rgb(${(d[i] * k + 8) | 0},${(d[i + 1] * k + 8) | 0},${(d[i + 2] * k + 8) | 0})`;

      if (v > 0.45) {
        ctx.fillRect(xo + c * cwp, yo + r * chp + dy, cwp + 0.6, h);
      } else {
        ctx.fillRect(xo + c * cwp + cwp * 0.22, yo + r * chp + dy, cwp * 0.56, h);
      }
    }
  }

  for (const s of stars) {
    const c = Math.floor(s[0] * cols);
    const r = Math.floor(s[1] * rows);
    if (d[(r * cols + c) * 4 + 3] > 25) continue;

    ctx.fillStyle = `rgba(255,255,240,${s[3]})`;
    ctx.fillRect(
      xo + c * cwp,
      yo + r * chp,
      Math.max(1.5, cwp * s[2] * 0.5),
      Math.max(1.5, chp * s[2] * 0.5)
    );
  }
}

function render(t) {
  cur = t;
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.clearRect(0, 0, src.width, src.height);
  sx.setTransform(SX, 0, 0, SY, OX, OY);
  sx.lineCap = 'round';

  const sps = fl.map(f => eo(clamp((t - f.d) / DUR)));

  sx.strokeStyle = '#3fae2b';
  sx.lineWidth = 1;
  fl.forEach((f, i) => {
    const sp = sps[i];
    if (sp <= 0) return;

    sx.beginPath();
    for (let k = 0; k <= 24; k++) {
      const p = q(f, (sp * k) / 24);
      if (k) {
        sx.lineTo(p[0], p[1]);
      } else {
        sx.moveTo(p[0], p[1]);
      }
    }
    sx.stroke();
  });

  fl.forEach((f, i) => {
    [0.28, 0.5].forEach((tt, j) => {
      const p = q(f, tt);
      const dv = qd(f, tt);
      const sg = (i + j) % 2 ? 1 : -1;
      const a = Math.atan2(dv[1], dv[0]) + sg * 0.85;
      leaf(p[0], p[1], a, 10 + f.size * 0.3, 2.2, sg * 3, eo(clamp((sps[i] - tt) / 0.25)));
    });
  });

  fl.forEach((f, i) => {
    flower(f, sps[i], f.bud ? 0 : ease(clamp((t - f.d - DUR - 0.1) / BL)));
  });

  for (const l of L0) {
    leaf(l.x, l.y, l.a, l.L, l.W, l.b, eo(clamp((t - l.d) / 1.6)));
  }

  ascii();
}

function tick(now) {
  const t = (now - t0) / 1000;
  if (now - last >= 30) {
    render(Math.min(t, END));
    last = now;
  }
  if (t < END) {
    raf = requestAnimationFrame(tick);
  } else {
    render(END);
  }
}

function start() {
  cancelAnimationFrame(raf);
  last = 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    render(END);
    return;
  }
  t0 = performance.now();
  raf = requestAnimationFrame(tick);
}

let rt = 0;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    layout();
    render(cur);
  }, 120);
});

stage.addEventListener('click', start);

layout();
start();