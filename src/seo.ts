// Structured data for the home page in each language: what the app is, who makes it,
// the site, and the FAQ as questions and answers — the shapes search engines and AI
// assistants read an entity from. No ratings: only real, verifiable ones may go here.

import { STRINGS, SITE, CONTACT, APP_STORE_ID, appStoreUrl, pathFor, blogPath, type Lang } from './i18n';
import { AUTHOR } from './author';

const org = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'Rubeeks',
  // rubeeks.co itself has no site yet (the name does not resolve): an organisation whose
  // address leads nowhere is weaker than none. Back to https://rubeeks.co once it does.
  url: SITE + '/',
  email: CONTACT,
  logo: `${SITE}/icons/icon-512.png`,
};

export function jsonLd(lang: Lang): object[] {
  const s = STRINGS[lang];
  const url = new URL(pathFor(lang), SITE).href;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      '@id': `${SITE}/#app`,
      name: 'Nomad Budget',
      description: s.meta.description,
      url,
      image: `${SITE}/icons/icon-512.png`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'iOS',
      inLanguage: ['en', 'tr', 'es', 'fr', 'ru', 'ar'],
      downloadUrl: appStoreUrl(lang),
      installUrl: appStoreUrl(lang),
      sameAs: [`https://apps.apple.com/app/id${APP_STORE_ID}`, 'https://www.youtube.com/@NomadBudgetInt'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'free' },
      featureList: s.features.items.map((f) => `${f.title[0]} ${f.title[1]}`),
      publisher: { '@id': `${SITE}/#org` },
    },
    { '@context': 'https://schema.org', ...org },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'Nomad Budget',
      url: SITE + '/',
      inLanguage: lang,
      publisher: { '@id': `${SITE}/#org` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: s.faq.items.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
}

// --- the blog --------------------------------------------------------------------------
// Every post names its author as a person with his own profile, its publisher and the app
// it is about — the same @ids the home page defines, so the site reads as one entity.

const abs = (path: string) => new URL(path, SITE).href;

function person(lang: Lang, photo: string) {
  return {
    '@type': 'Person',
    '@id': `${SITE}/#author`,
    name: AUTHOR.name,
    jobTitle: 'Designer',
    description: STRINGS[lang].blog.authorBio,
    image: abs(photo),
    sameAs: [AUTHOR.medium],
    worksFor: { '@id': `${SITE}/#org` },
  };
}

function crumbs(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  };
}

export function blogLd(lang: Lang, posts: { title: string; url: string; date: string }[]): object[] {
  const b = STRINGS[lang].blog;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${abs(blogPath(lang))}#blog`,
      name: b.metaTitle,
      description: b.metaDescription,
      url: abs(blogPath(lang)),
      inLanguage: lang,
      publisher: org,
      blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(p.url), datePublished: p.date })),
    },
    crumbs([['Nomad Budget', pathFor(lang)], ['Blog', blogPath(lang)]]),
  ];
}

export function postLd(
  lang: Lang,
  post: { title: string; description: string; url: string; published: string; modified: string; image: string; photo: string },
): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: abs(post.url),
      mainEntityOfPage: abs(post.url),
      image: abs(post.image),
      datePublished: post.published,
      dateModified: post.modified,
      inLanguage: lang,
      author: person(lang, post.photo),
      publisher: org,
      about: { '@id': `${SITE}/#app` },
      isPartOf: { '@id': `${abs(blogPath(lang))}#blog` },
    },
    crumbs([['Nomad Budget', pathFor(lang)], ['Blog', blogPath(lang)], [post.title, post.url]]),
  ];
}
