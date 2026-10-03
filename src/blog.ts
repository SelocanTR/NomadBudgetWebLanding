// The blog's posts as the pages use them: which language, which address, its pair in the
// other language, what to read next. Drafts and posts whose `pubDate` is still ahead exist
// only under `astro dev`; a daily build (.github/workflows/deploy.yml) lets each post out on
// its day. A post that is not a draft but lacks its other-language pair stops the build,
// even before its day, since every post goes out in both languages.

import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, STRINGS, blogPath, postPath, type Lang } from './i18n';

export type Post = { entry: CollectionEntry<'blog'>; lang: Lang; slug: string };

const LOCALE: Record<Lang, string> = { en: 'en-US', tr: 'tr-TR' };
const other = (lang: Lang): Lang => (lang === 'en' ? 'tr' : 'en');

let cache: Promise<Post[]> | undefined;

/** Why a post is not on the live site yet, if it is not: kept back, or its day is ahead. */
export const holdOf = (entry: CollectionEntry<'blog'>): 'draft' | 'scheduled' | undefined =>
  entry.data.draft ? 'draft' : entry.data.pubDate.valueOf() > Date.now() ? 'scheduled' : undefined;

/** Every post this build shows, newest first. */
export function allPosts(): Promise<Post[]> {
  // The dev server keeps modules alive across edits: only a build may remember.
  if (cache && !import.meta.env.DEV) return cache;
  cache = load();
  return cache;
}

async function load(): Promise<Post[]> {
  const all = await getCollection('blog');
  const entries = all.filter((e) => import.meta.env.DEV || !holdOf(e));
  const posts = entries
    .map((entry) => {
      const [lang, slug] = entry.id.split('/') as [Lang, string];
      return { entry, lang, slug };
    })
    .sort((a, b) => b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf());

  // Checked over every post, scheduled ones too: a post due next week fails today's build,
  // not the unattended one on its day.
  const every = all.map((entry) => {
    const [lang, slug] = entry.id.split('/') as [Lang, string];
    return { entry, lang, slug };
  });
  for (const p of every) {
    const key = p.entry.data.translationKey;
    const same = every.filter((q) => q.lang === p.lang && q.entry.data.translationKey === key);
    if (same.length > 1) throw new Error(`blog: ${same.map((q) => q.entry.id).join(', ')} share translationKey "${key}"`);
    if (p.entry.data.draft) continue;
    // A published post goes out in both languages, on the same day, and with its cover.
    const pair = translationOf(p, every);
    const problems = [
      !pair && `has no ${other(p.lang)} version (translationKey "${key}")`,
      pair && pair.entry.data.draft && `is not a draft but its ${other(p.lang)} version is`,
      pair && pair.entry.data.pubDate.valueOf() !== p.entry.data.pubDate.valueOf() && `has a different pubDate from its ${other(p.lang)} version`,
      !p.entry.data.cover && 'has no cover',
      /<mark class="todo"|\[(ANEKDOT|DOĞRULA|ANECDOTE|VERIFY):/.test(p.entry.body ?? '') && 'still has open questions for the author',
    ].filter(Boolean);
    for (const problem of problems) {
      const message = `blog: "${p.entry.id}" ${problem}`;
      if (import.meta.env.DEV) console.warn(message);
      else throw new Error(message);
    }
  }
  return posts;
}

export const postsIn = (lang: Lang, posts: Post[]) => posts.filter((p) => p.lang === lang);

export const translationOf = (post: Post, posts: Post[]) =>
  posts.find((q) => q.lang !== post.lang && q.entry.data.translationKey === post.entry.data.translationKey);

export const urlOf = (post: Post) => postPath(post.lang, post.slug);

/** The post's address in each language it exists in. */
export function alternatesOf(post: Post, posts: Post[]): Partial<Record<Lang, string>> {
  const pair = translationOf(post, posts);
  return { [post.lang]: urlOf(post), ...(pair ? { [pair.lang]: urlOf(pair) } : {}) };
}

/** Up to `n` more posts in the same language: the same topic first, then the newest. */
export function relatedTo(post: Post, posts: Post[], n = 3): Post[] {
  // By id: a page's post and the list may come from different loads.
  const rest = postsIn(post.lang, posts).filter((p) => p.entry.id !== post.entry.id);
  const sameTopic = rest.filter((p) => p.entry.data.topic === post.entry.data.topic);
  return [...sameTopic, ...rest.filter((p) => !sameTopic.includes(p))].slice(0, n);
}

export function readingMinutes(post: Post): number {
  const words = (post.entry.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const minRead = (post: Post) => STRINGS[post.lang].blog.minRead.replace('{n}', String(readingMinutes(post)));

export const formatDate = (date: Date, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The language's feed: RSS 2.0, newest first. */
export async function rss(lang: Lang): Promise<Response> {
  const b = STRINGS[lang].blog;
  const posts = postsIn(lang, await allPosts());
  const home = new URL(blogPath(lang), SITE).href;
  const items = posts
    .map((p) => {
      const url = new URL(urlOf(p), SITE).href;
      return `<item><title>${xml(p.entry.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.entry.data.pubDate.toUTCString()}</pubDate><description>${xml(p.entry.data.description)}</description></item>`;
    })
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(b.metaTitle)}</title><link>${home}</link><atom:link href="${home}rss.xml" rel="self" type="application/rss+xml"/><description>${xml(b.metaDescription)}</description><language>${lang}</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
