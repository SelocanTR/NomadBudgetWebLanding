// The App Store search video (3:2, 2880 × 1920): the store's first screenshots in motion, on
// a loop the store plays muted. The store's 3D phone with the app's own screens on its glass,
// the globe in front of it, the store's headlines a word at a time. Nothing holds still: the
// globe plays the trip as the landing's hero does, and grows, shrinks and moves from scene to
// scene; the phone drifts and leans in; the sky slides behind them.
//
//   A  "The expense tracker for life across borders."  The trip: Spain, Turkey, Georgia,
//      Thailand, Malaysia, the camera chasing each crossing; the audience pills along the
//      foot. The dashboard on the phone. Frame 0, the poster, is in the middle of it.
//   B  "Your own basket, not an average."  The Japan sheet on the phone. The camera starts
//      at Kazakhstan, home, the app's cost layer spreads out from it, and the camera flies on
//      to Japan: its chip, its +68%.
//   C  "One wallet per country. One total."  A country wallet on the phone. Five chips in
//      five currencies come up on the globe, then fly into one total, counting it up.
//
// As in the cover video, the camera chases its target a frame at a time from a whole lap
// before frame 0; everything else is a function of the loop's clock.

import { GlobeRenderer, loadImage, type View } from '../src/globe/renderer';
import { RouteLayer, type Leg, type Transport } from '../src/globe/routes';
import { drawStars } from '../src/globe/stars';
import { RAD, angleBetween, clamp, greatCircle, nearestTurn, project, smoothstep } from '../src/globe/geo';
import cost from './assets/cost.json';
import idsAllUrl from './assets/ids-all.png?url';
import { SCREEN, fitScreen } from './phone';

export const FPS = 30;
export const LOOP = 26;
const W = 960, H = 640;

// --- the scenes, s on the loop ---------------------------------------------------------------
/** Each scene's words, in and out. */
const HEADS: [number, number][] = [[22.4, 8.6], [9.2, 15.4], [16.0, 21.8]];
/** When the layout (the globe's place and size, the phone's) moves on to the next scene. */
const MOVES: { at: number; from: number; to: number }[] = [{ at: 8.7, from: 0, to: 1 }, { at: 15.5, from: 1, to: 2 }, { at: 21.9, from: 2, to: 0 }];
const MOVE = 1.5;
/** When each screen slides onto the phone: the dashboard, the Japan sheet, the wallet. */
const SHOT_IN = [22.2, 9.4, 16.2];
const SLIDE = 0.7;

// --- the layout, stage px: the whole frame ----------------------------------------------------
const HEAD = { x: 56, y: 58, w: 440, size: 46 };
/** The phone render's box (video/phone.ts). */
const PHONE_SIZE = 780;
/** Per scene: the globe (low on the left, its top half up) and the phone. */
const GLOBES = [{ cx: 330, cy: 650, r: 285 }, { cx: 380, cy: 646, r: 320 }, { cx: 300, cy: 652, r: 252 }];
const PHONES = [{ x: 352, y: -76, s: 1 }, { x: 322, y: -72, s: 1.04 }, { x: 366, y: -66, s: 0.98 }];
/** Where the stop just reached (or the vehicle) sits: this far up the globe's radius from its centre. */
const FOCUS_UP = 0.56;
const PILLS = { x: 56, y: 568 };
const TOTAL = { x: 56, y: 236 };

// --- A: the trip -----------------------------------------------------------------------------
const TRIP = ['ES', 'TR', 'GE', 'TH', 'MY'];
const TRIP_LEGS: Transport[] = ['flight', 'car', 'flight', 'bus'];
/** Arrivals and departures, unwrapped from Spain's (they run on past the loop's end). */
const ARRIVE = [22.7, 25.2, 27.9, 31.1, 33.1];
const DEPART = [23.3, 26.5, 28.5, 31.7];
const A_START = 21.8, A_END = 9.0;

// --- B: Japan --------------------------------------------------------------------------------
const B_HOME = 9.0, B_FLY = 10.3, B_JAPAN = 11.5, B_END = 15.6;
const WAVE = { from: 9.7, dur: 4.2 };

// --- C: the wallets --------------------------------------------------------------------------
const C_POPS = [16.6, 17.1, 17.6, 18.1, 18.6];
const C_CARD = 19.3, C_FLY = 19.6, C_END = 21.8;
const FLY = 0.62, FLY_GAP = 0.12;

// The cost scale (the app's costScale.ts).
const BAND_MAX = [0.5, 0.8, 1.25, 2];
const SCALE = ['#1FA37A', '#9AEAC4', '#4F5DDD', '#F2A93B', '#E3489C'];

const mod = (a: number, n: number) => ((a % n) + n) % n;
const sine = (x: number) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;
const glide = (x: number, a = 0.3) => {
  x = clamp(x, 0, 1);
  const v = 1 / (1 - a);
  if (x < a) return (v * x * x) / (2 * a);
  if (x > 1 - a) return 1 - (v * (1 - x) * (1 - x)) / (2 * a);
  return v * (x - a / 2);
};
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const inOutCubic = (x: number) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const outBack = (x: number) => {
  const u = clamp(x, 0, 1) - 1;
  return 1 + 2.4 * u * u * u + 1.4 * u * u;
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** How long after `e` the clock is, on the loop. */
const since = (t: number, e: number) => mod(t - e, LOOP);
/** Inside [from, to] on the loop (to may be past its end): how far in, how far out (0..1 each). */
const phase = (t: number, from: number, to: number, rise = 0.4, fall = 0.4) => {
  const d = mod(to - from, LOOP), s = since(t, from);
  if (s > d) return { on: false, inn: 0, out: 1, s };
  return { on: true, inn: smoothstep(0, rise, s), out: smoothstep(d - fall, d, s), s };
};
const shown = (t: number, from: number, to: number, rise?: number, fall?: number) => {
  const p = phase(t, from, to, rise, fall);
  return p.on ? p.inn * (1 - p.out) : 0;
};

type ChipData = { key: string; code: string; name: string; amount: string | null; lonLat: [number, number]; value?: number };
type Data = { locale: string; currency: string; total: number; chips: ChipData[]; journeyCodes: string[] };
type Life = { show: number; open: number; pop: number; fly: number };

export async function startSearch(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const qa = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const data = JSON.parse(document.getElementById('search-data')!.textContent!) as Data;
  const params = new URLSearchParams(location.search);
  const dpr = devicePixelRatio || 1;

  const renderer = new GlobeRenderer(q('.v-globe'), true);
  const names: Transport[] = ['flight', 'train', 'bus', 'ferry', 'car'];
  const sprites = await Promise.all(names.map((n) => loadImage(`/transport/${n}.webp`)));
  const routes = new RouteLayer(q('.v-routes'), Object.fromEntries(names.map((n, i) => [n, sprites[i]])) as Record<Transport, HTMLImageElement>);

  // B's cost layer: every country's price level against Kazakhstan's, in the app's bands.
  const pli = cost.pli as Record<string, number>;
  const bands = new Uint8Array(256 * 4);
  cost.codes.forEach((code: string, i: number) => {
    if (!pli[code] || !pli.KZ) return;
    const ratio = pli[code] / pli.KZ;
    let band = BAND_MAX.findIndex((m) => ratio < m);
    if (band < 0) band = 4;
    const hex = SCALE[band];
    bands.set([1, 3, 5].map((j) => parseInt(hex.slice(j, j + 2), 16)), (i + 1) * 4);
    bands[(i + 1) * 4 + 3] = 255;
  });

  const images = qa<HTMLImageElement>('img');
  const ready = Promise.all([
    renderer.load('/globe/earth-4k.webp', '/globe/ids.png'),
    renderer.loadCost(idsAllUrl, bands),
    document.fonts.ready,
    ...images.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))),
  ]);
  renderer.resize(W, H, dpr);
  routes.resize(W, H, dpr);
  const stars = q<HTMLCanvasElement>('.v-stars');
  drawStars(stars, dpr);

  // --- the elements ------------------------------------------------------------------------
  const phone = q<HTMLElement>('.v-phone');
  const body = q<HTMLImageElement>('.phone-body');
  const screen = q<HTMLElement>('.phone-screen');
  const shots = qa<HTMLImageElement>('.phone-screen img');
  body.style.width = body.style.height = `${PHONE_SIZE}px`;
  fitScreen(screen, PHONE_SIZE);

  const heads = qa<HTMLElement>('.head');
  heads.forEach((el) => Object.assign(el.style, { left: `${HEAD.x}px`, top: `${HEAD.y}px`, width: `${HEAD.w}px`, fontSize: `${HEAD.size}px` }));
  const headWords = heads.map((el) => Array.from(el.querySelectorAll<HTMLElement>('.w')));

  const pillsBox = q<HTMLElement>('.v-pills');
  Object.assign(pillsBox.style, { left: `${PILLS.x}px`, top: `${PILLS.y}px` });
  const pills = qa<HTMLElement>('.pill');
  const totalCard = q<HTMLElement>('.v-total');
  // Under the headline, on its side: in Arabic the card's right edge is the headline's, held
  // there as the sum grows.
  const rtl = document.documentElement.dir === 'rtl';
  const headEnd = HEAD.x + HEAD.w;
  Object.assign(totalCard.style, rtl
    ? { left: 'auto', right: `${W - headEnd}px`, top: `${TOTAL.y}px`, transformOrigin: '100% 100%' }
    : { left: `${TOTAL.x}px`, top: `${TOTAL.y}px` });
  const totalValue = q<HTMLElement>('.total-value');
  const badge = q<HTMLElement>('.v-badge');
  const money = new Intl.NumberFormat(data.locale, { style: 'currency', currency: data.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });

  const chipEls = qa<HTMLElement>('.chip');
  const chipBody = chipEls.map((c) => c.querySelector<HTMLElement>('.chip-body')!);
  const chipText = chipEls.map((c) => c.querySelector<HTMLElement>('.chip-text')!);
  const wallets = data.chips.filter((c) => c.key[0] === 'C');
  const jp = data.chips.findIndex((c) => c.key === 'B-JP');

  // --- the trip ----------------------------------------------------------------------------
  const where = (code: string) => data.chips.find((c) => c.code === code)!.lonLat;
  const legs: Leg[] = TRIP_LEGS.map((transport, i) => ({ transport, points: greatCircle(where(TRIP[i]), where(TRIP[i + 1]), 1) }));
  const legDur = legs.map((_, i) => ARRIVE[i + 1] - DEPART[i]);
  const legAngle = legs.map((_, i) => angleBetween(where(TRIP[i]), where(TRIP[i + 1])));
  /** Short hops close in, long flights pull back: the planet grows and shrinks with the trip. */
  const zoomFor = (i: number) => clamp(1.3 - legAngle[i] / 120, 0.86, 1.18);
  const along = (i: number, u: number): [number, number] => {
    const pts = legs[i].points;
    const m = pts.length / 2;
    const f = clamp(u, 0, 1) * (m - 1);
    const j = Math.min(m - 2, Math.floor(f));
    const v = f - j;
    const lon1 = nearestTurn(pts[j * 2], pts[j * 2 + 2]);
    return [pts[j * 2] + (lon1 - pts[j * 2]) * v, pts[j * 2 + 1] + (pts[j * 2 + 3] - pts[j * 2 + 1]) * v];
  };
  const legOn = (t: number, i: number) => phase(t, DEPART[i], A_END).on;
  const moving = (t: number) => legs.findIndex((_, i) => legOn(t, i) && since(t, DEPART[i]) < legDur[i]);

  // --- the layout: the scene's, eased into the next ------------------------------------------
  const layout = (t: number) => {
    let at = 0;
    for (let i = 1; i < MOVES.length; i++) if (since(t, MOVES[i].at) < since(t, MOVES[at].at)) at = i;
    const m = MOVES[at];
    const u = inOutCubic(since(t, m.at) / MOVE);
    const g0 = GLOBES[m.from], g1 = GLOBES[m.to], p0 = PHONES[m.from], p1 = PHONES[m.to];
    return {
      globe: { cx: lerp(g0.cx, g1.cx, u), cy: lerp(g0.cy, g1.cy, u), r: lerp(g0.r, g1.r, u) },
      phone: { x: lerp(p0.x, p1.x, u), y: lerp(p0.y, p1.y, u), s: lerp(p0.s, p1.s, u) },
    };
  };

  // --- the camera --------------------------------------------------------------------------
  /** The view centre that puts `p` at the focus. */
  const cameraFor = (p: [number, number]): [number, number] => [p[0], clamp(p[1] - Math.asin(FOCUS_UP) / RAD, -70, 70)];
  const target = (t: number): { p: [number, number]; zoom: number; tau: number } => {
    if (phase(t, A_START, B_HOME).on) {
      const v = moving(t);
      if (v >= 0) return { p: cameraFor(along(v, glide(since(t, DEPART[v]) / legDur[v]))), zoom: zoomFor(v), tau: 300 };
      // The stop most lately reached; Spain while the planet turns to it.
      const s0 = since(t, A_START);
      let latest = 0;
      ARRIVE.forEach((a, i) => { if (mod(a - A_START, LOOP) <= s0) latest = i; });
      return { p: cameraFor(where(TRIP[latest])), zoom: latest === 0 ? 1 : zoomFor(latest - 1), tau: 380 };
    }
    if (phase(t, B_HOME, B_END).on) {
      if (since(t, B_HOME) < B_FLY - B_HOME) return { p: cameraFor(where('KZ')), zoom: 0.94, tau: 500 };
      const [lon, lat] = cameraFor(where('JP'));
      return { p: [lon + 0.9 * since(t, B_JAPAN), lat], zoom: 1.1, tau: 650 };
    }
    const [lon, lat] = cameraFor([54, 24]);
    return { p: [lon + 1.2 * since(t, B_END), lat], zoom: 1, tau: 600 };
  };
  const frames = Math.round(LOOP * FPS);
  const cam = { lon: 0, lat: 0, zoom: 1 };
  let stepped = -Infinity;
  const step = (f: number) => {
    const g = target(mod(f / FPS, LOOP));
    const kk = 1 - Math.exp(-1000 / FPS / g.tau);
    cam.lon += (nearestTurn(cam.lon, g.p[0]) - cam.lon) * kk;
    cam.lat += (g.p[1] - cam.lat) * kk;
    cam.zoom += (g.zoom - cam.zoom) * (1 - Math.exp(-1000 / FPS / 700));
    cam.lon = ((cam.lon + 540) % 360) - 180;
  };
  const warmUp = () => {
    const g = target(mod(-frames / FPS, LOOP));
    [cam.lon, cam.lat] = g.p;
    cam.zoom = g.zoom;
    stepped = -frames;
  };

  // --- the chips' lives --------------------------------------------------------------------
  const life = (t: number, c: ChipData): Life => {
    const scene = c.key[0];
    let pop: number, fold: number | null, end: number;
    if (scene === 'A') {
      const i = TRIP.indexOf(c.code);
      pop = ARRIVE[i]; fold = i < DEPART.length ? DEPART[i] + 0.25 : null; end = A_END;
    } else if (scene === 'B') {
      if (c.code === 'KZ') { pop = B_HOME + 0.5; fold = B_FLY + 0.4; } else { pop = B_JAPAN; fold = null; }
      end = B_END;
    } else {
      const i = wallets.indexOf(c);
      pop = C_POPS[i]; fold = i < C_POPS.length - 1 ? C_POPS[i + 1] : C_CARD; end = C_END;
      const p = phase(t, pop, end, 0.18, 0.3);
      if (!p.on) return { show: 0, open: 0, pop: 0, fly: 0 };
      const fs = C_FLY + FLY_GAP * i;
      const fly = phase(t, fs, end).on ? clamp(since(t, fs) / FLY, 0, 1) : 0;
      const folded = smoothstep(0, 0.3, p.s - mod(fold - pop, LOOP));
      // Flying, it opens again to show its sum, and is gone as it lands in the card.
      const open = Math.max(smoothstep(0, 0.35, p.s) * (1 - folded), smoothstep(0, 0.3, fly));
      return { show: p.inn * (1 - smoothstep(0.75, 1, fly)), open, pop: outBack(p.s / 0.45), fly };
    }
    const p = phase(t, pop, end, 0.18, 0.4);
    if (!p.on) return { show: 0, open: 0, pop: 0, fly: 0 };
    const folded = fold === null ? 0 : smoothstep(0, 0.3, p.s - mod(fold - pop, LOOP));
    return { show: p.inn * (1 - p.out), open: smoothstep(0, 0.35, p.s) * (1 - folded), pop: outBack(p.s / 0.45), fly: 0 };
  };
  /** Where the flying chips land: the card's sum. */
  const landing = { x: rtl ? headEnd - 110 : TOTAL.x + 110, y: TOTAL.y + 100 };

  const draw = (t: number) => {
    const L = layout(t);
    const r = L.globe.r * cam.zoom;
    // The globe grows from its foot: its bottom moves less than its top.
    const v: View = { cx: L.globe.cx, cy: L.globe.cy + (L.globe.r - r) * 0.35, r, lon0: cam.lon, lat0: cam.lat, dawn: 1 };

    // The sky drifts against the globe's moves, a little.
    stars.style.transform = `translate3d(${(-(v.cx - 330) * 0.08 + 10 * Math.sin((2 * Math.PI * t) / LOOP)).toFixed(2)}px,${(-(r - 285) * 0.06).toFixed(2)}px,0)`;

    // The phone: the scene's place, a slow float.
    const fy = 6 * Math.sin((2 * Math.PI * t) / (LOOP / 2));
    const half = PHONE_SIZE / 2;
    phone.style.transform = `translate3d(${L.phone.x.toFixed(2)}px,${(L.phone.y + fy).toFixed(2)}px,0) translate(${half}px,${half}px) scale(${L.phone.s.toFixed(4)}) translate(${-half}px,${-half}px)`;
    // Each screen slides in over the last, which falls back a little under it.
    const order = SHOT_IN.map((s, i) => ({ i, ago: since(t, s) })).sort((a, b) => b.ago - a.ago);
    const incoming = outCubic(order[order.length - 1].ago / SLIDE);
    order.forEach(({ i }, z) => {
      shots[i].style.zIndex = String(z);
      const x = z === order.length - 1 ? (1 - incoming) * SCREEN.w : z === order.length - 2 && incoming < 1 ? -incoming * 0.3 * SCREEN.w : 0;
      shots[i].style.transform = `translateX(${x.toFixed(1)}px)`;
    });

    // The globe: A's countries as they are reached, C's as their chips come up, B's cost wave.
    const fills = data.journeyCodes.map(() => 0);
    const fresh = data.journeyCodes.map(() => 0);
    const fill = (code: string, from: number, to: number) => {
      const j = data.journeyCodes.indexOf(code);
      const p = phase(t, from, to, 0.45, 0.6);
      if (j < 0 || !p.on) return;
      fills[j] = Math.max(fills[j], p.inn * (1 - p.out));
      fresh[j] = Math.max(fresh[j], 1 - smoothstep(0.3, 1.6, p.s));
    };
    TRIP.forEach((code, i) => fill(code, ARRIVE[i], A_END));
    wallets.forEach((c, i) => fill(c.code, C_POPS[i], C_END));
    fills.forEach((a, i) => renderer.setFill(i, a, fresh[i]));
    const wave = phase(t, WAVE.from, B_END + 0.3, 0.3, 0.6);
    renderer.setCost(wave.on ? wave.inn * (1 - wave.out) : 0, where('KZ'), wave.on ? 185 * sine(wave.s / WAVE.dur) : 0);
    renderer.render(v);

    // The trip's routes.
    const vehicle = moving(t);
    routes.draw(v, legs, legs.map((_, i) => (legOn(t, i) ? glide(since(t, DEPART[i]) / legDur[i]) : 0)), vehicle < 0 ? null : vehicle, TRIP.length, TRIP.map(where), shown(t, ARRIVE[0], A_END, 0.01, 0.5), {
      legs: legs.map(() => 1),
      stops: TRIP.map((_, i) => (phase(t, ARRIVE[i], A_END).on ? smoothstep(0, 0.15, since(t, ARRIVE[i])) : 0)),
    });

    // Chips.
    data.chips.forEach((c, i) => {
      const x = life(t, c);
      const [px, py, cz] = project(c.lonLat[0], c.lonLat[1], v.lon0, v.lat0);
      const vis = smoothstep(0.05, 0.25, cz);
      let sx = v.cx + px * v.r, sy = v.cy + py * v.r;
      let scale = (0.8 + 0.2 * x.open) * (0.5 + 0.5 * x.pop);
      if (x.fly > 0) {
        // Up into the total card, on an arc, shrinking as it goes.
        const u = inOutCubic(x.fly);
        sx = lerp(sx, landing.x, u);
        sy = lerp(sy, landing.y, u) - Math.sin(Math.PI * u) * 70;
        scale *= lerp(1, 0.4, u);
      }
      chipEls[i].style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
      chipEls[i].style.zIndex = String(x.fly > 0 ? 80 + i : x.open > 0.5 ? 60 + i : Math.round(cz * 40));
      chipBody[i].style.opacity = (x.show * (x.fly > 0 ? 1 : vis)).toFixed(3);
      chipBody[i].style.transform = `translateX(-50%) scale(${scale.toFixed(3)})`;
      chipBody[i].style.gap = `${(9 * x.open).toFixed(1)}px`;
      chipText[i].style.maxWidth = `${(320 * x.open).toFixed(1)}px`;
      chipText[i].style.opacity = x.open.toFixed(3);
      chipText[i].style.paddingInlineEnd = `${(12 * x.open).toFixed(1)}px`;
    });

    // Japan's +68%, beside its chip.
    {
      const p = phase(t, B_JAPAN + 0.35, B_END, 0.3, 0.4);
      const [px, py, cz] = project(data.chips[jp].lonLat[0], data.chips[jp].lonLat[1], v.lon0, v.lat0);
      const w = chipBody[jp].offsetWidth, h = chipBody[jp].offsetHeight;
      const pop = outBack(p.s / 0.45);
      badge.style.opacity = (p.on ? p.inn * (1 - p.out) * smoothstep(0.05, 0.25, cz) : 0).toFixed(3);
      badge.style.transform = `translate3d(${(v.cx + px * v.r + w / 2 + 10).toFixed(1)}px,${(v.cy + py * v.r - 11 - h / 2).toFixed(1)}px,0) translateY(-50%) scale(${(p.on ? lerp(0.4, 1, pop) : 0.4).toFixed(3)})`;
    }

    // Headlines, a word at a time: in rising out of a blur, out rising on.
    HEADS.forEach(([from, to], h) => {
      const d = mod(to - from, LOOP), s = since(t, from);
      headWords[h].forEach((el, i) => {
        if (s > d) { el.style.opacity = '0'; return; }
        const inn = outCubic((s - 0.06 * i) / 0.55);
        const out = inOutCubic((s - (d - 0.5) - 0.035 * i) / 0.4);
        el.style.opacity = (inn * (1 - out)).toFixed(3);
        el.style.transform = `translateY(${((1 - inn) * 0.5 * HEAD.size - out * 0.35 * HEAD.size).toFixed(1)}px)`;
        el.style.filter = `blur(${(8 * Math.max(1 - inn, out)).toFixed(2)}px)`;
      });
    });

    // The audience pills, up along the foot one after another, bobbing a little; gone before B.
    pills.forEach((el, i) => {
      const p = phase(t, 23.2 + 0.18 * i, 8.4 + 0.06 * i, 0.4, 0.3);
      const inn = outBack(p.s / 0.55);
      el.style.opacity = (p.on ? p.inn * (1 - p.out) : 0).toFixed(3);
      el.style.transform = `translateY(${(p.on ? (1 - inn) * 34 + p.out * 20 + 2.5 * Math.sin((2 * Math.PI * (t + 0.6 * i)) / (LOOP / 8)) : 0).toFixed(1)}px)`;
    });

    // The total: up under the headline, counting as each chip lands in it, a beat with each.
    {
      const p = phase(t, C_CARD, C_END, 0.35, 0.35);
      const inn = outCubic(p.s / 0.45);
      let sum = 0, beat = 0;
      if (p.on) {
        wallets.forEach((c, i) => {
          const land = C_FLY + FLY_GAP * i + FLY;
          if (!phase(t, land, C_END).on) return;
          const s = since(t, land);
          sum += (c.value ?? 0) * outCubic(s / 0.35);
          beat += Math.sin(Math.PI * clamp(s / 0.25, 0, 1));
        });
      }
      totalCard.style.opacity = (p.on ? inn * (1 - p.out) : 0).toFixed(3);
      totalCard.style.transform = `translateY(${(p.on ? (1 - inn) * 20 : 0).toFixed(1)}px) scale(${(p.on ? lerp(0.92, 1, inn) * (1 + 0.035 * Math.min(1, beat)) : 0.92).toFixed(4)})`;
      totalValue.textContent = money.format(Math.round(Math.min(data.total, sum)));
    }
  };

  const seek = (f: number) => {
    f = clamp(Math.round(f), 0, frames - 1);
    if (f < stepped) stepped = -Infinity;
    if (stepped === -Infinity) warmUp();
    while (stepped < f) step(++stepped);
    draw(f / FPS);
  };

  await ready;
  (window as unknown as { __video: object }).__video = { fps: FPS, frames, duration: LOOP, seek, camera: () => ({ ...cam }) };

  if (params.has('play')) {
    const start = performance.now();
    let last = -1;
    const tick = (now: number) => {
      const f = Math.floor(((now - start) / 1000) * FPS) % frames;
      if (f !== last) {
        if (f < last) { while (stepped < frames - 1) step(++stepped); stepped = -1; }
        seek(f);
        last = f;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    seek(Number(params.get('t') ?? 0) * FPS);
  }
  root.dataset.ready = '1';
}
