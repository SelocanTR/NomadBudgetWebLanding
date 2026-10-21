// The app's globe themes as the hero wears them (the app's src/lib/globeThemes.ts). The
// realistic satellite picture is the app's free one and the hero's own; the others are
// Pro there, and here they take turns on the sample journey (hero.ts).
//
// What a theme carries is the app's: the grading, and for a pale painted ground the ink
// of what lies on it — the route (Piri Reis' lapis over a parchment halo) and the
// cards, which here are the chips (`chip`, read by global.css through `data-theme`).
// Pictures from build-globe-themes.mjs.

import type { Grade } from './renderer';
import type { RouteInk as Ink } from './routes';

export type ThemeId = 'realistic' | 'paper' | 'miniature' | 'pirireis';

/**
 * `rim`: the atmosphere — the haze round the disc and the light on its limb. The satellite
 * planet's thin blue air read as a blue halo round a painted map; each theme has its own,
 * taken from its ground (2026-10-16): paper's teal sea, the miniature's clear water, the
 * portolan's parchment.
 */
export type HeroTheme = { id: ThemeId; grade: Grade; rim: Rgb; ink: Ink };
type Rgb = [number, number, number];

/** The app's line: white over a dark halo, on white badges. */
export const DEFAULT_INK: Ink = { line: '#FFFFFF', halo: 'rgba(4,8,18,0.5)', badge: '#FFFFFF' };

export const THEMES: Record<ThemeId, HeroTheme> = {
  realistic: { id: 'realistic', grade: [1.1, 0.7, 0.42, 0.1], rim: [0.55, 0.72, 1.0], ink: DEFAULT_INK },
  paper: { id: 'paper', grade: [1.06, 0.64, 0.42, 0.05], rim: [0.7, 0.93, 0.88], ink: DEFAULT_INK },
  miniature: { id: 'miniature', grade: [1.06, 0.64, 0.42, 0.05], rim: [0.58, 0.86, 0.96], ink: DEFAULT_INK },
  pirireis: {
    id: 'pirireis',
    grade: [1.04, 0.68, 0.36, 0.03],
    rim: [1.0, 0.8, 0.5],
    ink: { line: '#1F3C9A', halo: 'rgba(244,231,198,0.85)', badge: '#F4E7C6' },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const isThemeId = (v: unknown): v is ThemeId => typeof v === 'string' && v in THEMES;

export const themeFiles = (id: ThemeId, big: boolean) => ({
  ground: `/globe/themes/${id}/ground-${big ? '4k' : '2k'}.webp`,
  atlas: `/globe/themes/${id}/symbols.webp`,
  symbols: `/globe/themes/${id}/symbols.json`,
});

/**
 * The journey's turns: on reaching the stop, the theme spreads from it. Before the first
 * and from the trip's fading away, the realistic planet. Each theme once, three stops each
 * (2026-10-16), chosen for what it shows on the way: the miniature from Morocco through
 * Turkey and Georgia (its Marrakech, Hagia Sophia, Cappadocia), paper for Asia (only it has
 * Bangkok, Petronas and Bali), and the portolan for the Atlantic crossing — the 1513 map is
 * the one of the Americas.
 */
export const CUES: [code: string, theme: ThemeId][] = [
  ['MA', 'miniature'],
  ['TH', 'paper'],
  ['MX', 'pirireis'],
];

/** How long a theme takes to spread over the whole planet, ms. */
export const WAVE_MS = 2400;

/** `a` to `b`, `k` of the way, for #RRGGBB and rgba() alike. */
export function mixColor(a: string, b: string, k: number): string {
  if (k <= 0 || a === b) return a;
  if (k >= 1) return b;
  const pa = parse(a), pb = parse(b);
  const c = pa.map((x, i) => x + (pb[i] - x) * k);
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
}

function parse(c: string): [number, number, number, number] {
  if (c[0] === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  const [r, g, b, a = '1'] = c.slice(c.indexOf('(') + 1, -1).split(',');
  return [+r, +g, +b, +a];
}

export const mixInk = (a: Ink, b: Ink, k: number): Ink => ({
  line: mixColor(a.line, b.line, k),
  halo: mixColor(a.halo, b.halo, k),
  badge: mixColor(a.badge, b.badge, k),
});
