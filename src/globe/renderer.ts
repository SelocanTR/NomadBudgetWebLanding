// The planet itself: one full-canvas triangle and a fragment shader that turns every
// pixel into a longitude and latitude and reads the ground from an equirectangular
// texture. A port of the app's Skia shader (Globe.tsx) — the same rotation, the same
// grading (saturation 1.4, a top-left light with a specular touch) and the same thin
// atmosphere on the limb — plus what the hero adds: the journey's countries filling in.
//
// Outside the disc the canvas is transparent but for the haze, so the stars drawn once
// underneath it (stars.ts) show through, and the whole-canvas pass stays cheap there.
//
// The marketing video (video/) adds the app's cost layer: every country painted in its
// price band against a home country, revealed as a wave spreading out from home. It is
// off (uCost = 0) unless `loadCost` has been called, so the hero never pays for it.
//
// The hero also wears the app's Pro globe themes (themes.ts): another ground with its own
// grading, spread over the old one as a wave from a place (`setLook`), and the theme's
// symbols lying on it, drawn in a second pass on the same canvas (symbols.ts). Without a
// look set, the ground is the realistic one graded as it always was.

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
uniform sampler2D uCountry;  // every country, one grey level each (index + 1), nearest
uniform sampler2D uBands;    // 256 × 1: rgb = the country's band colour, a = has one
uniform vec2 uCountrySize;
uniform float uCost;         // 0 → 1: how much of the cost layer is painted
uniform vec3 uHome;          // the home country, a unit vector
uniform float uSweep;        // radians from home the wave has reached
uniform sampler2D uGroundPrev; // the theme being left, while the wave crosses it
uniform vec4 uGrade;         // saturation, diffuse base, diffuse gain, specular (themes.ts)
uniform vec4 uGradePrev;
uniform vec3 uOrigin;        // where the new ground spreads from, a unit vector
uniform float uWave;         // radians from there it has reached; < 0: no wave
uniform vec3 uRim;           // the atmosphere: the haze round the disc and the light on its limb

const float PI = 3.14159265;
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

vec4 bandOf(vec2 texel) {
  float id = floor(texture2D(uCountry, (texel + 0.5) / uCountrySize).r * 255.0 + 0.5);
  vec4 b = texture2D(uBands, vec2((id + 0.5) / 256.0, 0.5));
  return vec4(b.rgb * b.a, b.a);
}

// As fillAt: the four neighbours' colours, blended by hand (premultiplied).
vec4 bandAt(vec2 uv) {
  vec2 p = uv * uCountrySize - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec4 a = bandOf(i);
  vec4 b = bandOf(i + vec2(1.0, 0.0));
  vec4 c = bandOf(i + vec2(0.0, 1.0));
  vec4 d = bandOf(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// The app's grading: saturation, then a top-left light with a specular touch.
vec3 graded(vec3 t, vec4 g, float ndl) {
  float lum = dot(t, vec3(0.299, 0.587, 0.114));
  t = mix(vec3(lum), t, g.x);
  return t * (g.y + g.z * ndl) + vec3(g.w * pow(ndl, 8.0));
}

void main() {
  vec2 q = (gl_FragCoord.xy - uCenter) / uRadius;
  float r2 = dot(q, q);
  float r = sqrt(r2);

  float haze = exp(-max(r - 1.0, 0.0) * uHaze) * 0.55 * uDawn;
  vec4 outside = vec4(uRim * haze, haze);

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

  vec3 normal = vec3(q.x, q.y, z);
  vec3 lightDir = normalize(vec3(-0.6, 0.6, 1.0));
  float ndl = max(0.0, dot(normal, lightDir));
  vec3 t = graded(texture2D(uGround, uv).rgb, uGrade, ndl);

  // A new theme spreading from a place: the old ground beyond the wave, a crisp edge between.
  // No light on the edge: while the wave is small a glow fills all of it, a white fog.
  if (uWave >= 0.0) {
    float dist = acos(clamp(dot(vec3(x2, y1, z2), uOrigin), -1.0, 1.0));
    float reveal = 1.0 - smoothstep(uWave - 0.015, uWave, dist);
    if (reveal < 1.0) t = mix(graded(texture2D(uGroundPrev, uv).rgb, uGradePrev, ndl), t, reveal);
  }

  // The countries the trip has reached, painted over the graded ground and not graded
  // themselves (as in the app), keeping only a little of the limb's fall-off.
  if (uAnyFill > 0.5 && texture2D(uIdsLin, uv).r > 0.0) {
    vec2 fill = fillAt(uv);
    float shade = mix(0.78, 1.0, z);
    vec3 paint = mix(STAY, FRESH, fill.g) * shade;
    t = mix(t, paint, fill.r * 0.8);
  }

  if (uCost > 0.0) {
    // Under the cost layer the ground is the app's poster navy (globeThemes.ts
    // POSTER_GROUND_THEME): the same picture, nearly grey, cast blue.
    vec3 poster = graded(texture2D(uGround, uv).rgb, vec4(0.2, 0.7, 0.42, 0.1), ndl) * vec3(0.154, 0.401, 0.852);
    t = mix(t, poster, uCost);
    vec4 band = bandAt(uv);
    if (band.a > 0.0) {
      float dist = acos(clamp(dot(vec3(x2, y1, z2), uHome), -1.0, 1.0));
      float reveal = 1.0 - smoothstep(uSweep - 0.14, uSweep, dist);
      float front = exp(-pow((dist - uSweep + 0.05) / 0.05, 2.0)) * step(0.001, uSweep);
      float shade = mix(0.78, 1.0, z);
      vec3 paint = band.rgb / band.a * shade + vec3(0.35 * front);
      t = mix(t, paint, band.a * 0.85 * reveal * uCost);
    }
  }

  t += uRim * pow(1.0 - z, 4.0) * 0.55;

  vec4 inside = vec4(t, 1.0);
  gl_FragColor = mix(outside, inside, cover) * uDawn;
}
`;

// The symbols: textured quads in CSS px, each vertex with its light and its alpha. The
// atlas is uploaded premultiplied, so a sprite's clear corners add nothing.
const SYMBOL_VERT = `
attribute vec2 aXY;
attribute vec2 aUV;
attribute vec2 aShade;       // light, alpha
uniform vec2 uView;          // the canvas, CSS px
varying vec2 vUV;
varying vec2 vShade;
void main() {
  vUV = aUV;
  vShade = aShade;
  gl_Position = vec4(aXY.x / uView.x * 2.0 - 1.0, 1.0 - aXY.y / uView.y * 2.0, 0.0, 1.0);
}
`;

const SYMBOL_FRAG = `
precision mediump float;
uniform sampler2D uAtlas;
varying vec2 vUV;
varying vec2 vShade;
void main() {
  vec4 c = texture2D(uAtlas, vUV);
  gl_FragColor = vec4(c.rgb * vShade.x, c.a) * vShade.y;
}
`;

/** Floats per vertex of a symbol quad: x, y, u, v, light, alpha. Six vertices a sprite. */
export const SYMBOL_STRIDE = 6;

/** A batch of symbols from one atlas, as symbols.ts writes them. */
export type SymbolBatch = { atlas: string; data: Float32Array; count: number };

export type Grade = [saturation: number, diffuseBase: number, diffuseGain: number, specular: number];

/** The ground and its grading, the atmosphere's colour, and the wave from the theme before. */
export type Look = {
  ground: string;
  grade: Grade;
  rim?: [number, number, number];
  prev?: { ground: string; grade: Grade; origin: [number, number, number]; wave: number };
};

export const REALISTIC_GRADE: Grade = [1.1, 0.7, 0.42, 0.1];
/** The satellite planet's thin blue air. */
export const REALISTIC_RIM: [number, number, number] = [0.55, 0.72, 1.0];

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
  private textures: Record<'ground' | 'ids' | 'idsLin' | 'fill' | 'country' | 'bands', WebGLTexture>;
  private fill = new Uint8Array(16 * 4);
  private fillDirty = true;
  private anyFill = false;
  private idsSize: [number, number] = [2048, 1024];
  private countrySize: [number, number] = [1, 1];
  private cost = { mix: 0, home: [0, 0, 1] as [number, number, number], sweep: 0 };
  /** The themes' grounds and atlases by id; "realistic" is `textures.ground`. */
  private grounds = new Map<string, WebGLTexture>();
  private atlases = new Map<string, WebGLTexture>();
  private look: Look = { ground: 'realistic', grade: REALISTIC_GRADE };
  private symbolProgram: WebGLProgram | null = null;
  private symbolLoc: Record<string, WebGLUniformLocation | null> = {};
  private symbolAttr = { xy: -1, uv: -1, shade: -1 };
  private symbolBuffer: WebGLBuffer | null = null;
  private quad: WebGLBuffer;
  private aPos: number;
  scale = 1;

  /** `keep`: hold the drawn frame for the page to be captured from (the video). */
  constructor(private canvas: HTMLCanvasElement, keep = false) {
    const opts: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: keep };
    const gl = (canvas.getContext('webgl2', opts) ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) throw new Error('no webgl');
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision === 0) throw new Error('no highp');
    this.gl = gl;
    this.program = this.link(VERT, FRAG);
    for (const name of ['uGround', 'uIds', 'uIdsLin', 'uFill', 'uCenter', 'uRadius', 'uTrig', 'uHaze', 'uDawn', 'uAnyFill', 'uIdsSize', 'uCountry', 'uBands', 'uCountrySize', 'uCost', 'uHome', 'uSweep', 'uGroundPrev', 'uGrade', 'uGradePrev', 'uOrigin', 'uWave', 'uRim']) {
      this.loc[name] = gl.getUniformLocation(this.program, name);
    }
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.aPos = gl.getAttribLocation(this.program, 'aPos');
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
    this.textures = { ground: gl.createTexture()!, ids: gl.createTexture()!, idsLin: gl.createTexture()!, fill: gl.createTexture()!, country: gl.createTexture()!, bands: gl.createTexture()! };
    gl.uniform1i(this.loc.uGroundPrev, 6);
  }

  private link(vert: string, frag: string): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    gl.useProgram(p);
    return p;
  }

  private upload(tex: WebGLTexture, unit: number, source: TexImageSource | null, filter: number, wrapS: number, w = 0, h = 0, data?: Uint8Array, premultiply = false) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
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

  /** A theme's ground (themes.ts), by its id; again with the same id for a sharper one. */
  addGround(id: string, img: TexImageSource) {
    const gl = this.gl;
    let tex = this.grounds.get(id);
    if (!tex) this.grounds.set(id, (tex = gl.createTexture()!));
    this.upload(tex, 7, img, gl.LINEAR, gl.REPEAT);
  }

  /** A theme's symbol atlas, mipmapped: the sprites are drawn at half their size and less. */
  addAtlas(id: string, img: TexImageSource) {
    const gl = this.gl;
    let tex = this.atlases.get(id);
    if (!tex) this.atlases.set(id, (tex = gl.createTexture()!));
    this.upload(tex, 7, img, gl.LINEAR, gl.CLAMP_TO_EDGE, 0, 0, undefined, true);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    if (!this.symbolProgram) {
      const p = this.link(SYMBOL_VERT, SYMBOL_FRAG);
      this.symbolProgram = p;
      this.symbolLoc = { uView: gl.getUniformLocation(p, 'uView'), uAtlas: gl.getUniformLocation(p, 'uAtlas') };
      this.symbolAttr = { xy: gl.getAttribLocation(p, 'aXY'), uv: gl.getAttribLocation(p, 'aUV'), shade: gl.getAttribLocation(p, 'aShade') };
      this.symbolBuffer = gl.createBuffer();
      gl.useProgram(this.program);
    }
  }

  /** The ground to draw and, while a theme comes in, the one it is replacing. */
  setLook(look: Look) {
    this.look = look;
  }

  private groundTexture(id: string) {
    return id === 'realistic' ? this.textures.ground : this.grounds.get(id) ?? this.textures.ground;
  }

  /**
   * The cost layer: `idsUrl` every country as a grey level, `bands` 256 × RGBA — the
   * colour of the country with that level, alpha 255 where it has one.
   */
  async loadCost(idsUrl: string, bands: Uint8Array) {
    const ids = await loadImage(idsUrl);
    const gl = this.gl;
    this.upload(this.textures.country, 4, ids, gl.NEAREST, gl.REPEAT);
    this.upload(this.textures.bands, 5, null, gl.NEAREST, gl.CLAMP_TO_EDGE, 256, 1, bands);
    this.countrySize = [ids.naturalWidth, ids.naturalHeight];
    gl.uniform1i(this.loc.uCountry, 4);
    gl.uniform1i(this.loc.uBands, 5);
  }

  /** How much of the cost layer shows, and how far from `home` (lon, lat) its wave has spread, degrees. */
  setCost(mix: number, home: [number, number], sweepDeg: number) {
    const φ = (home[1] * Math.PI) / 180, λ = (home[0] * Math.PI) / 180;
    this.cost = { mix, home: [Math.cos(φ) * Math.sin(λ), Math.sin(φ), Math.cos(φ) * Math.cos(λ)], sweep: (sweepDeg * Math.PI) / 180 };
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

  render(v: View, symbols: SymbolBatch[] = []) {
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
    gl.uniform2f(this.loc.uCountrySize, this.countrySize[0], this.countrySize[1]);
    gl.uniform1f(this.loc.uCost, this.cost.mix);
    gl.uniform3f(this.loc.uHome, ...this.cost.home);
    gl.uniform1f(this.loc.uSweep, this.cost.sweep);
    const look = this.look;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.groundTexture(look.ground));
    gl.uniform4f(this.loc.uGrade, ...look.grade);
    gl.uniform3f(this.loc.uRim, ...(look.rim ?? REALISTIC_RIM));
    if (look.prev) {
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, this.groundTexture(look.prev.ground));
      gl.uniform4f(this.loc.uGradePrev, ...look.prev.grade);
      gl.uniform3f(this.loc.uOrigin, ...look.prev.origin);
    }
    gl.uniform1f(this.loc.uWave, look.prev ? look.prev.wave : -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (this.symbolProgram && symbols.some((b) => b.count > 0)) this.drawSymbols(this.symbolProgram, symbols);
  }

  private drawSymbols(p: WebGLProgram, batches: SymbolBatch[]) {
    const gl = this.gl;
    const a = this.symbolAttr;
    const bytes = SYMBOL_STRIDE * 4;
    gl.useProgram(p);
    gl.uniform2f(this.symbolLoc.uView, this.canvas.clientWidth, this.canvas.clientHeight);
    gl.uniform1i(this.symbolLoc.uAtlas, 7);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.symbolBuffer);
    gl.disableVertexAttribArray(this.aPos);
    gl.enableVertexAttribArray(a.xy);
    gl.enableVertexAttribArray(a.uv);
    gl.enableVertexAttribArray(a.shade);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE7);
    for (const b of batches) {
      const tex = this.atlases.get(b.atlas);
      if (!tex || b.count === 0) continue;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.bufferData(gl.ARRAY_BUFFER, b.data.subarray(0, b.count * 6 * SYMBOL_STRIDE), gl.STREAM_DRAW);
      gl.vertexAttribPointer(a.xy, 2, gl.FLOAT, false, bytes, 0);
      gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, bytes, 8);
      gl.vertexAttribPointer(a.shade, 2, gl.FLOAT, false, bytes, 16);
      gl.drawArrays(gl.TRIANGLES, 0, b.count * 6);
    }
    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(a.xy);
    gl.disableVertexAttribArray(a.uv);
    gl.disableVertexAttribArray(a.shade);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
  }
}
