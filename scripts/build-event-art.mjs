// Media for the App Store in-app event "Find Your Winter Base": the event card (16:9,
// 1920×1080) and the event details page (9:16, 1080×1920), EN and TR.
//
// The hero globe with its route over the hero's starry space, and the compare screen laid
// over it — built in HTML from the app's own design values (C:\NomadBudget: Card is
// `bg-surface rounded-2xl p-5`, type is Inter on the app's text scale, the pair bar,
// the headline card and the category rows are those of app/compare.tsx) and shot at 3×,
// so a 360pt-wide layout comes out 1080px wide, as on a phone. The figures are the ones
// in public/shots/compare.webp (Poland → Thailand, as the app computed them).
//
// Where the App Store draws over the media (measured off App Store Connect's previews):
//  - card: shown at ~1.6:1, so ~100px goes off each side; the app's icon sits over the
//    top right (to ~1800 × 220); badge, name and short description fill the lower left
//    from ~740px down.
//  - details page: buttons over the top ~7%; everything under ~56% is blurred and the
//    badge, name and description are set on it, at a ~50px left margin.
//
//   node scripts/build-event-art.mjs        (Chrome at CHROME, as globe-still.mjs)

import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const APP = process.env.APP ?? 'C:/NomadBudget';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DSF = 3;

const FLAGS = JSON.parse(readFileSync('src/data/flags.json', 'utf8'));
// Not on the hero's route, so not in flags.json.
FLAGS.PL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"><path fill="#fff" d="M0 0h16v5H0z"/><path fill="#DC143C" d="M0 5h16v5H0z"/></svg>';

// The app's own strings (compare.perMonth / byCategory / tabGroups, the seeded category
// names) and its number formats in each language.
const COPY = {
  en: { from: 'Poland', to: 'Thailand', perMonth: 'Estimated per month', byCategory: 'By category', groups: 'Groups',
        a: '$3,941', b: '$2,787', pct: (n) => `${n < 0 ? '−' : '+'}${Math.abs(n)}%`,
        cats: ['Accommodation', 'Phone', 'Groceries', 'Restaurant', 'Cafe'] },
  tr: { from: 'Polonya', to: 'Tayland', perMonth: 'Aylık tahmini', byCategory: 'Kategorilere göre', groups: 'Gruplar',
        a: '$3.941', b: '$2.787', pct: (n) => `${n < 0 ? '−' : '+'}%${Math.abs(n)}`,
        cats: ['Konaklama', 'Telefon', 'Market', 'Restoran', 'Kafe'] },
};
// The compare screen's rows as captured: amounts, difference, icon, tint, data strength.
const ROWS = [
  { a: '$160', b: '$46', d: -71, icon: '🏨', tint: '#DDF1FB', strength: 3 },
  { a: '$10', b: '$14', d: 39, icon: '📱', tint: '#ECE7FB', strength: 3 },
  { a: '$386', b: '$274', d: -29, icon: '🥦', tint: '#E3F5E8', strength: 4 },
  { a: '$601', b: '$172', d: -71, icon: '🍽️', tint: '#FCE6EA', strength: 4 },
  { a: '$445', b: '$127', d: -71, icon: '☕', tint: '#F3ECE2', strength: 4 },
];

const font = (w, file) =>
  `@font-face{font-family:Inter;font-weight:${w};src:url(data:font/ttf;base64,${readFileSync(`${APP}/node_modules/@expo-google-fonts/inter/${file}/Inter_${file}.ttf`).toString('base64')})}`;
const FONTS = [[400, '400Regular'], [500, '500Medium'], [600, '600SemiBold'], [700, '700Bold'], [800, '800ExtraBold'], [900, '900Black']]
  .map(([w, f]) => font(w, f)).join('');

// The hero's space, as in build-banners.mjs.
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

// Space with the globe still on it, scaled by `k` with its top left at (x, y), in pixels.
async function background(file, W, H, { k, x, y }) {
  const size = Math.round(3136 * k);
  const buf = await sharp(file).resize(size, size).png().toBuffer();
  const left = Math.max(0, -x), top = Math.max(0, -y);
  const width = Math.min(size - left, W - Math.max(0, x)), height = Math.min(size - top, H - Math.max(0, y));
  const globe = await sharp(buf).extract({ left, top, width, height }).png().toBuffer();
  return sharp(await space(W, H)).composite([{ input: globe, left: Math.max(0, x), top: Math.max(0, y) }]).png().toBuffer();
}

const flag = (code, size) => `<span class="flag" style="width:${size}px;height:${size}px">${FLAGS[code].replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</span>`;
const trendDown = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/></svg>`;
const arrow = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(100 111 125)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

// The pair bar (CollapsedPair: a flag at 22, `text-sm`, the arrow between) as a card.
const pair = (c) => `
  <div class="card pair">
    <div class="side">${flag('PL', 22)}<span>${c.from}</span></div>
    ${arrow}
    <div class="side end"><span>${c.to}</span>${flag('TH', 22)}</div>
  </div>`;

// The headline card: `text-sm` bold heading, `text-2xl` black figures in two flex columns
// with the 84pt middle column for the badge.
const headline = (c) => `
  <div class="card">
    <div class="h">${c.perMonth}</div>
    <div class="row mt2"><div class="fig left">${c.a}</div><div class="mid"><span class="badge">${trendDown}${c.pct(-29)}</span></div><div class="fig right">${c.b}</div></div>
  </div>`;

const bars = (n, good) => `<span class="bars">${[0, 1, 2, 3].map((i) => `<i style="background:${i < n ? (good ? 'rgb(20 159 89)' : 'rgb(100 111 125)') : 'rgb(231 236 242)'}"></i>`).join('')}</span>`;

// The category card: the two tabs, then CategoryDiff rows (`mt-3 pt-3 border-t`, a 24pt
// avatar and `text-base` name, `text-xl` amounts either side of the 84pt badge column).
const categories = (c) => `
  <div class="card">
    <div class="tabs"><span class="tab on">${c.byCategory}</span><span class="tab">${c.groups}</span></div>
    ${ROWS.map((r, i) => `
      <div class="${i ? 'cat sep' : 'cat'}">
        <div class="lbl"><span class="av" style="background:${r.tint}">${r.icon}</span><span class="name">${c.cats[i]}</span>${bars(r.strength, r.strength === 4)}</div>
        <div class="row mt15"><div class="amt left">${r.a}</div><div class="mid"><span class="badge plain" style="background:${r.d < 0 ? 'rgb(20 159 89)' : 'rgb(240 68 56)'}">${c.pct(r.d)}</span></div><div class="amt right">${r.b}</div></div>
      </div>`).join('')}
  </div>`;

const CSS = `${FONTS}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:var(--w);height:var(--h);overflow:hidden;font-family:Inter;color:rgb(14 23 38);-webkit-font-smoothing:antialiased}
  body{background:#040812;position:relative}
  .bg{position:absolute;left:0;top:0;width:100%;height:100%}
  .stack{position:absolute;display:flex;flex-direction:column;gap:12px;transform-origin:top left}
  .card{background:#fff;border-radius:20px;padding:20px;box-shadow:0 6px 16px rgba(0,0,0,.06),0 18px 40px rgba(2,6,16,.45)}
  .pair{display:flex;align-items:center;gap:12px;padding:12px 20px}
  .side{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;line-height:18px;font-weight:600;min-width:0}
  .side.end{justify-content:flex-end}
  .flag{display:inline-block;border-radius:50%;overflow:hidden;flex:none;box-shadow:0 0 0 1px rgba(14,23,38,.08)}
  .flag svg{width:100%;height:100%;display:block}
  .h{font-size:13px;line-height:18px;font-weight:700;text-align:center}
  .row{display:flex;align-items:center}
  .mt2{margin-top:8px}.mt15{margin-top:6px}
  .fig{flex:1;font-size:20px;line-height:26px;font-weight:900;white-space:nowrap}
  .left{text-align:left;padding-right:12px}.right{text-align:right;padding-left:12px}
  .mid{width:84px;display:flex;justify-content:center;flex:none}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgb(20 159 89);color:#fff;font-size:12px;line-height:16px;font-weight:800;white-space:nowrap}
  .badge.plain{padding:4px 8px}
  .tabs{display:flex;gap:8px}
  .tab{flex:1;text-align:center;padding:9px 0;border-radius:999px;font-size:14px;line-height:20px;font-weight:600;color:rgb(100 111 125);background:rgb(238 241 246)}
  .tab.on{background:rgb(14 23 38);color:#fff}
  .cat{margin-top:12px}.cat.sep{padding-top:12px;border-top:1px solid rgba(231,236,242,.6)}
  .lbl{display:flex;align-items:center;gap:8px}
  .av{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex:none}
  .name{flex:1;font-size:14px;line-height:20px}
  .bars{display:inline-flex;gap:2px;align-items:flex-end}.bars i{display:block;width:4px;height:10px;border-radius:1px}
  .amt{flex:1;font-size:17px;line-height:24px;white-space:nowrap}
  .fade{position:absolute;left:0;right:0}
`;

async function art(page, { out, W, H, lang, globe, stack, fade }) {
  const c = COPY[lang];
  const bg = await background(lang === 'tr' ? 'brand/_globe-tr.png' : 'brand/_globe.png', W, H, globe);
  const w = W / DSF, h = H / DSF;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
    :root{--w:${w}px;--h:${h}px}</style></head><body>
    <img class="bg" src="data:image/png;base64,${bg.toString('base64')}">
    <div class="stack" style="left:${stack.x}px;top:${stack.y}px;width:${stack.w}px;transform:scale(${stack.scale ?? 1})">
      ${pair(c)}${headline(c)}${stack.rows ? categories(c) : ''}
    </div>
  </body></html>`;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // The category card dims from its own top edge down, so what the App Store blurs is dark
  // enough for its white text, and the card's start is not cut across by the gradient.
  if (fade) await page.evaluate(({ to, span }) => {
    const cards = document.querySelectorAll('.stack .card');
    if (cards.length < 3) return;
    const top = cards[2].getBoundingClientRect().top;
    const d = document.createElement('div');
    d.className = 'fade';
    d.style.cssText = `top:${top}px;bottom:0;background:linear-gradient(rgba(4,8,18,.25),rgba(4,8,18,${to}) ${span}px)`;
    document.body.append(d);
  }, fade);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  // The headline card must end where the App Store's own drawing starts.
  const box = await page.evaluate(() => { const r = document.querySelectorAll('.stack .card')[1].getBoundingClientRect(); return { left: r.left, right: r.right, bottom: r.bottom }; });
  if (stack.maxBottom && box.bottom > stack.maxBottom) throw new Error(`${out}: headline card ends at ${Math.round(box.bottom * DSF)}px, past ${stack.maxBottom * DSF}px`);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).flatten({ background: '#040812' }).jpeg({ quality: 92, mozjpeg: true }).toFile(out);
  console.log(out, `cards ${Math.round(box.left * DSF)}–${Math.round(box.right * DSF)}px wide, headline ends at ${Math.round(box.bottom * DSF)}px`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ deviceScaleFactor: DSF });
for (const lang of ['en', 'tr']) {
  // Card (640×360pt). The app's cards at their own width (300pt), shown at 0.8 over the
  // empty sky above the route: left of the icon, inside the crop, clear of the text and of
  // the route's chips under it.
  await art(page, { out: `brand/event-card-${lang}.jpg`, W: 1920, H: 1080, lang,
    globe: { k: 0.7829, x: -580, y: -420 },
    stack: { x: 292, y: 20, w: 300, scale: 0.8, maxBottom: 150 } });
  // Details page (360×640pt). The cards at the App Store text's own margin (50px) on both
  // sides, about the width the app gives them; the route above, whole; the pair and the
  // headline card inside the clear upper part, the category card running on under the
  // blur and off the bottom, dimmed so the App Store's white text reads on it.
  await art(page, { out: `brand/event-details-${lang}.jpg`, W: 1080, H: 1920, lang,
    globe: { k: 0.43, x: -214, y: -170 },
    stack: { x: 50 / DSF, y: 202, w: 360 - 100 / DSF, rows: true, maxBottom: 356 },
    fade: { span: 60, to: 0.86 } });
}
await browser.close();
