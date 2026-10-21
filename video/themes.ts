// The app's Pro globe themes on the videos' planet, as the hero wears them (src/globe/hero.ts):
// a theme spreads as a wave from a place, the old ground beyond its edge; the route's ink,
// the atmosphere and the chips' colours turn with it; the theme's symbols lie on the ground,
// the old theme's beyond the wave and the new one's inside it.
//
// A video says which theme is on and since when (`ThemeMoment`), from its own clock, so a
// frame is the same however it is reached.

import type { GlobeRenderer, SymbolBatch, View } from '../src/globe/renderer';
import type { RouteLayer } from '../src/globe/routes';
import { RAD, clamp, smoothstep } from '../src/globe/geo';
import { THEMES, WAVE_MS, mixColor, mixInk, themeFiles, type ThemeId } from '../src/globe/themes';
import { planSymbols, symbolBatch, type SymbolSet } from '../src/globe/symbols';

/** The theme on the planet, the one before it, where its wave set out from (lon, lat) and how long ago, s. */
export type ThemeMoment = { cur: ThemeId; prev: ThemeId; origin: [number, number]; since: number };

/** The chips' colours by theme, as global.css gives the hero's (`.hero[data-theme]`). */
type ChipLook = { fill: string; ink: string; muted: string; edge: string };
const CHIP_PLAIN: ChipLook = { fill: '#FFFFFF', ink: '#0E1726', muted: '#6B7684', edge: 'rgba(74,36,22,0)' };
const CHIP_LOOK: Partial<Record<ThemeId, ChipLook>> = {
  pirireis: { fill: '#F4E7C6', ink: '#4A2416', muted: '#7A5A44', edge: '#4A2416' },
};
/** The chips take on a theme this fast, s (the hero's CSS transition). */
const CHIP_TURN = 0.6;

const sine = (x: number) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;

/** The symbols' order within a tier: drawn once, the same in every language and every take. */
const seeded = (n: number, seed = 0x9e3779b9) => {
  let a = seed;
  return Array.from({ length: n }, () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  });
};

/** Every theme in `ids` on the GPU (the sharp grounds: the videos are taken at 2× to 4×), with its symbols. */
export async function loadThemes(renderer: GlobeRenderer, ids: ThemeId[]): Promise<Map<ThemeId, SymbolSet>> {
  const sets = new Map<ThemeId, SymbolSet>();
  const decode = async (url: string, premultiply: boolean) =>
    createImageBitmap(await (await fetch(url)).blob(), { premultiplyAlpha: premultiply ? 'premultiply' : 'none', colorSpaceConversion: 'none' });
  await Promise.all(ids.filter((id) => id !== 'realistic').map(async (id) => {
    const f = themeFiles(id, true);
    const [ground, atlas, set] = await Promise.all([decode(f.ground, false), decode(f.atlas, true), fetch(f.symbols).then((r) => r.json() as Promise<SymbolSet>)]);
    renderer.addGround(id, ground);
    renderer.addAtlas(id, atlas);
    sets.set(id, set);
  }));
  return sets;
}

/**
 * Dresses a frame: sets the renderer's look and the route's ink, the chips' colours as
 * `--chip-*` on `root`, and returns the symbols to draw. `base` is the globe's radius at 1×
 * (CSS px), `favoured` the countries whose symbols go first.
 */
export function themeDresser(renderer: GlobeRenderer, routes: RouteLayer, root: HTMLElement, sets: Map<ThemeId, SymbolSet>, base: number, favoured: Set<string>) {
  const plans = new Map<ThemeId, number[]>();
  const buffers = new Map<ThemeId, { data: Float32Array }>();
  return (m: ThemeMoment, v: View): SymbolBatch[] => {
    const cur = THEMES[m.cur], prev = THEMES[m.prev];
    const p = clamp(m.since / (WAVE_MS / 1000), 0, 1);
    const waving = p < 1 && prev.id !== cur.id;
    // Fast from the place, easing out over the far side, as the hero's.
    const wave = (1 - (1 - p) * (1 - p)) * (Math.PI + 0.3);
    const [lon, lat] = m.origin;
    const ox = Math.cos(lat * RAD) * Math.sin(lon * RAD), oy = Math.sin(lat * RAD), oz = Math.cos(lat * RAD) * Math.cos(lon * RAD);
    const k = sine(p);
    const rim = waving ? (cur.rim.map((x, i) => prev.rim[i] + (x - prev.rim[i]) * k) as [number, number, number]) : cur.rim;
    renderer.setLook({ ground: cur.id, grade: cur.grade, rim, prev: waving ? { ground: prev.id, grade: prev.grade, origin: [ox, oy, oz], wave } : undefined });
    routes.ink = waving ? mixInk(prev.ink, cur.ink, k) : cur.ink;

    const kc = sine(m.since / CHIP_TURN);
    const a = CHIP_LOOK[prev.id] ?? CHIP_PLAIN, b = CHIP_LOOK[cur.id] ?? CHIP_PLAIN;
    for (const key of ['fill', 'ink', 'muted', 'edge'] as const) root.style.setProperty(`--chip-${key}`, mixColor(a[key], b[key], kc));

    const reached = (la: number, lo: number) => {
      if (!waving) return 1;
      const cl = Math.cos(la);
      const d = Math.acos(clamp(cl * Math.sin(lo) * ox + Math.sin(la) * oy + cl * Math.cos(lo) * oz, -1, 1));
      return 1 - smoothstep(wave - 0.015, wave, d);
    };
    const batches: SymbolBatch[] = [];
    const add = (id: ThemeId, mask: (la: number, lo: number) => number) => {
      const set = sets.get(id);
      if (!set) return;
      let plan = plans.get(id);
      if (!plan) plans.set(id, (plan = planSymbols(set.list, base, favoured, seeded(set.list.length))));
      let buf = buffers.get(id);
      if (!buf) buffers.set(id, (buf = { data: new Float32Array(0) }));
      batches.push(symbolBatch(id, set, plan, v, base, THEMES[id].grade, v.dawn, mask, buf));
    };
    if (waving) add(prev.id, (la, lo) => 1 - reached(la, lo));
    add(cur.id, reached);
    return batches;
  };
}
