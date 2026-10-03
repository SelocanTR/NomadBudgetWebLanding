import { SITE, pathFor, blogPath, type Lang } from '../i18n';
import { allPosts, postsIn, alternatesOf, urlOf, isoDate } from '../blog';

// Every page a search engine should know, each naming its other-language alternate: the
// two home pages, and — once there is something in them — the blog and its posts.
export async function GET() {
  const langs: Lang[] = ['en', 'tr'];
  const today = new Date().toISOString().slice(0, 10);
  const posts = await allPosts();

  const url = (path: string, lastmod: string, alternates: Partial<Record<Lang, string>>) => {
    const links = Object.entries(alternates)
      .map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${p}"/>`)
      .concat(alternates.en ? [`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${alternates.en}"/>`] : [])
      .join('');
    return `<url><loc>${SITE}${path}</loc><lastmod>${lastmod}</lastmod>${links}</url>`;
  };

  const homes = { en: pathFor('en'), tr: pathFor('tr') };
  const blogs = { en: blogPath('en'), tr: blogPath('tr') };
  const entries = langs.map((l) => url(pathFor(l), today, homes));
  for (const l of langs) {
    const own = postsIn(l, posts);
    if (!own.length) continue;
    entries.push(url(blogPath(l), isoDate(own[0].entry.data.pubDate), blogs));
    for (const p of own) {
      entries.push(url(urlOf(p), isoDate(p.entry.data.updatedDate ?? p.entry.data.pubDate), alternatesOf(p, posts)));
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
