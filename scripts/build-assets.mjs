// Pulls what the site needs out of the app's repo and bakes it for the web.
//
//   node scripts/build-assets.mjs            (APP defaults to ../NomadBudget)
//
// Everything written here is committed: the site builds without the app's repo next to
// it (GitHub Actions only has this one). Re-run it when the app's globe, sprites, flags
// or store screenshots change.
//
//   public/globe/earth-4k.webp, earth-2k.webp  the app's Blue Marble ground, as is / halved
//   public/globe/ids.png                        the journey's countries, one grey level each
//   public/transport/*.webp                     the app's top-down vehicle sprites
//   public/shots/*.webp                         raw app screenshots (Store/Screenshots)
//   public/art/*.webp                           onboarding illustrations
//   public/avatars/*.webp                       the app's profile avatars
//   public/countries/*.webp                     the app's country covers, for the strip
//   public/icons/*                              favicon, touch icon, the coin
//   src/data/geo.json                           anchors of the journey's countries
//   src/data/flags.json                         their flags and the strip's (SVG)

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { JOURNEY_CODES } from '../src/data/journey-codes.mjs';
import { STRIP_CODES } from '../src/data/strip-codes.mjs';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const OUT = path.resolve('public');
const DATA = path.resolve('src/data');
const mk = (d) => fs.mkdirSync(d, { recursive: true });
const app = (...p) => path.join(APP, ...p);

mk(`${OUT}/globe`); mk(`${OUT}/transport`); mk(`${OUT}/shots`); mk(`${OUT}/art`); mk(`${OUT}/icons`); mk(DATA);

// --- ground -------------------------------------------------------------------------------
// The app's texture is already a graded equirectangular 4096×2048 (see build-globe.mjs).
// Power-of-two on both axes so WebGL 1 can wrap it across the date line.
await sharp(app('assets/map/globe.webp')).resize(4096, 2048).webp({ quality: 82 }).toFile(`${OUT}/globe/earth-4k.webp`);
await sharp(app('assets/map/globe.webp')).resize(2048, 1024).webp({ quality: 84 }).toFile(`${OUT}/globe/earth-2k.webp`);

// --- the journey's countries as ids -------------------------------------------------------
// One grey level per country (index × 16, 0 = none), drawn with crisp edges so no pixel is
// a blend of two ids; the shader smooths the edge itself by averaging four neighbours.
const globe = JSON.parse(fs.readFileSync(app('src/data/world-globe.json'), 'utf8'));
const [GW, GH] = globe.meta.grid;
// Only the part of a country the trip is in: France's rings in South America and the
// Indian Ocean would light up across the world when the train leaves Paris.
const KEEP_RING = {
  FR: (lon, lat) => lon > -10 && lon < 20 && lat > 38,
};
const ringStart = (ring) => {
  const [x, y] = ring.slice(1).split(/[L,]/).map(Number);
  return [x / (GW / 360) - 180, 90 - y / (GH / 180)];
};
const paths = JOURNEY_CODES.map((code, i) => {
  let d = globe.countries[code]?.d;
  if (!d) throw new Error(`no outline for ${code}`);
  const keep = KEEP_RING[code];
  if (keep) d = d.split('Z').filter(Boolean).filter((ring) => keep(...ringStart(ring))).map((r) => r + 'Z').join('');
  const v = (i + 1) * 16;
  return `<path d="${d}" fill="rgb(${v},${v},${v})" fill-rule="evenodd"/>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 ${GW} ${GH}" shape-rendering="crispEdges"><rect width="${GW}" height="${GH}" fill="#000"/>${paths}</svg>`;
await sharp(Buffer.from(svg)).greyscale().png({ compressionLevel: 9, palette: false }).toFile(`${OUT}/globe/ids.png`);

// --- anchors ------------------------------------------------------------------------------
// The app's label anchors, except where the trip means another part of the country:
// Malaysia's anchor sits on Borneo, and the bus from Thailand arrives on the peninsula;
// Indonesia's on Sumatra, a hop too short to see the ferry cross — Jakarta instead.
const ANCHOR_OVERRIDES = { MY: [102.2, 4.0], ID: [106.8, -6.2] };
const geo = {};
for (const code of JOURNEY_CODES) {
  const c = globe.countries[code];
  geo[code] = ANCHOR_OVERRIDES[code] ?? [+(c.ax / (GW / 360) - 180).toFixed(3), +(90 - c.ay / (GH / 180)).toFixed(3)];
}
fs.writeFileSync(`${DATA}/geo.json`, JSON.stringify(geo, null, 1) + '\n');

// --- flags --------------------------------------------------------------------------------
const allFlags = JSON.parse(fs.readFileSync(app('src/data/flags.json'), 'utf8'));
const flags = Object.fromEntries([...JOURNEY_CODES, ...STRIP_CODES].map((c) => [c, allFlags[c]]));
fs.writeFileSync(`${DATA}/flags.json`, JSON.stringify(flags) + '\n');

// --- country covers -----------------------------------------------------------------------
// The pictures the app heads its country sheets with (1024×768), for the strip behind "What
// is Nomad Budget?". The app keeps them in a public bucket (src/data/covers.ts); its own
// scripts/.cache holds the same files when the covers were built on this machine.
fs.mkdirSync(`${OUT}/countries`, { recursive: true });
const coverUrls = Object.fromEntries(
  [...fs.readFileSync(app('src/data/covers.ts'), 'utf8').matchAll(/"([a-z]{2})": "([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
for (const code of [...JOURNEY_CODES, ...STRIP_CODES].map((c) => c.toLowerCase())) {
  const cached = app('scripts/.cache/covers-out', `${code}.webp`);
  const input = fs.existsSync(cached) ? cached : Buffer.from(await (await fetch(coverUrls[code])).arrayBuffer());
  await sharp(input).resize(480, 360).webp({ quality: 74 }).toFile(`${OUT}/countries/${code}.webp`);
}

// --- vehicles -----------------------------------------------------------------------------
for (const t of ['flight', 'train', 'bus', 'ferry', 'car']) {
  fs.copyFileSync(app(`assets/transport/${t}.webp`), `${OUT}/transport/${t}.webp`);
}

// --- app screenshots ------------------------------------------------------------------------
// Plain iPhone captures (1170×2532), not the store's composed images: the page frames them
// itself. Scaled, never cropped, so the phone's proportions hold (720×1558).
const SHOTS = {
  total: 'IMG_0179.PNG',     // a country wallet: tenge and dollars side by side
  entry: 'IMG_0180.PNG',     // the calculator entry
  journey: 'IMG_0170.PNG',   // the route on the globe
  compare: 'IMG_0177.PNG',   // Poland against Thailand
  crossings: 'IMG_0173.PNG', // the crossings timeline
  pace: 'IMG_0169.PNG',      // the dashboard's spending pace
  budget: 'IMG_0190.PNG',    // the dashboard, dark, with the monthly budget bar
  // Payment capture (v1.0.4): no capture yet. Until one is put in Store/Screenshots and
  // named here, the app's capture artwork stands in, on the app's dark background.
  capture: null,
};
/**
 * Status-bar clutter painted out, per capture, as [left, top, width, height] in the
 * original's pixels: IMG_0190 was taken from a TestFlight build and carries "◀ TestFlight"
 * under the clock. Each row of the patch takes the colour just right of it, so the
 * page's gradient carries on underneath.
 */
const PAINT_OUT = { 'IMG_0190.PNG': [18, 80, 320, 60] };
async function paintOut(input, [left, top, width, height]) {
  const { data, info } = await sharp(input).extract({ left: left + width + 8, top, width: 16, height }).raw().toBuffer({ resolveWithObject: true });
  const patch = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const rgb = [0, 1, 2].map((c) => {
      let sum = 0;
      for (let x = 0; x < info.width; x++) sum += data[(y * info.width + x) * info.channels + c];
      return Math.round(sum / info.width);
    });
    for (let x = 0; x < width; x++) patch.set(rgb, (y * width + x) * 3);
  }
  return sharp(input).composite([{ input: patch, raw: { width, height, channels: 3 }, left, top }]).png().toBuffer();
}
for (const f of fs.readdirSync(`${OUT}/shots`)) fs.rmSync(`${OUT}/shots/${f}`);
for (const [name, file] of Object.entries(SHOTS)) {
  if (!file) {
    const art = await sharp(app('assets/capture/intro.webp')).resize(900).toBuffer();
    const canvas = await sharp({ create: { width: 1170, height: 2532, channels: 3, background: '#0E1726' } })
      .composite([{ input: art, gravity: 'centre' }]).png().toBuffer();
    await sharp(canvas).resize(720).webp({ quality: 82 }).toFile(`${OUT}/shots/${name}.webp`);
    continue;
  }
  let input = app('Store/Screenshots', file);
  if (PAINT_OUT[file]) input = await paintOut(input, PAINT_OUT[file]);
  await sharp(input).resize(720).webp({ quality: 82 }).toFile(`${OUT}/shots/${name}.webp`);
}

// --- illustrations ------------------------------------------------------------------------
for (const name of ['slide-money', 'slide-plan', 'slide-journey', 'import', 'all-set', 'pro', 'reminders']) {
  await sharp(app(`assets/onboarding/${name}.webp`)).resize(360, 360, { fit: 'inside' }).webp({ quality: 85 }).toFile(`${OUT}/art/${name}.webp`);
}

// --- avatars ------------------------------------------------------------------------------
// The app's profile avatars, for the "who it's for" cards.
fs.mkdirSync(`${OUT}/avatars`, { recursive: true });
for (const n of [1, 2, 3, 4, 6, 7, 8]) {
  await sharp(app(`assets/avatars/avatar_${n}.webp`)).resize(128, 128).webp({ quality: 82 }).toFile(`${OUT}/avatars/avatar_${n}.webp`);
}

// The same illustrations for the feature cards: transparent margins trimmed, then centred in
// one square, so each object fills its tile about as much as the next — the journey globe
// is wider than tall and came out smaller than the rest in a square box.
for (const name of ['slide-money', 'slide-plan', 'slide-journey', 'import', 'all-set', 'reminders']) {
  const trimmed = await sharp(app(`assets/onboarding/${name}.webp`)).trim({ threshold: 1 }).toBuffer();
  // Equal height, not equal box: a wide object (the globe in its orbit) gets the extra
  // width instead of shrinking to fit a square.
  await sharp(trimmed)
    .resize({ height: 168, width: 220, fit: 'inside' })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88 })
    .toFile(`${OUT}/art/tile-${name}.webp`);
}

// --- stars ----------------------------------------------------------------------------------
// The hero's sky (the app's star hash, src/globe/stars.ts) as a repeating tile for the dark
// panels that have no canvas: 600 CSS px square, drawn at 2× so a star stays a crisp dot.
{
  const CSS = 600, SCALE = 2, SIZE = CSS * SCALE;
  const px = Buffer.alloc(SIZE * SIZE * 4);
  const cells = Math.ceil(CSS * 1.2);
  const cell = SCALE / 1.2;
  for (let sy = 0; sy < cells; sy++) {
    for (let sx = 0; sx < cells; sx++) {
      const a = (sx * 37 + sy * 91 + 17) % 1024;
      const b = (a * a + sx * 5 + sy * 29 + a * sy) % 2048;
      const c = (b * b + a * 73 + b * sx + sy * 3) % 4096;
      if (c < 4080) continue;
      const alpha = Math.round(((c - 4079) / 16) * 255);
      const x0 = Math.floor(sx * cell), y0 = Math.floor(sy * cell);
      for (let y = y0; y < Math.min(SIZE, y0 + 2); y++) {
        for (let x = x0; x < Math.min(SIZE, x0 + 2); x++) {
          const o = (y * SIZE + x) * 4;
          px[o] = px[o + 1] = px[o + 2] = 255;
          px[o + 3] = Math.max(px[o + 3], alpha);
        }
      }
    }
  }
  await sharp(px, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/art/stars.png`);
}

// --- icons --------------------------------------------------------------------------------
const coin = app('assets/coin-transparent@3x.png');
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
await sharp(coin).resize(96, 96, { fit: 'contain', background: clear }).webp({ quality: 90 }).toFile(`${OUT}/icons/coin-96.webp`);
// The Total wallet's globe (TotalGlobe.tsx), for the hero's eyebrow.
await sharp(app('assets/icons/globe.webp')).resize(48, 48, { fit: 'contain', background: clear }).webp({ quality: 90 }).toFile(`${OUT}/icons/globe-48.webp`);
await sharp(coin).resize(32, 32, { fit: 'contain', background: clear }).png().toFile(`${OUT}/favicon-32.png`);
await sharp(app('assets/icon.png')).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);
await sharp(app('assets/icon.png')).resize(512, 512).png().toFile(`${OUT}/icons/icon-512.png`);

console.log('assets written');
