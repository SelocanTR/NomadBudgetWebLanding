// The social cards (public/og-en.jpg, public/og-tr.jpg, 1200×630): the hero in one
// still — the planet rendered with the page's own maths from the same texture, stars
// from the same hash, a chip — and the headline beside it.
//
//   node scripts/build-og.mjs
//
// Text is set in Segoe UI (the machine this runs on has it; Inter ships as woff2 only,
// which the SVG renderer can't read). Re-run when the headline or the look changes.

import fs from 'node:fs';
import sharp from 'sharp';

const W = 1200, H = 630;
const RAD = Math.PI / 180;
const flags = JSON.parse(fs.readFileSync('src/data/flags.json', 'utf8'));

const COPY = {
  en: { title: ['Your money,', 'wherever you are.'], sub: 'One wallet per country. One total in yours.', chip: ['Georgia', '₾3,100/mo'] },
  tr: { title: ['Paran,', 'neredeysen orada.'], sub: 'Her ülkeye bir cüzdan. Senin para biriminde tek toplam.', chip: ['Gürcistan', '₾3.100/ay'] },
};

// --- the planet -----------------------------------------------------------------------
const { data: tex, info } = await sharp('public/globe/earth-2k.webp').raw().toBuffer({ resolveWithObject: true });
const TW = info.width, TH = info.height, TC = info.channels;
const sample = (u, v) => {
  const x = ((u % 1) + 1) % 1 * (TW - 1), y = Math.min(Math.max(v, 0), 1) * (TH - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = (x0 + 1) % TW, y1 = Math.min(y0 + 1, TH - 1);
  const fx = x - x0, fy = y - y0;
  const px = (xx, yy, c) => tex[(yy * TW + xx) * TC + c];
  return [0, 1, 2].map((c) => (px(x0, y0, c) * (1 - fx) + px(x1, y0, c) * fx) * (1 - fy) + (px(x0, y1, c) * (1 - fx) + px(x1, y1, c) * fx) * fy);
};

const cx = 900, cy = 470, R = 420;
const lon0 = 40 * RAD, lat0 = 28 * RAD;
const sl = Math.sin(lat0), cl = Math.cos(lat0), sn = Math.sin(lon0), cn = Math.cos(lon0);
const img = Buffer.alloc(W * H * 3);
const light = [-0.6, 0.6, 1.0].map((v, _, a) => v / Math.hypot(...a));
for (let py = 0; py < H; py++) {
  for (let px = 0; px < W; px++) {
    // Space and the app's star hash (one cell per 1/1.2 px).
    const sx = Math.floor(px * 1.2), sy = Math.floor(py * 1.2);
    const a = (sx * 37 + sy * 91 + 17) % 1024;
    const b = (a * a + sx * 5 + sy * 29 + a * sy) % 2048;
    const c = (b * b + a * 73 + b * sx + sy * 3) % 4096;
    const star = c >= 4080 ? (c - 4079) / 16 : 0;
    let col = [0.015 + star, 0.03 + star, 0.07 + star];

    const qx = (px - cx) / R, qy = -(py - cy) / R;
    const r2 = qx * qx + qy * qy, r = Math.sqrt(r2);
    const haze = Math.exp(-Math.max(r - 1, 0) * R / 22) * 0.55;
    col = col.map((v, i) => v + [0.55, 0.72, 1][i] * haze);
    if (r < 1) {
      const z = Math.sqrt(1 - r2);
      const y1 = qy * cl + z * sl, z1 = -qy * sl + z * cl;
      const x2 = qx * cn + z1 * sn, z2 = -qx * sn + z1 * cn;
      const lon = Math.atan2(x2, z2), lat = Math.asin(Math.max(-1, Math.min(1, y1)));
      let t = sample(lon / (2 * Math.PI) + 0.5, 0.5 - lat / Math.PI).map((v) => v / 255);
      const lum = t[0] * 0.299 + t[1] * 0.587 + t[2] * 0.114;
      t = t.map((v) => lum + (v - lum) * 1.4);
      const ndl = Math.max(0, qx * light[0] + qy * light[1] + z * light[2]);
      t = t.map((v) => v * (0.5 + 0.6 * ndl) + 0.15 * Math.pow(ndl, 8));
      const edge = Math.pow(1 - z, 4) * 0.55;
      t = t.map((v, i) => v + [0.55, 0.72, 1][i] * edge);
      const cover = Math.min(1, (1 - r) * R / 1.5);
      col = col.map((v, i) => v * (1 - cover) + t[i] * cover);
    }
    const o = (py * W + px) * 3;
    for (let i = 0; i < 3; i++) img[o + i] = Math.round(Math.min(1, Math.max(0, col[i])) * 255);
  }
}

// Where Georgia lands, for the chip's pointer.
const project = (lon, lat) => {
  const λ = (lon * RAD) - lon0, φ = lat * RAD;
  const x = Math.cos(φ) * Math.sin(λ);
  const y = cl * Math.sin(φ) - sl * Math.cos(φ) * Math.cos(λ);
  return [cx + x * R, cy - y * R];
};
const [gx, gy] = project(43.7, 41.9);
const [tx, ty] = project(34.6, 39.4);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** A round flag, rasterised on its own (the SVG renderer won't nest the flag's SVG). */
const roundFlag = async (code, d) => {
  const svg = flags[code].replace('<svg ', `<svg width="${Math.round((d * 513) / 342)}" height="${d}" `);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}"/></svg>`);
  return sharp(Buffer.from(svg)).resize(d, d, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
};

for (const [lang, t] of Object.entries(COPY)) {
  const chipW = 196;
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" x2="1"><stop offset="0" stop-color="#040812" stop-opacity=".92"/><stop offset=".42" stop-color="#040812" stop-opacity=".6"/><stop offset=".62" stop-color="#040812" stop-opacity="0"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <path d="M${tx} ${ty} Q ${(tx + gx) / 2} ${Math.min(ty, gy) - 26} ${gx} ${gy}" fill="none" stroke="#040812" stroke-opacity=".5" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.1 9"/>
  <path d="M${tx} ${ty} Q ${(tx + gx) / 2} ${Math.min(ty, gy) - 26} ${gx} ${gy}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 9"/>
  <circle cx="${tx}" cy="${ty}" r="5" fill="#fff" stroke="#040812" stroke-opacity=".5" stroke-width="2"/>
  <circle cx="${gx}" cy="${gy}" r="5" fill="#fff" stroke="#040812" stroke-opacity=".5" stroke-width="2"/>
  <g filter="url(#sh)">
    <rect x="${gx - chipW / 2}" y="${gy - 70}" width="${chipW}" height="52" rx="26" fill="#fff"/>
    <path d="M${gx - 8} ${gy - 19} L${gx + 8} ${gy - 19} L${gx} ${gy - 10} Z" fill="#fff"/>
  </g>
  <text x="${gx - chipW / 2 + 56}" y="${gy - 48}" font-family="Segoe UI" font-weight="700" font-size="18" fill="#0E1726">${esc(t.chip[0])}</text>
  <text x="${gx - chipW / 2 + 56}" y="${gy - 27}" font-family="Segoe UI" font-size="16" fill="#6B7684">${esc(t.chip[1])}</text>

  <g transform="translate(64 64)">
    <circle cx="20" cy="20" r="20" fill="#C9804F"/>
    <text x="54" y="28" font-family="Segoe UI" font-weight="700" font-size="26" fill="#fff">Nomad Budget</text>
  </g>
  <text x="64" y="252" font-family="Segoe UI" font-weight="800" font-size="72" letter-spacing="-2" fill="#fff">${esc(t.title[0])}</text>
  <text x="64" y="334" font-family="Segoe UI" font-weight="800" font-size="72" letter-spacing="-2" fill="#52D69B">${esc(t.title[1])}</text>
  <text x="64" y="392" font-family="Segoe UI" font-size="26" fill="#C9D3E0">${esc(t.sub)}</text>

</svg>`;
  const coin = await sharp('public/icons/coin-96.webp').resize(40, 40).png().toBuffer();
  await sharp(img, { raw: { width: W, height: H, channels: 3 } })
    .composite([
      { input: Buffer.from(overlay) },
      { input: coin, left: 64, top: 64 },
      { input: await roundFlag('GE', 40), left: Math.round(gx - chipW / 2 + 6), top: Math.round(gy - 64) },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`public/og-${lang}.jpg`);
}
console.log('og cards written');
