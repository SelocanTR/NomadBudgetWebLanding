// The hero globe alone, transparent around it — route lines, badges and country chips
// included — as a PNG for store images. The dev server must be running.
//
//   node scripts/globe-still.mjs <out.png> [t=finale+3000] [size=1100] [lang=en|tr] [all]
//
// `t` is the scenario clock (see `?globe-t`); the default is the finale, the whole trip
// drawn, the planet turned to Europe–Asia. `all` opens every chip, not just the current one.
// Bold ink for a small picture: a small `size` and a dense DSF (say 380 and 8) draws the
// lines, badges and chips large against the planet; PAD=0.3 leaves room for them past its rim.
// VIEW=lon,lat[,zoom] points the camera elsewhere (default: the page's own finale view).
// Writes <out.png> (transparent) and <out>-space.png (over the hero's starry space).

import { chromium } from 'playwright-core';
import sharp from 'sharp';

const [out, tArg, sizeArg = '1100', lang = 'en', all] = process.argv.slice(2);
const SIZE = +sizeArg, PAD = Math.round(SIZE * +(process.env.PAD ?? 0.06)), VIEW = SIZE + PAD * 2;
const VIEWP = process.env.VIEW ? `&globe-view=${process.env.VIEW}` : '';
const BASE = process.env.BASE ?? 'http://localhost:4399';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=d3d11', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: VIEW, height: VIEW }, deviceScaleFactor: +(process.env.DSF ?? 2) });
const css = `
  html, body, .hero { background: var(--matte, transparent) !important; }
  body > *:not(main), main > *:not(.hero), .hero-stars, .hero-scrim, .hero-copy, .globe-pause, .hero-fallback { display: none !important; }
  .hero { position: fixed !important; inset: 0 !important; min-height: 0 !important; height: ${VIEW}px !important; overflow: visible !important; }
  .globe-slot { position: fixed !important; left: ${PAD + SIZE * 0.03}px !important; top: ${PAD + SIZE * 0.03}px !important;
                width: ${SIZE * 0.94}px !important; height: ${SIZE * 0.94}px !important; margin: 0 !important; transform: none !important; translate: none !important; }
  .chip-body, .chip-text { transition: none !important; }
  .chip-name { display: block !important; }
  .chip-body { bottom: calc(11px + var(--lift, 0px)) !important; }
  .chip-body::before { content: ''; position: absolute; left: 50%; top: 100%; width: 2.5px; margin-left: -1.25px;
                       height: calc(var(--lift, 0px) + 5px); background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); }
`;
await page.addInitScript((css) => {
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.append(s);
  });
}, css);

const path = lang === 'tr' ? '/tr/' : '/';
// First a frozen load to read the schedule, then the moment itself.
await page.goto(`${BASE}${path}?globe-t=0`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('.hero')?.dataset.schedule);
const sched = JSON.parse(await page.evaluate(() => document.querySelector('.hero').dataset.schedule));
const t = tArg && tArg !== '-' ? +tArg : sched.finale + 3000;
await page.goto(`${BASE}${path}?globe-t=${t}${VIEWP}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('.hero')?.classList.contains('is-lit'));
await page.waitForTimeout(2500); // the sharp texture and the dawn
if (all) await page.evaluate(() => document.querySelectorAll('.chip.is-on').forEach((c) => c.classList.add('is-current')));
// OPEN=FR,TR,TH opens just those chips, the rest folded to their flags; HIDE=ES,MA hides some;
// LIFT=ES:60 raises a chip that far on a stem, clear of its neighbours.
if (process.env.OPEN) await page.evaluate((open) => document.querySelectorAll('.chip.is-on').forEach((c) =>
  c.classList.toggle('is-current', open.includes(c.dataset.code))), process.env.OPEN.split(','));
if (process.env.LIFT) await page.evaluate((lift) => lift.forEach(([code, px]) =>
  document.querySelector(`.chip[data-code="${code}"]`)?.style.setProperty('--lift', `${px}px`)), process.env.LIFT.split(',').map((x) => x.split(':')));
if (process.env.HIDE) await page.evaluate((hide) => document.querySelectorAll('.chip').forEach((c) => {
  if (hide.includes(c.dataset.code)) c.style.display = 'none';
}), process.env.HIDE.split(','));
await page.waitForTimeout(300);
// The atmosphere is light added onto the dark of space, which a plain transparent
// capture can't hold: shoot over black and over white and work the alpha out of the two.
const shoot = async (matte) => {
  await page.evaluate((m) => document.documentElement.style.setProperty('--matte', m), matte);
  await page.waitForTimeout(200);
  return sharp(await page.screenshot({ clip: { x: 0, y: 0, width: VIEW, height: VIEW } })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
};
const { data: blk, info } = await shoot('#000');
const { data: wht } = await shoot('#fff');
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < blk.length; i += 3, j += 4) {
  let a = 0;
  for (let c = 0; c < 3; c++) a = Math.max(a, 255 - (wht[i + c] - blk[i + c]), blk[i + c]);
  a = Math.min(255, a);
  for (let c = 0; c < 3; c++) rgba[j + c] = a ? Math.min(255, Math.round(blk[i + c] * 255 / a)) : 0;
  rgba[j + 3] = a;
}
await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(out);
// The same frame over the page's own space, stars and all, for a dark layout.
await page.evaluate(() => {
  document.documentElement.style.removeProperty('--matte');
  document.querySelector('.hero-stars').style.setProperty('display', 'block', 'important');
  document.querySelector('.hero').style.setProperty('background', 'var(--space)', 'important');
});
await page.waitForTimeout(200);
await page.screenshot({ path: out.replace(/\.png$/, '-space.png'), clip: { x: 0, y: 0, width: VIEW, height: VIEW } });
console.log(JSON.stringify({ t, sched }));
await browser.close();
