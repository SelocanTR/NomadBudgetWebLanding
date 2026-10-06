// Banners for outside the site: the X (Twitter) header (1500×500) and the Google Play
// feature graphic (1024×500, EN and TR). The hero globe — route, flags and the open chip —
// on the right, the hero's own headline on the left, over the hero's starry space.
//
// The globe is shot small and dense so the route, flags and chip read large against it
// (see globe-still.mjs); a viewport under 768px would switch the page to its phone view.
//
//   LIFT=FR:30 PAD=0.2 DSF=4 BASE=http://localhost:4321 node scripts/globe-still.mjs brand/_globe.png - 560 en
//   LIFT=FR:30 PAD=0.2 DSF=4 BASE=http://localhost:4321 node scripts/globe-still.mjs brand/_globe-tr.png - 560 tr
//   node scripts/build-banners.mjs
//
// Text is set in Segoe UI, as in build-og.mjs. On X the profile picture covers the lower
// left corner, so the words sit high; on Play nothing important goes near the edges.

import sharp from 'sharp';

const WHITE = '#fff', LIME = '#52D69B';
// The hero's headline (src/i18n.ts → hero.title, lime on its second half) and its eyebrow,
// broken into lines that fit each banner.
const COPY = {
  x: {
    title: [['The expense tracker', WHITE], ['for life across borders.', LIME]],
    sub: ['For digital nomads, expats and long-term travellers'],
  },
  'play-en': {
    title: [['The expense tracker', WHITE], ['for life across', LIME], ['borders.', LIME]],
    sub: ['For digital nomads, expats', 'and long-term travellers'],
  },
  'play-tr': {
    title: [['Sınır tanımayan', WHITE], ['bir hayat için', WHITE], ['harcama takibi.', LIME]],
    sub: ['Dijital göçebeler', 've gurbetçiler için'],
  },
};
// Where the route sits in the 3136px globe still (France's chip at the top, Indonesia at
// the bottom, the plane off Brittany on the left, the last dashes past Sumatra on the right).
const ROUTE = { x0: 850, x1: 2500, y0: 690, y1: 1725 };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const line = (x, y, size, weight, fill, s) =>
  `<text x="${x}" y="${y}" font-family="Segoe UI" font-weight="${weight}" font-size="${size}"${weight >= 800 ? ` letter-spacing="${(-size / 36).toFixed(2)}"` : ''} fill="${fill}">${esc(s)}</text>`;

// How wide a line sets at 100px, so each banner can size its headline to the room it has.
async function width100(s, weight) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="160">${line(0, 120, 100, weight, '#fff', s)}</svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim().toBuffer({ resolveWithObject: true });
  return info.width;
}

// The hero's space: the app's star hash over near-black blue, as in build-og.mjs.
function space(W, H) {
  const img = Buffer.alloc(W * H * 3);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const sx = Math.floor(px * 1.2), sy = Math.floor(py * 1.2);
      const a = (sx * 37 + sy * 91 + 17) % 1024;
      const b = (a * a + sx * 5 + sy * 29 + a * sy) % 2048;
      const c = (b * b + a * 73 + b * sx + sy * 3) % 4096;
      const star = c >= 4080 ? (c - 4079) / 16 : 0;
      const i = (py * W + px) * 3;
      img[i] = Math.min(255, (0.015 + star) * 255);
      img[i + 1] = Math.min(255, (0.03 + star) * 255);
      img[i + 2] = Math.min(255, (0.07 + star) * 255);
    }
  }
  return sharp(img, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}

// The globe scaled so the route fills `box` ({x, y, h}: its left edge, top and height on
// the canvas); whatever falls outside the canvas is cut off.
async function globe(file, box, W, H) {
  const k = box.h / (ROUTE.y1 - ROUTE.y0);
  const x = Math.round(box.x - ROUTE.x0 * k), y = Math.round(box.y - ROUTE.y0 * k);
  const meta = await sharp(file).metadata();
  const size = Math.round(meta.width * k);
  const buf = await sharp(file).resize(size, size).png().toBuffer();
  const left = Math.max(0, -x), top = Math.max(0, -y);
  const width = Math.min(size - left, W - Math.max(0, x)), height = Math.min(size - top, H - Math.max(0, y));
  return { input: await sharp(buf).extract({ left, top, width, height }).png().toBuffer(), left: Math.max(0, x), top: Math.max(0, y) };
}

async function banner({ out, W, H, copy, file, box, tx, ty, textW, maxSize }) {
  const t = COPY[copy];
  const widest = Math.max(...(await Promise.all(t.title.map(([s]) => width100(s, 800)))));
  const size = Math.min(maxSize, Math.floor((textW / widest) * 100));
  const subSize = Math.round(size * 0.4), icon = Math.round(size * 0.66), lead = size * 1.12;
  let y = ty + icon + size * 1.2;
  const parts = [line(tx + icon + 14, ty + icon * 0.72, Math.round(size * 0.42), 700, WHITE, 'Nomad Budget')];
  for (const [s, fill] of t.title) { parts.push(line(tx, y, size, 800, fill, s)); y += lead; }
  y += subSize * 0.5;
  for (const s of t.sub) { parts.push(line(tx, y, subSize, 400, '#C9D3E0', s)); y += subSize * 1.35; }
  const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join('')}</svg>`;
  const round = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${icon}" height="${icon}"><rect width="${icon}" height="${icon}" rx="${icon * 0.23}"/></svg>`);
  const logo = await sharp('public/icons/icon-512.png').resize(icon, icon).composite([{ input: round, blend: 'dest-in' }]).png().toBuffer();
  await sharp(await space(W, H))
    .composite([await globe(file, box, W, H), { input: Buffer.from(text), left: 0, top: 0 }, { input: logo, left: tx, top: ty }])
    .flatten({ background: '#040812' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(out);
  console.log(out, `headline ${size}px, text ends at y=${Math.round(y)}`);
}

// X header: the route across the right half, as tall as the banner allows.
await banner({ out: 'brand/x-header.jpg', W: 1500, H: 500, copy: 'x', file: 'brand/_globe.png',
  box: { x: 760, y: 36, h: 430 }, tx: 90, ty: 78, textW: 600, maxSize: 54 });
// Play feature graphic, EN and TR.
for (const lang of ['en', 'tr']) {
  await banner({ out: `brand/play-feature-${lang}.jpg`, W: 1024, H: 500, copy: `play-${lang}`,
    file: lang === 'en' ? 'brand/_globe.png' : 'brand/_globe-tr.png',
    box: { x: 470, y: 86, h: 330 }, tx: 56, ty: 78, textW: 370, maxSize: 48 });
}
