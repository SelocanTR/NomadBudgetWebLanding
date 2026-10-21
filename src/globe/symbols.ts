// A Pro theme's symbols on the hero's globe — the app's globeSymbols.ts, for the web.
//
// As in the app, each landmark lies on the ground like part of the map, pinned at the foot
// of its picture and carried by the surface: turned as the ground turns, squashed towards
// the limb, lit as the ground is lit. A symbol drawn standing over the globe reads as one
// more chip, and the chips and the route are the journey's own things.
//
// Placement is the app's too: a symbol shows from its tier's zoom if it does not overlap
// one placed before it, planned once per zoom band in the ground's own measure (radians),
// so nothing appears or disappears while the globe turns. "Before" is the tier, then — the
// hero's own rule — a symbol in a country the sample journey visits, then a random order
// drawn once per page: the stops get their landmark, the rest a different few each visit.
// The hero never comes in past 1.8×, so only tiers 1 and 2 are baked (build-globe-themes.mjs).

import { SYMBOL_STRIDE, type Grade, type SymbolBatch, type View } from './renderer';

const RAD = Math.PI / 180;

export type GlobeSymbol = {
  id: string;
  cc: string;
  lat: number;
  lon: number;
  tier: 1 | 2 | 3;
  /** The sprite in the atlas, in its pixels. */
  x: number; y: number; w: number; h: number;
  /** The drawing's box inside the sprite when a border is baked round it (a sticker's). */
  art?: [number, number, number, number];
};

export type SymbolSet = { size: [number, number]; list: GlobeSymbol[] };

/** The zoom each tier comes in at, by tier. */
const TIER_ZOOM = [0, 1, 1.8, 3.4];
const BANDS = [1, 1.8];
/** How far past its band's zoom a newly placed symbol takes to come in fully, as a share of that zoom. */
const FADE_IN = 0.25;
/** Where the foot of the picture is, as a share of its height from the top. */
const FOOT = 0.94;

/**
 * The hero's symbols against the app's: smaller. The app's sizes are for a phone's globe
 * that fills the screen; the hero's planet is a backdrop for the trip, and at the app's
 * size the landmarks crowded the route and the chips (2026-10-16).
 */
const HERO_SCALE = 0.62;

/** A symbol's height on screen, CSS px: the app's, scaled; a little larger as the globe comes in; tier 1 a step larger. */
function symbolHeight(base: number, zoom: number, tier: number) {
  const h = HERO_SCALE * Math.max(42, Math.min(96, base * 0.26 * Math.pow(Math.min(zoom, 10), 0.18)));
  return tier === 1 ? h * 1.12 : h;
}

const artOf = (s: GlobeSymbol): [number, number, number, number] => s.art ?? [0, 0, s.w, s.h];

function footOf(s: GlobeSymbol): [number, number] {
  const a = artOf(s);
  return [a[0] + a[2] / 2, a[1] + a[3] * FOOT];
}

/** The drawing's size on screen at height `h` — the very wide ones held to 1.5 of it — and px per sprite pixel. */
function spriteSize(s: GlobeSymbol, h: number): [w: number, h: number, scale: number] {
  const a = artOf(s);
  let w = (h * a[2]) / a[3];
  let hh = h;
  if (w > h * 1.5) {
    w = h * 1.5;
    hh = (w * a[3]) / a[2];
  }
  return [w, hh, hh / a[3]];
}

/**
 * For each symbol, the zoom it shows from, or 0 for not at all. `base` is the globe's
 * radius at 1×, CSS px; `favoured` the countries whose symbols go first within a tier.
 */
export function planSymbols(list: GlobeSymbol[], base: number, favoured: Set<string>, draw: number[]): number[] {
  const n = list.length;
  const rank = (i: number) => list[i].tier * 2 + (favoured.has(list[i].cc) ? 0 : 1);
  const order = list.map((_, i) => i).sort((a, b) => rank(a) - rank(b) || draw[a] - draw[b]);
  const start = new Array<number>(n).fill(0);
  const lat = list.map((s) => s.lat * RAD), lon = list.map((s) => s.lon * RAD);
  for (const band of BANDS) {
    const r = base * band;
    const gw: number[] = [], gh: number[] = [];
    for (let i = 0; i < n; i++) {
      const [w, , k] = spriteSize(list[i], symbolHeight(base, band, list[i].tier));
      gw[i] = w / r;
      gh[i] = ((footOf(list[i])[1] - artOf(list[i])[1]) * k) / r;
    }
    const placed = order.filter((i) => start[i] > 0);
    for (const i of order) {
      if (start[i] > 0 || TIER_ZOOM[list[i].tier] > band + 1e-6) continue;
      const hit = placed.some((o) => {
        let dl = lon[i] - lon[o];
        dl -= Math.round(dl / (2 * Math.PI)) * 2 * Math.PI;
        const dx = dl * Math.cos((lat[i] + lat[o]) / 2), dy = lat[i] - lat[o];
        return Math.abs(dx) < (gw[i] + gw[o]) * 0.42 && dy < gh[o] && -dy < gh[i];
      });
      if (hit) continue;
      start[i] = band;
      placed.push(i);
    }
  }
  return start;
}

function onDisc(lon: number, lat: number, lon0: number, sin0: number, cos0: number) {
  const l = lon - lon0;
  const sl = Math.sin(lat), cl = Math.cos(lat), cdl = Math.cos(l);
  return { x: cl * Math.sin(l), y: -(cos0 * sl - sin0 * cl * cdl), z: sin0 * sl + cos0 * cl * cdl };
}

/**
 * Writes the visible symbols' quads for this frame into `out` (grown as needed) and
 * returns the batch. `mask(lat, lon)` (radians) is how much of each shows — the wave of a
 * theme coming in or going out; `alpha` dims them all (the dawn).
 */
export function symbolBatch(
  atlas: string, set: SymbolSet, start: number[], v: View, base: number, grade: Grade,
  alpha: number, mask: (lat: number, lon: number) => number, out: { data: Float32Array },
): SymbolBatch {
  const zoom = v.r / base;
  const lon0 = v.lon0 * RAD, sin0 = Math.sin(v.lat0 * RAD), cos0 = Math.cos(v.lat0 * RAD);
  const [AW, AH] = set.size;
  const need = set.list.length * 6 * SYMBOL_STRIDE;
  if (out.data.length < need) out.data = new Float32Array(need);
  const d = out.data;
  let count = 0;
  let o = 0;
  for (let i = 0; i < set.list.length; i++) {
    const s = set.list[i];
    if (start[i] <= 0 || zoom < start[i] - 1e-6) continue;
    const la = s.lat * RAD, lo = s.lon * RAD;
    const p = onDisc(lo, la, lon0, sin0, cos0);
    if (p.z < 0.15) continue;
    const fade = start[i] > 1 ? Math.min(1, (zoom - start[i]) / (FADE_IN * start[i])) : 1;
    const a = fade * Math.min(1, (p.z - 0.15) / 0.2) * alpha * mask(la, lo);
    if (a <= 0.01) continue;
    const e = 0.002;
    const pe = onDisc(lo + e / Math.max(0.05, Math.cos(la)), la, lon0, sin0, cos0);
    const pn = onDisc(lo, la + e, lon0, sin0, cos0);
    const ex = (pe.x - p.x) / e, ey = (pe.y - p.y) / e, nx = (pn.x - p.x) / e, ny = (pn.y - p.y) / e;
    const g = spriteSize(s, symbolHeight(base, zoom, s.tier))[2] / v.r;
    // The shader's light, from the top-left, on the ground's normal (y down here).
    const ndl = Math.max(0, -0.4575 * p.x - 0.4575 * p.y + 0.7625 * p.z);
    const light = Math.min(1, grade[1] + grade[2] * ndl + 0.06);
    const [fx, fy] = footOf(s);
    const corner = (ix: number, iy: number) => {
      const u = (ix - fx) * g, w = (fy - iy) * g;
      d[o++] = v.cx + v.r * (p.x + ex * u + nx * w);
      d[o++] = v.cy + v.r * (p.y + ey * u + ny * w);
      d[o++] = (s.x + ix) / AW;
      d[o++] = (s.y + iy) / AH;
      d[o++] = light;
      d[o++] = a;
    };
    corner(0, 0); corner(s.w, 0); corner(s.w, s.h);
    corner(0, 0); corner(s.w, s.h); corner(0, s.h);
    count++;
  }
  return { atlas, data: d, count };
}
