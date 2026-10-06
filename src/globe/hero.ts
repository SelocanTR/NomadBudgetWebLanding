// The hero's globe: a sample journey played on a loop.
//
// Everything on screen is a function of one scenario clock `t` (ms): where each vehicle
// is, which countries are filled, which chip is up. The camera is
// the one thing with state of its own — it eases after a target the clock sets (the
// stop, then the vehicle as it travels), so the planet turns under the trip, and the
// reader can take it over by dragging. The clock stops while the hero is off screen, the
// reader holds the globe, or the pause button is on — and with the frames themselves when
// the browser stops them for a hidden tab. (Not on `document.hidden`: some embedded
// browsers report a page on screen as hidden while running its frames.)

import { GlobeRenderer, loadImage, type View } from './renderer';
import { RouteLayer, type Leg, type Transport } from './routes';
import { drawStars } from './stars';
import { RAD, angleBetween, clamp, greatCircle, nearestTurn, project, smoothstep } from './geo';

type Stop = { code: string; name: string; lonLat: [number, number]; amount: string };
type Journey = { stops: Stop[]; legs: Transport[] };

const FIRST = 2200;    // the planet spins in and the first stop lands this long after the page opens
const OVERTURE = 500;  // the whole planet on show at the first stop, before the camera dives in
const HOLD = 1500;     // a stop's moment before the next crossing
const FINALE = 4200;   // the whole trip on show, the planet turning slowly
const RESET = 1100;    // the trip fading away before it starts again
const DAWN = 1000;
const SPEED = 170;     // CSS px/s along the route on screen
/** How far round the planet turns to the first stop when the page opens, degrees. */
const OPENING_SPIN = 130;
/** How far it turns on through the finale — and back again as the trip restarts. */
const FINALE_SPIN = 60;

const sine = (x: number) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;


export async function startHero(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const data = JSON.parse(q<HTMLScriptElement>('#journey-data').textContent ?? '{}') as Journey;
  const starsCanvas = q<HTMLCanvasElement>('.hero-stars');
  const globeCanvas = q<HTMLCanvasElement>('.hero-globe');
  const routeCanvas = q<HTMLCanvasElement>('.hero-routes');
  const slot = q<HTMLElement>('.globe-slot');
  const chips = Array.from(root.querySelectorAll<HTMLElement>('.chip'));
  const pauseButton = q<HTMLButtonElement>('.globe-pause');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?globe-t=12000` holds the trip at that moment, fully lit — for screenshots (the
  // social card is one) and for looking at a frame without waiting for it.
  const frozenParam = new URLSearchParams(location.search).get('globe-t');
  const frozen = frozenParam !== null && Number.isFinite(Number(frozenParam));
  // With it, `&globe-view=60,32` (lon,lat[,zoom]) points the camera there instead (store images).
  const viewParam = new URLSearchParams(location.search).get('globe-view')?.split(',').map(Number);
  const small = () => innerWidth < 768;

  let renderer: GlobeRenderer;
  let routes: RouteLayer;
  try {
    renderer = new GlobeRenderer(globeCanvas);
    const names: Transport[] = ['flight', 'train', 'bus', 'ferry', 'car'];
    const imgs = await Promise.all(names.map((n) => loadImage(`/transport/${n}.webp`)));
    routes = new RouteLayer(routeCanvas, Object.fromEntries(names.map((n, i) => [n, imgs[i]])) as Record<Transport, HTMLImageElement>);
    // The light texture first, so the planet is turning within moments of the page
    // opening; on a big screen the sharp one takes its place once it has arrived.
    await renderer.load('/globe/earth-2k.webp', '/globe/ids.png');
    const big = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio, 2) > 2000;
    if (big) renderer.swapGround('/globe/earth-4k.webp').then(() => { dirty = true; schedulefr(); }, () => {});
  } catch (e) {
    console.warn('globe unavailable', e);
    root.classList.add('no-webgl');
    return;
  }

  const stops = data.stops;
  const anchors = stops.map((s) => s.lonLat);
  const legs: Leg[] = data.legs.map((transport, i) => ({
    transport,
    points: greatCircle(anchors[i], anchors[(i + 1) % stops.length], 1),
  }));
  const legAngle = legs.map((_, i) => angleBetween(anchors[i], anchors[(i + 1) % stops.length]));

  // --- layout ------------------------------------------------------------------------------
  let W = 0, H = 0, cx = 0, cy = 0, R0 = 1, dpr = 1;
  /** Where on screen the trip happens, CSS px from the disc's centre: on a phone the
   *  upper part of the disc, the part above the fold. */
  let focus = { x: 0, y: 0 };
  /** Close enough in that a crossing spans a good stretch of screen, never so close the
   *  planet stops reading as round. */
  const zoomFor = (k: number) => {
    const target = Math.min(R0 * 0.8, small() ? 150 : 220);
    return clamp(target / (legAngle[k] * RAD * R0), 1, 1.8);
  };
  /** The view centre that puts `p` at the focus, at zoom `z`. */
  const cameraFor = (p: [number, number], z: number): [number, number] => {
    const r = R0 * z;
    const fx = clamp(focus.x / r, -0.8, 0.8), fy = clamp(focus.y / r, -0.8, 0.8);
    const lat0 = p[1] - Math.asin(-fy) / RAD;
    const lon0 = p[0] - Math.asin(clamp(fx / Math.max(0.2, Math.cos(p[1] * RAD)), -1, 1)) / RAD;
    return [lon0, clamp(lat0, -40, 55)];
  };

  // --- schedule (depends on the layout: durations follow the route's length on screen) ---
  let arrivals: number[] = [];
  let travelStart: number[] = [];
  let travelEnd: number[] = [];
  let finaleStart = 0, resetStart = 0, cycle = 1;
  const schedule = () => {
    arrivals = [FIRST];
    travelStart = [];
    travelEnd = [];
    let t = FIRST + HOLD + OVERTURE;
    legs.forEach((_, k) => {
      const px = legAngle[k] * RAD * R0 * zoomFor(k);
      const dur = clamp((px / SPEED) * 1000, 1900, 4200);
      travelStart.push(t);
      travelEnd.push(t + dur);
      t += dur;
      if (k < legs.length - 1) {
        arrivals.push(t);
        t += HOLD;
      }
    });
    finaleStart = t;
    resetStart = t + FINALE;
    cycle = resetStart + RESET;
  };

  const layout = () => {
    const box = root.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    W = box.width;
    H = box.height;
    cx = s.left - box.left + s.width / 2;
    cy = s.top - box.top + s.height / 2;
    R0 = (s.width / 2) * 0.94;
    focus = small() ? { x: 0.1 * R0, y: -0.46 * R0 } : { x: 0, y: -0.08 * R0 };
    // A frozen frame is a picture to keep: as sharp as the screen asks, however dense.
    dpr = frozen ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, small() ? 1.5 : 2);
    renderer.resize(W, H, dpr);
    routes.resize(W, H, dpr);
    drawStars(starsCanvas, Math.min(devicePixelRatio || 1, 2));
    schedule();
    dirty = true;
  };

  // --- state -------------------------------------------------------------------------------
  let t = 0;
  let dawnStart = -1;
  let playing = !reduceMotion;
  let visible = true;
  let dirty = true;
  let raf = 0;
  let last = 0;
  const cam = { lon: anchors[0][0] + OPENING_SPIN, lat: anchors[0][1] - 12, zoom: 1 };
  /** Where the spin to the first stop starts from: the far side on the first run, where
   *  the finale left the planet on every run after. */
  let introFrom = OPENING_SPIN;
  let holding = false;       // a pointer is on the globe
  let resumeAt = 0;          // the clock waits for this after the reader lets go
  const spin = { lon: 0, lat: 0 };
  let chipState = '';

  /** The place `p` of the way along leg k (0..1). */
  const along = (k: number, p: number): [number, number] => {
    const pts = legs[k].points;
    const n = pts.length / 2;
    const f = clamp(p, 0, 1) * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const u = f - i;
    const lon1 = nearestTurn(pts[i * 2], pts[i * 2 + 2]);
    return [pts[i * 2] + (lon1 - pts[i * 2]) * u, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * u];
  };

  /** Everything the clock decides, at time `t`. */
  const scene = (t: number) => {
    const progress = legs.map((_, k) => sine((t - travelStart[k]) / (travelEnd[k] - travelStart[k])));
    let vehicle: number | null = null;
    for (let k = 0; k < legs.length; k++) if (t >= travelStart[k] && t < travelEnd[k]) vehicle = k;
    const reached = arrivals.filter((a) => t >= a).length;
    const back = t >= travelEnd[legs.length - 1];

    let target: [number, number];
    let zoom: number;
    if (t < FIRST) {
      // Opening: the planet turns in from the far side to the first stop.
      const u = 1 - sine(t / FIRST);
      target = [anchors[0][0] + introFrom * u, anchors[0][1] - 12 * u];
      zoom = 1;
    } else if (t >= finaleStart) {
      target = [anchors[0][0] + FINALE_SPIN * sine((t - finaleStart) / (FINALE + RESET)), 22];
      zoom = 1;
    } else if (vehicle !== null) {
      target = along(vehicle, progress[vehicle]);
      zoom = zoomFor(vehicle);
    } else {
      const at = Math.max(0, reached - 1);
      target = anchors[at];
      zoom = at === 0 && t < arrivals[0] + OVERTURE ? 1 : zoomFor(Math.min(at, legs.length - 1));
    }
    const fade = t >= resetStart ? 1 - smoothstep(0, RESET, t - resetStart) : 1;
    return { progress, vehicle, reached, back, target, zoom, fade };
  };

  // --- DOM for the chips ------------------------------------------------------------------
  const updateDom = (s: ReturnType<typeof scene>, v: View) => {
    // The stop just reached opens its chip; the moment the next crossing sets off it
    // folds back to its flag, so the chip never sits on the vehicle leaving from under it.
    const latest = s.back ? 0 : s.vehicle !== null ? -1 : s.reached - 1;
    const on = s.fade > 0.5 ? s.reached : 0;
    const state = `${on}:${latest}`;
    if (state !== chipState) {
      chips.forEach((chip, i) => {
        chip.classList.toggle('is-on', i < on);
        chip.classList.toggle('is-current', i < on && i === latest);
      });
      chipState = state;
    }
    chips.forEach((chip, i) => {
      const [x, y, c] = project(anchors[i][0], anchors[i][1], v.lon0, v.lat0);
      const vis = smoothstep(0.05, 0.25, c);
      chip.style.transform = `translate3d(${(v.cx + x * v.r).toFixed(1)}px,${(v.cy + y * v.r).toFixed(1)}px,0)`;
      chip.style.setProperty('--vis', vis.toFixed(3));
      chip.style.zIndex = String(i === latest ? 50 : Math.round(c * 40));
    });
  };

  const draw = (dt: number) => {
    const s = scene(t);
    const dawn = dawnStart < 0 ? 0 : reduceMotion || frozen ? 1 : clamp((performance.now() - dawnStart) / DAWN, 0, 1);

    if (!holding && performance.now() > resumeAt) {
      // Ease after the target; the longitude the short way round.
      const k = 1 - Math.exp(-dt / 420);
      const kz = 1 - Math.exp(-dt / 700);
      cam.zoom += (s.zoom - cam.zoom) * kz;
      const [lon, lat] = cameraFor(s.target, cam.zoom);
      cam.lon += (nearestTurn(cam.lon, lon) - cam.lon) * k;
      cam.lat += (lat - cam.lat) * k;
    } else if (!holding) {
      // Let go: the fling runs out.
      cam.lon += spin.lon * dt;
      cam.lat = clamp(cam.lat + spin.lat * dt, -60, 70);
      spin.lon *= Math.exp(-dt / 350);
      spin.lat *= Math.exp(-dt / 350);
    }
    cam.lon = ((cam.lon + 540) % 360) - 180;

    const v: View = { cx, cy, r: R0 * cam.zoom, lon0: cam.lon, lat0: cam.lat, dawn: dawn * dawn * (3 - 2 * dawn) };
    stops.forEach((_, i) => {
      const since = t - arrivals[i];
      const amount = since >= 0 ? smoothstep(0, 500, since) * s.fade : 0;
      const fresh = since >= 0 ? 1 - smoothstep(600, 2600, since) : 0;
      renderer.setFill(i, amount, fresh);
    });
    renderer.render(v);
    routes.draw(v, legs, s.progress, s.vehicle, s.reached, anchors, s.fade * v.dawn);
    updateDom(s, v);
    root.classList.toggle('is-lit', v.dawn > 0.02);
  };

  // --- the loop --------------------------------------------------------------------------
  let slowFrames = 0;
  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    if (playing && !holding && now > resumeAt) {
      t += dt;
      if (t >= cycle) {
        t -= cycle;
        introFrom = FINALE_SPIN;
      }
    }
    draw(dt);
    dirty = false;
    // A GPU that can't keep up draws fewer pixels rather than fewer frames.
    if (dt > 26 && renderer.scale > 0.55) {
      if (++slowFrames > 40) {
        renderer.scale -= 0.15;
        renderer.resize(W, H, dpr);
        slowFrames = 0;
      }
    } else slowFrames = Math.max(0, slowFrames - 1);
    schedulefr();
  };
  const moving = () => playing || holding || now() < resumeAt + 1500 || dirty || (dawnStart >= 0 && now() - dawnStart < DAWN + 50);
  const now = () => performance.now();
  const schedulefr = () => {
    if (!raf && visible && moving()) raf = requestAnimationFrame(frame);
    if (!raf) last = 0;
  };

  // --- interaction -------------------------------------------------------------------------
  let lastX = 0, lastY = 0, lastT = 0;
  root.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, .hero-copy')) return;
    const box = root.getBoundingClientRect();
    const dx = e.clientX - box.left - cx, dy = e.clientY - box.top - cy;
    if (Math.hypot(dx, dy) > R0 * cam.zoom * 1.05) return;
    holding = true;
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    spin.lon = spin.lat = 0;
    root.setPointerCapture(e.pointerId);
    root.classList.add('is-dragging');
    schedulefr();
  });
  root.addEventListener('pointermove', (e) => {
    if (!holding) return;
    const r = R0 * cam.zoom;
    const dLon = -((e.clientX - lastX) / r) / RAD;
    const dLat = ((e.clientY - lastY) / r) / RAD;
    const dt = Math.max(1, e.timeStamp - lastT);
    cam.lon += dLon;
    cam.lat = clamp(cam.lat + dLat, -60, 70);
    spin.lon = spin.lon * 0.5 + (dLon / dt) * 0.5;
    spin.lat = spin.lat * 0.5 + (dLat / dt) * 0.5;
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    dirty = true;
  });
  const release = () => {
    if (!holding) return;
    holding = false;
    resumeAt = now() + 2500;
    root.classList.remove('is-dragging');
    schedulefr();
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  const setPlaying = (on: boolean) => {
    playing = on;
    pauseButton.setAttribute('aria-pressed', String(!on));
    pauseButton.setAttribute('aria-label', on ? pauseButton.dataset.pause! : pauseButton.dataset.play!);
    pauseButton.classList.toggle('is-paused', !on);
    // The country strip under "What is Nomad Budget?" stops with the globe.
    document.documentElement.classList.toggle('motion-paused', !on);
    dirty = true;
    schedulefr();
  };
  pauseButton.addEventListener('click', () => setPlaying(!playing));

  // Only while a good part of the hero is on screen: once the reader has scrolled it
  // mostly away, what is left of it sits under the next section's card, and drawing the
  // planet there would only cost the scroll its frames.
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2);
    schedulefr();
  }, { threshold: [0, 0.2] }).observe(root);

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { layout(); if (frozen) still(); schedulefr(); }, 60);
  }).observe(root);

  /** The frame at the frozen moment, camera already where the clock wants it. */
  const still = () => {
    const sc = scene(t);
    cam.zoom = sc.zoom;
    [cam.lon, cam.lat] = cameraFor(sc.target, cam.zoom);
    resumeAt = 0;
    spin.lon = spin.lat = 0;
    if (viewParam && viewParam.length >= 2 && viewParam.every(Number.isFinite)) {
      [cam.lon, cam.lat] = viewParam;
      if (viewParam[2]) cam.zoom = viewParam[2];
      resumeAt = Infinity; // and keeps it there, as if the reader had turned it
    }
    draw(16);
  };

  // --- go ----------------------------------------------------------------------------------
  layout();
  if (frozen) {
    t = clamp(Number(frozenParam), 0, cycle - 1);
    playing = false;
    pauseButton.hidden = true;
    // The timings, for picking a moment to freeze.
    const ms = (xs: number[]) => xs.map(Math.round);
    root.dataset.schedule = JSON.stringify({ arrivals: ms(arrivals), travelStart: ms(travelStart), travelEnd: ms(travelEnd), finale: Math.round(finaleStart), cycle: Math.round(cycle) });
    dawnStart = now();
    root.classList.add('is-ready');
    still();
    return;
  }
  if (reduceMotion) {
    // One still frame: the whole trip, every country filled.
    t = finaleStart;
    [cam.lon, cam.lat] = cameraFor(scene(t).target, 1);
    pauseButton.hidden = true;
  }
  dawnStart = now();
  root.classList.add('is-ready');
  // The first frame now, not on the next animation frame: the planet is there from the
  // start and turning from the next.
  draw(16);
  schedulefr();
}
