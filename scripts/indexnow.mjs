// Tells Bing (and through IndexNow, Yandex, Seznam, Naver…) which pages just changed, so a
// post is crawled the day it goes out instead of whenever the crawler comes by. ChatGPT's
// search reads Bing's index, so this is also how a new post reaches it.
//
// Runs after each deploy. Reads the live sitemap and sends the pages whose lastmod is
// within the last two days: on the daily build that is the post published that morning,
// on a push it is also the home pages (their lastmod is the last commit's date).
//   node scripts/indexnow.mjs          only recent pages
//   INDEXNOW_ALL=1 node scripts/…      every page in the sitemap (first run, or after a rename)
//
// The key is public by design: IndexNow checks that the site serves it at /<key>.txt.

const SITE = 'https://nomadbudget.rubeeks.co';
const KEY = 'd852a1550c8f9399dc60210bf543161c';
const DAYS = 2;

const xml = await (await fetch(`${SITE}/sitemap.xml?t=${Date.now()}`)).text();
const pages = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(([, loc, lastmod]) => ({ loc, lastmod }));
if (!pages.length) throw new Error('No pages in the sitemap');

const since = new Date(Date.now() - DAYS * 86400e3).toISOString().slice(0, 10);
const urlList = process.env.INDEXNOW_ALL ? pages.map((p) => p.loc) : pages.filter((p) => p.lastmod >= since).map((p) => p.loc);
if (!urlList.length) {
  console.log(`Nothing changed since ${since}.`);
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow ${res.status} for ${urlList.length} page(s):\n${urlList.join('\n')}`);
// 200 accepted, 202 accepted but the key is still being checked; anything else is worth a red run.
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
