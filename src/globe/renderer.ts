// The planet itself: one full-canvas triangle and a fragment shader that turns every
// pixel into a longitude and latitude and reads the ground from an equirectangular
// texture. A port of the app's Skia shader (Globe.tsx) — the same rotation, the same
// grading (saturation 1.4, a top-left light with a specular touch) and the same thin
// atmosphere on the limb — plus what the hero adds: the journey's countries filling in.
//
// Outside the disc the canvas is transparent but for the haze, so the stars drawn once
// underneath it (stars.ts) show through, and the whole-canvas pass stays cheap there.

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uGround;
uniform sampler2D uIds;      // one grey level per journey country, nearest
uniform sampler2D uIdsLin;   // the same, filtered: non-zero anywhere near one of them
uniform sampler2D uFill;     // 16 × 1: r = how filled, g = how fresh (the arrival's glow)
uniform vec2 uCenter;        // device px, y up
uniform float uRadius;       // device px
uniform vec4 uTrig;          // sin(lat0), cos(lat0), sin(lon0), cos(lon0)
uniform float uHaze;         // how fast the haze falls off, per radius
uniform float uDawn;         // 0 → 1 as the planet comes up
uniform float uAnyFill;
uniform vec2 uIdsSize;

const float PI = 3.14159265;
const vec3 RIM = vec3(0.55, 0.72, 1.0);
const vec3 STAY = vec3(0.310, 0.769, 0.561);   // POSTER.stay.week  #4FC48F
const vec3 FRESH = vec3(0.659, 0.941, 0.800);  // POSTER.stay.visited #A8F0CC

vec2 fillOf(vec2 texel) {
  float id = floor(texture2D(uIds, (texel + 0.5) / uIdsSize).r * 255.0 / 16.0 + 0.5);
  if (id < 0.5) return vec2(0.0);
  return texture2D(uFill, vec2((id + 0.5) / 16.0, 0.5)).rg;
}

// The four texels round the point, blended by hand: the ids themselves can't be
// filtered (a blend of two ids is a third country), but what they stand for can.
vec2 fillAt(vec2 uv) {
  vec2 p = uv * uIdsSize - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 a = fillOf(i);
  vec2 b = fillOf(i + vec2(1.0, 0.0));
  vec2 c = fillOf(i + vec2(0.0, 1.0));
  vec2 d = fillOf(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 q = (gl_FragCoord.xy - uCenter) / uRadius;
  float r2 = dot(q, q);
  float r = sqrt(r2);

  float haze = exp(-max(r - 1.0, 0.0) * uHaze) * 0.55 * uDawn;
  vec4 outside = vec4(RIM * haze, haze);

  float cover = 1.0 - smoothstep(1.0 - 1.5 / uRadius, 1.0, r);
  if (cover <= 0.0) { gl_FragColor = outside; return; }

  float z = sqrt(max(1.0 - r2, 0.0));
  float sl = uTrig.x, cl = uTrig.y, sn = uTrig.z, cn = uTrig.w;
  float y1 = q.y * cl + z * sl;
  float z1 = -q.y * sl + z * cl;
  float x2 = q.x * cn + z1 * sn;
  float z2 = -q.x * sn + z1 * cn;
  float lon = atan(x2, z2);
  float lat = asin(clamp(y1, -1.0, 1.0));
  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);

  vec3 t = texture2D(uGround, uv).rgb;
  float lum = dot(t, vec3(0.299, 0.587, 0.114));
  t = mix(vec3(lum), t, 1.4);
  vec3 normal = vec3(q.x, q.y, z);
  vec3 lightDir = normalize(vec3(-0.6, 0.6, 1.0));
  float ndl = max(0.0, dot(normal, lightDir));
  t = t * (0.5 + 0.6 * ndl) + vec3(0.15 * pow(ndl, 8.0));

  // The countries the trip has reached, painted over the graded ground and not graded
  // themselves (as in the app), keeping only a little of the limb's fall-off.
  if (uAnyFill > 0.5 && texture2D(uIdsLin, uv).r > 0.0) {
    vec2 fill = fillAt(uv);
    float shade = mix(0.78, 1.0, z);
    vec3 paint = mix(STAY, FRESH, fill.g) * shade;
    t = mix(t, paint, fill.r * 0.8);
  }

  t += RIM * pow(1.0 - z, 4.0) * 0.55;

  vec4 inside = vec4(t, 1.0);
  gl_FragColor = mix(outside, inside, cover) * uDawn;
}
`;

export type View = {
  /** The disc's centre, CSS px from the canvas's top-left. */
  cx: number;
  cy: number;
  /** Its radius, CSS px. */
  r: number;
  /** The centre of the view, degrees. */
  lon0: number;
  lat0: number;
  dawn: number;
};

/**
 * An image, once loaded. On `load`, not `decode()`: some embedded browsers hold
 * `decode()` back while they report the page as hidden, and the upload to the GPU
 * decodes it anyway.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

export class GlobeRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private textures: Record<'ground' | 'ids' | 'idsLin' | 'fill', WebGLTexture>;
  private fill = new Uint8Array(16 * 4);
  private fillDirty = true;
  private anyFill = false;
  private idsSize: [number, number] = [2048, 1024];
  scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const opts: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' };
    const gl = (canvas.getContext('webgl2', opts) ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) throw new Error('no webgl');
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision === 0) throw new Error('no highp');
    this.gl = gl;
    this.program = this.link();
    for (const name of ['uGround', 'uIds', 'uIdsLin', 'uFill', 'uCenter', 'uRadius', 'uTrig', 'uHaze', 'uDawn', 'uAnyFill', 'uIdsSize']) {
      this.loc[name] = gl.getUniformLocation(this.program, name);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    this.textures = { ground: gl.createTexture()!, ids: gl.createTexture()!, idsLin: gl.createTexture()!, fill: gl.createTexture()! };
  }

  private link(): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    gl.useProgram(p);
    return p;
  }

  private upload(tex: WebGLTexture, unit: number, source: TexImageSource | null, filter: number, wrapS: number, w = 0, h = 0, data?: Uint8Array) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data ?? null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * The ground is sampled without mipmaps: with them the date line, where u jumps from 1
   * back to 0, picks the smallest level for one column of pixels and draws a seam. At the
   * sizes the hero shows, the full level is never far from one texel per pixel anyway.
   */
  async load(groundUrl: string, idsUrl: string) {
    const [ground, ids] = await Promise.all([loadImage(groundUrl), loadImage(idsUrl)]);
    const gl = this.gl;
    this.upload(this.textures.ground, 0, ground, gl.LINEAR, gl.REPEAT);
    this.upload(this.textures.ids, 1, ids, gl.NEAREST, gl.REPEAT);
    this.upload(this.textures.idsLin, 2, ids, gl.LINEAR, gl.REPEAT);
    this.upload(this.textures.fill, 3, null, gl.NEAREST, gl.CLAMP_TO_EDGE, 16, 1, this.fill);
    this.idsSize = [ids.naturalWidth, ids.naturalHeight];
    gl.uniform1i(this.loc.uGround, 0);
    gl.uniform1i(this.loc.uIds, 1);
    gl.uniform1i(this.loc.uIdsLin, 2);
    gl.uniform1i(this.loc.uFill, 3);
  }

  /** Replaces the ground with a sharper texture, once it has loaded. */
  async swapGround(url: string) {
    const img = await loadImage(url);
    this.upload(this.textures.ground, 0, img, this.gl.LINEAR, this.gl.REPEAT);
  }

  /** How filled journey country `index` is (0..1) and how fresh its colour (0..1). */
  setFill(index: number, amount: number, fresh: number) {
    const i = (index + 1) * 4;
    const r = Math.round(Math.max(0, Math.min(1, amount)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, fresh)) * 255);
    if (this.fill[i] === r && this.fill[i + 1] === g) return;
    this.fill[i] = r;
    this.fill[i + 1] = g;
    this.fillDirty = true;
  }

  /** Sizes the backing store to the element's box at `dpr × scale`. */
  resize(cssW: number, cssH: number, dpr: number) {
    const w = Math.max(1, Math.round(cssW * dpr * this.scale));
    const h = Math.max(1, Math.round(cssH * dpr * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  render(v: View) {
    const gl = this.gl;
    const k = this.canvas.width / Math.max(1, this.canvas.clientWidth);
    if (this.fillDirty) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.fill);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 16, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.fill);
      this.anyFill = this.fill.some((b, i) => i % 4 === 0 && b > 0);
      this.fillDirty = false;
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const φ = (v.lat0 * Math.PI) / 180, λ = (v.lon0 * Math.PI) / 180;
    gl.uniform2f(this.loc.uCenter, v.cx * k, this.canvas.height - v.cy * k);
    gl.uniform1f(this.loc.uRadius, v.r * k);
    gl.uniform4f(this.loc.uTrig, Math.sin(φ), Math.cos(φ), Math.sin(λ), Math.cos(λ));
    // The haze falls to 1/e over ~22 CSS px whatever the size.
    gl.uniform1f(this.loc.uHaze, v.r / 22);
    gl.uniform1f(this.loc.uDawn, v.dawn);
    gl.uniform1f(this.loc.uAnyFill, this.anyFill ? 1 : 0);
    gl.uniform2f(this.loc.uIdsSize, this.idsSize[0], this.idsSize[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
