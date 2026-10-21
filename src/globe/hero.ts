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

// The globe changes its looks on the way: at a few stops one of the app's Pro themes
// spreads over the planet from the country just reached (themes.ts `CUES`), and the trip
// ends back on the realistic planet. A theme turns only at a stop, never while a vehicle
// is on its way; one whose pictures have not arrived by then is skipped until its next
// turn, so the trip never waits on a download. The picker under the globe holds one
// theme for as long as the reader wants it (again to let go).

import { GlobeRenderer, loadImage, type SymbolBatch, type View } from './renderer';
import { RouteLayer, type Leg, type Transport } from './routes';
import { drawStars } from './stars';
import { RAD, angleBetween, clamp, greatCircle, nearestTurn, project, smoothstep } from './geo';
import { CUES, THEMES, WAVE_MS, isThemeId, mixInk, themeFiles, type ThemeId } from './themes';
import { planSymbols, symbolBatch, type SymbolSet } from './symbols';

type Stop = { code: string; name: string; lonLat: [number, number]; amount: string };
type Journey = { stops: Stop[]; legs: Transport[] };

const FIRST = 2200;    // the planet spins in and the first stop lands this long after the page opens
const OVERTURE = 500;  // the whole planet on show at the first stop, before the camera dives in
const HOLD = 1500;     // a stop's moment before the next crossing
const FINALE = 4200;   // the whole trip on show, the planet turning slowly
const RESET = 1100;    // the trip fading away before it starts again
const DAWN = 1000;
/** A stop's spends burst out of its chip this long after the arrival (the chip opening first)… */
const BURST_AFTER = 200;
/** …and a theme's wave this long after the arrival: none, it spreads as the vehicle lands (asked 2026-10-16). */
const WAVE_AFTER = 0;
/** How far over the country's point the open chip's middle is, px (global.css `.chip-body`). */
const CHIP_MIDDLE = 33;
/** A phone's places for the spends, px from the chip's middle: two rows of three under it. */
const PHONE_SLOTS: [number, number][] = [[-108, 46], [0, 50], [108, 46], [-108, 94], [0, 98], [108, 94]];
const SPEED = 170;     // CSS px/s along the route on screen
/** How far round the planet turns to the first stop when the page opens, degrees. */
const OPENING_SPIN = 130;
/** How far it turns on through the finale — and back again as the trip restarts. */
const FINALE_SPIN = 60;

const sine = (x: number) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;

type Vec3 = [number, number, number];
const toVec = (lon: number, lat: number): Vec3 => {
  const φ = lat * RAD, λ = lon * RAD;
  return [Math.cos(φ) * Math.sin(λ), Math.sin(φ), Math.cos(φ) * Math.cos(λ)];
};


export async function startHero(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const data = JSON.parse(q<HTMLScriptElement>('#journey-data').textContent ?? '{}') as Journey;
  const starsCanvas = q<HTMLCanvasElement>('.hero-stars');
  const globeCanvas = q<HTMLCanvasElement>('.hero-globe');
  const routeCanvas = q<HTMLCanvasElement>('.hero-routes');
  const slot = q<HTMLElement>('.globe-slot');
  const chips = Array.from(root.querySelectorAll<HTMLElement>('.chip'));
  const pauseButton = q<HTMLButtonElement>('.globe-pause');
  const picker = q<HTMLElement>('.globe-themes');
  const pickButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.theme-pick'));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?globe-t=12000` holds the trip at that moment, fully lit — for screenshots (the
  // social card is one) and for looking at a frame without waiting for it.
  const frozenParam = new URLSearchParams(location.search).get('globe-t');
  const frozen = frozenParam !== null && Number.isFinite(Number(frozenParam));
  // With it, `&globe-view=60,32` (lon,lat[,zoom]) points the camera there instead (store images).
  const viewParam = new URLSearchParams(location.search).get('globe-view')?.split(',').map(Number);
  // With it, `&globe-theme=pirireis` draws the frame in that theme. A frozen frame is
  // otherwise always the realistic planet: store images and the social card stay as they were.
  const themeParam = new URLSearchParams(location.search).get('globe-theme');
  const small = () => innerWidth < 768;
  const big = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio, 2) > 2000;

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
  /** The theme from each moment on; `from` the stop it spreads from (else the view's centre). */
  let cues: { at: number; id: ThemeId; from: number | null }[] = [];
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
    cues = [{ at: 0, id: 'realistic', from: null }];
    for (const [code, id] of CUES) {
      const i = stops.findIndex((s) => s.code === code);
      if (i > 0) cues.push({ at: arrivals[i] + WAVE_AFTER, id, from: i });
    }
    cues.push({ at: resetStart, id: 'realistic', from: null });
    cues.sort((a, b) => a.at - b.at);
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
    plans.clear();
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

  // --- themes ------------------------------------------------------------------------------
  /** The themes whose ground and atlas are on the GPU, with their symbols. */
  const sets = new Map<ThemeId, SymbolSet>();
  const loading = new Map<ThemeId, Promise<void>>();
  /** Each theme's symbol plan for this layout, and the random order behind it (once a page). */
  const plans = new Map<ThemeId, number[]>();
  const draws = new Map<ThemeId, number[]>();
  const buffers = new Map<ThemeId, { data: Float32Array }>();
  const favoured = new Set(stops.map((s) => s.code));
  const ready = (id: ThemeId) => id === 'realistic' || sets.has(id);
  /** The theme on the globe and, while its wave spreads, the one before it. */
  const look = { id: 'realistic' as ThemeId, prev: null as ThemeId | null, origin: [0, 0, 1] as Vec3, start: 0 };
  /** The reader's pick, held until they let it go — never kept: every visit starts on the trip's own turns. */
  let pinned: ThemeId | null = frozen && isThemeId(themeParam) ? themeParam : null;

  /**
   * A theme's pictures are decoded off the page's thread (`createImageBitmap`) and handed
   * to the GPU a step a frame, only in a quiet one — at a stop, with no wave crossing the
   * planet (`pumpUploads`). Decoded on the upload, as plain images were, each stalled the
   * turning planet for ~100 ms (seen 2026-10-16).
   */
  const uploads: (() => void)[] = [];
  const decode = async (url: string, premultiply: boolean): Promise<TexImageSource> => {
    if (typeof createImageBitmap !== 'function') return loadImage(url);
    const blob = await (await fetch(url)).blob();
    return createImageBitmap(blob, { premultiplyAlpha: premultiply ? 'premultiply' : 'none', colorSpaceConversion: 'none' });
  };
  const pumpUploads = (travelling: boolean) => {
    if (uploads.length && !look.prev && (!travelling || !playing)) uploads.shift()!();
  };

  const loadTheme = (id: ThemeId): Promise<void> => {
    if (ready(id)) return Promise.resolve();
    let p = loading.get(id);
    if (!p) {
      const f = themeFiles(id, big);
      p = Promise.all([decode(f.ground, false), decode(f.atlas, true), fetch(f.symbols).then((r) => r.json() as Promise<SymbolSet>)])
        .then(([ground, atlas, set]) => new Promise<void>((done) => {
          const steps = [
            () => renderer.addGround(id, ground),
            () => {
              renderer.addAtlas(id, atlas);
              sets.set(id, set);
              draws.set(id, set.list.map(() => Math.random()));
              dirty = true;
              done();
            },
          ];
          if (frozen || reduceMotion) {
            steps.forEach((s) => s());
            if (frozen) still(); else schedulefr();
          } else {
            uploads.push(...steps);
            schedulefr();
          }
        }))
        .catch((e) => console.warn('globe theme unavailable', id, e))
        .finally(() => {
          loading.delete(id);
          updatePicker();
        });
      loading.set(id, p);
      updatePicker();
    }
    return p;
  };

  /** The theme the globe should wear now. */
  const wanted = (): ThemeId => {
    if (pinned) return ready(pinned) ? pinned : look.id;
    if (frozen) return 'realistic';
    let cue = cues[0];
    for (const c of cues) if (c.at <= t) cue = c;
    if (cue.id === look.id || !ready(cue.id)) return look.id;
    // Only at its stop: a theme that comes late waits for its next turn.
    return reduceMotion || t - cue.at < HOLD - WAVE_AFTER ? cue.id : look.id;
  };

  const switchTo = (id: ThemeId) => {
    let cue = cues[0];
    for (const c of cues) if (c.at <= t) cue = c;
    const from = !pinned && cue.id === id && cue.from !== null ? anchors[cue.from] : [cam.lon, cam.lat] as [number, number];
    look.prev = frozen || reduceMotion ? null : look.id;
    look.id = id;
    look.origin = toVec(from[0], from[1]);
    look.start = now();
    root.dataset.theme = id;
    updatePicker();
  };

  /** This frame's look: the ground and its wave, the route's ink, the symbols. */
  const dress = (v: View): SymbolBatch[] => {
    const want = wanted();
    if (want !== look.id) switchTo(want);
    const p = look.prev ? clamp((now() - look.start) / WAVE_MS, 0, 1) : 1;
    if (p >= 1) look.prev = null;
    // Fast from the stop, easing out over the far side: a slow start left a soft blot there.
    const wave = (1 - (1 - p) * (1 - p)) * (Math.PI + 0.3);
    const cur = THEMES[look.id], prev = look.prev ? THEMES[look.prev] : null;
    // The air turns with the whole planet rather than with the wave: it is all round the disc.
    const k = sine(p);
    const rim = prev ? cur.rim.map((c, i) => prev.rim[i] + (c - prev.rim[i]) * k) as [number, number, number] : cur.rim;
    renderer.setLook({ ground: cur.id, grade: cur.grade, rim, prev: prev ? { ground: prev.id, grade: prev.grade, origin: look.origin, wave } : undefined });
    routes.ink = prev ? mixInk(prev.ink, cur.ink, sine(p)) : cur.ink;

    const [ox, oy, oz] = look.origin;
    const reached = (la: number, lo: number) => {
      if (!prev) return 1;
      const c = Math.cos(la);
      const d = Math.acos(clamp(c * Math.sin(lo) * ox + Math.sin(la) * oy + c * Math.cos(lo) * oz, -1, 1));
      return 1 - smoothstep(wave - 0.015, wave, d);
    };
    const batches: SymbolBatch[] = [];
    const add = (id: ThemeId, mask: (la: number, lo: number) => number) => {
      const set = sets.get(id);
      if (!set) return;
      let plan = plans.get(id);
      if (!plan) plans.set(id, (plan = planSymbols(set.list, R0, favoured, draws.get(id)!)));
      let buf = buffers.get(id);
      if (!buf) buffers.set(id, (buf = { data: new Float32Array(0) }));
      batches.push(symbolBatch(id, set, plan, v, R0, THEMES[id].grade, v.dawn, mask, buf));
    };
    if (prev) add(prev.id, (la, lo) => 1 - reached(la, lo));
    add(cur.id, reached);
    return batches;
  };

  const updatePicker = () => {
    pickButtons.forEach((b) => {
      const id = b.dataset.theme as ThemeId;
      b.classList.toggle('is-current', id === look.id);
      b.classList.toggle('is-loading', loading.has(id) && pinned === id);
      b.setAttribute('aria-pressed', String(pinned === id));
    });
  };

  pickButtons.forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.theme as ThemeId;
    pinned = pinned === id ? null : id;
    if (pinned) void loadTheme(pinned);
    updatePicker();
    dirty = true;
    schedulefr();
  }));

  // --- DOM for the chips ------------------------------------------------------------------
  /** Which stops' spends have burst this time round the trip. */
  const burst = stops.map(() => false);
  const bursts = () => {
    if (frozen || reduceMotion) return;
    stops.forEach((_, i) => {
      const since = t - arrivals[i] - BURST_AFTER;
      if (burst[i] || since < 0 || since > 1500) return;
      burst[i] = true;
      const chip = chips[i];
      scatter(chip);
      chip.classList.remove('is-burst');
      void chip.offsetWidth; // the animation again from its start
      chip.classList.add('is-burst');
    });
  };
  /**
   * Which spends burst and where each lands, new every time: a random three to six of the
   * stop's six, spread evenly round an ellipse wide enough to clear the open chip, from a
   * random turn, with a little jitter — the same fan at every stop read as one stamp.
   * Every other one on a wider ring, so five or six never touch. On a phone, a random few
   * of six places in two rows under the chip instead: the trip runs just under the CTA
   * there (a spend flying up went under it), and six on the lower half of a ring that
   * narrow piled up.
   */
  const scatter = (chip: HTMLElement) => {
    const all = Array.from(chip.querySelectorAll<HTMLElement>('.spend'));
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const shuffled = all.slice().sort(() => Math.random() - 0.5);
    const n = Math.min(all.length, 3 + Math.floor(Math.random() * 4));
    const pills = shuffled.slice(0, n);
    all.forEach((p) => { p.style.display = pills.includes(p) ? '' : 'none'; });
    if (!n) return;
    const phone = small();
    const slots = PHONE_SLOTS.slice().sort(() => Math.random() - 0.5);
    const from = rnd(0, 360), step = 360 / n;
    pills.forEach((pill, k) => {
      let dx: number, dy: number;
      if (phone) {
        [dx, dy] = slots[k];
        dx += rnd(-8, 8);
        dy += rnd(-5, 5);
      } else {
        const a = (from + k * step + rnd(-8, 8)) * RAD;
        const outer = k % 2 === 1 && n > 3 ? 1.28 : 1;
        // Just clear of the open chip (~170 × 44 px) and no further: they belong to it.
        dx = Math.cos(a) * rnd(108, 122) * outer;
        dy = Math.sin(a) * rnd(46, 56) * outer;
      }
      // Placed about the chip's middle, flown from the country's point under it.
      pill.style.setProperty('--dx', `${dx.toFixed(0)}px`);
      pill.style.setProperty('--dy', `${(dy - CHIP_MIDDLE).toFixed(0)}px`);
    });
  };
  const resetBursts = () => {
    burst.fill(false);
    chips.forEach((c) => c.classList.remove('is-burst'));
  };

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
    pumpUploads(s.vehicle !== null);
    renderer.render(v, dress(v));
    routes.draw(v, legs, s.progress, s.vehicle, s.reached, anchors, s.fade * v.dawn);
    updateDom(s, v);
    bursts();
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
        resetBursts();
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
  const moving = () => playing || holding || now() < resumeAt + 1500 || dirty || look.prev !== null || uploads.length > 0 || (dawnStart >= 0 && now() - dawnStart < DAWN + 50);
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
  root.dataset.theme = look.id;
  updatePicker();
  if (pinned) void loadTheme(pinned);
  // The themes the trip turns to, one after the other once the planet is up — never
  // ahead of the page's own first pictures, and not at all on a connection asking to save data.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  if (!frozen && !saveData) {
    const queue = [...new Set(CUES.map(([, id]) => id))];
    setTimeout(() => queue.reduce((p, id) => p.then(() => loadTheme(id)), Promise.resolve()), 1200);
  }
  if (frozen) {
    t = clamp(Number(frozenParam), 0, cycle - 1);
    playing = false;
    pauseButton.hidden = true;
    if (picker) picker.hidden = true;
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
