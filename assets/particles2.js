/* <pf-scene> — getsite particle engine v4.
   Dense volumetric scene: body-level fixed canvas behind all content.
   Shapes are abstract 3D dust fields that slowly rotate/swing.
   API: el.setShape(id), el.setScroll(p 0..1), el.startIntro()
   Shapes: 0 cloud, 1 ribbon, 2 bands, 3 clusters, 4 ribbon, 5 vortex, 6 cloud.
   Fires 'pf-ready' (bubbles) after first rendered frame. */
(function () {
  if (customElements.get('pf-scene')) return;

  const MOBILE = Math.min(window.innerWidth, window.innerHeight) < 700;
  const CORES = navigator.hardwareConcurrency || 4;
  const N = MOBILE ? 52000 : (CORES >= 8 ? 260000 : 160000);
  const R = Math.random;
  const G = () => (R() + R() + R() - 1.5) * 0.66;

  const put = (a, i, x, y, z) => { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
  const gen = (fill) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) fill(a, i, i / N); return a; };

  function makeShapes() {
    const perm = new Uint32Array(N);
    for (let i = 0; i < N; i++) perm[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    const shuffle = (src) => { const o = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const s = perm[i] * 3; o[i * 3] = src[s]; o[i * 3 + 1] = src[s + 1]; o[i * 3 + 2] = src[s + 2]; } return o; };

    const scatter = gen((a, i) => put(a, i, (R() - 0.5) * 3.6, (R() - 0.5) * 2.1, (R() - 0.5) * 2.2 - 0.15));
    const shapes = [];

    // Reference-style abstract dust fields. These intentionally replace
    // object-like silhouettes with soft clouds, ribbons and constellations.
    const dust = (mode) => gen((a, i, f) => {
      const t = R(), ph = R() * 6.2832;
      if (mode === 0) {
        if (f < 0.68) {
          const r = Math.pow(R(), 0.74) * 0.82;
          put(a, i, 0.44 + Math.cos(ph) * r * 1.08 + G() * 0.045, 0.25 + Math.sin(ph * 1.65) * r * 0.38 + G() * 0.045, Math.sin(ph) * r * 0.58 + G() * 0.055);
        } else if (f < 0.92) {
          const k = Math.floor(R() * 4);
          put(a, i, -0.55 + t * 1.88 + G() * 0.04, -0.22 + k * 0.19 + Math.sin(t * 8.6 + k) * 0.12 + G() * 0.035, Math.cos(t * 6.4 + k) * 0.54 + G() * 0.055);
        } else {
          const r = Math.pow(R(), 0.58) * 0.58;
          put(a, i, 0.98 + Math.cos(ph) * r * 0.82 + G() * 0.035, 0.08 + Math.sin(ph * 1.8) * r * 0.3 + G() * 0.035, Math.sin(ph) * r * 0.44 + G() * 0.04);
        }
      } else if (mode === 1) {
        const k = Math.floor(R() * 6);
        put(a, i, -1.12 + t * 2.38 + G() * 0.045, -0.32 + k * 0.13 + Math.sin(t * 9.8 + k * 0.8) * 0.24 + G() * 0.045, Math.cos(t * 8.0 + k) * 0.62 + G() * 0.06);
      } else if (mode === 2) {
        const band = Math.floor(R() * 5);
        put(a, i, -1.05 + t * 2.1 + G() * 0.05, -0.55 + band * 0.26 + Math.sin(t * 7.0 + band) * 0.09 + G() * 0.035, (R() - 0.5) * 1.05);
      } else if (mode === 3) {
        const c = Math.floor(R() * 8);
        const an = c / 8 * 6.2832;
        const cx = Math.cos(an) * 0.9;
        const cy = Math.sin(an * 1.3) * 0.44;
        const cz = Math.sin(an) * 0.78;
        put(a, i, cx + G() * 0.16, cy + G() * 0.13, cz + G() * 0.17);
      } else {
        const r = Math.pow(R(), 0.56) * 0.98;
        put(a, i, Math.cos(ph + t * 2.4) * r + G() * 0.045, Math.sin(ph * 2.0) * 0.54 + G() * 0.045, Math.sin(ph + t) * r * 0.72 + G() * 0.055);
      }
    });

    shapes[0] = dust(0);
    shapes[1] = dust(1);
    shapes[2] = dust(2);
    shapes[3] = dust(3);
    shapes[4] = dust(1);
    shapes[5] = dust(4);
    shapes[6] = dust(0);

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
  float ps = uSize * (0.8 + aSeed.z * 1.35) * (2.35 / dist);
  gl_PointSize = max(1.2, min(ps, uSize * 4.2));
  vA = 0.55 + 0.35 * sin(uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 40.0);
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
  gl_FragColor = vec4(col, a);
}`;

  const hex = (c) => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  const persp = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };

  // camera preset per shape: x shift (0 on mobile), z distance — bigger shapes, side varies per section
  const CAM = [
    { x: 1.08, z: 4.2 }, { x: 0.86, z: 3.8 }, { x: 0.82, z: 3.9 }, { x: 0.1, z: 4.0 },
    { x: -0.44, z: 3.95 }, { x: 0.86, z: 3.85 }, { x: -0.34, z: 3.9 }
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
        gl.uniform1f(this._u.uSize, dpr * (MOBILE ? 2.35 : 2.18));
      };
      resize();
      this._onResize = resize;
      window.addEventListener('resize', resize);

      // Keep all states abstract; the reference-like direction is dust, not
      // readable logos or product pictograms.

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
        if ((++this._fc % 90) === 0 && this._ema > 30 && this._drawN > 35000) this._drawN = Math.floor(this._drawN * 0.72);

        this._mx += (this._tmx - this._mx) * 0.06;
        this._my += (this._tmy - this._my) * 0.06;
        if (this._playing && this._t < 1) this._t = Math.min(1, this._t + Math.min(dtMs / 1000, 0.05) * (reduced ? 3 : 2.45));

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
