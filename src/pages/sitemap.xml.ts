import { execSync } from 'node:child_process';
import { SITE, pathFor, blogPath, type Lang } from '../i18n';
import { allPosts, postsIn, alternatesOf, urlOf, isoDate } from '../blog';
import { ALTERNATIVES_PATH, alternativePath, publishedAlternatives } from '../data/alternatives';
import { guidePath, publishedGuides } from '../data/guides';

// The home pages change only with a commit. The site is rebuilt every morning, and a
// lastmod that moves with every build is one search engines learn to ignore.
function lastCommit(): string {
  try {
    return execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim() || isoDate(new Date());
  } catch {
    return isoDate(new Date());
  }
}

// Every page a search engine should know, each naming its other-language alternate: the
// two home pages, and — once there is something in them — the blog and its posts.
export async function GET() {
  const langs: Lang[] = ['en', 'tr'];
  const homeDate = lastCommit();
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
  const entries = langs.map((l) => url(pathFor(l), homeDate, homes));
  for (const l of langs) {
    const own = postsIn(l, posts);
    if (!own.length) continue;
    entries.push(url(blogPath(l), isoDate(own[0].entry.data.pubDate), blogs));
    for (const p of own) {
      entries.push(url(urlOf(p), isoDate(p.entry.data.updatedDate ?? p.entry.data.pubDate), alternatesOf(p, posts)));
    }
  }

  // The comparisons and guides: English only, each dated by when it was last checked.
  const section = [
    ...publishedGuides().map((g) => ({ path: guidePath(g), checked: g.checked })),
    ...publishedAlternatives().map((a) => ({ path: alternativePath(a), checked: a.checked })),
  ];
  if (section.length) {
    const newest = section.map((p) => p.checked).sort().at(-1)!;
    entries.push(url(ALTERNATIVES_PATH, newest, { en: ALTERNATIVES_PATH }));
    for (const p of section) entries.push(url(p.path, p.checked, { en: p.path }));
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
