// YouTube thumbnail: the video page's globe at a chosen frame, the video's own words
// hidden, a large headline laid over the left. 1920x1080 capture → 1280x720 JPEG.
//   node video/thumb.mjs <lang> <seconds> <outName> [scale]
// SHIFT=14% moves the globe further right, clear of the headline (a pale theme behind the
// words reads badly).
import { createRequire } from 'node:module';
const require = createRequire('C:/NomadBudgetWeb/package.json');
const { chromium } = require('playwright-core');
const sharp = require('C:/NomadBudget/node_modules/sharp');

const [lang = 'en', sec = '12', out = 'thumb', scale = '1.18'] = process.argv.slice(2);
const TEXT = {
  // The app's slogan, the videos' opening words (copy.ts `hook`).
  en: { a: 'The expense tracker', b: 'for life across borders.', tag: 'Your journey on a 3D globe' },
  tr: { a: 'Sınır tanımayan bir hayat için', b: 'harcama takibi.', tag: 'Yolculuğun 3B kürede' },
  ar: { a: 'متتبّع المصاريف', b: 'لحياة عابرة للحدود.', tag: 'رحلتك على كرة أرضية ثلاثية الأبعاد' },
}[lang];

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
await page.goto(`${process.env.VIDEO_URL ?? 'http://127.0.0.1:4321'}/video/${lang}/?f=landscape`, { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('[data-video]')?.getAttribute('data-ready') === '1', null, { timeout: 60000 });
const { fps } = await page.evaluate(() => window.__video);
await page.evaluate((f) => window.__video.seek(f), Math.round(Number(sec) * fps));

await page.addStyleTag({ content: `
  .v-captions, .v-total, .v-legend { display: none !important; }
  .v-globe, .v-routes, .v-pins { transform: scale(${scale}) translateX(${process.env.SHIFT ?? '4%'}); transform-origin: 78% 50%; }
  .landscape .v-scrim { width: 600px !important; background: linear-gradient(90deg, rgba(4,8,18,.94) 0%, rgba(4,8,18,.78) 55%, rgba(4,8,18,0) 100%) !important; }
  .th { position: absolute; left: 44px; top: 0; bottom: 0; width: 620px; display: flex; flex-direction: column; justify-content: center; z-index: 10; }
  .th h1 { width: 500px; font-size: 66px; font-weight: 900; line-height: 1.02; letter-spacing: -0.035em; color: #fff; }
  .th h1 span { display: block; }
  .th h1 .g { color: #52D69B; }
  html[lang='ar'] .th { width: 470px; }
  html[lang='ar'] .th h1 { width: 470px; font-size: 60px; letter-spacing: 0; line-height: 1.25; font-family: 'Inter Variable', 'Cairo', sans-serif; }
  .th .tag { margin-top: 22px; font-size: 27px; font-weight: 700; color: #DCE6F2; letter-spacing: -0.01em; }
  .th .brand { position: absolute; left: 0; bottom: 34px; display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .th .brand img { width: 42px; height: 42px; border-radius: 10px; }
` });
await page.evaluate((t) => {
  const el = document.createElement('div');
  el.className = 'th';
  el.innerHTML = `<h1><span>${t.a}</span><span class="g">${t.b}</span></h1><p class="tag">${t.tag}</p>
    <div class="brand"><img src="/icons/icon-512.png" alt="">Nomad Budget</div>`;
  document.querySelector('[data-video]').appendChild(el);
}, TEXT);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.waitForTimeout(150);
const png = await page.screenshot({ type: 'png' });
await sharp(png).resize(1280, 720).jpeg({ quality: 90, mozjpeg: true }).toFile(`C:/NomadBudgetWeb/video/out/${out}.jpg`);
await browser.close();
console.log(`C:/NomadBudgetWeb/video/out/${out}.jpg`);
