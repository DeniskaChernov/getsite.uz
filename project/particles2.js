/* <pf-scene> — getsite particle engine v4.
   Dense volumetric scene: body-level fixed canvas behind all content.
   Shapes are true 3D (depth layers, rings, extrusion) and slowly rotate/swing.
   API: el.setShape(id), el.setScroll(p 0..1), el.startIntro()
   Shapes: 0 core, 1 website, 2 telegram, 3 crm funnel, 4 automation chain, 5 network, 6 logo.
   Fires 'pf-ready' (bubbles) after first rendered frame. */
(function () {
  if (customElements.get('pf-scene')) return;

  const MOBILE = Math.min(window.innerWidth, window.innerHeight) < 700;
  const CORES = navigator.hardwareConcurrency || 4;
  const N = MOBILE ? 50000 : (CORES >= 8 ? 220000 : 130000);
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
    if (pts.length && f < 0.90) { const p = pts[Math.floor(R() * pts.length)]; put(a, i, (p[0] / 640 - 0.5) * 4.1 + G() * 0.01, (0.5 - p[1] / 160) * 1.025 + G() * 0.01, (R() - 0.5) * 0.22); }
    else put(a, i, (R() - 0.5) * 4.8, (R() - 0.5) * 2.0, (R() - 0.5) * 1.2);
  });

  function makeShapes() {
    const perm = new Uint32Array(N);
    for (let i = 0; i < N; i++) perm[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    const shuffle = (src) => { const o = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const s = perm[i] * 3; o[i * 3] = src[s]; o[i * 3 + 1] = src[s + 1]; o[i * 3 + 2] = src[s + 2]; } return o; };

    const scatter = gen((a, i) => put(a, i, (R() - 0.5) * 10, (R() - 0.5) * 6, (R() - 0.5) * 6 - 1));
    const shapes = [];

    // 0 CORE — shell + two tilted orbit rings + dense heart + node clusters + dust
    const NODE = []; for (let k = 0; k < 10; k++) { const u = R() * 2 - 1, ph = R() * 6.2832, s = Math.sqrt(1 - u * u); NODE.push([s * Math.cos(ph) * 1.32, u * 1.32, s * Math.sin(ph) * 1.32]); }
    shapes[0] = gen((a, i, f) => {
      if (f < 0.46) { const u = R() * 2 - 1, ph = R() * 6.2832, r = 1.15 + G() * 0.05, s = Math.sqrt(1 - u * u); put(a, i, s * Math.cos(ph) * r, u * r, s * Math.sin(ph) * r); }
      else if (f < 0.58) { const an = R() * 6.2832, r = 1.62 + G() * 0.015; const x = Math.cos(an) * r, z = Math.sin(an) * r; put(a, i, x, -z * 0.44, z * 0.9); }
      else if (f < 0.68) { const an = R() * 6.2832, r = 1.45 + G() * 0.015; const x = Math.cos(an) * r, z = Math.sin(an) * r; put(a, i, x * 0.77 - z * 0.35, z * 0.52, x * 0.5 + z * 0.72); }
      else if (f < 0.80) put(a, i, G() * 0.35, G() * 0.35, G() * 0.35);
      else if (f < 0.92) { const c = NODE[Math.floor(R() * 10)]; put(a, i, c[0] + G() * 0.07, c[1] + G() * 0.07, c[2] + G() * 0.07); }
      else put(a, i, (R() - 0.5) * 6, (R() - 0.5) * 4, (R() - 0.5) * 4);
    });

    // 1 WEBSITE — 3D browser: front frame, recessed image, floating cards, back grid plane
    shapes[1] = gen((a, i, f) => {
      if (f < 0.16) rectEdge(a, i, -1.4, -0.95, 1.4, 0.95, 0.30);
      else if (f < 0.21) seg(a, i, -1.4, 0.70, 1.4, 0.70, 0.30, 0.30);
      else if (f < 0.23) { const cx = -1.25 + Math.floor(R() * 3) * 0.1; put(a, i, cx + G() * 0.012, 0.82 + G() * 0.012, 0.30 + G() * 0.015); }
      else if (f < 0.31) { if (R() < 0.55) seg(a, i, -1.15, 0.40, -0.15, 0.40, 0.30, 0.30); else seg(a, i, -1.15, 0.25, -0.4, 0.25, 0.30, 0.30); }
      else if (f < 0.36) rectEdge(a, i, -1.15, -0.10, -0.75, 0.05, 0.32);
      else if (f < 0.46) rectEdge(a, i, 0.15, -0.08, 1.15, 0.52, 0.05);
      else if (f < 0.49) seg(a, i, 0.15, 0.52, 1.15, -0.08, 0.05, 0.05);
      else if (f < 0.73) { const k = Math.floor(R() * 3), x0 = -1.15 + k * 0.82; if (R() < 0.7) rectEdge(a, i, x0, -0.78, x0 + 0.68, -0.30, -0.20); else rectFill(a, i, x0 + 0.06, -0.72, x0 + 0.62, -0.36, -0.20); }
      else if (f < 0.88) { if (R() < 0.5) { const y0 = -0.9 + Math.floor(R() * 7) * 0.3; seg(a, i, -1.55, y0, 1.55, y0, -0.5, -0.5); } else { const x0 = -1.5 + Math.floor(R() * 11) * 0.3; seg(a, i, x0, -0.95, x0, 1.0, -0.5, -0.5); } }
      else put(a, i, (R() - 0.5) * 3.6, (R() - 0.5) * 2.4, (R() - 0.5) * 1.4);
    });

    // 2 TELEGRAM — paper plane in two depth planes + 3D spiral trail
    const A = [-1.35, 0.66], T = [1.4, 0.06], C = [-0.5, -0.22], D = [-0.12, -0.74];
    shapes[2] = gen((a, i, f) => {
      if (f < 0.28) tri(a, i, A, T, C, 0.13);
      else if (f < 0.42) tri(a, i, C, T, D, -0.15);
      else if (f < 0.48) seg(a, i, A[0], A[1], T[0], T[1], 0.13, 0.13);
      else if (f < 0.53) seg(a, i, A[0], A[1], C[0], C[1], 0.13, 0.13);
      else if (f < 0.58) seg(a, i, C[0], C[1], T[0], T[1], 0.0, 0.0);
      else if (f < 0.63) seg(a, i, D[0], D[1], T[0], T[1], -0.15, 0.05);
      else if (f < 0.85) { const t = R(); put(a, i, -2.6 + t * 1.35, -0.5 + t * 0.6 + Math.sin(t * 7) * 0.1, Math.cos(t * 7) * 0.2 + G() * 0.02); }
      else put(a, i, (R() - 0.5) * 3.8, (R() - 0.5) * 2.4, (R() - 0.5) * 1.2);
    });

    // 3 CRM — volumetric funnel: 4 stacked rings narrowing + side streams + drip + deal sphere
    const FW = [1.25, 0.95, 0.66, 0.40];
    shapes[3] = gen((a, i, f) => {
      if (f < 0.46) { const k = Math.floor(R() * 4), w = FW[k] + G() * 0.02, an = R() * 6.2832, y = 0.80 - k * 0.44; put(a, i, Math.cos(an) * w, y + G() * 0.025, Math.sin(an) * w); }
      else if (f < 0.58) { const k = Math.floor(R() * 4), w = FW[k] * Math.sqrt(R()), an = R() * 6.2832, y = 0.80 - k * 0.44; put(a, i, Math.cos(an) * w, y + G() * 0.015, Math.sin(an) * w); }
      else if (f < 0.74) { const k = Math.floor(R() * 3), an = Math.floor(R() * 10) / 10 * 6.2832, t = R(); const w = FW[k] + t * (FW[k + 1] - FW[k]), y = 0.80 - k * 0.44 - t * 0.44; put(a, i, Math.cos(an) * w + G() * 0.012, y, Math.sin(an) * w + G() * 0.012); }
      else if (f < 0.82) { const t = R(); put(a, i, G() * 0.03, -0.62 - t * 0.4, G() * 0.03); }
      else if (f < 0.92) sphere(a, i, 0, -1.24, 0, 0.17 + G() * 0.012);
      else put(a, i, (R() - 0.5) * 3.6, (R() - 0.5) * 2.6, (R() - 0.5) * 1.6);
    });

    // 4 AUTOMATION — 3D chain: node spheres zigzagging in depth + links + pulse clusters
    const CX = [-1.8, -1.08, -0.36, 0.36, 1.08, 1.8];
    const CYf = (k) => (k % 2 ? 0.24 : -0.24);
    const CZf = (k) => (k % 2 ? 0.30 : -0.30);
    shapes[4] = gen((a, i, f) => {
      if (f < 0.36) { const k = Math.floor(R() * 6); sphere(a, i, CX[k], CYf(k), CZf(k), 0.16 + G() * 0.012); }
      else if (f < 0.44) { const k = Math.floor(R() * 6); put(a, i, CX[k] + G() * 0.04, CYf(k) + G() * 0.04, CZf(k) + G() * 0.04); }
      else if (f < 0.78) { const k = Math.floor(R() * 5); seg(a, i, CX[k], CYf(k), CX[k + 1], CYf(k + 1), CZf(k), CZf(k + 1)); }
      else if (f < 0.86) { const k = Math.floor(R() * 5), t = R(); put(a, i, CX[k] + t * (CX[k + 1] - CX[k]) + G() * 0.03, CYf(k) + t * (CYf(k + 1) - CYf(k)) + G() * 0.03, CZf(k) + t * (CZf(k + 1) - CZf(k)) + G() * 0.03); }
      else put(a, i, (R() - 0.5) * 4.6, (R() - 0.5) * 1.8, (R() - 0.5) * 1.4);
    });

    // 5 NETWORK — hub + satellites + spokes (already volumetric)
    const SAT = []; for (let k = 0; k < 8; k++) { const an = k / 8 * 6.2832; SAT.push([Math.cos(an) * 1.5, Math.sin(an * 2) * 0.4, Math.sin(an) * 1.5]); }
    shapes[5] = gen((a, i, f) => {
      if (f < 0.16) put(a, i, G() * 0.18, G() * 0.18, G() * 0.18);
      else if (f < 0.54) { const c = SAT[Math.floor(R() * 8)]; sphere(a, i, c[0], c[1], c[2], 0.09 + R() * 0.04); }
      else if (f < 0.88) { const c = SAT[Math.floor(R() * 8)], t = R(); put(a, i, c[0] * t + G() * 0.012, c[1] * t + G() * 0.012, c[2] * t + G() * 0.012); }
      else put(a, i, (R() - 0.5) * 5.5, (R() - 0.5) * 3.4, (R() - 0.5) * 3.4);
    });

    // 6 LOGO — extruded glyphs
    shapes[6] = buildLogoRaw(buildLogoPts());

    return { scatter: shuffle(scatter), shapes: shapes.map(shuffle), shuffle };
  }

  const VS = `
attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 aSeed;
uniform mat4 uMV; uniform mat4 uP;
uniform float uT; uniform float uTime; uniform vec2 uMouse; uniform float uMouseF; uniform float uSize;
varying float vA; varying float vSeed;
void main(){
  float tt = uT * uT * (3.0 - 2.0 * uT);
  vec3 p = mix(aFrom, aTo, tt);
  float w = 0.022 + 0.026 * aSeed.x;
  p += w * vec3(
    sin(uTime * (0.5 + aSeed.y) + aSeed.x * 19.0),
    cos(uTime * (0.45 + aSeed.y * 0.7) + aSeed.x * 29.0),
    sin(uTime * (0.6 + aSeed.y * 0.5) + aSeed.x * 37.0));
  vec4 mv = uMV * vec4(p, 1.0);
  vec4 pos = uP * mv;
  vec2 ndc = pos.xy / pos.w;
  vec2 d = ndc - uMouse;
  float f = exp(-dot(d, d) * 10.0) * uMouseF;
  vec2 dir = normalize(d + vec2(1e-4));
  pos.xy += (dir * 0.13 + vec2(-dir.y, dir.x) * 0.07) * f * pos.w;
  gl_Position = pos;
  float dist = max(0.7, -mv.z);
  float ps = uSize * (0.6 + aSeed.z * 1.1) * (2.3 / dist);
  gl_PointSize = max(1.0, min(ps, uSize * 3.2));
  vA = 0.32 + 0.30 * sin(uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 40.0);
  vSeed = aSeed.z;
}`;
  const FS = `
precision mediump float;
varying float vA; varying float vSeed;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
void main(){
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.12, d) * vA;
  vec3 col = vSeed > 0.88 ? uC1 : (vSeed > 0.80 ? uC3 : uC2);
  gl_FragColor = vec4(col * 0.95, a);
}`;

  const hex = (c) => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  const persp = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };

  // camera preset per shape: x shift (0 on mobile), z distance — bigger shapes, side varies per section
  const CAM = [
    { x: 0.72, z: 2.7 }, { x: 0.72, z: 2.9 }, { x: 0.72, z: 2.9 }, { x: 0.0, z: 3.5 },
    { x: -0.55, z: 3.4 }, { x: 0.72, z: 3.0 }, { x: -0.4, z: 2.9 }
  ];

  class PFScene extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = 'block';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none';
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
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('pf-scene shader: ' + gl.getProgramInfoLog(prog)); return; }
      gl.useProgram(prog);

      const built = makeShapes();
      this._shapes = built.shapes;
      this._shuffle = built.shuffle;
      this._from = new Float32Array(built.scatter);
      this._toId = 0;
      this._t = 0;
      this._playing = false;

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
      this._bFrom = mkBuf(this._from, 'aFrom', gl.DYNAMIC_DRAW);
      this._bTo = mkBuf(this._shapes[0], 'aTo', gl.DYNAMIC_DRAW);
      mkBuf(seeds, 'aSeed', gl.STATIC_DRAW);
      this._locFrom = gl.getAttribLocation(prog, 'aFrom');
      this._locTo = gl.getAttribLocation(prog, 'aTo');
      this._gl = gl;

      this._u = {};
      ['uMV', 'uP', 'uT', 'uTime', 'uMouse', 'uMouseF', 'uSize', 'uC1', 'uC2', 'uC3'].forEach(n => this._u[n] = gl.getUniformLocation(prog, n));
      gl.uniform3fv(this._u.uC1, hex(0xD8FF3D));
      gl.uniform3fv(this._u.uC2, hex(0xF2F0EA));
      gl.uniform3fv(this._u.uC3, hex(0x56C8FF));
      gl.uniform1f(this._u.uMouseF, reduced || MOBILE ? 0 : 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.disable(gl.DEPTH_TEST);

      this._scroll = 0; this._mx = 0; this._my = 0; this._tmx = 0; this._tmy = 0;
      if (!reduced && !MOBILE) {
        this._onMove = (e) => { this._tmx = (e.clientX / window.innerWidth) * 2 - 1; this._tmy = -((e.clientY / window.innerHeight) * 2 - 1); };
        window.addEventListener('mousemove', this._onMove, { passive: true });
      }

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1 : 1.25);
        canvas.width = Math.max(2, window.innerWidth * dpr);
        canvas.height = Math.max(2, window.innerHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        this._proj = persp(0.9, canvas.width / canvas.height, 0.1, 30);
        gl.uniform1f(this._u.uSize, dpr * (MOBILE ? 2.1 : 1.55));
      };
      resize();
      this._onResize = resize;
      window.addEventListener('resize', resize);

      if (document.fonts && document.fonts.load) {
        document.fonts.load('900 112px "Unbounded"').then(() => {
          const pts = buildLogoPts();
          if (!pts.length || !this._gl) return;
          this._shapes[6] = this._shuffle(buildLogoRaw(pts));
          if (this._toId === 6) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._bTo);
            gl.bufferData(gl.ARRAY_BUFFER, this._shapes[6], gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(this._locTo, 3, gl.FLOAT, false, 0, 0);
          }
        }).catch(() => {});
      }

      this._cx = MOBILE ? 0 : CAM[0].x; this._cz = CAM[0].z;
      this._ry = 0; this._rx = 0.14;
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
        if ((++this._fc % 90) === 0 && this._ema > 30 && this._drawN > 20000) this._drawN = Math.floor(this._drawN * 0.68);

        this._mx += (this._tmx - this._mx) * 0.06;
        this._my += (this._tmy - this._my) * 0.06;
        if (this._playing && this._t < 1) this._t = Math.min(1, this._t + Math.min(dtMs / 1000, 0.05) * (reduced ? 3 : 0.8));

        const id = this._toId;
        const cont = id === 0 || id === 3 || id === 5;      // radially symmetric — rotate continuously
        const amp = id === 6 ? 0.10 : 0.45;                  // others swing to show depth
        const tRy = cont ? time * 0.14 + this._mx * 0.18 : Math.sin(time * 0.2) * amp + this._mx * 0.15;
        const tRx = (id === 3 ? 0.42 : cont ? 0.16 : 0.10) - this._my * 0.09;
        this._ry += (tRy - this._ry) * 0.05;
        this._rx += (tRx - this._rx) * 0.05;
        const cam = CAM[id];
        this._cx += ((MOBILE ? 0 : cam.x) - this._cx) * 0.045;
        this._cz += (cam.z - this._cz) * 0.045;

        const cy = Math.cos(this._ry), sy = Math.sin(this._ry), cx = Math.cos(this._rx), sx = Math.sin(this._rx);
        const m = this._mv;
        m[0] = cy; m[1] = sx * sy; m[2] = -cx * sy; m[3] = 0;
        m[4] = 0; m[5] = cx; m[6] = sx; m[7] = 0;
        m[8] = sy; m[9] = -sx * cy; m[10] = cx * cy; m[11] = 0;
        m[12] = this._cx; m[13] = -0.02; m[14] = -this._cz; m[15] = 1;

        gl.uniformMatrix4fv(this._u.uMV, false, m);
        gl.uniformMatrix4fv(this._u.uP, false, this._proj);
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

    setShape(id) {
      if (!this._gl || !this._shapes || id === this._toId) return;
      const gl = this._gl;
      const e = this._t * this._t * (3 - 2 * this._t);
      const to = this._shapes[this._toId];
      const f = this._from;
      for (let i = 0; i < f.length; i++) f[i] += (to[i] - f[i]) * e;
      this._toId = id;
      this._t = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._bFrom);
      gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(this._locFrom, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._bTo);
      gl.bufferData(gl.ARRAY_BUFFER, this._shapes[id], gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(this._locTo, 3, gl.FLOAT, false, 0, 0);
    }

    startIntro() { this._playing = true; }
    setScroll(p) { this._scroll = p; }

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
