/* <pf-scene> — getsite particle engine v5.
   GPU-resident morphing: all 9 shapes live as vertex attributes; shape changes are
   pure uniform updates (zero buffer uploads) → no hitches ever.
   Dense volumetric shapes, staggered morph, breathing scale, depth-fog color grading.
   API: el.setShape(id 0..9), el.startIntro()
   Shapes: 0 rocket, 1 website, 2 briefcase, 3 support headset, 4 workflow, 5 closed book, 6 logo, 7 telegram plane, 8 automation hub, 9 cloud.
   API also: el.setSide('left'|'right') — positions figure opposite section text.
   Fires 'pf-ready' (bubbles) after first rendered frame. */
(function () {
  if (customElements.get('pf-scene')) return;

  // "mobile" = coarse pointer (real touch device) or genuinely narrow viewport —
  // never a short desktop/preview window (that used to silently degrade the scene)
  const MOBILE = window.innerWidth < 700;
  const CORES = navigator.hardwareConcurrency || 4;
  const N = MOBILE ? 64000 : (CORES >= 8 ? 180000 : 120000);
  // Keep the v5 GPU morphing look, but cap particles for fast first paint.
  // Per-particle alpha is scaled so additive glow doesn't blow out.
  const ALPHA = Math.max(0.8, Math.min(1.35, Math.sqrt(700000 / N)));
  const R = Math.random;
  const G = () => (R() + R() + R() - 1.5) * 0.66;

  const put = (a, i, x, y, z) => { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
  const gen = (fill) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) fill(a, i, i / N); return a; };
  const rectFill = (a, i, x0, y0, x1, y1, z, zj) => put(a, i, x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), (z || 0) + G() * (zj || 0.02));
  const rectEdge = (a, i, x0, y0, x1, y1, z, zj) => {
    const t = R(), s = Math.floor(R() * 4), zz = (z || 0) + G() * (zj || 0.02);
    if (s === 0) put(a, i, x0 + t * (x1 - x0), y0 + G() * 0.008, zz);
    else if (s === 1) put(a, i, x0 + t * (x1 - x0), y1 + G() * 0.008, zz);
    else if (s === 2) put(a, i, x0 + G() * 0.008, y0 + t * (y1 - y0), zz);
    else put(a, i, x1 + G() * 0.008, y0 + t * (y1 - y0), zz);
  };
  const seg = (a, i, x0, y0, x1, y1, z0, z1) => {
    const t = R();
    put(a, i, x0 + t * (x1 - x0) + G() * 0.01, y0 + t * (y1 - y0) + G() * 0.01, (z0 || 0) + t * ((z1 || 0) - (z0 || 0)) + G() * 0.012);
  };
  const tri = (a, i, A, B, C, z, zj) => {
    let r1 = R(), r2 = R();
    if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    put(a, i, A[0] + r1 * (B[0] - A[0]) + r2 * (C[0] - A[0]) + G() * 0.01, A[1] + r1 * (B[1] - A[1]) + r2 * (C[1] - A[1]) + G() * 0.01, (z || 0) + G() * (zj || 0.03));
  };
  const sphere = (a, i, cx, cy, cz, r) => {
    const u = R() * 2 - 1, ph = R() * 6.2832, s = Math.sqrt(1 - u * u);
    put(a, i, cx + s * Math.cos(ph) * r, cy + u * r, cz + s * Math.sin(ph) * r);
  };
  const radialDust = (a, i, rMin, rMax) => {
    const u = R() * 2 - 1, ph = R() * 6.2832, s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = rMin + R() * (rMax - rMin);
    put(a, i, s * Math.cos(ph) * r, u * r * 0.55, s * Math.sin(ph) * r);
  };

  function buildLogoPts() {
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 160;
    const c = cv.getContext('2d');
    c.font = '900 112px Unbounded, Arial, sans-serif';
    c.textBaseline = 'middle'; c.fillStyle = '#fff';
    const w = Math.min(600, c.measureText('getsite').width);
    c.fillText('getsite', (640 - w) / 2, 86);
    const d = c.getImageData(0, 0, 640, 160).data; const pts = [];
    for (let y = 0; y < 160; y += 2) for (let x = 0; x < 640; x += 2) if (d[(y * 640 + x) * 4 + 3] > 110) pts.push([x, y]);
    return pts;
  }
  const buildLogoRaw = (pts) => gen((a, i, f) => {
    if (pts.length && f < 0.90) { const p = pts[Math.floor(R() * pts.length)]; put(a, i, (p[0] / 640 - 0.5) * 3.4 + G() * 0.01, (0.5 - p[1] / 160) * 0.85 + G() * 0.01, (R() - 0.5) * 0.2); }
    else radialDust(a, i, 0.4, 6);
  });

  function makeShapes() {
    const perm = new Uint32Array(N);
    for (let i = 0; i < N; i++) perm[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    const shuffle = (src) => { const o = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const s = perm[i] * 3; o[i * 3] = src[s]; o[i * 3 + 1] = src[s + 1]; o[i * 3 + 2] = src[s + 2]; } return o; };

    const shapes = [];

    // 0 ROCKET — body, nose cone, fins, window, flame trail
    shapes[0] = gen((a, i, f) => {
      if (f < 0.34) {
        const t = R(), an = R() * 6.2832, y = -0.85 + t * 1.45, r = 0.21 + G() * 0.018;
        put(a, i, Math.cos(an) * r, y, Math.sin(an) * r * 0.48 + G() * 0.01);
      } else if (f < 0.44) {
        const t = R(), an = R() * 6.2832, y = 0.55 + t * 0.62, r = (1 - t) * 0.23;
        put(a, i, Math.cos(an) * r, y, Math.sin(an) * r * 0.38);
      } else if (f < 0.54) {
        const fin = Math.floor(R() * 3), t = R(), an = fin / 3 * 6.2832;
        const y = -0.65 - t * 0.42, spread = 0.28 + t * 0.55;
        put(a, i, Math.cos(an) * spread + G() * 0.015, y, Math.sin(an) * spread * 0.55 + G() * 0.012);
      } else if (f < 0.60) {
        rectEdge(a, i, -0.08, 0.02, 0.08, 0.22, 0.22, 0.02);
      } else if (f < 0.82) {
        const t = R(), an = R() * 6.2832, y = -0.95 - t * 1.35, r = 0.16 * (1 - t * 0.75) * (0.35 + R() * 0.65);
        put(a, i, Math.cos(an) * r + G() * 0.02, y, Math.sin(an) * r * 0.55);
      } else radialDust(a, i, 1.2, 9);
    });

    // 1 WEBSITE — browser UI card: header, image block, text lines, 3 widgets
    const WX0 = -1.05, WX1 = 1.05, WY0 = -0.9, WY1 = 0.92, HDR = 0.55;
    shapes[1] = gen((a, i, f) => {
      if (f < 0.14) {
        rectFill(a, i, WX0, WY0, WX1, WY1, 0.1 + G() * 0.02, 0.025);
      } else if (f < 0.20) {
        rectEdge(a, i, WX0, WY0, WX1, WY1, 0.12, 0.025);
      } else if (f < 0.24) {
        seg(a, i, WX0 + 0.08, HDR, WX1 - 0.08, HDR, 0.11, 0.11);
      } else if (f < 0.28) {
        const k = Math.floor(R() * 3);
        sphere(a, i, [-0.82, -0.72, -0.62][k], 0.74, 0.11 + G() * 0.01, 0.022);
      } else if (f < 0.32) {
        rectFill(a, i, 0.05, 0.62, 0.88, 0.76, 0.11, 0.015);
      } else if (f < 0.40) {
        rectFill(a, i, WX0 + 0.08, 0.08, -0.18, 0.48, 0.12, 0.02);
      } else if (f < 0.44) {
        if (R() < 0.55) tri(a, i, [-0.85, 0.12], [-0.55, 0.38], [-0.25, 0.12], 0.13, 0.015);
        else tri(a, i, [-0.55, 0.12], [-0.22, 0.32], [0.02, 0.12], 0.13, 0.015);
      } else if (f < 0.46) {
        sphere(a, i, -0.28, 0.4, 0.13, 0.055);
      } else if (f < 0.52) {
        const k = Math.floor(R() * 3), ys = [0.42, 0.32, 0.22];
        seg(a, i, 0.3, ys[k], 0.88, ys[k], 0.12, 0.12);
      } else if (f < 0.56) {
        seg(a, i, 0.3, 0.12, 0.82, 0.12, 0.12, 0.12);
      } else if (f < 0.58) {
        seg(a, i, 0.3, 0.46, 0.9, 0.46, 0.12, 0.12);
      } else if (f < 0.66) {
        const k = Math.floor(R() * 3), x0 = [-0.97, -0.29, 0.39][k];
        rectFill(a, i, x0, -0.78, x0 + 0.58, -0.32, 0.12, 0.02);
      } else if (f < 0.72) {
        const k = Math.floor(R() * 3), x0 = [-0.97, -0.29, 0.39][k];
        rectEdge(a, i, x0, -0.78, x0 + 0.58, -0.32, 0.13, 0.015);
      } else if (f < 0.80) {
        const k = Math.floor(R() * 3), x0 = [-0.93, -0.25, 0.43][k];
        const line = Math.floor(R() * 3), ys = [-0.42, -0.54, -0.66], w = [0.36, 0.28, 0.22][line];
        seg(a, i, x0, ys[line], x0 + w[line], ys[line], 0.13, 0.13);
      } else if (f < 0.86) {
        const cr = Math.floor(R() * 4), r = 0.09;
        const cx = cr < 2 ? WX1 : WX0, cy = cr % 2 === 0 ? WY1 : WY0;
        const an = R() * 1.57;
        put(a, i, cx + (cr < 2 ? -1 : 1) * Math.cos(an) * r, cy + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, 0.12);
      } else radialDust(a, i, 1.2, 8);
    });

    // 2 BRIEFCASE — portfolio bag with dashboard widgets on front
    const BBW = 0.86, BBH = 0.7;
    shapes[2] = gen((a, i, f) => {
      if (f < 0.20) rectFill(a, i, -BBW, -BBH, BBW, BBH, 0.1 + G() * 0.02, 0.03);
      else if (f < 0.26) rectEdge(a, i, -BBW, -BBH, BBW, BBH, 0.12, 0.03);
      else if (f < 0.30) {
        const t = R();
        put(a, i, BBW - R() * 0.05, -BBH + t * (BBH * 2), -0.08 + G() * 0.02);
      } else if (f < 0.36) {
        const t = R();
        put(a, i, -0.32 + t * 0.64, 0.76 + Math.sin(t * Math.PI) * 0.2, 0.14 + G() * 0.02);
      } else if (f < 0.40) seg(a, i, -BBW * 0.82, 0.3, BBW * 0.82, 0.3, 0.13, 0.13);
      else if (f < 0.46) rectEdge(a, i, -0.76, -0.46, -0.16, 0.26, 0.15, 0.02);
      else if (f < 0.52) {
        if (R() < 0.55) tri(a, i, [-0.66, -0.34], [-0.4, 0.06], [-0.54, -0.34], 0.16, 0.02);
        else tri(a, i, [-0.52, -0.34], [-0.26, -0.02], [-0.36, -0.34], 0.16, 0.02);
      } else if (f < 0.56) sphere(a, i, -0.32, 0.08, 0.17, 0.038);
      else if (f < 0.60) {
        rectEdge(a, i, -0.04, 0.04, 0.26, 0.26, 0.16, 0.02);
        seg(a, i, -0.04, 0.26, 0.12, 0.36, 0.16, 0.24);
        seg(a, i, 0.26, 0.04, 0.12, 0.14, 0.16, 0.24);
      } else if (f < 0.66) {
        const k = Math.floor(R() * 3), h = [0.38, 0.5, 0.62][k];
        rectFill(a, i, 0.36 + k * 0.12, -0.04, 0.44 + k * 0.12, h, 0.16, 0.01);
      } else if (f < 0.74) {
        const t = R(), x = -0.7 + t * 1.3;
        put(a, i, x, -0.56 + Math.sin(t * 5.2) * 0.1 + t * 0.06, 0.16 + G() * 0.01);
      } else if (f < 0.78) {
        const k = Math.floor(R() * 3);
        sphere(a, i, -0.1 + k * 0.1, -0.6, 0.17, k === 1 ? 0.042 : 0.028);
      } else if (f < 0.82) rectFill(a, i, -0.1, 0.26, 0.1, 0.4, 0.17, 0.02);
      else radialDust(a, i, 1.5, 9.5);
    });

    // 3 SUPPORT — headset + chat bubble with typing dots
    const BX0 = -0.38, BX1 = 0.38, BY0 = -0.28, BY1 = 0.38;
    shapes[3] = gen((a, i, f) => {
      if (f < 0.22) {
        rectFill(a, i, BX0, BY0, BX1, BY1, 0.08 + G() * 0.02, 0.025);
      } else if (f < 0.28) {
        rectEdge(a, i, BX0, BY0, BX1, BY1, 0.1, 0.02);
      } else if (f < 0.32) {
        tri(a, i, [BX0 + 0.02, BY0], [BX0 - 0.18, BY0 - 0.22], [BX0 + 0.14, BY0 - 0.02], 0.08, 0.02);
      } else if (f < 0.36) {
        const k = Math.floor(R() * 3);
        sphere(a, i, [-0.14, 0, 0.14][k], 0.02, 0.12 + G() * 0.01, 0.028 + G() * 0.008);
      } else if (f < 0.44) {
        const an = 0.35 + R() * 2.45, r = 0.82 + G() * 0.05;
        put(a, i, Math.cos(an) * r * 0.95, Math.sin(an) * r * 0.62 + 0.05, 0.05 + G() * 0.02);
      } else if (f < 0.52) {
        rectFill(a, i, -0.82, -0.2, -0.42, 0.42, 0.06 + G() * 0.02, 0.03);
      } else if (f < 0.56) {
        rectEdge(a, i, -0.82, -0.2, -0.42, 0.42, 0.08, 0.025);
      } else if (f < 0.64) {
        rectFill(a, i, 0.42, -0.2, 0.82, 0.42, 0.06 + G() * 0.02, 0.03);
      } else if (f < 0.68) {
        rectEdge(a, i, 0.42, -0.2, 0.82, 0.42, 0.08, 0.025);
      } else if (f < 0.72) {
        const t = R();
        put(a, i, 0.84 + G() * 0.02, -0.02 + t * 0.22, 0.1 + G() * 0.01);
      } else if (f < 0.78) {
        const t = R(), u = 1 - t;
        put(a, i, u * u * 0.62 + 2 * u * t * 0.48 + t * t * 0.2 + G() * 0.01, u * u * -0.18 + 2 * u * t * -0.42 + t * t * -0.6 + G() * 0.01, 0.07 + G() * 0.015);
      } else if (f < 0.82) {
        rectFill(a, i, 0.12, -0.62, 0.32, -0.48, 0.08, 0.015);
      } else if (f < 0.86) {
        const t = R();
        put(a, i, 0.18 + t * 0.08, -0.52 + G() * 0.01, 0.1);
      } else radialDust(a, i, 1.3, 9);
    });

    // 4 WORKFLOW — 4-step rail: research, idea, design, launch
    const PLQ = [-1.32, -0.44, 0.44, 1.32];
    const PW = 0.3, PH = 0.34;
    shapes[4] = gen((a, i, f) => {
      if (f < 0.24) {
        const k = Math.floor(R() * 4);
        rectFill(a, i, PLQ[k] - PW, 0.02, PLQ[k] + PW, PH, 0.06 + G() * 0.03, 0.035);
      } else if (f < 0.30) {
        const k = Math.floor(R() * 4);
        rectEdge(a, i, PLQ[k] - PW, 0.02, PLQ[k] + PW, PH, 0.08, 0.03);
      } else if (f < 0.40) {
        const t = R();
        put(a, i, -1.5 + t * 3.45, -0.38 + G() * 0.025, G() * 0.04);
      } else if (f < 0.46) {
        const k = Math.floor(R() * 3), t = R();
        put(a, i, PLQ[k] + PW + t * (PLQ[k + 1] - PW - PLQ[k] - PW), -0.05 + G() * 0.02, 0.07 + G() * 0.02);
      } else if (f < 0.52) {
        const an = Math.PI * 0.55 + R() * Math.PI * 0.9;
        put(a, i, -1.52 + Math.cos(an) * 0.22, -0.38 + Math.sin(an) * 0.22, G() * 0.03);
      } else if (f < 0.57) {
        if (R() < 0.55) seg(a, i, 1.72, -0.38, 2.02, -0.38, 0, 0);
        else tri(a, i, [1.92, -0.38], [2.18, -0.5], [2.18, -0.26], 0, 0.02);
      } else if (f < 0.66) {
        const cx = PLQ[0], cy = 0.42;
        if (R() < 0.65) sphere(a, i, cx, cy, 0.08, 0.085);
        else seg(a, i, cx + 0.05, cy - 0.05, cx + 0.17, cy - 0.17, 0.1, 0.1);
      } else if (f < 0.74) {
        const cx = PLQ[1], cy = 0.45;
        sphere(a, i, cx, cy, 0.07, 0.095);
        if (R() < 0.4) {
          const an = R() * 6.2832;
          put(a, i, cx + Math.cos(an) * 0.17, cy + 0.14 + Math.sin(an) * 0.06, 0.11 + G() * 0.01);
        }
      } else if (f < 0.82) {
        seg(a, i, PLQ[2] - 0.1, 0.28, PLQ[2] + 0.16, 0.52, 0.1, 0.1);
      } else if (f < 0.90) {
        const cx = PLQ[3], cy = 0.38;
        if (R() < 0.55) {
          const t = R(), an = R() * 6.2832, y = cy - 0.05 + t * 0.35, r = 0.07 * (1 - t * 0.35);
          put(a, i, cx + Math.cos(an) * r * 0.45, y, 0.09 + G() * 0.01);
        } else {
          const t = R();
          put(a, i, cx + G() * 0.03, cy - 0.2 - t * 0.22, G() * 0.025);
        }
      } else radialDust(a, i, 2.1, 10);
    });

    // 5 CLOSED BOOK — 3/4 view: cover, spine ribs, page stack, bookmark
    const FCX0 = -0.35, FCX1 = 0.85, FCY0 = -0.72, FCY1 = 0.78;
    const fcZ = (x) => 0.08 + ((x - FCX0) / (FCX1 - FCX0)) * 0.12;
    shapes[5] = gen((a, i, f) => {
      if (f < 0.30) {
        const x = FCX0 + R() * (FCX1 - FCX0), y = FCY0 + R() * (FCY1 - FCY0);
        put(a, i, x + G() * 0.01, y + G() * 0.01, fcZ(x) + G() * 0.02);
      } else if (f < 0.36) {
        rectEdge(a, i, FCX0, FCY0, FCX1, FCY1, 0.18, 0.03);
      } else if (f < 0.44) {
        const t = R(), y = FCY0 + t * (FCY1 - FCY0);
        const an = Math.PI * 0.5 + R() * Math.PI;
        put(a, i, -0.35 + Math.cos(an) * 0.1 + G() * 0.01, y, 0.04 + Math.sin(an) * 0.1 + G() * 0.015);
      } else if (f < 0.48) {
        const band = Math.floor(R() * 2), y = band === 0 ? -0.1 : 0.32;
        const an = Math.PI * 0.35 + R() * Math.PI * 0.65;
        put(a, i, -0.36 + Math.cos(an) * 0.12, y + G() * 0.02, 0.05 + Math.sin(an) * 0.11);
      } else if (f < 0.54) {
        const t = R(), x = -0.22 + t * 0.98;
        put(a, i, x, -0.78 + G() * 0.02, 0.04 + R() * 0.08);
      } else if (f < 0.60) {
        const line = Math.floor(R() * 8), y = -0.76 + line * 0.01;
        const t = R();
        put(a, i, -0.18 + t * 0.94, y, 0.08 + G() * 0.01);
      } else if (f < 0.64) {
        const t = R();
        put(a, i, FCX0 + t * (FCX1 - FCX0), FCY1 - R() * 0.04, 0.1 + G() * 0.02);
      } else if (f < 0.68) {
        const t = R();
        put(a, i, FCX1 - R() * 0.04, FCY0 + t * (FCY1 - FCY0), 0.06 + G() * 0.03);
      } else if (f < 0.74) {
        const t = R();
        put(a, i, 0.15 + G() * 0.05, 0.28 + t * 0.48, 0.22 + G() * 0.015);
      } else if (f < 0.78) {
        const t = R();
        put(a, i, 0.08 + t * 0.2, 0.8 + G() * 0.02, 0.2 + G() * 0.015);
      } else if (f < 0.82) {
        if (R() < 0.5) seg(a, i, 0.08, 0.42, 0.2, 0.26, 0.22, 0.22);
        else seg(a, i, 0.32, 0.42, 0.2, 0.26, 0.22, 0.22);
      } else if (f < 0.86) {
        const t = R();
        put(a, i, 0.2 + G() * 0.02, -0.78 + t * 0.05, 0.07 + G() * 0.01);
      } else if (f < 0.90) {
        const cr = Math.floor(R() * 4), r = 0.07;
        const cx = cr < 2 ? FCX1 : FCX0, cy = cr % 2 === 0 ? FCY1 : FCY0;
        const an = R() * 1.57;
        put(a, i, cx + (cr < 2 ? -1 : 1) * Math.cos(an) * r, cy + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, fcZ(cx) + 0.02);
      } else radialDust(a, i, 1.4, 9);
    });

    // 6 LOGO — extruded glyphs
    shapes[6] = buildLogoRaw(buildLogoPts());

    // 7 TELEGRAM — 3D paper plane with center crease glow
    const TN = [1.25, 0.58], TBL = [-1.05, 0.38], TBR = [0.35, -0.28], TC = [0.02, 0.08], TKF = [-0.35, -0.72];
    shapes[7] = gen((a, i, f) => {
      if (f < 0.26) tri(a, i, TN, TBL, TC, 0.14, 0.02);
      else if (f < 0.42) tri(a, i, TN, TC, TBR, 0.08, 0.02);
      else if (f < 0.52) tri(a, i, TBL, TBR, TKF, -0.14, 0.025);
      else if (f < 0.56) tri(a, i, TC, TBR, TKF, -0.1, 0.02);
      else if (f < 0.62) seg(a, i, TN[0], TN[1], TBL[0], TBL[1], 0.14, 0.1);
      else if (f < 0.66) seg(a, i, TN[0], TN[1], TBR[0], TBR[1], 0.1, 0.05);
      else if (f < 0.70) seg(a, i, TBL[0], TBL[1], TKF[0], TKF[1], 0.02, -0.12);
      else if (f < 0.76) {
        const t = R();
        seg(a, i, TN[0] - t * 1.1, TN[1] - t * 0.95, TN[0] - t * 1.1 + G() * 0.02, TN[1] - t * 0.95 + G() * 0.02, 0.12 - t * 0.18, 0.06 - t * 0.14);
      } else if (f < 0.82) {
        put(a, i, TN[0] + G() * 0.015, TN[1] + G() * 0.015, 0.16 + G() * 0.01);
      } else if (f < 0.88) {
        put(a, i, TBL[0] + G() * 0.02, TBL[1] + G() * 0.02, 0.12);
      } else radialDust(a, i, 1.3, 9);
    });

    // 8 AUTOMATION — hub gear + 4 modules + pipes
    const AC = [[-0.92, 0.82], [0.92, 0.82], [-0.92, -0.82], [0.92, -0.82]];
    const ASQ = 0.24;
    shapes[8] = gen((a, i, f) => {
      if (f < 0.18) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        rectFill(a, i, cx - ASQ, cy - ASQ, cx + ASQ, cy + ASQ, 0.08 + G() * 0.02, 0.025);
      } else if (f < 0.24) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        rectEdge(a, i, cx - ASQ, cy - ASQ, cx + ASQ, cy + ASQ, 0.1, 0.02);
      } else if (f < 0.32) {
        const tooth = Math.floor(R() * 8), ban = tooth / 8 * 6.2832 + R() * 0.12;
        const r = 0.2 + Math.abs(Math.sin(ban * 4)) * 0.08;
        put(a, i, Math.cos(ban) * r, Math.sin(ban) * r, 0.06 + G() * 0.02);
      } else if (f < 0.36) {
        if (R() < 0.5) seg(a, i, -0.08, -0.02, 0.02, 0.14, 0.08, 0.08);
        else seg(a, i, 0.02, 0.14, 0.16, -0.1, 0.08, 0.08);
      } else if (f < 0.44) {
        const k = Math.floor(R() * 4), t = R();
        put(a, i, AC[k][0] * 0.72 * t + G() * 0.02, AC[k][1] * 0.72 * t + G() * 0.02, 0.05 + G() * 0.015);
      } else if (f < 0.48) {
        const t = R();
        put(a, i, -0.5 + t * 1.0, 0.45 + G() * 0.025, 0.05);
      } else if (f < 0.54) {
        if (R() < 0.45) seg(a, i, -1.02, 0.72, -0.82, 0.98, 0.1, 0.1);
        else if (R() < 0.75) seg(a, i, -0.82, 0.98, -0.98, 0.78, 0.1, 0.1);
        else seg(a, i, -0.82, 0.98, -0.68, 0.72, 0.1, 0.1);
      } else if (f < 0.60) {
        const line = Math.floor(R() * 3), y = 0.92 - line * 0.1;
        seg(a, i, 0.72, y, 1.08, y, 0.1, 0.1);
        sphere(a, i, [0.82, 0.98, 0.94][line], y, 0.11, 0.028);
      } else if (f < 0.66) {
        const cyl = Math.floor(R() * 3), y = -0.68 - cyl * 0.14, an = R() * 6.2832;
        put(a, i, -0.92 + Math.cos(an) * 0.1, y, 0.08 + Math.sin(an) * 0.04);
      } else if (f < 0.72) {
        rectEdge(a, i, 0.7, -0.95, 1.12, -0.62, 0.1, 0.02);
        const dot = Math.floor(R() * 3);
        sphere(a, i, 0.76 + dot * 0.06, -0.68, 0.12, 0.018);
        rectFill(a, i, 0.82, -0.88, 1.05, -0.72, 0.11, 0.01);
      } else if (f < 0.80) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        const cr = Math.floor(R() * 4), r = 0.06;
        const ex = cr < 2 ? cx + ASQ : cx - ASQ, ey = cr % 2 === 0 ? cy + ASQ : cy - ASQ;
        const an = R() * 1.57;
        put(a, i, ex + (cr < 2 ? -1 : 1) * Math.cos(an) * r, ey + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, 0.1);
      } else radialDust(a, i, 1.5, 9);
    });

    return { shapes: shapes.map(shuffle), shuffle };
  }

  /* All 9 shapes are vertex attributes; morph = uniform weights only.
     Current position = mix(F, T, tt) where F/T are weighted sums of shapes + seed-derived scatter. */
  const VS = `
attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3;
attribute vec3 aP4; attribute vec3 aP5; attribute vec3 aP6; attribute vec3 aP7; attribute vec3 aP8; attribute vec3 aSeed;
uniform mat4 uMV; uniform mat4 uP;
uniform float uWF[9]; uniform float uWT[9]; uniform float uScF; uniform float uScT;
uniform float uT; uniform float uTime; uniform vec2 uMouse; uniform float uMouseF; uniform float uSize; uniform float uA;
varying float vA; varying float vCloud; varying vec3 vColor;
void main(){
  float tl = clamp(uT * 1.35 - aSeed.x * 0.35, 0.0, 1.0);
  float tt = tl * tl * (3.0 - 2.0 * tl);
  vec3 sc = vec3((aSeed.x * 2.0 - 1.0) * 5.0, (aSeed.y * 2.0 - 1.0) * 3.2, (aSeed.z * 2.0 - 1.0) * 3.0 - 0.8);
  vec3 F = sc * uScF + aP0 * uWF[0] + aP1 * uWF[1] + aP2 * uWF[2] + aP3 * uWF[3] + aP4 * uWF[4] + aP5 * uWF[5] + aP6 * uWF[6] + aP7 * uWF[7] + aP8 * uWF[8];
  vec3 T = sc * uScT + aP0 * uWT[0] + aP1 * uWT[1] + aP2 * uWT[2] + aP3 * uWT[3] + aP4 * uWT[4] + aP5 * uWT[5] + aP6 * uWT[6] + aP7 * uWT[7] + aP8 * uWT[8];
  vec3 form = mix(F, T, tt);
  float cloudSeed = fract(aSeed.x * 37.17 + aSeed.y * 11.31 + aSeed.z * 5.73);
  float cloud = step(0.70, cloudSeed);
  vec3 cosmosDir = normalize(vec3(
    sin(aSeed.x * 6.283 + aSeed.y * 3.11),
    cos(aSeed.y * 6.283 + aSeed.z * 2.7) * 0.55,
    sin(aSeed.z * 6.283 + aSeed.x * 4.3)));
  float cosmosDist = pow(cloudSeed, 1.6) * 14.0 + 0.4;
  vec3 cosmosPos = form + cosmosDir * cosmosDist;
  float cosmosFade = exp(-cosmosDist * 0.22);
  vec3 p = mix(form, cosmosPos, cloud);
  float w = 0.014 + 0.020 * aSeed.x;
  p += w * vec3(
    sin(uTime * (0.5 + aSeed.y) + aSeed.x * 19.0),
    cos(uTime * (0.45 + aSeed.y * 0.7) + aSeed.x * 29.0),
    sin(uTime * (0.6 + aSeed.y * 0.5) + aSeed.x * 37.0));
  p *= 1.0 + 0.022 * sin(uTime * 0.5);
  vec4 mv = uMV * vec4(p, 1.0);
  vec4 pos = uP * mv;
  vec2 ndc = pos.xy / pos.w;
  vec2 d = ndc - uMouse;
  float f = exp(-dot(d, d) * 10.0) * uMouseF;
  vec2 dir = normalize(d + vec2(1e-4));
  pos.xy += (dir * 0.12 + vec2(-dir.y, dir.x) * 0.06) * f * pos.w;
  gl_Position = pos;
  float dist = max(0.7, -mv.z);
  float lime = step(0.93, aSeed.y);
  float ps = uSize * (0.7 + aSeed.z * 1.2) * (2.4 / dist) * (1.0 + lime * 0.5);
  gl_PointSize = max(1.0, min(ps, uSize * 4.2));
  vCloud = cloud;
  float cosmosAlpha = mix(1.0, cosmosFade * 0.85, cloud);
  vA = (0.40 + 0.26 * sin(uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 40.0)) * uA * cosmosAlpha;
  float fog = clamp((dist - 1.6) / 3.4, 0.0, 1.0);
  vec3 base = mix(vec3(0.949, 0.941, 0.918), vec3(0.337, 0.784, 1.0), smoothstep(0.5, 0.93, aSeed.y) * 0.85);
  vec3 col = mix(base, vec3(0.847, 1.0, 0.239) * 1.35, lime);
  vColor = col * (1.3 - fog * 0.45) * cosmosAlpha;
  gl_PointSize *= mix(1.0, 0.35 + cosmosFade * 0.65, cloud);
}`;
  const FS = `
precision mediump float;
varying float vA; varying float vCloud; varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.1, d) * vA;
  gl_FragColor = vec4(vColor, a);
}`;

  const persp = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };

  // camera z distance per shape; horizontal shift comes from setSide()
  const CAM_Z = [3.6, 3.8, 3.8, 4.2, 4.4, 3.9, 3.8, 3.7, 4.0, 4.2];
  const CAM_RX = [0.08, 0.10, 0.10, 0.10, 0.06, 0.14, 0.08, 0.12, 0.08, 0.04];
  const SIDE_X = 1.15;

  class PFScene extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = 'block';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;pointer-events:none';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block';
      holder.appendChild(canvas);
      document.body.prepend(holder);
      this._holder = holder;
      const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) { this.dispatchEvent(new CustomEvent('pf-ready', { bubbles: true })); return; }

      const prog = gl.createProgram();
      const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(prog, s); };
      mk(gl.VERTEX_SHADER, VS); mk(gl.FRAGMENT_SHADER, FS);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('pf-scene shader: ' + gl.getProgramInfoLog(prog));
        this.dispatchEvent(new CustomEvent('pf-ready', { bubbles: true }));
        return;
      }
      gl.useProgram(prog);

      const built = makeShapes();
      this._shuffle = built.shuffle;
      this._toId = 0;
      this._t = 0;
      this._playing = false;
      // morph weights: scatter scalar + 9 shape weights, "from" and "to"
      this._scF = 1; this._scT = 0;
      this._wF = new Float32Array(9);
      this._wT = new Float32Array(9); this._wT[0] = 1;

      const seeds = new Float32Array(N * 3);
      for (let i = 0; i < N * 3; i++) seeds[i] = R();

      const mkBuf = (data, loc, usage) => {
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        const a = gl.getAttribLocation(prog, loc);
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0);
        return b;
      };
      this._bufs = [];
      for (let s = 0; s < 9; s++) this._bufs[s] = mkBuf(built.shapes[s], 'aP' + s, gl.STATIC_DRAW);
      mkBuf(seeds, 'aSeed', gl.STATIC_DRAW);
      this._gl = gl;

      this._u = {};
      ['uMV', 'uP', 'uWF', 'uWT', 'uScF', 'uScT', 'uT', 'uTime', 'uMouse', 'uMouseF', 'uSize', 'uA'].forEach(n => this._u[n] = gl.getUniformLocation(prog, n));
      gl.uniform1f(this._u.uA, ALPHA);
      gl.uniform1f(this._u.uMouseF, reduced || MOBILE ? 0 : 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.disable(gl.DEPTH_TEST);

      this._mx = 0; this._my = 0; this._tmx = 0; this._tmy = 0;
      if (!reduced && !MOBILE) {
        this._onMove = (e) => { this._tmx = (e.clientX / window.innerWidth) * 2 - 1; this._tmy = -((e.clientY / window.innerHeight) * 2 - 1); };
        window.addEventListener('mousemove', this._onMove, { passive: true });
      }

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.1 : 1.5);
        canvas.width = Math.max(2, window.innerWidth * dpr);
        canvas.height = Math.max(2, window.innerHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        this._proj = persp(0.72, canvas.width / canvas.height, 0.1, 30);
        gl.uniform1f(this._u.uSize, dpr * (MOBILE ? 2.2 : N >= 700000 ? 1.8 : 2.0));
      };
      resize();
      this._onResize = resize;
      window.addEventListener('resize', resize);

      // rebuild logo glyphs once the display font is available (one-time upload)
      if (document.fonts && document.fonts.load) {
        document.fonts.load('900 112px "Unbounded"').then(() => {
          const pts = buildLogoPts();
          if (!pts.length || !this._gl) return;
          const data = this._shuffle(buildLogoRaw(pts));
          gl.bindBuffer(gl.ARRAY_BUFFER, this._bufs[6]);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          gl.vertexAttribPointer(gl.getAttribLocation(prog, 'aP6'), 3, gl.FLOAT, false, 0, 0);
        }).catch(() => {});
      }

      this._cx = 0; this._cz = CAM_Z[0];
      this._side = 0; this._targetSide = -1;
      if (!MOBILE) {
        this._side = -1;
        this._cx = -this._side * SIDE_X;
      }
      this._ry = 0; this._rx = CAM_RX[0];
      this._mv = new Float32Array(16);
      this._drawN = N; this._ema = 16; this._fc = 0;

      let ready = false, last = performance.now();
      const t0 = last;
      const loop = () => {
        this._raf = requestAnimationFrame(loop);
        if (document.hidden) { last = performance.now(); return; }
        const now = performance.now(), dtMs = now - last; last = now;
        const time = (now - t0) / 1000;

        this._ema = this._ema * 0.94 + Math.min(dtMs, 100) * 0.06;
        if ((++this._fc % 90) === 0 && this._ema > 28 && this._drawN > 80000) this._drawN = Math.floor(this._drawN * 0.7);

        this._mx += (this._tmx - this._mx) * 0.06;
        this._my += (this._tmy - this._my) * 0.06;
        if (this._playing && this._t < 1) {
          const morphSpeed = this._toId === 9 ? 0.72 : 0.42;
          this._t = Math.min(1, this._t + Math.min(dtMs / 1000, 0.04) * (reduced ? 2 : morphSpeed));
        }

        const id = this._toId;
        const morphing = this._t < 0.92;
        const morphEase = morphing ? (1 - this._t * this._t) : 0;
        const spinMul = morphing ? 0.15 + morphEase * 0.85 : 1;
        const sway = id === 0 ? 0.05 : id === 6 ? 0.04 : id === 9 ? 0.02 : 0.09;
        const tRy = Math.sin(time * 0.11) * sway * spinMul + this._mx * 0.05;
        const tRx = CAM_RX[id] - this._my * 0.04;
        this._ry += (tRy - this._ry) * 0.028;
        this._rx += (tRx - this._rx) * 0.028;
        const targetCx = MOBILE ? 0 : -this._side * SIDE_X;
        const targetCz = CAM_Z[id];
        this._side += (this._targetSide - this._side) * 0.05;
        this._cx += (targetCx - this._cx) * 0.05;
        this._cz += (targetCz - this._cz) * 0.05;

        const cy = Math.cos(this._ry), sy = Math.sin(this._ry), cx = Math.cos(this._rx), sx = Math.sin(this._rx);
        const m = this._mv;
        m[0] = cy; m[1] = sx * sy; m[2] = -cx * sy; m[3] = 0;
        m[4] = 0; m[5] = cx; m[6] = sx; m[7] = 0;
        m[8] = sy; m[9] = -sx * cy; m[10] = cx * cy; m[11] = 0;
        m[12] = this._cx; m[13] = -0.02; m[14] = -this._cz; m[15] = 1;

        gl.uniformMatrix4fv(this._u.uMV, false, m);
        gl.uniformMatrix4fv(this._u.uP, false, this._proj);
        gl.uniform1fv(this._u.uWF, this._wF);
        gl.uniform1fv(this._u.uWT, this._wT);
        gl.uniform1f(this._u.uScF, this._scF);
        gl.uniform1f(this._u.uScT, this._scT);
        gl.uniform1f(this._u.uT, this._t);
        gl.uniform1f(this._u.uTime, time);
        gl.uniform2f(this._u.uMouse, this._mx, this._my);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, this._drawN);
        if (!ready) { ready = true; this.dispatchEvent(new CustomEvent('pf-ready', { bubbles: true })); }
      };
      this._raf = requestAnimationFrame(loop);
    }

    /* Retarget without any GPU uploads: fold eased progress into the "from" weights.
       id 0..8 = shapes; id 9 = starfield (seed-derived scatter). */
    setShape(id) {
      if (!this._gl || id === this._toId) return;
      const e = this._t * this._t * (3 - 2 * this._t);
      this._scF = this._scF * (1 - e) + this._scT * e;
      for (let i = 0; i < 9; i++) this._wF[i] = this._wF[i] * (1 - e) + this._wT[i] * e;
      this._wT.fill(0);
      if (id === 9) this._scT = 1; else { this._wT[id] = 1; this._scT = 0; }
      this._toId = id;
      this._t = 0;
      this._playing = true;
    }

    setSide(side) {
      if (side === 'center') this._targetSide = 0;
      else this._targetSide = side === 'right' ? 1 : -1;
    }

    startIntro() { this._playing = true; }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      if (this._onMove) window.removeEventListener('mousemove', this._onMove);
      this._init = false; this._gl = null;
      if (this._holder) { this._holder.remove(); this._holder = null; }
    }
  }
  customElements.define('pf-scene', PFScene);
})();
