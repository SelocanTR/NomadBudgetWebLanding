// The words of the App Store search video, per language: the store screenshots' own
// headlines (white, then green, as they set them) and audience pills, word for word.

import type { CoverLang } from '../src/data/journey';

type Headline = [string, string];

export type SearchCopy = {
  /** Store screenshots 1–2: the panorama. */
  hook: Headline;
  audiences: [string, string, string];
  /** Store screenshot 3's line, over the app's Japan sheet: what living there would cost
   *  you, priced from your own spending in Kazakhstan. */
  basket: Headline;
  japan: { name: string; usd: number; change: string; home: string };
  /** The wallets scene, and the trip total its chips fly into. */
  wallets: Headline;
  totalLabel: string;
  totalSub: string;
  /** The currency the total is shown in. */
  currency: string;
};

export const SEARCH_COPY: Record<CoverLang, SearchCopy> = {
  en: {
    hook: ['The expense tracker', 'for life across borders.'],
    audiences: ['Digital Nomads', 'Expats', 'Long-term travellers'],
    basket: ['Your own basket,', 'not an average.'],
    japan: { name: 'Japan', usd: 4396, change: '+68%', home: 'Kazakhstan' },
    wallets: ['One wallet per country.', 'One total.'],
    totalLabel: 'Trip total',
    totalSub: '5 countries · 5 currencies',
    currency: 'USD',
  },
  tr: {
    hook: ['Sınır tanımayan bir hayat için', 'harcama takibi.'],
    audiences: ['Dijital göçebeler', 'Gurbetçiler', 'Uzun süre gezenler'],
    basket: ['Ortalama değil,', 'kendi sepetin.'],
    japan: { name: 'Japonya', usd: 4396, change: '+%68', home: 'Kazakistan' },
    wallets: ['Her ülkeye bir cüzdan.', 'Tek toplam.'],
    totalLabel: 'Yolculuk toplamı',
    totalSub: '5 ülke · 5 para birimi',
    currency: 'TRY',
  },
  // No Arabic store screenshots yet: the English lines, in the app's Arabic wording where it
  // has one ("سلتك" is world.sheet.indexWhy's). The total stays in dollars: the Arabic store
  // is many countries' and no one currency is theirs.
  ar: {
    hook: ['متتبّع المصاريف', 'لحياة عابرة للحدود.'],
    audiences: ['الرحّالة الرقميون', 'المغتربون', 'المسافرون لفترات طويلة'],
    basket: ['سلّتك أنت،', 'لا متوسّط عام.'],
    japan: { name: 'اليابان', usd: 4396, change: '+68%', home: 'كازاخستان' },
    wallets: ['محفظة لكل دولة.', 'إجمالي واحد.'],
    totalLabel: 'إجمالي الرحلة',
    totalSub: '5 دول · 5 عملات',
    currency: 'USD',
  },
};
