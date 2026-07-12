/* <particle-field> — WebGL particle scene: morphing shapes, cursor repulsion, flicker.
   API: el.setScroll(sectionFloat 0..4), el.startIntro() */
(function () {
  if (customElements.get('particle-field')) return;

  const N = 100000;

  function makeShapes() {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const shapes = [];

    // scatter (intro start)
    const scatter = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      scatter[i * 3] = rnd(-6, 6); scatter[i * 3 + 1] = rnd(-4, 4); scatter[i * 3 + 2] = rnd(-6, 2);
    }

    // 0: blob sphere (hero)
    const s0 = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
      const sq = Math.sqrt(1 - u * u);
      const r = 1.15 * (0.55 + 0.5 * Math.pow(Math.random(), 2.2));
      s0[i * 3] = sq * Math.cos(ph) * r; s0[i * 3 + 1] = u * r; s0[i * 3 + 2] = sq * Math.sin(ph) * r;
    }

    // 1: torus (agency)
    const s1 = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * 2;
      const R = 1.05, r = 0.34 * Math.pow(Math.random(), 0.6);
      s1[i * 3] = (R + r * Math.cos(b)) * Math.cos(a);
      s1[i * 3 + 1] = r * Math.sin(b) * 1.15;
      s1[i * 3 + 2] = (R + r * Math.cos(b)) * Math.sin(a);
    }

    // 2: double helix (services)
    const s2 = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = rnd(-1.5, 1.5);
      const strand = Math.random() < 0.5 ? 0 : Math.PI;
      const ang = t * 3.2 + strand;
      const rad = 0.6 + rnd(-0.13, 0.13);
      s2[i * 3] = Math.cos(ang) * rad;
      s2[i * 3 + 1] = t;
      s2[i * 3 + 2] = Math.sin(ang) * rad;
    }

    // 3: wave plane (custom)
    const s3 = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const x = rnd(-1.8, 1.8), z = rnd(-1.4, 1.4);
      s3[i * 3] = x;
      s3[i * 3 + 1] = 0.32 * Math.sin(x * 2.4) + 0.22 * Math.cos(z * 2.0) + rnd(-0.05, 0.05);
      s3[i * 3 + 2] = z;
    }

    // 4: vortex funnel (contacts)
    const s4 = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.55) * 1.5;
      s4[i * 3] = Math.cos(ang) * rad;
      s4[i * 3 + 1] = -0.7 + 1.5 * Math.exp(-rad * 1.6) + rnd(-0.06, 0.06);
      s4[i * 3 + 2] = Math.sin(ang) * rad;
    }

    shapes.push(s0, s1, s2, s3, s4);
    return { scatter, shapes };
  }

  const VS = `
attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 aSeed;
uniform mat4 uMV; uniform mat4 uP;
uniform float uT; uniform float uTime; uniform vec2 uMouse; uniform float uMouseF; uniform float uSize;
varying float vAlpha; varying float vMix;
void main(){
  float tt = smoothstep(0.0, 1.0, uT);
  vec3 p = mix(aFrom, aTo, tt);
  p += 0.05 * vec3(
    sin(uTime * (0.6 + aSeed.y) + aSeed.x * 17.0),
    cos(uTime * (0.5 + aSeed.y * 0.8) + aSeed.x * 23.0),
    sin(uTime * (0.7 + aSeed.y * 0.6) + aSeed.x * 31.0));
  vec4 mv = uMV * vec4(p, 1.0);
  vec4 pos = uP * mv;
  vec2 ndc = pos.xy / pos.w;
  vec2 d = ndc - uMouse;
  float f = exp(-dot(d, d) * 9.0) * uMouseF;
  vec2 dir = normalize(d + vec2(1e-4));
  vec2 tang = vec2(-dir.y, dir.x);
  pos.xy += (dir * f * 0.24 + tang * f * 0.16) * pos.w;
  gl_Position = pos;
  float dist = max(0.6, -mv.z);
  gl_PointSize = uSize * (0.8 + aSeed.z * 1.6) * (2.6 / dist);
  vAlpha = (0.16 + 0.5 * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed.y * 2.2) + aSeed.x * 40.0)));
  vMix = aSeed.z;
}`;

  const FS = `
precision mediump float;
varying float vAlpha; varying float vMix;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
void main(){
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.08, d) * vAlpha;
  vec3 col = vMix < 0.62 ? mix(uC2, uC1, vMix / 0.62) : mix(uC1, uC3, (vMix - 0.62) / 0.38);
  gl_FragColor = vec4(col, a);
}`;

  function hex(c) { return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]; }

  function persp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }

  class ParticleField extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = 'block';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(canvas);
      const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
      if (!gl) return;
      this._gl = gl; this._canvas = canvas;

      const prog = gl.createProgram();
      const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(prog, s); };
      mk(gl.VERTEX_SHADER, VS); mk(gl.FRAGMENT_SHADER, FS);
      gl.linkProgram(prog); gl.useProgram(prog);

      const { scatter, shapes } = makeShapes();
      this._shapes = shapes;

      const seeds = new Float32Array(N * 3);
      for (let i = 0; i < N * 3; i++) seeds[i] = Math.random();

      const mkBuf = (data, loc) => {
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        const a = gl.getAttribLocation(prog, loc);
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0);
        return b;
      };
      this._bFrom = mkBuf(scatter, 'aFrom');
      this._bTo = mkBuf(shapes[0], 'aTo');
      mkBuf(seeds, 'aSeed');
      this._locFrom = gl.getAttribLocation(prog, 'aFrom');
      this._locTo = gl.getAttribLocation(prog, 'aTo');

      this._u = {};
      ['uMV', 'uP', 'uT', 'uTime', 'uMouse', 'uMouseF', 'uSize', 'uC1', 'uC2', 'uC3'].forEach(n => this._u[n] = gl.getUniformLocation(prog, n));
      gl.uniform3fv(this._u.uC1, hex(0x4F7DFF));
      gl.uniform3fv(this._u.uC2, hex(0xF2F0EA));
      gl.uniform3fv(this._u.uC3, hex(0xD9B45B));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.disable(gl.DEPTH_TEST);

      this._scroll = 0;        // section float 0..4
      this._curIdx = -1;       // -1 = intro (scatter -> shape0)
      this._intro = 0;
      this._introOn = false;
      this._mx = 0; this._my = 0; this._tmx = 0; this._tmy = 0;

      this._onMove = (e) => {
        this._tmx = (e.clientX / window.innerWidth) * 2 - 1;
        this._tmy = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener('mousemove', this._onMove, { passive: true });

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = this.clientWidth * dpr; canvas.height = this.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        this._proj = persp(0.9, canvas.width / canvas.height, 0.1, 30);
      };
      resize();
      this._ro = new ResizeObserver(resize); this._ro.observe(this);

      const shifts = [0.85, -0.7, 0.75, 0, -1.1];    // object x-offset per section
      const zooms = [3.1, 3.4, 3.3, 3.6, 4.4];

      const t0 = performance.now();
      const loop = () => {
        const time = (performance.now() - t0) / 1000;
        this._mx += (this._tmx - this._mx) * 0.06;
        this._my += (this._tmy - this._my) * 0.06;

        let t;
        if (this._curIdx === -1) {
          if (this._introOn) this._intro = Math.min(1, this._intro + 0.011);
          t = this._intro;
          if (this._intro >= 1) { this._setPair(0); }
        } else {
          const s = Math.max(0, Math.min(this._shapes.length - 1.0001, this._scroll));
          const idx = Math.floor(s);
          if (idx !== this._curIdx) this._setPair(idx);
          t = s - idx;
        }

        const s = Math.max(0, Math.min(4, this._scroll));
        const i0 = Math.floor(Math.min(3.999, s)), ft = Math.min(1, s - i0);
        const shiftX = shifts[i0] + (shifts[i0 + 1] - shifts[i0]) * ft;
        const camZ = zooms[i0] + (zooms[i0 + 1] - zooms[i0]) * ft;

        const ry = time * 0.12 + s * 1.4;
        const rx = 0.18 + Math.sin(time * 0.07) * 0.06 + s * 0.1;
        const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
        // MV = T(shift,0,-camZ) * Rx * Ry  (column-major)
        const mv = new Float32Array([
          cy, sx * sy, -cx * sy, 0,
          0, cx, sx, 0,
          sy, -sx * cy, cx * cy, 0,
          shiftX, -0.05, -camZ, 1
        ]);

        gl.uniformMatrix4fv(this._u.uMV, false, mv);
        gl.uniformMatrix4fv(this._u.uP, false, this._proj);
        gl.uniform1f(this._u.uT, t);
        gl.uniform1f(this._u.uTime, time);
        gl.uniform2f(this._u.uMouse, this._mx, this._my);
        gl.uniform1f(this._u.uMouseF, 1.0);
        gl.uniform1f(this._u.uSize, Math.min(window.devicePixelRatio || 1, 1.5) * 1.5);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, N);
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    _setPair(idx) {
      const gl = this._gl;
      this._curIdx = idx;
      const from = this._shapes[idx];
      const to = this._shapes[Math.min(idx + 1, this._shapes.length - 1)];
      gl.bindBuffer(gl.ARRAY_BUFFER, this._bFrom);
      gl.bufferData(gl.ARRAY_BUFFER, from, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(this._locFrom, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._bTo);
      gl.bufferData(gl.ARRAY_BUFFER, to, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(this._locTo, 3, gl.FLOAT, false, 0, 0);
    }

    startIntro() { this._introOn = true; }
    setScroll(s) { this._scroll = s; }
    setPalette(cols) {
      const gl = this._gl;
      if (!gl || !this._u) return;
      gl.uniform3fv(this._u.uC1, hex(cols[0]));
      gl.uniform3fv(this._u.uC2, hex(cols[1]));
      gl.uniform3fv(this._u.uC3, hex(cols[2]));
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      window.removeEventListener('mousemove', this._onMove);
      this._init = false;
      if (this._canvas) this._canvas.remove();
    }
  }
  customElements.define('particle-field', ParticleField);
})();
