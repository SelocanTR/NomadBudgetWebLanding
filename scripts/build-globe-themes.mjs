// The app's Pro globe themes, baked for the hero: each theme's ground at two sizes, an
// atlas of the symbols the hero can show, where they stand, and the picker's thumbnail.
//
//   node scripts/build-globe-themes.mjs      (APP defaults to ../NomadBudget)
//
// The app keeps its themes' pictures out of the repo: they are built into
// scripts/.cache/globe-themes/<theme>/dist/ (docs/GLOBE-THEMES.md there) and uploaded to a
// bucket. This reads that build, so run it on the machine that made the themes, after a
// theme's new version. Everything written is committed, as build-assets.mjs's output is.
//
//   public/globe/themes/<id>/ground-4k.webp, ground-2k.webp   the ground, as is / halved
//   public/globe/themes/<id>/symbols.webp                      tier 1 and 2 sprites, 128 px cells
//   public/globe/themes/<id>/symbols.json                      where each stands, in that atlas
//   public/globe/themes/<id>/thumb.webp                        the picker's globe
//   public/globe/themes/realistic/thumb.webp                   (the realistic ground is earth-*k)
//
// Only tiers 1 and 2: the hero never comes in past 1.8×, where tier 3 starts (3.4×). The
// cells are two thirds of the app's 192, and the atlas a power of two on both sides so
// WebGL 1 can mipmap it.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const OUT = path.resolve('public/globe/themes');
const THEMES = ['paper', 'miniature', 'pirireis'];
const CELL = 128;
const APP_CELL = 192;
const COLS = 16;
const pot = (n) => 2 ** Math.ceil(Math.log2(n));
const mk = (d) => fs.mkdirSync(d, { recursive: true });

const thumb = (src, out) => sharp(src).resize(96, 96).webp({ quality: 90, alphaQuality: 90 }).toFile(out);

mk(`${OUT}/realistic`);
await thumb(path.join(APP, 'assets/globe-themes/thumbs/realistic.webp'), `${OUT}/realistic/thumb.webp`);

for (const id of THEMES) {
  const dist = path.join(APP, 'scripts/.cache/globe-themes', id, 'dist');
  const dir = `${OUT}/${id}`;
  mk(dir);
  await sharp(path.join(dist, 'ground.webp')).resize(4096, 2048).webp({ quality: 82 }).toFile(`${dir}/ground-4k.webp`);
  await sharp(path.join(dist, 'ground.webp')).resize(2048, 1024).webp({ quality: 84 }).toFile(`${dir}/ground-2k.webp`);
  await thumb(path.join(APP, `assets/globe-themes/thumbs/${id}.webp`), `${dir}/thumb.webp`);

  const all = JSON.parse(fs.readFileSync(path.join(APP, `src/data/globe-symbols-${id}.json`), 'utf8'));
  const list = all.filter((s) => s.tier <= 2);
  const k = CELL / APP_CELL;
  const W = COLS * CELL, H = pot(Math.ceil(list.length / COLS) * CELL);
  const atlas = path.join(dist, 'symbols.webp');
  const parts = [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const w = Math.max(1, Math.round(s.w * k)), h = Math.max(1, Math.round(s.h * k));
    const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
    const sprite = await sharp(atlas).extract({ left: s.x, top: s.y, width: s.w, height: s.h }).resize(w, h).png().toBuffer();
    parts.push({ input: sprite, left: x, top: y });
    const sx = w / s.w, sy = h / s.h;
    out.push({
      id: s.id, cc: s.cc, lat: s.lat, lon: s.lon, tier: s.tier, x, y, w, h,
      ...(s.art ? { art: [s.art[0] * sx, s.art[1] * sy, s.art[2] * sx, s.art[3] * sy].map((v) => Math.round(v * 10) / 10) } : {}),
    });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(parts).webp({ quality: 76, alphaQuality: 80, effort: 6 }).toFile(`${dir}/symbols.webp`);
  fs.writeFileSync(`${dir}/symbols.json`, JSON.stringify({ size: [W, H], list: out }));
  const kb = (f) => Math.round(fs.statSync(`${dir}/${f}`).size / 1024);
  console.log(`${id}: ${list.length} symbols, ground ${kb('ground-2k.webp')} / ${kb('ground-4k.webp')} KB, atlas ${W}×${H} ${kb('symbols.webp')} KB`);
}
