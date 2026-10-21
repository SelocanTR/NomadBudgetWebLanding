// What the App Store search video needs beyond the site's own assets, baked once.
//
//   node video/build-search.mjs [path/to/phone-3d.png]     (APP defaults to ../NomadBudget)
//
//   video/assets/search/phone-3d.webp   the store's 3D phone (a 3060 × 3060 render), lossless
//   video/assets/search/<shot>.webp     the app's captures at their own 1170 px, not the
//                                       site's 720: the phone is drawn larger than that
//   video/assets/search/flags.json      the flags of the countries the video names

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const OUT = path.resolve('video/assets/search');
fs.mkdirSync(OUT, { recursive: true });

const phone = process.argv[2];
if (phone) await sharp(phone).webp({ lossless: true }).toFile(path.join(OUT, 'phone-3d.webp'));
else if (!fs.existsSync(path.join(OUT, 'phone-3d.webp'))) throw new Error('give the 3D phone render the first time');

// The same captures the site uses (scripts/build-assets.mjs), at full size.
const SHOTS = { pace: 'IMG_0169.PNG', japan: 'IMG_0199.PNG', total: 'IMG_0200.PNG' };
for (const [name, file] of Object.entries(SHOTS)) {
  await sharp(path.join(APP, 'Store/Screenshots', file)).webp({ quality: 90 }).toFile(path.join(OUT, `${name}.webp`));
}

const CODES = ['ES', 'TR', 'GE', 'TH', 'MY', 'FR', 'JP', 'KZ'];
const all = JSON.parse(fs.readFileSync(path.join(APP, 'src/data/flags.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'flags.json'), JSON.stringify(Object.fromEntries(CODES.map((c) => [c, all[c]]))) + '\n');
console.log(fs.readdirSync(OUT).join('  '));
