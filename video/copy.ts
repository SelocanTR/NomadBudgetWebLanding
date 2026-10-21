// The words on screen, per language — the landing's own: the hero's title and audiences,
// the features' titles. A caption is two lines: white, then lime (the hero's title does the same). The trip's total is in the viewer's `home.currency`; the
// cost layer prices every country against `reference` — the trip's last stop, as the
// app's automatic reference follows the latest stay (and Mexico, mid-priced, is the one
// that spreads the countries over all five bands; the US painted nearly all of them
// cheaper, Thailand or Türkiye nearly all dearer).

import type { CoverLang } from '../src/data/journey';

export type Caption = [string, string];

export type VideoCopy = {
  /** The hero's eyebrow, one audience at a time in the opening; all three on the end card. */
  audiences: [string, string, string];
  /** The hero's title. */
  hook: Caption;
  currencies: Caption;
  journey: Caption;
  total: Caption;
  totalLabel: string;
  totalSub: string;
  cost: Caption;
  home: { currency: string };
  reference: { code: string; name: string; label: string };
  /** The app's world.cost.pricedAgainst: the cost card's heading, the reference beside it. */
  legendTitle: string;
  /** The app's own band words (world.cost.band.*), cheapest first. */
  bands: [string, string, string, string, string];
  /** The landing's feature titles, over the landing's own screenshots. */
  screens: { shot: string; caption: Caption }[];
  name: string;
  tagline: string;
  cta: string;
  url: string;
};

export const COPY: Record<CoverLang, VideoCopy> = {
  en: {
    audiences: ['For digital nomads', 'For expats', 'For long-term travellers'],
    hook: ['The expense tracker', 'for life across borders.'],
    currencies: ['Every country,', 'in its own currency.'],
    journey: ['Your journey', 'on a globe.'],
    total: ['One wallet per country.', 'One total.'],
    totalLabel: 'Trip total',
    totalSub: '9 countries · 8 currencies',
    cost: ['Compare countries', 'before you go.'],
    home: { currency: 'USD' },
    reference: { code: 'MX', name: 'Mexico', label: 'You’re here' },
    legendTitle: 'Priced against',
    bands: ['half or less', 'cheaper', 'about the same', 'dearer', 'twice or more'],
    screens: [
      { shot: 'entry', caption: ['Log it', 'in seconds.'] },
      { shot: 'capture', caption: ['Payments that', 'add themselves.'] },
    ],
    name: 'Nomad Budget',
    tagline: 'Multi-Currency Expense Tracker',
    // Not one store's: the app is on Google Play too.
    cta: 'Download now',
    url: 'nomadbudget.rubeeks.co',
  },
  tr: {
    audiences: ['Dijital göçebeler için', 'Gurbetçiler için', 'Uzun süre gezenler için'],
    hook: ['Sınır tanımayan bir hayat için', 'harcama takibi.'],
    currencies: ['Her ülke,', 'kendi para biriminde.'],
    journey: ['Yolculuğun', 'bir kürede.'],
    total: ['Her ülkeye bir cüzdan.', 'Tek toplam.'],
    totalLabel: 'Yolculuk toplamı',
    totalSub: '9 ülke · 8 para birimi',
    cost: ['Gitmeden önce', 'karşılaştır.'],
    home: { currency: 'TRY' },
    reference: { code: 'MX', name: 'Meksika', label: 'Buradasın' },
    legendTitle: 'Karşılaştırma',
    bands: ['yarısı veya altı', 'daha ucuz', 'aşağı yukarı aynı', 'daha pahalı', 'iki katı veya üstü'],
    screens: [
      { shot: 'entry', caption: ['Saniyeler içinde', 'kaydet.'] },
      { shot: 'capture', caption: ['Kendi kendine', 'eklenen ödemeler.'] },
    ],
    name: 'Nomad Budget',
    tagline: 'Çok Dövizli Harcama Takibi',
    cta: 'Hemen indir',
    url: 'nomadbudget.rubeeks.co',
  },
  // The site has no Arabic: the app's own Arabic where it has the words (the cost card's
  // world.cost.*, the route pill's /شهر), the search video's (search-copy.ts) for the hook
  // and audiences. The total in dollars, as there: the Arabic store is many countries'.
  ar: {
    audiences: ['للرحّالة الرقميين', 'للمغتربين', 'للمسافرين لفترات طويلة'],
    hook: ['متتبّع المصاريف', 'لحياة عابرة للحدود.'],
    currencies: ['كل دولة', 'بعملتها الخاصة.'],
    journey: ['رحلتك', 'على كرة أرضية.'],
    total: ['محفظة لكل دولة.', 'إجمالي واحد.'],
    totalLabel: 'إجمالي الرحلة',
    totalSub: '9 دول · 8 عملات',
    cost: ['قارن بين الدول', 'قبل أن تسافر.'],
    home: { currency: 'USD' },
    reference: { code: 'MX', name: 'المكسيك', label: 'أنت هنا' },
    legendTitle: 'مسعّرة مقارنةً بـ',
    bands: ['النصف أو أقل', 'أرخص', 'متقاربة', 'أغلى', 'الضعف أو أكثر'],
    screens: [
      { shot: 'entry', caption: ['سجّلها', 'في ثوانٍ.'] },
      { shot: 'capture', caption: ['مدفوعات', 'تُضاف تلقائيًا.'] },
    ],
    name: 'Nomad Budget',
    tagline: 'متتبّع مصاريف متعدد العملات',
    cta: 'حمّل الآن',
    url: 'nomadbudget.rubeeks.co',
  },
};

/**
 * Rough rates to US dollars, for the trip's total only — the figures are illustrative,
 * not a claim about any day's rate.
 */
export const USD_PER: Record<string, number> = {
  USD: 1, EUR: 1.1, MAD: 0.1, TRY: 0.024, GEL: 0.37, THB: 0.029, MYR: 0.22, IDR: 0.000062, MXN: 0.053,
};
