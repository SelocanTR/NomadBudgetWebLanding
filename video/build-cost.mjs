// The cost layer's data, baked from the app's repo for the marketing video.
//
//   node video/build-cost.mjs            (APP defaults to ../NomadBudget)
//
//   video/assets/ids-all.png   every country, one grey level each (index + 1; 0 = none)
//   video/assets/cost.json     the codes in that order, each one's overall price level
//                              (ICP 2021, rolled forward — the app's price-levels.json)
//                              and its label anchor; the reference countries' flags
//
// Which band a country falls in depends on the home country it is compared with, so that
// is left to the page: it divides two of these numbers and asks the app's thresholds.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const OUT = path.resolve('video/assets');
fs.mkdirSync(OUT, { recursive: true });

const globe = JSON.parse(fs.readFileSync(path.join(APP, 'src/data/world-globe.json'), 'utf8'));
const prices = JSON.parse(fs.readFileSync(path.join(APP, 'src/data/price-levels.json'), 'utf8'));
const [GW, GH] = globe.meta.grid;

const codes = Object.keys(globe.countries).sort();
if (codes.length > 254) throw new Error('more countries than grey levels');

// Crisp edges, as for the hero's ids: a pixel blended between two ids would be a third
// country. Twice the hero's size, since the whole planet is painted and seen up close.
const paths = codes
  .map((code, i) => `<path d="${globe.countries[code].d}" fill="rgb(${i + 1},${i + 1},${i + 1})" fill-rule="evenodd"/>`)
  .join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="2048" viewBox="0 0 ${GW} ${GH}" shape-rendering="crispEdges"><rect width="${GW}" height="${GH}" fill="#000"/>${paths}</svg>`;
const png = await sharp(Buffer.from(svg)).removeAlpha().greyscale().png({ compressionLevel: 9, palette: false }).toBuffer();
fs.writeFileSync(`${OUT}/ids-all.png`, png);

// A blend would show up as a grey level no country has.
const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
const seen = new Set(data);
const stray = [...seen].filter((v) => v > codes.length);
if (stray.length) throw new Error(`ids-all.png has levels no country owns: ${stray.slice(0, 10)}`);

const pli = {};
const anchors = {};
for (const code of codes) {
  const p = prices.countries[code]?.pli?.overall;
  if (p) pli[code] = p;
  const c = globe.countries[code];
  anchors[code] = [+(c.ax / (GW / 360) - 180).toFixed(2), +(90 - c.ay / (GH / 180)).toFixed(2)];
}
// The countries the video prices against (video/copy.ts `reference`), for their pin.
const HOMES = ['MX'];
const allFlags = JSON.parse(fs.readFileSync(path.join(APP, 'src/data/flags.json'), 'utf8'));
const flags = Object.fromEntries(HOMES.map((c) => [c, allFlags[c]]));
fs.writeFileSync(`${OUT}/cost.json`, JSON.stringify({ codes, pli, anchors, flags }) + '\n');
console.log(`${codes.length} countries, ${Object.keys(pli).length} with a price level, ${seen.size} grey levels`);
