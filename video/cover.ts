// The App Store product page header: a 21:9 video (3840 × 1646) that the store plays on
// a loop, muted. The hero's trip, round the planet and back to where it began, with no
// seam: the last stop's flight lands in the first stop, the planet has turned once, and
// what is drawn is a trail of the last few crossings rather than the whole trip — so
// nothing has to be cleared away and start again.
//
// Everything is a function of the loop's clock, except the camera, which chases a target
// as the hero's does. It is stepped one video frame at a time through a whole lap before
// frame 0, so the frame after the last is frame 0 again, to the last bit.
//
// Apple's template (creative_assets-product_page_header_template) keeps the art that
// matters in the middle 1646 × 661 of the frame, which every device shows. An iPhone shows
// more: the whole height and about the middle 2490 px of the width (1.5 : 1), at about
// 390 pt — so that is what the planet and the chips are sized for, with the stop just
// reached and its chip inside the safe area for the rest.

import { GlobeRenderer, loadImage, type View } from '../src/globe/renderer';
import { RouteLayer, type Leg, type Transport } from '../src/globe/routes';
import { drawStars } from '../src/globe/stars';
import { RAD, angleBetween, clamp, greatCircle, nearestTurn, project, smoothstep } from '../src/globe/geo';

export const FPS = 30;
/**
 * The stage, CSS px; captured at 4×. Small, so that the route's lines, vehicles and badges
 * (sized in CSS px for the hero) come out large enough on an iPhone. 1646 is 2 × 823, so
 * the height is not a whole number.
 */
export const W = 960;
export const H = 1646 / 4;

// --- the planet's place ----------------------------------------------------------------------
const R = 500;
/** Its top edge: under the iPhone's status bar, a quarter of the way down. It stays put as the camera pulls back. */
const TOP = 99;
const CX = W / 2;
/** Where the stop just reached (or the vehicle) sits on screen: low in the safe area, its chip above it. */
const FOCUS_Y = 282;

// --- the loop ----------------------------------------------------------------------------
export const LOOP = 29;
const HOLD = 0.75;   // at a stop before setting off again, s
const TRAIL = 3;     // stops (and the crossings into them) kept on the planet behind the latest
const FADE = 0.9;    // how long one takes to fade from the trail, s
/** Frame 0, the poster frame, falls this long after stop START_AT is reached: Georgia's
 *  chip open, Morocco's and Turkey's flags behind it, the flight to Thailand setting off. */
const START_AT = 4;
const START_AFTER = 1.0;

/** Speeds up over the first `a` of the way, cruises, slows over the last `a`. */
const glide = (x: number, a = 0.28) => {
  x = clamp(x, 0, 1);
  const v = 1 / (1 - a);
  if (x < a) return (v * x * x) / (2 * a);
  if (x > 1 - a) return 1 - (v * (1 - x) * (1 - x)) / (2 * a);
  return v * (x - a / 2);
};
const outBack = (x: number) => {
  const u = clamp(x, 0, 1) - 1;
  return 1 + 2.4 * u * u * u + 1.4 * u * u;
};
const mod = (a: number, n: number) => ((a % n) + n) % n;

type Data = {
  journey: { stops: { code: string; name: string; lonLat: [number, number]; amount: string }[]; legs: Transport[] };
};

export async function startCover(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const qa = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const data = JSON.parse(document.getElementById('cover-data')!.textContent!) as Data;
  const params = new URLSearchParams(location.search);
  root.classList.toggle('show-guides', params.has('guides'));
  const dpr = devicePixelRatio || 1;

  const renderer = new GlobeRenderer(q('.v-globe'), true);
  const names: Transport[] = ['flight', 'train', 'bus', 'ferry', 'car'];
  const sprites = await Promise.all(names.map((n) => loadImage(`/transport/${n}.webp`)));
  const routes = new RouteLayer(q('.v-routes'), Object.fromEntries(names.map((n, i) => [n, sprites[i]])) as Record<Transport, HTMLImageElement>);

  const images = qa<HTMLImageElement>('img');
  const ready = Promise.all([
    renderer.load('/globe/earth-4k.webp', '/globe/ids.png'),
    document.fonts.ready,
    ...images.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))),
  ]);
  renderer.resize(W, H, dpr);
  routes.resize(W, H, dpr);
  drawStars(q('.v-stars'), dpr);

  // --- the trip: every stop, and the crossing from the last back to the first --------------
  const stops = data.journey.stops;
  const n = stops.length;
  const anchors = stops.map((s) => s.lonLat);
  const legs: Leg[] = anchors.map((a, i) => ({ transport: data.journey.legs[i], points: greatCircle(a, anchors[(i + 1) % n], 1) }));
  const legAngle = legs.map((_, i) => angleBetween(anchors[i], anchors[(i + 1) % n]) * RAD);

  // A crossing takes longer the further it goes, and all of them together fill the loop.
  const raw = legAngle.map((a) => clamp(1.2 + 0.03 * (a / RAD), 1.6, 5.5));
  // The long ones pull back a little, so the planet turning under them reads slower.
  const zoomFor = (i: number) => clamp(1.2 - legAngle[i] / RAD / 250, 0.82, 1);
  const k = (LOOP - HOLD * n) / raw.reduce((s, d) => s + d, 0);
  const dur = raw.map((d) => d * k);
  /** Arrivals, unwrapped past the end of the loop: A[i + n] = A[i] + LOOP. */
  const A: number[] = [0];
  for (let i = 0; i < n + TRAIL + 1; i++) A.push(A[i] + HOLD + dur[i % n]);
  const depart = (i: number) => A[i] + HOLD;

  /** How long ago event `e` was, on the loop: 0 at it, growing until it comes round again. */
  const since = (t: number, e: number) => mod(t - e, LOOP);

  type Stop = { s: number; alive: boolean; fade: number; open: number };
  const stopAt = (t: number, i: number): Stop => {
    const s = since(t, A[i]);
    const fadeFrom = A[i + TRAIL] - A[i];
    const alive = s < fadeFrom + FADE;
    const next = A[i + 1] - A[i];
    const open = !alive ? 0 : s < next ? smoothstep(0, 0.35, s) : 1 - smoothstep(next, next + 0.3, s);
    return { s, alive, fade: alive ? 1 - smoothstep(fadeFrom, fadeFrom + FADE, s) : 0, open };
  };
  /** Leg i runs from stop i to stop i + 1, and leaves the trail with stop i + 1. */
  const legAt = (t: number, i: number) => {
    const s = since(t, depart(i));
    const fadeFrom = A[i + 1 + TRAIL] - depart(i);
    const alive = s < fadeFrom + FADE;
    return { s, progress: alive ? glide(s / dur[i]) : 0, moving: s < dur[i], fade: alive ? 1 - smoothstep(fadeFrom, fadeFrom + FADE, s) : 0 };
  };

  /** The view centre that puts `p` at the focus, at zoom `z`. */
  const cameraFor = (p: [number, number], z: number): [number, number] => {
    const fy = (FOCUS_Y - TOP) / (R * z) - 1;
    return [p[0], clamp(p[1] - Math.asin(-fy) / RAD, -80, 80)];
  };
  const along = (i: number, u: number): [number, number] => {
    const pts = legs[i].points;
    const m = pts.length / 2;
    const f = clamp(u, 0, 1) * (m - 1);
    const j = Math.min(m - 2, Math.floor(f));
    const v = f - j;
    const lon1 = nearestTurn(pts[j * 2], pts[j * 2 + 2]);
    return [pts[j * 2] + (lon1 - pts[j * 2]) * v, pts[j * 2 + 1] + (pts[j * 2 + 3] - pts[j * 2 + 1]) * v];
  };

  const target = (t: number) => {
    for (let i = 0; i < n; i++) {
      const l = legAt(t, i);
      if (l.moving) return { p: cameraFor(along(i, l.progress), zoomFor(i)), zoom: zoomFor(i), tau: 260 };
    }
    let latest = 0;
    for (let i = 1; i < n; i++) if (since(t, A[i]) < since(t, A[latest])) latest = i;
    return { p: cameraFor(anchors[latest], 1), zoom: 1, tau: 320 };
  };

  // --- the camera, a frame at a time -------------------------------------------------------
  const frames = Math.round(LOOP * FPS);
  const START = A[START_AT] + START_AFTER;
  const clock = (f: number) => mod(f / FPS + START, LOOP);
  const cam = { lon: 0, lat: 0, zoom: 1 };
  let stepped = -Infinity;
  const step = (f: number) => {
    const g = target(clock(f));
    const kk = 1 - Math.exp(-1000 / FPS / g.tau);
    cam.zoom += (g.zoom - cam.zoom) * (1 - Math.exp(-1000 / FPS / (g.tau * 1.7)));
    cam.lon += (nearestTurn(cam.lon, g.p[0]) - cam.lon) * kk;
    cam.lat += (g.p[1] - cam.lat) * kk;
    cam.lon = ((cam.lon + 540) % 360) - 180;
  };
  const warmUp = () => {
    const g = target(clock(-frames));
    [cam.lon, cam.lat] = g.p;
    cam.zoom = g.zoom;
    stepped = -frames;
  };

  // --- the DOM -----------------------------------------------------------------------------
  const chips = qa<HTMLElement>('.chip');
  const chipBody = chips.map((c) => c.querySelector<HTMLElement>('.chip-body')!);
  const chipText = chips.map((c) => c.querySelector<HTMLElement>('.chip-text')!);

  const draw = (t: number) => {
    const r = R * cam.zoom;
    const v: View = { cx: CX, cy: TOP + r, r, lon0: cam.lon, lat0: cam.lat, dawn: 1 };
    const st = stops.map((_, i) => stopAt(t, i));
    const lg = legs.map((_, i) => legAt(t, i));

    st.forEach((x, i) => renderer.setFill(i, x.alive ? smoothstep(0, 0.4, x.s) * x.fade : 0, x.alive ? 1 - smoothstep(0.3, 1.5, x.s) : 0));
    renderer.render(v);

    const vehicle = lg.findIndex((l) => l.moving);
    routes.draw(v, legs, lg.map((l) => l.progress), vehicle < 0 ? null : vehicle, n, anchors, 1, {
      legs: lg.map((l) => l.fade),
      stops: st.map((x) => (x.alive ? smoothstep(0, 0.15, x.s) * x.fade : 0)),
    });

    chips.forEach((chip, i) => {
      const x = st[i];
      const [px, py, c] = project(anchors[i][0], anchors[i][1], v.lon0, v.lat0);
      const vis = smoothstep(0.05, 0.25, c);
      const pop = outBack(x.s / 0.45);
      chip.style.transform = `translate3d(${(v.cx + px * r).toFixed(1)}px,${(v.cy + py * r).toFixed(1)}px,0)`;
      chip.style.zIndex = String(x.open > 0.5 ? 60 : Math.round(c * 40));
      chipBody[i].style.opacity = (x.alive ? smoothstep(0, 0.18, x.s) * x.fade * vis : 0).toFixed(3);
      chipBody[i].style.transform = `translateX(-50%) scale(${((0.8 + 0.2 * x.open) * (0.5 + 0.5 * pop)).toFixed(3)})`;
      chipBody[i].style.gap = `${(10 * x.open).toFixed(1)}px`;
      chipText[i].style.maxWidth = `${(320 * x.open).toFixed(1)}px`;
      chipText[i].style.opacity = x.open.toFixed(3);
      chipText[i].style.paddingRight = `${(13 * x.open).toFixed(1)}px`;
    });
  };

  const seek = (f: number) => {
    f = clamp(Math.round(f), 0, frames - 1);
    if (f < stepped) stepped = -Infinity;
    if (stepped === -Infinity) warmUp();
    while (stepped < f) step(++stepped);
    draw(clock(f));
  };

  await ready;
  (window as unknown as { __video: object }).__video = {
    fps: FPS, frames, duration: LOOP, seek, camera: () => ({ ...cam }),
    marks: { arrivals: A.slice(0, n).map((a) => mod(a - START, LOOP)), dur },
  };

  if (params.has('play')) {
    const start = performance.now();
    let last = -1;
    const tick = (now: number) => {
      const f = Math.floor(((now - start) / 1000) * FPS) % frames;
      // Back to frame 0 is the seam: stepping on from the last frame is what the video does.
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
