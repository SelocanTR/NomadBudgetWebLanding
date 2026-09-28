import { SITE, pathFor, type Lang } from '../i18n';

// Both home pages, each naming the other as its alternate.
export function GET() {
  const langs: Lang[] = ['en', 'tr'];
  const today = new Date().toISOString().slice(0, 10);
  const alternates = langs
    .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${pathFor(l)}"/>`)
    .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`)
    .join('');
  const urls = langs
    .map((l) => `<url><loc>${SITE}${pathFor(l)}</loc><lastmod>${today}</lastmod>${alternates}</url>`)
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
