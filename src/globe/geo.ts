// The globe's maths — taken from the app's src/lib/globe.ts so the two draw the same
// sphere the same way. Conventions (shared with the shader in renderer.ts):
//   - a point on the sphere is (cos φ sin λ, sin φ, cos φ cos λ): y up, z to the viewer
//     when λ = φ = 0;
//   - the view is centred on (λ₀, φ₀); a screen point is (x right, y down) from the disc's
//     centre in units of its radius.

export const RAD = Math.PI / 180;
export type LonLat = [lon: number, lat: number];

/**
 * Where a place lands on the disc, in units of its radius, and how far round the front it
 * is: `c` is the cosine of its angle from the view's centre — 1 in the middle, 0 on the
 * limb, negative behind. Angles in degrees.
 */
export function project(lon: number, lat: number, lon0: number, lat0: number): [x: number, y: number, c: number] {
  const λ = (lon - lon0) * RAD;
  const φ = lat * RAD;
  const φ0 = lat0 * RAD;
  const cosφ = Math.cos(φ), sinφ = Math.sin(φ);
  const cos0 = Math.cos(φ0), sin0 = Math.sin(φ0);
  const cosλ = Math.cos(λ);
  const c = sin0 * sinφ + cos0 * cosφ * cosλ;
  const x = cosφ * Math.sin(λ);
  const y = cos0 * sinφ - sin0 * cosφ * cosλ;
  return [x, -y, c];
}

/**
 * How high a flight's line arches over the surface, as a fraction of its chord's width
 * on screen — the app's FLIGHT_LIFT. The hump is perpendicular to the chord, on the side
 * that is up the screen, and scales with the chord's horizontal extent so it passes
 * through zero (instead of flipping sides) as the chord turns through vertical.
 */
export const FLIGHT_LIFT = 0.08;

export function flightLift(x0: number, y0: number, x1: number, y1: number, t: number): [number, number] {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return [0, 0];
  let nx = -dy / len, ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const a = FLIGHT_LIFT * Math.abs(dx) * Math.sin(Math.PI * t);
  return [nx * a, ny * a];
}

const toVec = (lon: number, lat: number): [number, number, number] => {
  const φ = lat * RAD, λ = lon * RAD;
  return [Math.cos(φ) * Math.sin(λ), Math.sin(φ), Math.cos(φ) * Math.cos(λ)];
};

/** The angle between two places, in degrees. */
export function angleBetween(a: LonLat, b: LonLat): number {
  const p = toVec(a[0], a[1]), q = toVec(b[0], b[1]);
  return Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]))) / RAD;
}

/** The shortest path over the sphere between two places, as evenly spaced [lon, lat, …]. */
export function greatCircle(a: LonLat, b: LonLat, stepDeg = 1): number[] {
  const p = toVec(a[0], a[1]);
  const q = toVec(b[0], b[1]);
  const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const ω = Math.acos(dot);
  const steps = Math.max(2, Math.ceil(ω / RAD / stepDeg));
  const out: number[] = [];
  const sinω = Math.sin(ω);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x: number, y: number, z: number;
    if (sinω < 1e-6) {
      [x, y, z] = p;
    } else {
      const ka = Math.sin((1 - t) * ω) / sinω;
      const kb = Math.sin(t * ω) / sinω;
      x = ka * p[0] + kb * q[0]; y = ka * p[1] + kb * q[1]; z = ka * p[2] + kb * q[2];
    }
    out.push(Math.atan2(x, z) / RAD, Math.asin(Math.max(-1, Math.min(1, y))) / RAD);
  }
  return out;
}

/** The longitude nearest `from` that shows the same place as `to`, so a turn never goes the long way round. */
export function nearestTurn(from: number, to: number): number {
  let d = ((((to - from) % 360) + 540) % 360) - 180;
  if (d === -180) d = 180;
  return from + d;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
