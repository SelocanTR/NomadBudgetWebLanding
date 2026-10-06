// The marketing video, as a function of time. Every section boundary sits on the music's
// beat grid (track B: 107 BPM, the drop at 8.0 s), every stop is reached on a beat.
//
// The camera is the one thing with state: it chases a target, as the hero's does. To
// keep a frame the same however it is reached, the chase is stepped at exactly one step
// per video frame from frame 0 — `seek` replays it from the start when asked to go back.

import { GlobeRenderer, loadImage, type View } from '../src/globe/renderer';
import { RouteLayer, type Leg, type Transport } from '../src/globe/routes';
import { drawStars } from '../src/globe/stars';
import { RAD, angleBetween, clamp, greatCircle, nearestTurn, project, smoothstep } from '../src/globe/geo';
import cost from './assets/cost.json';
import idsAllUrl from './assets/ids-all.png?url';

export const FPS = 30;

// --- the music's grid ----------------------------------------------------------------------
const BEAT = 60 / 107;
const DROP = 8.0;
const beat = (k: number) => DROP + k * BEAT;

const FIRST = beat(-11);          // France is reached
const DEPART = beat(-10);         // the first crossing sets off
/**
 * Beats per crossing, by how far it goes: three for a hop next door, more for the long
 * flights (Morocco–Turkey 35°, Georgia–Thailand 55°, Indonesia–Mexico 145°). Two beats a
 * crossing had the planet whipping round faster than the eye could follow — it read as a
 * glitch. Thirty-three of them bring Turkey in on the drop and Mexico in on beat 23.
 */
const LEG_BEATS = [3, 3, 4, 3, 5, 3, 3, 9];
/** How far round the planet turns to France as the video opens, degrees. */
const OPENING_SPIN = 40;
const HOLD = 0.4;                 // at a stop before setting off again, s
const TOTAL = beat(24);
const COST = beat(32);
const SCREENS = beat(40);
const END = beat(48);
export const DURATION = 39.6;
/** When the opening's eyebrow changes audience. */
const AUDIENCES = [0, beat(-9), beat(-4)];

// --- the cost scale (the app's costScale.ts) -------------------------------------------------
const BAND_MAX = [0.5, 0.8, 1.25, 2];
const SCALE = ['#1FA37A', '#9AEAC4', '#4F5DDD', '#F2A93B', '#E3489C'];
const costBand = (ratio: number) => {
  for (let i = 0; i < BAND_MAX.length; i++) if (ratio < BAND_MAX[i]) return i;
  return 4;
};

// --- easing ----------------------------------------------------------------------------------
const sine = (x: number) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;
/**
 * Speeds up over the first `a` of the way, cruises, slows over the last `a`: its top
 * speed is 1 / (1 − a) of the average, where an ease-in-out sine peaks at π/2 of it.
 */
const glide = (x: number, a = 0.28) => {
  x = clamp(x, 0, 1);
  const v = 1 / (1 - a);
  if (x < a) return (v * x * x) / (2 * a);
  if (x > 1 - a) return 1 - (v * (1 - x) * (1 - x)) / (2 * a);
  return v * (x - a / 2);
};
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const inCubic = (x: number) => Math.pow(clamp(x, 0, 1), 3);
const outBack = (x: number) => {
  const u = clamp(x, 0, 1) - 1;
  return 1 + 2.4 * u * u * u + 1.4 * u * u;
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** In over `rise` after `from`, out over `fall` before `to`: 0..1. */
const window01 = (t: number, from: number, to: number, rise = 0.35, fall = 0.25) =>
  smoothstep(from, from + rise, t) * (1 - smoothstep(to - fall, to, t));

type Data = {
  lang: string;
  locale: string;
  journey: { stops: { code: string; name: string; lonLat: [number, number]; amount: string }[]; legs: Transport[] };
  home: { currency: string };
  reference: { code: string };
  total: number;
  shots: string[];
};

export async function startVideo(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const qa = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const data = JSON.parse(document.getElementById('video-data')!.textContent!) as Data;
  const params = new URLSearchParams(location.search);
  const landscape = params.get('f') === 'landscape';
  root.classList.toggle('landscape', landscape);

  const W = landscape ? 960 : 540;
  const H = landscape ? 540 : 960;
  const cx = landscape ? 650 : 270;
  const cy = landscape ? 290 : 620;
  const R0 = landscape ? 230 : 248;
  // Where the trip happens on screen: right of centre in 16:9, clear of the words on the left.
  const focus = landscape ? { x: 0.3 * R0, y: 0 } : { x: 0, y: -0.06 * R0 };
  const dpr = devicePixelRatio || 1;

  const renderer = new GlobeRenderer(q('.v-globe'), true);
  const names: Transport[] = ['flight', 'train', 'bus', 'ferry', 'car'];
  const sprites = await Promise.all(names.map((n) => loadImage(`/transport/${n}.webp`)));
  const routes = new RouteLayer(q('.v-routes'), Object.fromEntries(names.map((n, i) => [n, sprites[i]])) as Record<Transport, HTMLImageElement>);

  // `home` is the viewer's currency; the cost layer spreads out from the reference country.
  const home = data.home;
  const ref = data.reference.code;
  const homeAt = (cost.anchors as unknown as Record<string, [number, number]>)[ref];
  const pli = cost.pli as Record<string, number>;
  const bands = new Uint8Array(256 * 4);
  cost.codes.forEach((code: string, i: number) => {
    if (!pli[code] || !pli[ref]) return;
    const hex = SCALE[costBand(pli[code] / pli[ref])];
    const o = (i + 1) * 4;
    bands[o] = parseInt(hex.slice(1, 3), 16);
    bands[o + 1] = parseInt(hex.slice(3, 5), 16);
    bands[o + 2] = parseInt(hex.slice(5, 7), 16);
    bands[o + 3] = 255;
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
  drawStars(q('.v-stars'), dpr);

  // --- the trip ------------------------------------------------------------------------------
  const stops = data.journey.stops;
  const anchors = stops.map((s) => s.lonLat);
  const legs: Leg[] = LEG_BEATS.map((_, i) => ({ transport: data.journey.legs[i], points: greatCircle(anchors[i], anchors[i + 1], 1) }));
  const legAngle = legs.map((_, i) => angleBetween(anchors[i], anchors[i + 1]));

  const arrivals = [FIRST];
  let k = -10;                     // DEPART's beat
  for (const b of LEG_BEATS) arrivals.push(beat((k += b)));
  const departures = legs.map((_, i) => (i === 0 ? DEPART : arrivals[i] + HOLD));
  /** When a stop's chip folds back to its flag: the next stop is reached, or the trip is over. */
  const chipEnds = stops.map((_, i) => arrivals[i + 1] ?? TOTAL);

  // A long crossing pulls back a little, so the planet turning under it reads slower.
  const zoomFor = (k: number) => clamp(0.72 / (legAngle[k] * RAD), 0.78, 1.8);
  /** The view centre that puts `p` at the focus, at zoom `z`. */
  const cameraFor = (p: [number, number], z: number): [number, number] => {
    const r = R0 * z;
    const fx = clamp(focus.x / r, -0.8, 0.8), fy = clamp(focus.y / r, -0.8, 0.8);
    const lat0 = p[1] - Math.asin(-fy) / RAD;
    const lon0 = p[0] - Math.asin(clamp(fx / Math.max(0.2, Math.cos(p[1] * RAD)), -1, 1)) / RAD;
    return [lon0, clamp(lat0, -40, 55)];
  };
  const along = (k: number, p: number): [number, number] => {
    const pts = legs[k].points;
    const n = pts.length / 2;
    const f = clamp(p, 0, 1) * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const u = f - i;
    const lon1 = nearestTurn(pts[i * 2], pts[i * 2 + 2]);
    return [pts[i * 2] + (lon1 - pts[i * 2]) * u, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * u];
  };
  const progressAt = (t: number) => legs.map((_, k) => glide((t - departures[k]) / (arrivals[k + 1] - departures[k])));
  const vehicleAt = (t: number) => {
    for (let k = 0; k < legs.length; k++) if (t >= departures[k] && t < arrivals[k + 1]) return k;
    return null;
  };

  // From Mexico — the end of the trip and the cost layer's home — the planet only ever
  // turns one way: easing into a slow drift east under the total, picking up a little for
  // the cost layer's wave, steady to the end. (It used to turn 60° east under the total and
  // swing back to Mexico in a second and a half for the cost layer: the jolt read as a fault.)
  const [mxLon, mxLat] = cameraFor(anchors[stops.length - 1], zoomFor(legs.length - 1));
  const SLOW = 4, FAST = 11;   // degrees a second
  const speed = (t: number) => SLOW * smoothstep(TOTAL - 0.4, TOTAL + 1.6, t) + (FAST - SLOW) * smoothstep(COST, COST + 2.5, t);
  // Its integral, a value per frame (and one past the end), summed once.
  const turned: number[] = [0];
  for (let f = 1; f <= Math.ceil(DURATION * FPS) + 1; f++) turned.push(turned[f - 1] + speed((f - 0.5) / FPS) / FPS);
  const drift = (t: number) => {
    const f = clamp(t * FPS, 0, turned.length - 2);
    const i = Math.floor(f);
    return lerp(turned[i], turned[i + 1], f - i);
  };

  type Target = { lon: number; lat: number; zoom: number; tau: number };
  // (16:9 needs no turn of its own past the trip: the planet already sits right of the words.)
  const target = (t: number): Target => {
    if (t < FIRST) {
      const u = 1 - glide(t / FIRST, 0.4);
      return { lon: anchors[0][0] + OPENING_SPIN * u, lat: anchors[0][1] - 12 * u, zoom: 1, tau: 1 };
    }
    if (t < TOTAL) {
      const v = vehicleAt(t);
      if (v !== null) {
        const z = zoomFor(v);
        const [lon, lat] = cameraFor(along(v, progressAt(t)[v]), z);
        return { lon, lat, zoom: z, tau: 260 };
      }
      const at = arrivals.filter((a) => t >= a).length - 1;
      const z = zoomFor(Math.min(at, legs.length - 1));
      const [lon, lat] = cameraFor(anchors[at], z);
      return { lon, lat, zoom: z, tau: 320 };
    }
    const lat = lerp(mxLat, 12, sine((t - TOTAL) / (SCREENS - TOTAL)));
    return { lon: mxLon + drift(t), lat, zoom: t < COST ? 0.9 : 1, tau: 300 };
  };

  // --- the camera, stepped a frame at a time -------------------------------------------------
  const cam = { lon: 0, lat: 0, zoom: 1 };
  let stepped = -1;
  const step = (f: number) => {
    const g = target(f / FPS);
    if (f === 0) {
      Object.assign(cam, { lon: g.lon, lat: g.lat, zoom: g.zoom });
      return;
    }
    const dt = 1000 / FPS;
    const kk = g.tau <= 1 ? 1 : 1 - Math.exp(-dt / g.tau);
    const kz = g.tau <= 1 ? 1 : 1 - Math.exp(-dt / (g.tau * 1.7));
    cam.zoom += (g.zoom - cam.zoom) * kz;
    cam.lon += (nearestTurn(cam.lon, g.lon) - cam.lon) * kk;
    cam.lat += (g.lat - cam.lat) * kk;
    cam.lon = ((cam.lon + 540) % 360) - 180;
  };

  // --- the DOM ---------------------------------------------------------------------------------
  const chips = qa<HTMLElement>('.chip');
  const chipBody = chips.map((c) => c.querySelector<HTMLElement>('.chip-body')!);
  const chipText = chips.map((c) => c.querySelector<HTMLElement>('.chip-text')!);
  const homePin = q<HTMLElement>('.home-pin');
  const homeRing = q<HTMLElement>('.home-ring');
  const homeBody = q<HTMLElement>('.home-body');
  const captions = qa<HTMLElement>('.caption');
  const shade = q<HTMLElement>('.v-shade');
  const totalCard = q<HTMLElement>('.v-total');
  const totalValue = q<HTMLElement>('.total-value');
  const legend = q<HTMLElement>('.v-legend');
  const phone = q<HTMLElement>('.v-phone');
  const shots = qa<HTMLImageElement>('.v-phone img');
  const endParts = qa<HTMLElement>('.v-end > *');
  const sample = q<HTMLElement>('.v-sample');
  const roll = q<HTMLElement>('.eyebrow-roll');
  const rollWords = qa<HTMLElement>('.eyebrow-word');
  let rollWidths: number[] | null = null;
  const money = new Intl.NumberFormat(data.locale, { style: 'currency', currency: home.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });

  const screenAt = (i: number) => SCREENS + 4 * i * BEAT;
  const captionTimes: [number, number][] = [
    [0.3, DROP],
    [DROP, beat(12)],
    [beat(12), TOTAL],
    [TOTAL, COST],
    [COST, SCREENS],
    ...shots.map((_, i): [number, number] => [screenAt(i), i === shots.length - 1 ? END : screenAt(i + 1)]),
  ];

  const GAP = 22;
  let heights: { captions: number[]; total: number; legend: number } | null = null;

  const at = (p: [number, number], v: View) => {
    const [x, y, c] = project(p[0], p[1], v.lon0, v.lat0);
    return { x: v.cx + x * v.r, y: v.cy + y * v.r, vis: smoothstep(0.05, 0.25, c), c };
  };

  const draw = (t: number) => {
    const dawn = smoothstep(0, 0.8, t);
    // For the end card the planet comes to the middle of the frame, a little larger, and stays.
    const home_ = sine((t - END) / 1.2);
    const v: View = {
      cx: lerp(cx, W / 2, home_), cy: lerp(cy, H / 2, home_), r: R0 * lerp(1, 1.15, home_) * cam.zoom,
      lon0: cam.lon, lat0: cam.lat, dawn,
    };
    const tripAlpha = 1 - smoothstep(COST, COST + 0.6, t);

    // Globe: the trip's countries, then the cost layer's wave from home.
    stops.forEach((_, i) => {
      const since = t - arrivals[i];
      renderer.setFill(i, since >= 0 ? smoothstep(0, 0.4, since) * tripAlpha : 0, since >= 0 ? 1 - smoothstep(0.3, 1.5, since) : 0);
    });
    const costMix = smoothstep(COST + 0.4, COST + 0.8, t);
    renderer.setCost(costMix, homeAt, 185 * sine((t - COST - 0.7) / 4.2));
    renderer.render(v);

    const vehicle = t < TOTAL ? vehicleAt(t) : null;
    const reached = arrivals.filter((a) => t >= a).length;
    routes.draw(v, legs, progressAt(t), vehicle, reached, anchors, tripAlpha * dawn);

    // Chips: pop on arrival, open while current, fold to the flag after.
    chips.forEach((chip, i) => {
      const since = t - arrivals[i];
      const p = at(anchors[i], v);
      const open = since < 0 ? 0 : t < chipEnds[i] ? smoothstep(0, 0.35, since) : 1 - smoothstep(chipEnds[i], chipEnds[i] + 0.3, t);
      const pop = outBack(since / 0.45);
      chip.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      chip.style.zIndex = String(open > 0.5 ? 60 : Math.round(p.c * 40));
      chipBody[i].style.opacity = (smoothstep(0, 0.18, since) * p.vis * tripAlpha).toFixed(3);
      chipBody[i].style.transform = `translateX(-50%) scale(${((0.8 + 0.2 * open) * lerp(0.5, 1, pop)).toFixed(3)})`;
      chipBody[i].style.gap = `${(8 * open).toFixed(1)}px`;
      chipText[i].style.maxWidth = `${(250 * open).toFixed(1)}px`;
      chipText[i].style.opacity = open.toFixed(3);
      chipText[i].style.paddingRight = `${(10 * open).toFixed(1)}px`;
    });

    // Home, while the cost layer is the story.
    {
      const p = at(homeAt, v);
      const since = t - (COST + 0.6);
      const out = 1 - smoothstep(SCREENS - 0.3, SCREENS, t);
      homePin.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      homeRing.style.opacity = (smoothstep(0, 0.2, since) * p.vis * out).toFixed(3);
      homeRing.style.transform = `scale(${lerp(0.3, 1, outBack(since / 0.4)).toFixed(3)})`;
      homeBody.style.opacity = (smoothstep(0.1, 0.3, since) * p.vis * out).toFixed(3);
      homeBody.style.transform = `translateX(-50%) translateY(-6px) scale(${lerp(0.5, 1, outBack((since - 0.1) / 0.45)).toFixed(3)})`;
    }

    // 16:9: the words are centred in the height of the frame, and whatever card goes with
    // them (the total, the cost card) is centred with them as one block — the words rise to
    // make room while it is up and are back in the middle once it has gone.
    if (landscape) {
      heights ??= { captions: captions.map((el) => el.offsetHeight), total: totalCard.offsetHeight, legend: legend.offsetHeight };
      const withTotal = smoothstep(TOTAL, TOTAL + 0.5, t) * (1 - smoothstep(COST - 0.2, COST + 0.3, t));
      const withLegend = smoothstep(COST + 0.8, COST + 1.3, t) * (1 - smoothstep(SCREENS - 0.2, SCREENS + 0.3, t));
      const extra = withTotal * (heights.total + GAP) + withLegend * (heights.legend + GAP);
      captions.forEach((el, i) => { el.style.top = `${((H - heights!.captions[i] - extra) / 2).toFixed(1)}px`; });
      const below = (caption: number, card: number) => (H - heights!.captions[caption] - card - GAP) / 2 + heights!.captions[caption] + GAP;
      totalCard.style.top = `${below(3, heights.total).toFixed(1)}px`;
      legend.style.top = `${below(4, heights.legend).toFixed(1)}px`;
    }

    // The opening's eyebrow, as the landing's: the audience in it leaves upwards, the pill
    // eases to the width of the next, and the next rises into it.
    {
      rollWidths ??= rollWords.map((el) => el.offsetWidth);
      const now = AUDIENCES.filter((a) => t >= a).length - 1;
      rollWords.forEach((el, i) => {
        const inn = i === 0 ? 1 : smoothstep(AUDIENCES[i] + 0.12, AUDIENCES[i] + 0.45, t);
        const out = i === AUDIENCES.length - 1 ? 0 : smoothstep(AUDIENCES[i + 1] - 0.2, AUDIENCES[i + 1] + 0.06, t);
        el.style.opacity = (inn * (1 - out)).toFixed(3);
        el.style.transform = `translateY(${((1 - inn) * 0.6 - out * 0.6).toFixed(3)}em)`;
        el.style.filter = `blur(${(3 * Math.max(1 - inn, out)).toFixed(2)}px)`;
      });
      const grow = now === 0 ? 1 : outCubic((t - AUDIENCES[now] + 0.1) / 0.5);
      roll.style.width = `${lerp(rollWidths[Math.max(0, now - 1)], rollWidths[now], grow).toFixed(1)}px`;
    }

    captions.forEach((el, i) => {
      const [from, to] = captionTimes[i];
      const inn = smoothstep(from, from + 0.35, t);
      const out = smoothstep(to - 0.22, to, t);
      el.style.opacity = (inn * (1 - out)).toFixed(3);
      el.style.transform = `translateY(${((1 - inn) * 16 - out * 10).toFixed(1)}px)`;
    });

    // The total: in, counting up, out as the cost layer comes.
    {
      const inn = outCubic((t - TOTAL - 0.25) / 0.4);
      const out = smoothstep(COST - 0.1, COST + 0.25, t);
      totalCard.style.opacity = (clamp(inn, 0, 1) * (1 - out)).toFixed(3);
      totalCard.style.transform = `translateY(${((1 - inn) * 18 - out * 14).toFixed(1)}px) scale(${lerp(0.94, 1, inn).toFixed(3)})`;
      totalValue.textContent = money.format(Math.round(data.total * outCubic((t - TOTAL - 0.35) / 1.0)));
    }

    legend.style.opacity = window01(t, COST + 1.0, SCREENS, 0.4, 0.3).toFixed(3);
    legend.style.transform = `translateY(${((1 - smoothstep(COST + 1.0, COST + 1.4, t)) * 14).toFixed(1)}px)`;
    sample.style.opacity = (window01(t, 1.0, SCREENS, 0.5, 0.3) * 1).toFixed(3);

    // The phone rises with the first screen, a screen a bar, and drops for the end card.
    {
      const up = outCubic((t - SCREENS) / 0.7);
      const down = inCubic((t - END) / 0.5);
      const y = (1 - up) * (H * 0.75) + down * (H * 0.75);
      phone.style.opacity = (smoothstep(SCREENS, SCREENS + 0.15, t) * (1 - smoothstep(END + 0.3, END + 0.5, t))).toFixed(3);
      phone.style.transform = `translateY(${y.toFixed(1)}px)`;
      // Each screen slides in over the one before, which stays underneath.
      shots.forEach((img, i) => {
        const inn = i === 0 ? 1 : smoothstep(screenAt(i), screenAt(i) + 0.3, t);
        img.style.opacity = inn.toFixed(3);
        img.style.zIndex = String(i);
        img.style.transform = `translateX(${((1 - inn) * 40).toFixed(1)}px)`;
      });
    }

    // Dimmed under the phone; a little less so for the end card, the planet being its backdrop.
    shade.style.opacity = (0.5 * smoothstep(SCREENS, SCREENS + 0.5, t) - 0.12 * smoothstep(END, END + 0.8, t)).toFixed(3);

    endParts.forEach((el, i) => {
      const s = END + 0.35 + 0.13 * i;
      const e = outCubic((t - s) / 0.45);
      el.style.opacity = clamp(e, 0, 1).toFixed(3);
      el.style.transform = i === 0 ? `scale(${lerp(0.7, 1, outBack((t - s) / 0.55)).toFixed(3)})` : `translateY(${((1 - e) * 16).toFixed(1)}px)`;
    });
  };

  const frames = Math.round(DURATION * FPS);
  const seek = (f: number) => {
    f = clamp(Math.round(f), 0, frames - 1);
    if (f < stepped) stepped = -1;
    while (stepped < f) step(++stepped);
    draw(f / FPS);
  };

  await ready;
  (window as unknown as { __video: object }).__video = { fps: FPS, frames, duration: DURATION, seek, camera: () => ({ ...cam }), marks: { FIRST, DROP, TOTAL, COST, SCREENS, END, arrivals } };

  if (params.has('play')) {
    const start = performance.now();
    const tick = (now: number) => {
      seek(Math.floor(((now - start) / 1000) * FPS) % frames);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    seek(Number(params.get('t') ?? 0) * FPS);
  }
  root.dataset.ready = '1';
}
