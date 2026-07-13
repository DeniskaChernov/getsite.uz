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
      c.beginPath();
      c.roundRect(-size * 0.018, -size * 0.09, size * 0.036, size * 0.18, size * 0.018);
      c.fill();
    }
    c.restore();
    const d = c.getImageData(0, 0, size, size).data; const pts = [];
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        if (d[(y * size + x) * 4 + 3] > 100) pts.push([x, y]);
      }
    }
    return { pts, size };
  }
  const buildLogoRaw = (sample) => gen((a, i, f) => {
    const { pts, size } = sample;
    if (pts.length && f < 0.92) {
      const p = pts[Math.floor(R() * pts.length)];
      const layer = R();
      const nz = layer < 0.42 ? 0.16 + R() * 0.05 : layer < 0.72 ? R() * 0.14 : -0.08 - R() * 0.06;
      put(a, i, (p[0] / size - 0.5) * 2.4 + G() * 0.006, (0.5 - p[1] / size) * 2.4 + G() * 0.006, nz);
    } else if (f < 0.978) {
      const p = pts[Math.floor(R() * pts.length)];
      put(a, i, (p[0] / size - 0.5) * 2.4 + G() * 0.01, (0.5 - p[1] / size) * 2.4 + G() * 0.01, G() * 0.02);
    } else radialDust(a, i, 0.35, 3.2);
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
      } else if (f < 0.96) {
        const t = R(), an = R() * 6.2832, y = -0.9 - t * 1.28, r = 0.14 * (1 - t * 0.8) * (0.35 + R() * 0.65);
        put(a, i, Math.cos(an) * r + G() * 0.012, y, Math.sin(an) * r * 0.48);
      } else if (f < 0.978) {
        const t = R(), an = R() * 6.2832, y = -0.8 + t * 1.2, r = 0.17 + G() * 0.012;
        put(a, i, Math.cos(an) * r, y, Math.sin(an) * r * 0.5);
      } else radialDust(a, i, 0.55, 3.4);
    });

    const SI = window.PF_SHAPE_ICONS;
    const iconVol = (key) => {
      const sc = SI.scales[key];
      return SI.makeVol(SI.ICONS[key](), sc[0], sc[1], sc[2], SI.dust, put, gen, radialDust);
    };

    shapes[1] = iconVol('browser');
    shapes[2] = iconVol('briefcase');
    shapes[3] = iconVol('headset');
    shapes[4] = iconVol('workflow');
    shapes[5] = iconVol('book');
    shapes[6] = buildLogoRaw(buildLogoPts());
    shapes[7] = iconVol('plane');
    shapes[8] = iconVol('automation');

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
  float lime = step(0.93, aSeed.y);
  float ps = uSize * (0.7 + aSeed.z * 1.2) * (2.4 / dist) * (1.0 + lime * 0.5);
  float zSize = clamp(0.82 + form.z * 2.4, 0.62, 1.38);
  gl_PointSize = max(1.0, min(ps * zSize, uSize * 4.6));
  vCloud = cloud;
  vFormZ = form.z;
  float cosmosAlpha = mix(1.0, cosmosFade * 0.85, cloud);
  vA = (0.44 + 0.24 * sin(uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 40.0)) * uA * cosmosAlpha;
  float fog = clamp((dist - 1.6) / 3.4, 0.0, 1.0);
  float zLift = clamp(0.58 + form.z * 4.2, 0.36, 1.72);
  float sideShade = clamp(0.9 + form.x * 0.14, 0.74, 1.14);
  vec3 base = mix(vec3(0.949, 0.941, 0.918), vec3(0.337, 0.784, 1.0), smoothstep(0.5, 0.93, aSeed.y) * 0.85);
  vec3 col = mix(base, vec3(0.847, 1.0, 0.239) * 1.35, lime);
  vColor = col * (1.32 - fog * 0.45) * cosmosAlpha * zLift * sideShade;
  gl_PointSize *= mix(1.0, 0.35 + cosmosFade * 0.65, cloud);
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
  const CAM_SCL = [0.88, 0.76, 0.78, 0.74, 0.68, 0.76, 0.86, 0.74, 0.72, 1.0];
  const SIDE_X = 1.55;
  const SIDE_X_M = 0.95;

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
