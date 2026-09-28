// Structured data for the home page in each language: what the app is, who makes it,
// the site, and the FAQ as questions and answers — the shapes search engines and AI
// assistants read an entity from. No ratings: only real, verifiable ones may go here.

import { STRINGS, SITE, CONTACT, APP_STORE_ID, appStoreUrl, pathFor, type Lang } from './i18n';

export function jsonLd(lang: Lang): object[] {
  const s = STRINGS[lang];
  const url = new URL(pathFor(lang), SITE).href;
  const org = {
    '@type': 'Organization',
    '@id': `${SITE}/#org`,
    name: 'Rubeeks',
    url: 'https://rubeeks.co',
    email: CONTACT,
    logo: `${SITE}/icons/icon-512.png`,
  };
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
      sameAs: [`https://apps.apple.com/app/id${APP_STORE_ID}`],
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
