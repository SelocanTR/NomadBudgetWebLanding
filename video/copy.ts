// The words on screen, per language — the landing's own: the hero's title and audiences,
// the features' titles. A caption is two lines: white, then lime (the hero's title does the same). The trip's total is in the viewer's `home.currency`; the
// cost layer prices every country against `reference` — the trip's last stop, as the
// app's automatic reference follows the latest stay (and Mexico, mid-priced, is the one
// that spreads the countries over all five bands; the US painted nearly all of them
// cheaper, Thailand or Türkiye nearly all dearer).

import type { Lang } from '../src/i18n';

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
  sample: string;
};

export const COPY: Record<Lang, VideoCopy> = {
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
    cta: 'Download on the App Store',
    url: 'nomadbudget.rubeeks.co',
    sample: 'Sample journey · illustrative figures',
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
    cta: 'App Store’dan indir',
    url: 'nomadbudget.rubeeks.co',
    sample: 'Örnek yolculuk · temsilî rakamlar',
  },
};

/**
 * Rough rates to US dollars, for the trip's total only — the figures are illustrative
 * (the footer says so), not a claim about any day's rate.
 */
export const USD_PER: Record<string, number> = {
  USD: 1, EUR: 1.1, MAD: 0.1, TRY: 0.024, GEL: 0.37, THB: 0.029, MYR: 0.22, IDR: 0.000062, MXN: 0.053,
};
