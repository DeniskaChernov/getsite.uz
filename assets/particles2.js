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
  const N = MOBILE ? 80000 : (CORES >= 8 ? 300000 : 200000);
  // Keep the v5 GPU morphing look, but cap particles for fast first paint.
  // Per-particle alpha is scaled so additive glow doesn't blow out.
  const ALPHA = Math.max(0.72, Math.min(1.28, Math.sqrt(900000 / N)));
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
    const size = 512;
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const c = cv.getContext('2d');
    const cx = size * 0.5, cy = size * 0.5, r = size * 0.42;
    c.fillStyle = '#000';
    c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
    c.strokeStyle = 'rgba(245,242,235,0.14)'; c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#f5f2eb';
    c.font = '900 250px Unbounded, Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('g', cx - size * 0.02, cy + size * 0.03);
    c.fillStyle = '#d8ff3d';
    c.save();
    c.translate(cx + size * 0.17, cy - size * 0.17);
    for (let i = 0; i < 3; i++) {
      c.rotate(1.0472);
      c.fillRect(-size * 0.018, -size * 0.09, size * 0.036, size * 0.18);
    }
    c.restore();
    const d = c.getImageData(0, 0, size, size).data; const pts = [];
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const i = (y * size + x) * 4;
        const alpha = d[i + 3];
        if (alpha < 100) continue;
        const lum = d[i] + d[i + 1] + d[i + 2];
        if (lum < 200) continue;
        pts.push([x, y]);
      }
    }
    return { pts, size };
  }
  const buildLogoRaw = (sample) => gen((a, i, f) => {
    const { pts, size } = sample;
    if (!pts.length) {
      if (f < 0.72) {
        const t = R(), an = R() * 6.2832, r = 0.78 + G() * 0.02;
        put(a, i, Math.cos(an) * r, Math.sin(an) * r, G() * 0.05);
      } else if (f < 0.88) {
        const p = pts.length ? pts[Math.floor(R() * pts.length)] : null;
        if (p) put(a, i, (p[0] / size - 0.5) * 2.4, (0.5 - p[1] / size) * 2.4, G() * 0.04);
        else put(a, i, -0.12 + G() * 0.24, G() * 0.2, G() * 0.06);
      } else radialDust(a, i, 0.55, 5.2);
      return;
    }
    if (f < 0.92) {
      const p = pts[Math.floor(R() * pts.length)];
      const layer = R();
      const nz = layer < 0.42 ? 0.16 + R() * 0.05 : layer < 0.72 ? R() * 0.14 : -0.08 - R() * 0.06;
      put(a, i, (p[0] / size - 0.5) * 2.4 + G() * 0.006, (0.5 - p[1] / size) * 2.4 + G() * 0.006, nz);
    } else if (f < 0.978) {
      const p = pts[Math.floor(R() * pts.length)];
      put(a, i, (p[0] / size - 0.5) * 2.4 + G() * 0.01, (0.5 - p[1] / size) * 2.4 + G() * 0.01, G() * 0.02);
    } else radialDust(a, i, 0.55, 5.2);
  });

  function boxVol(a, i, x0, y0, x1, y1, z0, z1) {
    const face = R();
    const zz0 = z0 + G() * 0.006;
    const zz1 = z1 + G() * 0.006;
    if (face < 0.28) rectFill(a, i, x0, y0, x1, y1, zz1, 0.006);
    else if (face < 0.52) rectFill(a, i, x0, y0, x1, y1, zz0, 0.006);
    else if (face < 0.64) rectEdge(a, i, x0, y0, x1, y1, zz1, 0.005);
    else if (face < 0.76) {
      const side = Math.floor(R() * 4);
      const t = R();
      if (side === 0) seg(a, i, x0 + t * (x1 - x0), y0, x0 + t * (x1 - x0), y0, zz0, zz1);
      else if (side === 1) seg(a, i, x0 + t * (x1 - x0), y1, x0 + t * (x1 - x0), y1, zz0, zz1);
      else if (side === 2) seg(a, i, x0, y0 + t * (y1 - y0), x0, y0 + t * (y1 - y0), zz0, zz1);
      else seg(a, i, x1, y0 + t * (y1 - y0), x1, y0 + t * (y1 - y0), zz0, zz1);
    } else {
      const t = R();
      put(a, i, x0 + t * (x1 - x0), y0 + R() * (y1 - y0), zz0 + R() * (zz1 - zz0));
    }
  }

  function makeShapes() {
    const perm = new Uint32Array(N);
    for (let i = 0; i < N; i++) perm[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    const shuffle = (src) => { const o = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const s = perm[i] * 3; o[i * 3] = src[s]; o[i * 3 + 1] = src[s + 1]; o[i * 3 + 2] = src[s + 2]; } return o; };

    const shapes = [];

    // 0 ROCKET — volumetric hull, nose, fins, porthole, exhaust
    shapes[0] = gen((a, i, f) => {
      if (f < 0.30) {
        const t = R(), an = R() * 6.2832, y = -0.8 + t * 1.38, r = 0.19 + G() * 0.01;
        put(a, i, Math.cos(an) * r, y, Math.sin(an) * r * 0.52 + G() * 0.008);
      } else if (f < 0.40) {
        const t = R(), an = R() * 6.2832, y = 0.5 + t * 0.66, r = (1 - t) * 0.21;
        put(a, i, Math.cos(an) * r, y, Math.sin(an) * r * 0.42);
      } else if (f < 0.48) {
        boxVol(a, i, -0.075, 0.02, 0.075, 0.24, 0.14, 0.3);
      } else if (f < 0.54) {
        sphere(a, i, 0, 0.14, 0.22, 0.055);
      } else if (f < 0.62) {
        const fin = Math.floor(R() * 3), t = R(), an = fin / 3 * 6.2832;
        const y = -0.6 - t * 0.38, spread = 0.24 + t * 0.48;
        put(a, i, Math.cos(an) * spread + G() * 0.01, y, 0.1 + Math.sin(an) * spread * 0.42);
      } else if (f < 0.84) {
        const t = R(), an = R() * 6.2832, y = -0.9 - t * 1.28, r = 0.14 * (1 - t * 0.8) * (0.35 + R() * 0.65);
        put(a, i, Math.cos(an) * r + G() * 0.012, y, Math.sin(an) * r * 0.48);
      } else radialDust(a, i, 0.55, 5.2);
    });

    // 1 WEBSITE — browser UI card (reference layout, extruded)
    const WX0 = -0.82, WX1 = 0.82, WY0 = -0.7, WY1 = 0.74, HDR = 0.44;
    shapes[1] = gen((a, i, f) => {
      if (f < 0.10) {
        rectFill(a, i, WX0, WY0, WX1, WY1, 0.14 + G() * 0.02, 0.02);
      } else if (f < 0.14) {
        rectFill(a, i, WX0, WY0, WX1, WY1, -0.06 + G() * 0.015, 0.018);
      } else if (f < 0.18) {
        boxVol(a, i, WX0, WY0, WX1, WY1, -0.06, 0.16);
      } else if (f < 0.21) {
        rectFill(a, i, WX0 + 0.04, WY1 - 0.08, WX1 - 0.04, WY1, 0.13, 0.015);
      } else if (f < 0.24) {
        seg(a, i, WX0 + 0.06, HDR, WX1 - 0.06, HDR, 0.13, 0.13);
      } else if (f < 0.28) {
        const k = Math.floor(R() * 3);
        sphere(a, i, [-0.66, -0.56, -0.46][k], 0.58, 0.14 + G() * 0.012, 0.022);
      } else if (f < 0.32) {
        boxVol(a, i, -0.22, 0.5, 0.62, 0.6, 0.1, 0.14);
      } else if (f < 0.40) {
        boxVol(a, i, WX0 + 0.06, 0.08, -0.16, 0.42, 0.1, 0.15);
      } else if (f < 0.44) {
        if (R() < 0.55) tri(a, i, [-0.66, 0.12], [-0.44, 0.32], [-0.28, 0.12], 0.14, 0.012);
        else tri(a, i, [-0.44, 0.12], [-0.22, 0.28], [-0.1, 0.12], 0.14, 0.012);
      } else if (f < 0.46) {
        sphere(a, i, -0.2, 0.32, 0.14, 0.052);
      } else if (f < 0.54) {
        const k = Math.floor(R() * 3), ys = [0.3, 0.24, 0.18];
        seg(a, i, 0.24, ys[k], 0.72, ys[k], 0.13, 0.13);
      } else if (f < 0.58) {
        seg(a, i, 0.24, 0.36, 0.68, 0.36, 0.13, 0.13);
        seg(a, i, 0.24, 0.1, 0.7, 0.1, 0.13, 0.13);
      } else if (f < 0.66) {
        const k = Math.floor(R() * 3), x0 = [-0.74, -0.18, 0.38][k];
        boxVol(a, i, x0, -0.64, x0 + 0.48, -0.3, 0.1, 0.14);
      } else if (f < 0.76) {
        const k = Math.floor(R() * 3), x0 = [-0.7, -0.14, 0.42][k];
        const line = Math.floor(R() * 3), ys = [-0.38, -0.48, -0.56], w = [0.34, 0.26, 0.2][line];
        seg(a, i, x0, ys[line], x0 + w[line], ys[line], 0.14, 0.14);
      } else if (f < 0.84) {
        const cr = Math.floor(R() * 4), r = 0.07;
        const cx = cr < 2 ? WX1 : WX0, cy = cr % 2 === 0 ? WY1 : WY0;
        const an = R() * 1.57;
        put(a, i, cx + (cr < 2 ? -1 : 1) * Math.cos(an) * r, cy + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, 0.13);
      } else radialDust(a, i, 0.55, 5.2);
    });

    // 2 BRIEFCASE — portfolio bag with dashboard widgets
    const BBW = 0.86, BBH = 0.7;
    shapes[2] = gen((a, i, f) => {
      if (f < 0.16) rectFill(a, i, -BBW, -BBH, BBW, BBH, 0.14 + G() * 0.02, 0.03);
      else if (f < 0.22) rectFill(a, i, -BBW, -BBH, BBW, BBH, -0.06 + G() * 0.015, 0.025);
      else if (f < 0.28) boxVol(a, i, -BBW, -BBH, BBW, BBH, -0.06, 0.16);
      else if (f < 0.32) {
        const t = R();
        put(a, i, -0.32 + t * 0.64, 0.76 + Math.sin(t * Math.PI) * 0.2, 0.16 + G() * 0.02);
      } else if (f < 0.36) seg(a, i, -BBW * 0.82, 0.3, BBW * 0.82, 0.3, 0.15, 0.15);
      else if (f < 0.42) boxVol(a, i, -0.76, -0.46, -0.16, 0.26, 0.12, 0.18);
      else if (f < 0.48) {
        if (R() < 0.55) tri(a, i, [-0.66, -0.34], [-0.4, 0.06], [-0.54, -0.34], 0.18, 0.02);
        else tri(a, i, [-0.52, -0.34], [-0.26, -0.02], [-0.36, -0.34], 0.18, 0.02);
      } else if (f < 0.52) sphere(a, i, -0.32, 0.08, 0.19, 0.038);
      else if (f < 0.58) {
        rectEdge(a, i, -0.04, 0.04, 0.26, 0.26, 0.18, 0.02);
        seg(a, i, -0.04, 0.26, 0.12, 0.36, 0.18, 0.26);
        seg(a, i, 0.26, 0.04, 0.12, 0.14, 0.18, 0.26);
      } else if (f < 0.64) {
        const k = Math.floor(R() * 3), h = [0.38, 0.5, 0.62][k];
        rectFill(a, i, 0.36 + k * 0.12, -0.04, 0.44 + k * 0.12, h, 0.18, 0.01);
      } else if (f < 0.72) {
        const t = R(), x = -0.7 + t * 1.3;
        put(a, i, x, -0.56 + Math.sin(t * 5.2) * 0.1 + t * 0.06, 0.18 + G() * 0.01);
      } else if (f < 0.78) {
        const k = Math.floor(R() * 3);
        sphere(a, i, -0.1 + k * 0.1, -0.6, 0.19, k === 1 ? 0.042 : 0.028);
      } else if (f < 0.84) rectFill(a, i, -0.1, 0.26, 0.1, 0.4, 0.19, 0.02);
      else radialDust(a, i, 0.55, 5.2);
    });

    // 3 SUPPORT — headset wrapping chat bubble
    const BX0 = -0.38, BX1 = 0.38, BY0 = -0.28, BY1 = 0.38;
    shapes[3] = gen((a, i, f) => {
      if (f < 0.16) {
        rectFill(a, i, BX0, BY0, BX1, BY1, 0.12 + G() * 0.02, 0.02);
      } else if (f < 0.20) {
        rectFill(a, i, BX0, BY0, BX1, BY1, -0.04 + G() * 0.015, 0.018);
      } else if (f < 0.24) {
        boxVol(a, i, BX0, BY0, BX1, BY1, -0.04, 0.14);
      } else if (f < 0.28) {
        tri(a, i, [BX0 + 0.04, BY0], [BX0 - 0.14, BY0 - 0.16], [BX0 + 0.1, BY0 - 0.02], 0.1, 0.015);
      } else if (f < 0.34) {
        const k = Math.floor(R() * 3), ys = [0.06, 0.0, -0.06];
        seg(a, i, -0.22, ys[k], 0.22, ys[k], 0.12, 0.12);
      } else if (f < 0.38) {
        const k = Math.floor(R() * 3);
        sphere(a, i, [-0.18, 0, 0.18][k], 0.02, 0.13 + G() * 0.01, 0.028);
      } else if (f < 0.46) {
        const an = 0.55 + R() * 2.05, r = 0.82 + G() * 0.03;
        put(a, i, Math.cos(an) * r, Math.sin(an) * r * 0.62 + 0.12, 0.06 + G() * 0.016);
      } else if (f < 0.52) {
        boxVol(a, i, -0.82, -0.12, -0.42, 0.52, 0.04, 0.12);
      } else if (f < 0.58) {
        boxVol(a, i, 0.42, -0.12, 0.82, 0.52, 0.04, 0.12);
      } else if (f < 0.64) {
        const t = R();
        put(a, i, 0.84 + G() * 0.012, 0.04 + t * 0.16, 0.1 + G() * 0.01);
      } else if (f < 0.70) {
        const t = R(), u = 1 - t;
        put(a, i, u * u * 0.56 + 2 * u * t * 0.42 + t * t * 0.16 + G() * 0.01, u * u * -0.1 + 2 * u * t * -0.34 + t * t * -0.48 + G() * 0.01, 0.08 + G() * 0.012);
      } else if (f < 0.76) {
        rectFill(a, i, 0.12, -0.5, 0.3, -0.38, 0.1, 0.012);
      } else if (f < 0.84) {
        const t = R();
        put(a, i, 0.18 + t * 0.06, -0.42 + G() * 0.01, 0.11);
      } else radialDust(a, i, 0.55, 5.2);
    });

    // 4 WORKFLOW — vertical 5-step process (matches route timeline in section)
    const WN = [-0.68, -0.34, 0, 0.34, 0.68];
    const WB = 0.34, WH = 0.2;
    shapes[4] = gen((a, i, f) => {
      if (f < 0.28) {
        const k = Math.floor(R() * 5);
        const cy = WN[k];
        boxVol(a, i, -WB * 0.5, cy - WH * 0.5, WB * 0.5, cy + WH * 0.5, 0.05, 0.15);
      } else if (f < 0.36) {
        const k = Math.floor(R() * 4);
        const y0 = WN[k] + WH * 0.5;
        const y1 = WN[k + 1] - WH * 0.5;
        const t = R();
        seg(a, i, 0, y0, 0, y1, 0.1, 0.1);
        put(a, i, G() * 0.02, y0 + t * (y1 - y0), 0.1 + G() * 0.015);
      } else if (f < 0.42) {
        const k = Math.floor(R() * 4);
        const ay = WN[k + 1] - WH * 0.58;
        tri(a, i, [-0.05, ay + 0.07], [0.05, ay + 0.07], [0, ay - 0.01], 0.1, 0.014);
      } else if (f < 0.50) {
        const k = Math.floor(R() * 5);
        sphere(a, i, 0, WN[k], 0.12, 0.042);
      } else if (f < 0.56) {
        const k = Math.floor(R() * 5);
        const cy = WN[k];
        seg(a, i, -0.1, cy + 0.05, 0.1, cy + 0.05, 0.12, 0.12);
      } else if (f < 0.62) {
        const k = Math.floor(R() * 5);
        const cy = WN[k];
        if (k === 2) {
          sphere(a, i, 0, cy - 0.02, 0.14, 0.038);
        } else {
          const t = R();
          put(a, i, -0.08 + t * 0.16, cy - 0.02, 0.12 + G() * 0.01);
        }
      } else if (f < 0.70) {
        const t = R();
        put(a, i, -WB * 0.5 - 0.1 + G() * 0.012, -0.82 + t * 1.64, 0.08 + G() * 0.02);
      } else if (f < 0.76) {
        const k = Math.floor(R() * 5);
        sphere(a, i, -WB * 0.5 - 0.1, WN[k], 0.1, 0.028);
      } else if (f < 0.82) {
        const k = Math.floor(R() * 5);
        const cy = WN[k];
        if (k === 0) {
          const an = R() * 6.2832;
          put(a, i, Math.cos(an) * 0.055, cy + Math.sin(an) * 0.055, 0.13);
          if (R() < 0.35) seg(a, i, 0.04, cy + 0.04, 0.1, cy + 0.1, 0.13, 0.13);
        } else if (k === 1) {
          sphere(a, i, 0, cy - 0.04, 0.13, 0.03);
          seg(a, i, 0, cy + 0.02, 0, cy + 0.1, 0.13, 0.13);
          seg(a, i, -0.04, cy + 0.1, 0.04, cy + 0.1, 0.13, 0.13);
        } else if (k === 2) {
          seg(a, i, -0.05, cy + 0.04, 0.05, cy - 0.04, 0.13, 0.13);
          seg(a, i, -0.05, cy - 0.04, 0.05, cy + 0.04, 0.13, 0.13);
        } else if (k === 3) {
          boxVol(a, i, -0.06, cy - 0.08, 0.06, cy + 0.02, 0.1, 0.14);
        } else {
          tri(a, i, [0, cy + 0.08], [-0.06, cy - 0.06], [0.06, cy - 0.06], 0.12, 0.016);
        }
      } else if (f < 0.84) {
        const t = R();
        put(a, i, WB * 0.5 + 0.06 + G() * 0.01, -0.7 + t * 1.4, 0.09 + G() * 0.02);
      } else radialDust(a, i, 0.55, 5.2);
    });

    // 5 CLOSED BOOK — 3/4 view with spine, pages, bookmark
    const FCX0 = -0.28, FCX1 = 0.68, FCY0 = -0.58, FCY1 = 0.62;
    const fcZ = (x) => 0.1 + ((x - FCX0) / (FCX1 - FCX0)) * 0.14;
    shapes[5] = gen((a, i, f) => {
      if (f < 0.28) {
        const x = FCX0 + R() * (FCX1 - FCX0), y = FCY0 + R() * (FCY1 - FCY0);
        put(a, i, x + G() * 0.01, y + G() * 0.01, fcZ(x) + G() * 0.02);
      } else if (f < 0.34) {
        rectEdge(a, i, FCX0, FCY0, FCX1, FCY1, 0.22, 0.03);
      } else if (f < 0.40) {
        const t = R(), y = FCY0 + t * (FCY1 - FCY0);
        const an = Math.PI * 0.5 + R() * Math.PI;
        put(a, i, -0.35 + Math.cos(an) * 0.1 + G() * 0.01, y, 0.06 + Math.sin(an) * 0.1 + G() * 0.015);
      } else if (f < 0.46) {
        const band = Math.floor(R() * 2), y = band === 0 ? -0.1 : 0.32;
        const an = Math.PI * 0.35 + R() * Math.PI * 0.65;
        put(a, i, -0.36 + Math.cos(an) * 0.12, y + G() * 0.02, 0.07 + Math.sin(an) * 0.11);
      } else if (f < 0.52) {
        const t = R(), x = -0.22 + t * 0.98;
        put(a, i, x, -0.78 + G() * 0.02, 0.06 + R() * 0.08);
      } else if (f < 0.58) {
        const line = Math.floor(R() * 8), y = -0.76 + line * 0.01;
        const t = R();
        put(a, i, -0.18 + t * 0.94, y, 0.1 + G() * 0.01);
      } else if (f < 0.64) {
        const t = R();
        put(a, i, FCX0 + t * (FCX1 - FCX0), FCY1 - R() * 0.04, 0.12 + G() * 0.02);
      } else if (f < 0.70) {
        const t = R();
        put(a, i, 0.15 + G() * 0.05, 0.28 + t * 0.48, 0.26 + G() * 0.015);
      } else if (f < 0.76) {
        const t = R();
        put(a, i, 0.08 + t * 0.2, 0.8 + G() * 0.02, 0.24 + G() * 0.015);
      } else if (f < 0.82) {
        if (R() < 0.5) seg(a, i, 0.08, 0.42, 0.2, 0.26, 0.26, 0.26);
        else seg(a, i, 0.32, 0.42, 0.2, 0.26, 0.26, 0.26);
      } else if (f < 0.88) {
        const cr = Math.floor(R() * 4), r = 0.07;
        const cx = cr < 2 ? FCX1 : FCX0, cy = cr % 2 === 0 ? FCY1 : FCY0;
        const an = R() * 1.57;
        put(a, i, cx + (cr < 2 ? -1 : 1) * Math.cos(an) * r, cy + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, fcZ(cx) + 0.02);
      } else radialDust(a, i, 0.55, 5.2);
    });

    shapes[6] = buildLogoRaw(buildLogoPts());

    // 7 TELEGRAM — paper plane with folded wings
    const TN = [0.92, 0.52], TBL = [-0.78, 0.18], TBR = [0.22, -0.28], TC = [-0.02, 0.02], TKF = [-0.32, -0.62];
    shapes[7] = gen((a, i, f) => {
      if (f < 0.28) tri(a, i, TN, TBL, TC, 0.16, 0.022);
      else if (f < 0.44) tri(a, i, TN, TC, TBR, 0.1, 0.02);
      else if (f < 0.54) tri(a, i, TBL, TBR, TKF, -0.16, 0.026);
      else if (f < 0.58) tri(a, i, TC, TBR, TKF, -0.12, 0.02);
      else if (f < 0.64) seg(a, i, TN[0], TN[1], TBL[0], TBL[1], 0.16, 0.12);
      else if (f < 0.68) seg(a, i, TN[0], TN[1], TBR[0], TBR[1], 0.12, 0.06);
      else if (f < 0.72) seg(a, i, TBL[0], TBL[1], TKF[0], TKF[1], 0.02, -0.14);
      else if (f < 0.76) seg(a, i, TC[0], TC[1], TBR[0], TBR[1], 0.08, 0.04);
      else if (f < 0.82) {
        const t = R();
        seg(a, i, TN[0] - t * 1.05, TN[1] - t * 0.88, TN[0] - t * 1.05 + G() * 0.02, TN[1] - t * 0.88 + G() * 0.02, 0.14 - t * 0.2, 0.08 - t * 0.16);
      } else if (f < 0.86) {
        put(a, i, TN[0] + G() * 0.012, TN[1] + G() * 0.012, 0.18 + G() * 0.01);
      } else if (f < 0.90) {
        put(a, i, TBL[0] + G() * 0.018, TBL[1] + G() * 0.018, 0.14);
      } else radialDust(a, i, 0.55, 5.2);
    });

    shapes[8] = gen((a, i, f) => {
      const AC = [[-0.74, 0.66], [0.74, 0.66], [-0.74, -0.66], [0.74, -0.66]], ASQ = 0.22;
      if (f < 0.14) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        boxVol(a, i, cx - ASQ, cy - ASQ, cx + ASQ, cy + ASQ, 0.04, 0.14);
      } else if (f < 0.20) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        const dot = Math.floor(R() * 3);
        sphere(a, i, cx + [-0.06, 0, 0.06][dot], cy + [0.06, 0, -0.06][dot], 0.12, 0.02);
      } else if (f < 0.30) {
        const tooth = Math.floor(R() * 10), ban = tooth / 10 * 6.2832 + R() * 0.1;
        const r = 0.22 + Math.abs(Math.sin(ban * 4)) * 0.09;
        put(a, i, Math.cos(ban) * r, Math.sin(ban) * r, 0.08 + G() * 0.02);
      } else if (f < 0.34) {
        sphere(a, i, 0, 0, 0.08, 0.12);
      } else if (f < 0.42) {
        const k = Math.floor(R() * 4), t = R();
        const mx = AC[k][0] * t * 0.78, my = AC[k][1] * t * 0.78;
        put(a, i, mx + G() * 0.015, my + G() * 0.015, 0.06 + G() * 0.014);
      } else if (f < 0.48) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        if (Math.abs(cx) > Math.abs(cy)) {
          seg(a, i, cx > 0 ? 0.14 : -0.14, cy * 0.35, cx > 0 ? cx - ASQ : cx + ASQ, cy, 0.1, 0.1);
        } else {
          seg(a, i, cx * 0.35, cy > 0 ? 0.14 : -0.14, cx, cy > 0 ? cy - ASQ : cy + ASQ, 0.1, 0.1);
        }
      } else if (f < 0.54) {
        if (R() < 0.45) seg(a, i, -0.8, 0.58, -0.64, 0.78, 0.12, 0.12);
        else if (R() < 0.75) seg(a, i, -0.64, 0.78, -0.76, 0.62, 0.12, 0.12);
        else seg(a, i, -0.64, 0.78, -0.52, 0.58, 0.12, 0.12);
      } else if (f < 0.60) {
        const line = Math.floor(R() * 3), y = 0.74 - line * 0.08;
        seg(a, i, 0.58, y, 0.86, y, 0.12, 0.12);
        sphere(a, i, [0.66, 0.78, 0.74][line], y, 0.12, 0.024);
      } else if (f < 0.66) {
        const cyl = Math.floor(R() * 3), y = -0.56 - cyl * 0.11, an = R() * 6.2832;
        put(a, i, -0.74 + Math.cos(an) * 0.08, y, 0.09 + Math.sin(an) * 0.03);
      } else if (f < 0.72) {
        boxVol(a, i, 0.58, -0.76, 0.88, -0.52, 0.08, 0.13);
        const dot = Math.floor(R() * 3);
        sphere(a, i, 0.62 + dot * 0.05, -0.54, 0.12, 0.016);
      } else if (f < 0.84) {
        const k = Math.floor(R() * 4), cx = AC[k][0], cy = AC[k][1];
        const cr = Math.floor(R() * 4), r = 0.06;
        const ex = cr < 2 ? cx + ASQ : cx - ASQ, ey = cr % 2 === 0 ? cy + ASQ : cy - ASQ;
        const an = R() * 1.57;
        put(a, i, ex + (cr < 2 ? -1 : 1) * Math.cos(an) * r, ey + (cr % 2 === 0 ? -1 : 1) * Math.sin(an) * r, 0.12);
      } else radialDust(a, i, 0.55, 5.2);
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
varying float vA; varying float vCloud; varying vec3 vColor; varying float vFormZ;
void main(){
  float tl = clamp(uT * 2.55 - aSeed.x * 0.04, 0.0, 1.0);
  float tt = tl * tl * (3.0 - 2.0 * tl);
  vec3 sc = vec3((aSeed.x * 2.0 - 1.0) * 5.0, (aSeed.y * 2.0 - 1.0) * 3.2, (aSeed.z * 2.0 - 1.0) * 3.0 - 0.8);
  vec3 F = sc * uScF + aP0 * uWF[0] + aP1 * uWF[1] + aP2 * uWF[2] + aP3 * uWF[3] + aP4 * uWF[4] + aP5 * uWF[5] + aP6 * uWF[6] + aP7 * uWF[7] + aP8 * uWF[8];
  vec3 T = sc * uScT + aP0 * uWT[0] + aP1 * uWT[1] + aP2 * uWT[2] + aP3 * uWT[3] + aP4 * uWT[4] + aP5 * uWT[5] + aP6 * uWT[6] + aP7 * uWT[7] + aP8 * uWT[8];
  vec3 form = mix(F, T, tt);
  float cloudSeed = fract(aSeed.x * 37.17 + aSeed.y * 11.31 + aSeed.z * 5.73);
  float cloud = step(0.56, cloudSeed);
  vec3 cosmosDir = normalize(vec3(
    sin(aSeed.x * 6.283 + aSeed.y * 3.11),
    cos(aSeed.y * 6.283 + aSeed.z * 2.7) * 0.55,
    sin(aSeed.z * 6.283 + aSeed.x * 4.3)));
  float cosmosDist = pow(cloudSeed, 1.45) * 16.0 + 0.35;
  vec3 cosmosPos = form + cosmosDir * cosmosDist;
  float cosmosFade = exp(-cosmosDist * 0.14);
  vec3 p = mix(form, cosmosPos, cloud);
  float w = 0.014 + 0.020 * aSeed.x;
  p += w * vec3(
    sin(uTime * (0.5 + aSeed.y) + aSeed.x * 19.0),
    cos(uTime * (0.45 + aSeed.y * 0.7) + aSeed.x * 29.0),
    sin(uTime * (0.6 + aSeed.y * 0.5) + aSeed.x * 37.0));
  p *= 1.0 + 0.012 * sin(uTime * 0.5);
  vec4 mv = uMV * vec4(p, 1.0);
  vec4 pos = uP * mv;
  vec2 ndc = pos.xy / pos.w;
  vec2 d = ndc - uMouse;
  float f = exp(-dot(d, d) * 10.0) * uMouseF;
  vec2 dir = normalize(d + vec2(1e-4));
  pos.xy += (dir * 0.12 + vec2(-dir.y, dir.x) * 0.06) * f * pos.w;
  gl_Position = pos;
  float dist = max(0.7, -mv.z);
  float lime = step(0.86, aSeed.y);
  float ps = uSize * (0.7 + aSeed.z * 1.2) * (2.4 / dist) * (1.0 + lime * 0.65);
  float zSize = clamp(0.82 + form.z * 2.4, 0.62, 1.38);
  gl_PointSize = max(1.0, min(ps * zSize, uSize * 4.6));
  vCloud = cloud;
  vFormZ = form.z;
  float cosmosAlpha = mix(1.0, max(0.42, cosmosFade * 0.95), cloud);
  vA = (0.46 + 0.26 * sin(uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 40.0)) * uA * cosmosAlpha;
  float fog = clamp((dist - 1.6) / 3.4, 0.0, 1.0);
  float zLift = clamp(0.58 + form.z * 4.2, 0.36, 1.72);
  float sideShade = clamp(0.9 + form.x * 0.14, 0.74, 1.14);
  vec3 base = mix(vec3(0.949, 0.941, 0.918), vec3(0.42, 0.88, 1.0), smoothstep(0.32, 0.86, aSeed.y) * 1.0);
  vec3 col = mix(base, vec3(0.847, 1.0, 0.239) * 1.45, lime);
  vColor = col * (1.38 - fog * 0.42) * cosmosAlpha * zLift * sideShade;
  gl_PointSize *= mix(1.0, 0.52 + cosmosFade * 0.62, cloud);
}`;
  const FS = `
precision mediump float;
varying float vA; varying float vCloud; varying vec3 vColor; varying float vFormZ;
void main(){
  float d = length(gl_PointCoord - vec2(0.5));
  float core = smoothstep(0.5, 0.06, d);
  float depthBoost = clamp(0.72 + vFormZ * 2.8 + 0.5, 0.55, 1.65);
  float a = core * vA;
  vec3 col = vColor * (0.88 + core * 0.28) * depthBoost;
  gl_FragColor = vec4(col, a);
}`;

  const persp = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };

  // camera z distance per shape; horizontal shift comes from setSide()
  const CAM_Z = [3.8, 4.4, 4.2, 4.5, 4.8, 4.2, 4.0, 4.4, 4.5, 4.6];
  const CAM_RX = [0.10, 0.10, 0.10, 0.09, 0.07, 0.12, 0.10, 0.10, 0.09, 0.04];
  const CAM_SCL = [0.88, 0.76, 0.78, 0.74, 0.76, 0.76, 0.86, 0.74, 0.72, 1.0];
  const SIDE_X = 1.55;
  const SIDE_X_M = 0.95;

  class PFScene extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = 'block';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const holder = document.createElement('div');
      holder.className = 'pf-holder';
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
      this._introHold = true;
      this._introActive = false;
      this._introZoom = 0;
      this._introT0 = 0;
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
        gl.uniform1f(this._u.uSize, dpr * (MOBILE ? 2.2 : N >= 250000 ? 1.75 : 2.0));
      };
      resize();
      this._onResize = resize;
      window.addEventListener('resize', resize);

      // rebuild logo glyphs once the display font is available (one-time upload)
      if (document.fonts && document.fonts.load) {
        document.fonts.load('900 112px "Unbounded"').then(() => {
          const sample = buildLogoPts();
          if (!sample.pts.length || !this._gl) return;
          const data = this._shuffle(buildLogoRaw(sample));
          gl.bindBuffer(gl.ARRAY_BUFFER, this._bufs[6]);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          gl.vertexAttribPointer(gl.getAttribLocation(prog, 'aP6'), 3, gl.FLOAT, false, 0, 0);
          if (this._toId === 6) {
            this._t = 0;
            this._playing = true;
          }
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
        if ((++this._fc % 90) === 0 && this._ema > 28 && this._drawN > 120000) this._drawN = Math.floor(this._drawN * 0.72);

        this._mx += (this._tmx - this._mx) * 0.06;
        this._my += (this._tmy - this._my) * 0.06;
        if (this._playing && this._t < 1) {
          const morphSpeed = this._introActive ? 0.62 : (this._toId === 9 ? 1.05 : 1.45);
          this._t = Math.min(1, this._t + Math.min(dtMs / 1000, 0.08) * (reduced ? 2.8 : morphSpeed));
        }

        if (this._introActive && this._introT0) {
          const introAge = (now - this._introT0) / 1000;
          this._introZoom = Math.min(1, introAge / 1.9);
          if (this._t >= 0.995 && this._introZoom >= 0.995) {
            this._introActive = false;
            this.dispatchEvent(new CustomEvent('pf-intro-complete', { bubbles: true }));
          }
        }

        const id = this._toId;
        const morphing = this._t < 0.88;
        const morphEase = morphing ? (1 - this._t * this._t) : 0;
        const spinMul = morphing ? 0.18 + morphEase * 0.82 : 1;
        const sway = id === 0 ? 0.04 : id === 6 ? 0.035 : id === 9 ? 0.015 : 0.07;
        const tRy = Math.sin(time * 0.09) * sway * spinMul + this._mx * 0.04;
        const tRx = CAM_RX[id] - this._my * 0.03;
        this._ry += (tRy - this._ry) * 0.045;
        this._rx += (tRx - this._rx) * 0.045;
        const mob = window.innerWidth < 700;
        const targetCx = -this._side * (mob ? SIDE_X_M : SIDE_X);
        const zoomEase = this._introZoom * this._introZoom * (3 - 2 * this._introZoom);
        const introPull = this._introActive ? (1 - zoomEase) * 5.8 : 0;
        const targetCz = CAM_Z[id] + introPull;
        this._side += (this._targetSide - this._side) * 0.09;
        this._cx += (targetCx - this._cx) * 0.09;
        this._cz += (targetCz - this._cz) * 0.09;

        const cy = Math.cos(this._ry), sy = Math.sin(this._ry), cx = Math.cos(this._rx), sx = Math.sin(this._rx);
        const scl = CAM_SCL[id] ?? 1;
        const m = this._mv;
        m[0] = cy * scl; m[1] = sx * sy * scl; m[2] = -cx * sy * scl; m[3] = 0;
        m[4] = 0; m[5] = cx * scl; m[6] = sx * scl; m[7] = 0;
        m[8] = sy * scl; m[9] = -sx * cy * scl; m[10] = cx * cy * scl; m[11] = 0;
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
        if (!ready) {
          ready = true;
          this.setAttribute('data-ready', '');
          this.dispatchEvent(new CustomEvent('pf-ready', { bubbles: true }));
        }
      };
      this._raf = requestAnimationFrame(loop);
    }

    /* Retarget without any GPU uploads: fold eased progress into the "from" weights.
       id 0..8 = shapes; id 9 = starfield (seed-derived scatter). */
    setShape(id) {
      if (!this._gl) return;
      if (id === this._toId) {
        if (!this._introHold && this._t < 0.98) this._playing = true;
        return;
      }
      const snapT = this._t < 0.72 ? this._t : 1;
      const e = snapT * snapT * (3 - 2 * snapT);
      this._scF = this._scF * (1 - e) + this._scT * e;
      for (let i = 0; i < 9; i++) this._wF[i] = this._wF[i] * (1 - e) + this._wT[i] * e;
      this._wT.fill(0);
      if (id === 9) this._scT = 1; else { this._wT[id] = 1; this._scT = 0; }
      this._toId = id;
      this._t = 0;
      this._playing = true;
      this._introHold = false;
      this._introActive = false;
    }

    setSide(side) {
      if (side === 'center') this._targetSide = 0;
      else this._targetSide = side === 'right' ? 1 : -1;
    }

    prepareIntro() {
      if (!this._gl) return;
      this._toId = 0;
      this._scF = 1;
      this._scT = 0;
      this._wF.fill(0);
      this._wT.fill(0);
      this._wT[0] = 1;
      this._t = 0;
      this._playing = false;
      this._introHold = true;
      this._introActive = false;
      this._introZoom = 0;
      this._introT0 = 0;
      this.setSide('left');
    }

    startIntro() {
      if (!this._gl) return;
      this._toId = 0;
      this._scF = 1;
      this._scT = 0;
      this._wF.fill(0);
      this._wT.fill(0);
      this._wT[0] = 1;
      this._t = 0;
      this._introHold = false;
      this._introActive = true;
      this._introZoom = 0;
      this._introT0 = performance.now();
      this._playing = true;
      this._cz = CAM_Z[0] + 5.8;
      this.setSide('left');
    }

    skipIntro() {
      if (!this._gl) return;
      this._toId = 0;
      this._scF = 0;
      this._scT = 0;
      this._wF.fill(0);
      this._wT.fill(0);
      this._wT[0] = 1;
      this._t = 1;
      this._playing = false;
      this._introHold = false;
      this._introActive = false;
      this._introZoom = 1;
      this._introT0 = 0;
      this.setSide('left');
    }

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
