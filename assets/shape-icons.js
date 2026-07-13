/* Reference icon rasterization + volumetric particle extrusion for pf-scene. */
window.PF_SHAPE_ICONS = (function () {
  const R = Math.random;
  const G = () => (R() + R() + R() - 1.5) * 0.66;

  function rr(c, x, y, w, h, rad) {
    c.beginPath();
    c.moveTo(x + rad, y);
    c.lineTo(x + w - rad, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rad);
    c.lineTo(x + w, y + h - rad);
    c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    c.lineTo(x + rad, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rad);
    c.lineTo(x, y + rad);
    c.quadraticCurveTo(x, y, x + rad, y);
    c.closePath();
  }

  function fillW(c) { c.fillStyle = '#fff'; c.fill(); }

  function sample(draw, size = 640, step = 1) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    draw(ctx, size, size);
    const d = ctx.getImageData(0, 0, size, size).data;
    const pts = [], edges = [];
    const on = (x, y) => x >= 0 && x < size && y >= 0 && y < size && d[(y * size + x) * 4 + 3] > 72;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        if (!on(x, y)) continue;
        pts.push([x, y]);
        if (!on(x + step, y) || !on(x - step, y) || !on(x, y + step) || !on(x, y - step)) edges.push([x, y]);
      }
    }
    return { pts, edges: edges.length ? edges : pts, size };
  }

  function drawBrowser(c, w, h) {
    const p = w * 0.055, x0 = p, y0 = p * 1.02, x1 = w - p, y1 = h - p, rad = w * 0.04;
    rr(c, x0, y0, x1 - x0, y1 - y0, rad); fillW(c);
    const hdr = y0 + (y1 - y0) * 0.118;
    c.fillStyle = '#ececec'; c.fillRect(x0, y0, x1 - x0, hdr - y0);
    ['#ff6b6b', '#ffd166', '#6ee7a8'].forEach((col, i) => {
      c.beginPath(); c.arc(x0 + w * 0.075 + i * w * 0.05, y0 + (hdr - y0) * 0.54, w * 0.015, 0, 6.2832);
      c.fillStyle = col; c.fill();
    });
    rr(c, x0 + w * 0.26, y0 + (hdr - y0) * 0.2, w * 0.42, (hdr - y0) * 0.58, w * 0.014);
    c.fillStyle = '#d6d6d6'; c.fill();
    const body = hdr + (y1 - hdr) * 0.035;
    rr(c, x0 + w * 0.048, body, x0 + w * 0.36, body + (y1 - hdr) * 0.36, w * 0.018);
    c.fillStyle = '#dedede'; c.fill();
    c.fillStyle = '#c4c4c4';
    c.beginPath();
    c.moveTo(x0 + w * 0.05, body + (y1 - hdr) * 0.3);
    c.lineTo(x0 + w * 0.18, body + (y1 - hdr) * 0.11);
    c.lineTo(x0 + w * 0.37, body + (y1 - hdr) * 0.3);
    c.closePath(); c.fill();
    c.beginPath(); c.arc(x0 + w * 0.27, body + (y1 - hdr) * 0.09, w * 0.032, 0, 6.2832);
    c.fillStyle = '#efefef'; c.fill();
    c.fillStyle = '#d0d0d0';
    [0.42, 0.5, 0.58, 0.66, 0.74].forEach((yy, i) => {
      c.fillRect(x0 + w * 0.41, body + (y1 - hdr) * yy, w * (0.47 - i * 0.045), (y1 - hdr) * 0.024);
    });
    for (let k = 0; k < 3; k++) {
      rr(c, x0 + w * (0.048 + k * 0.302), y1 - (y1 - hdr) * 0.185, w * 0.25, (y1 - hdr) * 0.125, w * 0.014);
      c.fillStyle = '#e8e8e8'; c.fill();
      c.fillStyle = '#cccccc';
      c.fillRect(x0 + w * (0.062 + k * 0.302), y1 - (y1 - hdr) * 0.16, w * 0.21, (y1 - hdr) * 0.034);
    }
  }

  function drawBriefcase(c, w, h) {
    rr(c, w * 0.11, h * 0.29, w * 0.78, h * 0.55, w * 0.036); fillW(c);
    c.strokeStyle = '#fff'; c.lineWidth = w * 0.036; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(w * 0.34, h * 0.29);
    c.quadraticCurveTo(w * 0.34, h * 0.15, w * 0.5, h * 0.15);
    c.quadraticCurveTo(w * 0.66, h * 0.15, w * 0.66, h * 0.29);
    c.stroke();
    c.fillStyle = '#e4e4e4';
    c.fillRect(w * 0.455, h * 0.29, w * 0.09, h * 0.05);
    rr(c, w * 0.16, h * 0.42, w * 0.31, h * 0.27, w * 0.016); c.fillStyle = '#ededed'; c.fill();
    c.fillStyle = '#c8c8c8';
    c.beginPath();
    c.moveTo(w * 0.2, h * 0.57); c.lineTo(w * 0.285, h * 0.47); c.lineTo(w * 0.365, h * 0.57);
    c.closePath(); c.fill();
    c.beginPath(); c.arc(w * 0.285, h * 0.49, w * 0.026, 0, 6.2832); c.fill();
    rr(c, w * 0.54, h * 0.44, w * 0.15, h * 0.14, w * 0.012);
    c.strokeStyle = '#e0e0e0'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#d0d0d0'; c.lineWidth = w * 0.01;
    c.beginPath(); c.moveTo(w * 0.54, h * 0.58); c.lineTo(w * 0.6, h * 0.5); c.lineTo(w * 0.68, h * 0.58); c.stroke();
    [0.54, 0.58, 0.62].forEach((bx, i) => {
      c.fillStyle = '#d8d8d8';
      c.fillRect(w * bx, h * 0.62, w * 0.022, h * (0.072 + i * 0.026));
    });
  }

  function drawHeadset(c, w, h) {
    rr(c, w * 0.21, h * 0.26, w * 0.58, h * 0.43, w * 0.068); fillW(c);
    c.beginPath();
    c.moveTo(w * 0.27, h * 0.69); c.lineTo(w * 0.14, h * 0.84); c.lineTo(w * 0.37, h * 0.69);
    c.closePath(); fillW(c);
    c.fillStyle = '#d2d2d2';
    [0.38, 0.46, 0.54].forEach((x) => {
      c.beginPath(); c.arc(w * x, h * 0.45, w * 0.021, 0, 6.2832); c.fill();
    });
    c.strokeStyle = '#fff'; c.lineWidth = w * 0.058; c.lineCap = 'round';
    c.beginPath(); c.arc(w * 0.5, h * 0.52, w * 0.35, Math.PI * 1.07, Math.PI * 1.93); c.stroke();
    rr(c, w * 0.035, h * 0.4, w * 0.165, h * 0.29, w * 0.054); fillW(c);
    rr(c, w * 0.8, h * 0.4, w * 0.165, h * 0.29, w * 0.054); fillW(c);
    c.lineWidth = w * 0.036;
    c.beginPath();
    c.moveTo(w * 0.885, h * 0.54);
    c.quadraticCurveTo(w * 0.96, h * 0.72, w * 0.75, h * 0.83);
    c.stroke();
    c.beginPath(); c.arc(w * 0.73, h * 0.85, w * 0.038, 0, 6.2832); fillW(c);
    c.fillStyle = '#d8ff3d';
    c.beginPath(); c.arc(w * 0.885, h * 0.48, w * 0.016, 0, 6.2832); c.fill();
  }

  function drawWorkflow(c, w, h) {
    const pw = w * 0.175, ph = h * 0.32, xs = [0.075, 0.305, 0.535, 0.765], cy = h * 0.47;
    xs.forEach((x, k) => {
      rr(c, w * x, h * 0.31, pw, ph, w * 0.022); fillW(c);
      const cx = w * (x + 0.0875);
      c.strokeStyle = '#e0e0e0'; c.lineWidth = w * 0.009; c.lineCap = 'round';
      if (k === 0) {
        c.beginPath(); c.arc(cx, cy, w * 0.046, 0, 6.2832); c.stroke();
        c.beginPath(); c.moveTo(cx + w * 0.032, cy + w * 0.032); c.lineTo(cx + w * 0.072, cy + w * 0.072); c.stroke();
      } else if (k === 1) {
        c.fillStyle = '#d8ff3d';
        c.beginPath(); c.arc(cx, cy - h * 0.018, w * 0.036, 0, 6.2832); c.fill();
        c.beginPath(); c.moveTo(cx, cy + h * 0.018); c.lineTo(cx, cy + h * 0.072); c.stroke();
        c.beginPath(); c.moveTo(cx - w * 0.02, cy + h * 0.072); c.lineTo(cx + w * 0.02, cy + h * 0.072); c.stroke();
      } else if (k === 2) {
        c.beginPath(); c.moveTo(cx - w * 0.036, cy + h * 0.04); c.lineTo(cx + w * 0.036, cy - h * 0.04); c.stroke();
        c.beginPath(); c.moveTo(cx - w * 0.036, cy - h * 0.04); c.lineTo(cx + w * 0.036, cy + h * 0.04); c.stroke();
      } else {
        c.fillStyle = '#ececec';
        c.beginPath();
        c.moveTo(cx, cy - h * 0.058); c.lineTo(cx - w * 0.032, cy + h * 0.048);
        c.lineTo(cx + w * 0.032, cy + h * 0.048); c.closePath(); c.fill();
      }
    });
    c.strokeStyle = '#fff'; c.lineWidth = w * 0.012;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(w * (xs[k] + 0.175), cy);
      c.lineTo(w * xs[k + 1], cy);
      c.stroke();
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(w * 0.962, cy); c.lineTo(w * 0.928, cy - h * 0.028); c.lineTo(w * 0.928, cy + h * 0.028);
    c.closePath(); c.fill();
  }

  function drawBook(c, w, h) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(w * 0.17, h * 0.09); c.lineTo(w * 0.91, h * 0.065);
    c.lineTo(w * 0.935, h * 0.91); c.lineTo(w * 0.13, h * 0.935);
    c.closePath(); c.fill();
    c.fillStyle = '#e8e8e8';
    c.beginPath();
    c.moveTo(w * 0.04, h * 0.11); c.lineTo(w * 0.17, h * 0.09);
    c.lineTo(w * 0.13, h * 0.935); c.lineTo(w * 0.02, h * 0.905);
    c.closePath(); c.fill();
    c.strokeStyle = '#c8c8c8'; c.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      c.beginPath();
      c.moveTo(w * (0.06 + t * 0.02), h * (0.15 + t * 0.7));
      c.lineTo(w * (0.18 + t * 0.02), h * (0.13 + t * 0.7));
      c.stroke();
    }
    c.fillStyle = '#f2f2f2';
    c.fillRect(w * 0.88, h * 0.085, w * 0.055, h * 0.83);
    c.fillStyle = '#d8ff3d';
    c.beginPath();
    c.moveTo(w * 0.5, h * 0.065); c.lineTo(w * 0.575, h * 0.065);
    c.lineTo(w * 0.538, h * 0.24); c.closePath(); c.fill();
    c.fillStyle = '#d0d0d0';
    c.fillRect(w * 0.27, h * 0.29, w * 0.52, h * 0.04);
    c.fillRect(w * 0.27, h * 0.37, w * 0.4, h * 0.026);
  }

  function drawPlane(c, w, h) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(w * 0.88, h * 0.17); c.lineTo(w * 0.07, h * 0.45);
    c.lineTo(w * 0.33, h * 0.49); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(w * 0.88, h * 0.17); c.lineTo(w * 0.33, h * 0.49);
    c.lineTo(w * 0.57, h * 0.55); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(w * 0.07, h * 0.45); c.lineTo(w * 0.25, h * 0.83);
    c.lineTo(w * 0.37, h * 0.51); c.closePath(); c.fill();
    c.strokeStyle = '#d8ff3d'; c.lineWidth = w * 0.01;
    c.beginPath(); c.moveTo(w * 0.88, h * 0.17); c.lineTo(w * 0.33, h * 0.49); c.stroke();
  }

  function drawAutomation(c, w, h) {
    const sq = w * 0.175;
    const mods = [[0.09, 0.09], [0.735, 0.09], [0.09, 0.735], [0.735, 0.735]];
    mods.forEach(([bx, by]) => {
      rr(c, w * bx, h * by, sq, sq, w * 0.024); fillW(c);
    });
    const cx = w * 0.5, cy = h * 0.5, gr = w * 0.12;
    c.fillStyle = '#fff';
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * 6.2832;
      const r = gr + (i % 2 ? gr * 0.38 : 0);
      c.beginPath();
      c.arc(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, w * 0.028, 0, 6.2832);
      c.fill();
    }
    c.beginPath(); c.arc(cx, cy, gr * 0.48, 0, 6.2832); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = w * 0.02; c.lineCap = 'round';
    [[0.264, 0.19, 0.39, 0.37], [0.736, 0.19, 0.61, 0.37], [0.264, 0.81, 0.39, 0.63], [0.736, 0.81, 0.61, 0.63]].forEach(([x1, y1, x2, y2]) => {
      c.beginPath(); c.moveTo(w * x1, h * y1); c.lineTo(w * x2, h * y2); c.stroke();
    });
    c.fillStyle = '#e8e8e8';
    c.beginPath();
    c.moveTo(w * 0.13, h * 0.13); c.lineTo(w * 0.19, h * 0.25); c.lineTo(w * 0.07, h * 0.25);
    c.closePath(); c.fill();
    [0.77, 0.83, 0.89].forEach((x) => {
      c.fillRect(w * x, h * 0.15, w * 0.011, h * 0.1);
    });
    c.fillRect(w * 0.13, h * 0.77, w * 0.08, h * 0.038);
    c.fillRect(w * 0.13, h * 0.83, w * 0.06, h * 0.028);
    rr(c, w * 0.75, h * 0.75, w * 0.14, h * 0.1, w * 0.011);
    c.fillStyle = '#ededed'; c.fill();
  }

  function makeVol(sample, sx, sy, depth, dustAt, put, gen, radialDust) {
    const { pts, edges, size } = sample;
    return gen((a, i, f) => {
      if (pts.length && f < dustAt) {
        const edge = R() < 0.38;
        const pool = edge ? edges : pts;
        const p = pool[Math.floor(R() * pool.length)];
        const nx = (p[0] / size - 0.5) * sx;
        const ny = (0.5 - p[1] / size) * sy;
        const roll = R();
        let nz;
        if (roll < 0.28) nz = depth * (0.92 + R() * 0.08);
        else if (roll < 0.48) nz = -depth * (0.32 + R() * 0.12);
        else if (roll < 0.82) nz = depth * (0.06 + R() * 0.76);
        else nz = -depth * (0.04 + R() * 0.18);
        put(a, i, nx + G() * 0.002, ny + G() * 0.002, nz + G() * 0.003);
      } else radialDust(a, i, 0.5, 3.2);
    });
  }

  const ICONS = {
    browser: () => sample(drawBrowser, 640, 1),
    briefcase: () => sample(drawBriefcase, 640, 1),
    headset: () => sample(drawHeadset, 640, 1),
    workflow: () => sample(drawWorkflow, 640, 1),
    book: () => sample(drawBook, 640, 1),
    plane: () => sample(drawPlane, 640, 1),
    automation: () => sample(drawAutomation, 640, 1),
  };

  return {
    makeVol,
    ICONS,
    scales: {
      browser: [1.86, 1.86, 0.32],
      briefcase: [1.82, 1.82, 0.28],
      headset: [1.88, 1.88, 0.26],
      workflow: [2.04, 1.04, 0.24],
      book: [1.8, 1.8, 0.32],
      plane: [1.86, 1.86, 0.26],
      automation: [1.88, 1.88, 0.28],
    },
    dust: 0.982,
  };
})();
