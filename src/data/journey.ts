// The hero's sample journey. Figures are illustrative — plausible monthly spends for a
// nomad in each country, in its own currency. The footer says so.

import { JOURNEY_CODES } from './journey-codes.mjs';
import geo from './geo.json';
import flags from './flags.json';
import type { Lang } from '../i18n';

export type Transport = 'flight' | 'train' | 'bus' | 'ferry' | 'car';

/** A spend's category, drawn as an emoji. */
export type Spend = 'rent' | 'groceries' | 'cafe' | 'restaurant' | 'transport' | 'coworking';
const SPEND_ICON: Record<Spend, string> = { rent: '🏠', groceries: '🛒', cafe: '☕', restaurant: '🍽️', transport: '🚕', coworking: '💻' };

/**
 * `spends`: what bursts out of the stop's chip on arrival (Hero.astro) — single entries
 * of a month there, as a nomad would log them, in the country's currency. Six a stop, of
 * which each burst shows a random three to six (hero.ts). Illustrative, as the monthly
 * figures are.
 */
export type Stop = { code: string; currency: string; amount: number; name: Record<Lang, string>; spends: [Spend, number][] };

export const STOPS: Stop[] = [
  { code: 'FR', currency: 'EUR', amount: 2100, name: { en: 'France', tr: 'Fransa' }, spends: [['rent', 1100], ['groceries', 64], ['cafe', 4], ['restaurant', 38], ['transport', 16], ['coworking', 220]] },
  { code: 'ES', currency: 'EUR', amount: 1550, name: { en: 'Spain', tr: 'İspanya' }, spends: [['rent', 850], ['groceries', 48], ['cafe', 3], ['restaurant', 26], ['transport', 12], ['coworking', 160]] },
  { code: 'MA', currency: 'MAD', amount: 14500, name: { en: 'Morocco', tr: 'Fas' }, spends: [['rent', 6500], ['groceries', 420], ['cafe', 25], ['transport', 60], ['restaurant', 180], ['coworking', 1200]] },
  { code: 'TR', currency: 'TRY', amount: 48000, name: { en: 'Turkey', tr: 'Türkiye' }, spends: [['rent', 22000], ['groceries', 1850], ['cafe', 120], ['restaurant', 650], ['transport', 300], ['coworking', 4500]] },
  { code: 'GE', currency: 'GEL', amount: 3100, name: { en: 'Georgia', tr: 'Gürcistan' }, spends: [['rent', 1600], ['groceries', 140], ['cafe', 9], ['restaurant', 55], ['transport', 6], ['coworking', 350]] },
  { code: 'TH', currency: 'THB', amount: 38000, name: { en: 'Thailand', tr: 'Tayland' }, spends: [['rent', 15000], ['groceries', 900], ['cafe', 75], ['transport', 120], ['restaurant', 250], ['coworking', 3500]] },
  { code: 'MY', currency: 'MYR', amount: 4900, name: { en: 'Malaysia', tr: 'Malezya' }, spends: [['rent', 2200], ['groceries', 160], ['cafe', 12], ['restaurant', 35], ['transport', 18], ['coworking', 450]] },
  { code: 'ID', currency: 'IDR', amount: 18500000, name: { en: 'Indonesia', tr: 'Endonezya' }, spends: [['rent', 7500000], ['groceries', 450000], ['cafe', 35000], ['transport', 60000], ['restaurant', 85000], ['coworking', 1500000]] },
  { code: 'MX', currency: 'MXN', amount: 24000, name: { en: 'Mexico', tr: 'Meksika' }, spends: [['rent', 12000], ['groceries', 900], ['cafe', 65], ['restaurant', 380], ['transport', 90], ['coworking', 2800]] },
];

/** How each crossing is made: leg i goes from stop i to stop i + 1; the last closes the loop. */
const LEGS: Transport[] = ['train', 'ferry', 'flight', 'car', 'flight', 'bus', 'ferry', 'flight', 'flight'];

/** The App Store cover is made in Arabic too, though the site is not. Names as the app gives them. */
export type CoverLang = Lang | 'ar';
const AR_NAMES: Record<string, string> = {
  FR: 'فرنسا', ES: 'إسبانيا', MA: 'المغرب', TR: 'تركيا', GE: 'جورجيا',
  TH: 'تايلاند', MY: 'ماليزيا', ID: 'إندونيسيا', MX: 'المكسيك',
};

// Arabic with Latin digits, as the app writes it.
const LOCALE: Record<CoverLang, string> = { en: 'en-US', tr: 'tr-TR', ar: 'ar-u-nu-latn' };

function money(lang: CoverLang, currency: string, value: number) {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    // ₾, ฿, RM, Rp — but MX$ for pesos, whose narrow "$" would read as dollars.
    currencyDisplay: currency === 'MXN' ? 'symbol' : 'narrowSymbol',
    maximumFractionDigits: 0,
  };
  if (value >= 1e6) Object.assign(opts, { notation: 'compact', maximumFractionDigits: 1 });
  return new Intl.NumberFormat(LOCALE[lang], opts).format(value);
}

/** A round flag: the app's SVG, told to fill its box. */
export const flagSvg = (code: string) =>
  (flags as Record<string, string>)[code].replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" ');

export type HeroStop = { code: string; name: string; lonLat: [number, number]; amount: string; spends: { icon: string; amount: string }[] };
export type HeroJourney = { stops: HeroStop[]; legs: Transport[] };

export function heroJourney(lang: CoverLang): HeroJourney {
  if (STOPS.map((s) => s.code).join() !== JOURNEY_CODES.join()) throw new Error('journey stops out of step with journey-codes.mjs');
  return {
    legs: LEGS,
    stops: STOPS.map((s) => ({
      code: s.code,
      name: lang === 'ar' ? AR_NAMES[s.code] : s.name[lang],
      lonLat: (geo as unknown as Record<string, [number, number]>)[s.code],
      amount: money(lang, s.currency, s.amount),
      spends: s.spends.map(([cat, v]) => ({ icon: SPEND_ICON[cat], amount: money(lang, s.currency, v) })),
    })),
  };
}
