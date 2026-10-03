// A screenshot of one element of a page, for checking blog pages without the app's browser
// pane (which stops redrawing after a scroll). The dev server must be running.
//
//   node scripts/shot.mjs <url> <out.png> <selector> [width=420] [light|dark]
//   node scripts/shot.mjs http://localhost:4399/blog/ .work/card.png ".post-card"

import { chromium } from 'playwright-core';

const [url, out, sel, width = '420', scheme = 'light'] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, deviceScaleFactor: 2, colorScheme: scheme });
await page.goto(url, { waitUntil: 'networkidle' });
const el = page.locator(sel).first();
await el.scrollIntoViewIfNeeded();
// Lazy images start loading only once scrolled to: wait for every one inside the element.
await el.evaluate((node) =>
  Promise.all([...node.querySelectorAll('img')].map((img) => {
    img.loading = 'eager';
    return img.complete && img.naturalWidth ? null : new Promise((r) => { img.onload = img.onerror = r; });
  })),
);
await el.screenshot({ path: out });
await browser.close();
