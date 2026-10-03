// The payment-capture feature's screenshot, made from the app's own captures until a real
// one exists: the dashboard (IMG_0169) with its "Waiting for your OK" section opened up
// under the passport card, where `CaptureInbox` sits, and two payments waiting in it.
//
//   node scripts/capture-shot.mjs            (APP defaults to ../NomadBudget)
//
// The section is drawn to the app's own measures (`CaptureInbox`, `Card`, `SectionHeader`:
// 20pt padding and radius, 40pt avatar, 14/12pt Inter), at the capture's 3× scale. The
// avatars' emoji are cut from IMG_0178, so they are Apple's, as on the phone. Everything
// below the section moves down by its height; the floating bar stays where it was.
// Needs Chrome (CHROME to point elsewhere). Writes public/shots/capture.webp.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const shot = (f) => path.join(APP, 'Store/Screenshots', f);
const dataUrl = (buf, type = 'png') => `data:image/${type};base64,${buf.toString('base64')}`;
const fontCss = path.resolve('node_modules/@fontsource-variable/inter/index.css');

/** In the capture's pixels (1170×2532); the page works in points, a third of them. */
const W = 1170, H = 2532;
const CUT = 1352;    // the passport card's bottom margin ends here: "Countries & goals" starts
const SECTION = 690; // header 66 + 36 + card 240 + 36 + card 240 + 72 below
const EDGE = 6;      // the next header's "All" casts its shadow into the last rows above the cut
const BAR = [        // the floating bar's buttons: [cx, cy, r, shadow]
  [387, 2321, 72, '0 4px 10px rgba(12,24,36,.16)'],
  [585, 2315, 90, '0 8px 22px rgba(12,24,36,.2)'],
  [783, 2322, 72, '0 4px 10px rgba(12,24,36,.16)'],
  [829, 2276, 37, '0 2px 6px rgba(12,24,36,.18)'],
];

const dash = fs.readFileSync(shot('IMG_0169.PNG'));
// The page's own background over the section's height: the rows just above the cut, past
// the passport card's shadow, averaged into one and repeated, so it meets both edges.
const line = await sharp(dash).extract({ left: 0, top: CUT - 14, width: W, height: 8 }).resize(W, 1, { fit: 'fill' }).png().toBuffer();
const band = await sharp(line).resize(W, SECTION + EDGE, { fit: 'fill', kernel: 'nearest' }).png().toBuffer();
const emoji = (top) => sharp(shot('IMG_0178.PNG')).extract({ left: 114, top, width: 70, height: 70 }).png().toBuffer();
const coffee = await emoji(995);
const greens = await emoji(779);

const pt = (px) => `${px / 3}px`;
const row = (img, title, amount) => `
  <div class="card"><div class="row">
    <div class="avatar"><img src="${dataUrl(img)}" alt=""></div>
    <div class="text"><div class="title">${title}</div><div class="sub">Sep 20 · Tap to review</div></div>
    <div class="amount">${amount}</div>
    <svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </div></div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///${fontCss.replace(/\\/g, '/')}">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 390px; height: 844px; position: relative; overflow: hidden; font-family: 'Inter Variable', sans-serif;
    -webkit-font-smoothing: antialiased; }
  .layer { position: absolute; left: 0; width: 390px; overflow: hidden; }
  .layer img { display: block; width: 390px; position: absolute; left: 0; }
  .inbox { position: absolute; left: 20px; right: 20px; top: ${pt(CUT)}; }
  .header { font-size: 16px; line-height: 22px; font-weight: 700; color: rgb(14,23,38); margin-bottom: 12px; }
  .card { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 12px;
    box-shadow: 0 6px 24px rgba(12,24,36,.06); }
  .row { display: flex; align-items: center; height: 40px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: rgb(238,241,246);
    display: grid; place-items: center; margin-right: 12px; flex: none; }
  .avatar img { width: 24px; height: 24px; mix-blend-mode: multiply; }
  .text { flex: 1; min-width: 0; padding-right: 12px; }
  .title { font-size: 14px; line-height: 20px; font-weight: 600; color: rgb(14,23,38); }
  .sub { font-size: 12px; line-height: 16px; font-weight: 500; color: rgb(100,111,125); }
  .amount { font-size: 14px; line-height: 20px; font-weight: 700; color: rgb(14,23,38); }
  .x { width: 14px; height: 14px; margin-left: 12px; color: rgb(100,111,125); flex: none; }
  .btn { position: absolute; border-radius: 50%; background-image: url(${dataUrl(dash)}); background-size: 390px auto; }
</style></head><body>
  <div class="layer" style="top:0;height:${pt(CUT - EDGE)}"><img src="${dataUrl(dash)}" style="top:0"></div>
  <div class="layer" style="top:${pt(CUT - EDGE)};height:${pt(SECTION + EDGE)}"><img src="${dataUrl(band)}" style="top:0"></div>
  <div class="layer" style="top:${pt(CUT + SECTION)};height:${pt(H - CUT - SECTION)}"><img src="${dataUrl(dash)}" style="top:${pt(-CUT)}"></div>
  <div class="inbox">
    <div class="header">Waiting for your OK</div>
    ${row(coffee, 'Galata Coffee', '₺185.00')}
    ${row(greens, 'Kadıköy Market', '₺412.50')}
  </div>
  ${BAR.map(([cx, cy, r, shadow]) => `<div class="btn" style="left:${pt(cx - r)};top:${pt(cy - r)};width:${pt(2 * r)};height:${pt(2 * r)};background-position:${pt(r - cx)} ${pt(r - cy)};box-shadow:${shadow}"></div>`).join('')}
</body></html>`;

fs.mkdirSync('.work', { recursive: true });
fs.writeFileSync('.work/capture-shot.html', html);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(`file:///${path.resolve('.work/capture-shot.html').replace(/\\/g, '/')}`);
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();
fs.writeFileSync('.work/capture-shot.png', png);
await sharp(png).resize(720).webp({ quality: 82 }).toFile('public/shots/capture.webp');
console.log('public/shots/capture.webp');
