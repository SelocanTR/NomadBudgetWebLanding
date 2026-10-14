// The legal documents (src/data/legal.json, from scripts/build-legal.mjs): their
// addresses, their words in each language, and the one rule for turning their prose
// into HTML. The pages are src/components/LegalDoc.astro and LegalIndex.astro.

import data from './data/legal.json';
import { pathFor, type Lang } from './i18n';

export type LegalSection = { title: string; body: (string | string[])[] };
export type LegalDoc = { slug: string; title: string; summary: string; intro: string[]; sections: LegalSection[] };

export const LEGAL = data;
/** The documents, then the account-deletion page: every page under /legal/. */
export const LEGAL_PAGES = [...data.slugs, 'delete-account'] as const;

export const legalPath = (lang: Lang, slug?: string) => `${pathFor(lang)}legal/${slug ? `${slug}/` : ''}`;
export const legalDoc = (lang: Lang, slug: string): LegalDoc => (data.docs[lang] as Record<string, LegalDoc>)[slug];

export const LEGAL_LABELS: Record<Lang, {
  index: string; lede: string; meta: (v: string, d: string) => string; back: string; toc: string;
  deleteSummary: string;
}> = {
  en: {
    index: 'Legal Documents',
    lede: 'The terms you agree to, how your data is handled, and how to delete your account.',
    meta: (v, d) => `Version ${v} · Effective ${d}`,
    back: 'All documents',
    toc: 'Contents',
    deleteSummary: 'How to delete your account, and what is kept afterwards',
  },
  tr: {
    index: 'Yasal Belgeler',
    lede: 'Kabul ettiğin koşullar, verilerinin nasıl işlendiği ve hesabını nasıl sileceğin.',
    meta: (v, d) => `Sürüm ${v} · Yürürlük tarihi: ${d}`,
    back: 'Tüm belgeler',
    toc: 'İçindekiler',
    deleteSummary: 'Hesabını nasıl silersin, sonrasında neler kalır',
  },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One prose string as HTML, the way the app's exporter reads it: `**…**` is emphasis,
 *  an email address or a web address is a link. Escaped first, so the prose can carry
 *  no markup of its own. */
export function inline(text: string): string {
  return esc(text)
    .split('**')
    .map((part, i) => (i % 2 === 1 ? `<strong>${part}</strong>` : part))
    .join('')
    .replace(/(https?:\/\/[^\s<]*[^\s<.,;:)])|([\w.+-]+@[\w-]+\.[\w.-]*\w)/g, (m, url) =>
      url ? `<a href="${m}">${m}</a>` : `<a href="mailto:${m}">${m}</a>`,
    );
}

/** A section body: a string is a paragraph, an array a bullet list. */
export const blocks = (body: (string | string[])[]) =>
  body
    .map((b) => (Array.isArray(b) ? `<ul>${b.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>` : `<p>${inline(b)}</p>`))
    .join('\n');
