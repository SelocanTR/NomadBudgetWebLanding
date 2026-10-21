// The Google Play feature graphic (1024 × 500): the store's first screenshot as one still —
// the headline, the globe with Spain, Turkey and Thailand open on it and the route between
// them, the 3D phone with the dashboard, the audience pills. Captured at 2× and scaled down
// by `node video/render.mjs --page feature`.

import { GlobeRenderer, loadImage, type View } from '../src/globe/renderer';
import { RouteLayer, type Leg, type Transport } from '../src/globe/routes';
import { drawStars } from '../src/globe/stars';
import { greatCircle, project, smoothstep } from '../src/globe/geo';
import { fitScreen } from './phone';

export const W = 1024, H = 500;

// --- the layout, stage px ------------------------------------------------------------------
// Google keeps the focal point near the middle and lets the edges go: the headline sits in
// from the left, the globe and its chips around the middle, the phone towards the right.
const HEAD = { x: 60, y: 72, w: 380, size: 40 };
/** The pills in a column under the headline, clear of the chips on the globe. */
const PILLS = { x: 60, y: 284 };
const GLOBE = { cx: 640, cy: 560, r: 330 };
const PHONE = { size: 600, x: 520, y: -50 };
/** The view: tipped south enough that Thailand is up in the picture with Spain and Turkey. */
const VIEW = { lon: 41, lat: -10 };

type ChipData = { code: string; name: string; amount: string; lonLat: [number, number]; open: boolean; lift?: number };
type Data = { chips: ChipData[]; route: { from: string; to: string; transport: Transport }[]; journeyCodes: string[] };

export async function startFeature(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const qa = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const data = JSON.parse(document.getElementById('feature-data')!.textContent!) as Data;
  const dpr = devicePixelRatio || 1;

  const renderer = new GlobeRenderer(q('.v-globe'), true);
  const names: Transport[] = ['flight', 'train', 'bus', 'ferry', 'car'];
  const sprites = await Promise.all(names.map((n) => loadImage(`/transport/${n}.webp`)));
  const routes = new RouteLayer(q('.v-routes'), Object.fromEntries(names.map((n, i) => [n, sprites[i]])) as Record<Transport, HTMLImageElement>);
  const images = qa<HTMLImageElement>('img');
  await Promise.all([
    renderer.load('/globe/earth-4k.webp', '/globe/ids.png'),
    document.fonts.ready,
    ...images.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))),
  ]);
  renderer.resize(W, H, dpr);
  routes.resize(W, H, dpr);
  drawStars(q('.v-stars'), dpr);

  // Layout.
  const head = q<HTMLElement>('.head');
  Object.assign(head.style, { left: `${HEAD.x}px`, top: `${HEAD.y}px`, width: `${HEAD.w}px`, fontSize: `${HEAD.size}px` });
  Object.assign(q<HTMLElement>('.v-pills').style, { left: `${PILLS.x}px`, top: `${PILLS.y}px` });
  q<HTMLImageElement>('.phone-body').style.width = q<HTMLImageElement>('.phone-body').style.height = `${PHONE.size}px`;
  q<HTMLElement>('.v-phone').style.transform = `translate(${PHONE.x}px,${PHONE.y}px)`;
  fitScreen(q('.phone-screen'), PHONE.size);

  // The globe: the route's countries filled, the route drawn, a badge on each crossing.
  const v: View = { cx: GLOBE.cx, cy: GLOBE.cy, r: GLOBE.r, lon0: VIEW.lon, lat0: VIEW.lat, dawn: 1 };
  const where = (code: string) => data.chips.find((c) => c.code === code)!.lonLat;
  data.chips.forEach((c) => {
    const j = data.journeyCodes.indexOf(c.code);
    if (j >= 0) renderer.setFill(j, 1, 0);
  });
  renderer.render(v);
  const legs: Leg[] = data.route.map((l) => ({ transport: l.transport, points: greatCircle(where(l.from), where(l.to), 1) }));
  const stops = data.chips.map((c) => c.lonLat);
  routes.draw(v, legs, legs.map(() => 1), null, stops.length, stops, 1);

  // Chips: open, or folded to the flag; one on a stem where two would meet.
  qa<HTMLElement>('.chip').forEach((el, i) => {
    const c = data.chips[i];
    const [px, py, cz] = project(c.lonLat[0], c.lonLat[1], v.lon0, v.lat0);
    const body = el.querySelector<HTMLElement>('.chip-body')!;
    const text = el.querySelector<HTMLElement>('.chip-text')!;
    const lift = c.lift ?? 0;
    el.style.transform = `translate(${(v.cx + px * v.r).toFixed(1)}px,${(v.cy + py * v.r).toFixed(1)}px)`;
    el.style.zIndex = String(c.open ? 60 + i : Math.round(cz * 40));
    body.style.opacity = smoothstep(0.05, 0.25, cz).toFixed(3);
    body.style.bottom = `${11 + lift}px`;
    body.style.transform = `translateX(-50%) scale(${c.open ? 1 : 0.8})`;
    body.style.gap = c.open ? '9px' : '0';
    text.style.maxWidth = c.open ? '320px' : '0';
    text.style.opacity = c.open ? '1' : '0';
    text.style.paddingInlineEnd = c.open ? '12px' : '0';
    if (lift) {
      const stem = document.createElement('span');
      stem.className = 'chip-stem';
      stem.style.height = `${lift + 6}px`;
      el.prepend(stem);
    }
  });

  root.dataset.ready = '1';
  (window as unknown as { __video: object }).__video = { fps: 1, frames: 1, duration: 1, seek: () => {} };
}
