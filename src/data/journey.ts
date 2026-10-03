// The hero's sample journey. Figures are illustrative — plausible monthly spends for a
// nomad in each country, in its own currency. The footer says so.

import { JOURNEY_CODES } from './journey-codes.mjs';
import geo from './geo.json';
import flags from './flags.json';
import type { Lang } from '../i18n';

export type Transport = 'flight' | 'train' | 'bus' | 'ferry' | 'car';

export type Stop = { code: string; currency: string; amount: number; name: Record<Lang, string> };

export const STOPS: Stop[] = [
  { code: 'FR', currency: 'EUR', amount: 2100, name: { en: 'France', tr: 'Fransa' } },
  { code: 'ES', currency: 'EUR', amount: 1550, name: { en: 'Spain', tr: 'İspanya' } },
  { code: 'MA', currency: 'MAD', amount: 14500, name: { en: 'Morocco', tr: 'Fas' } },
  { code: 'TR', currency: 'TRY', amount: 48000, name: { en: 'Turkey', tr: 'Türkiye' } },
  { code: 'GE', currency: 'GEL', amount: 3100, name: { en: 'Georgia', tr: 'Gürcistan' } },
  { code: 'TH', currency: 'THB', amount: 38000, name: { en: 'Thailand', tr: 'Tayland' } },
  { code: 'MY', currency: 'MYR', amount: 4900, name: { en: 'Malaysia', tr: 'Malezya' } },
  { code: 'ID', currency: 'IDR', amount: 18500000, name: { en: 'Indonesia', tr: 'Endonezya' } },
  { code: 'MX', currency: 'MXN', amount: 24000, name: { en: 'Mexico', tr: 'Meksika' } },
];

/** How each crossing is made: leg i goes from stop i to stop i + 1; the last closes the loop. */
const LEGS: Transport[] = ['train', 'ferry', 'flight', 'car', 'flight', 'bus', 'ferry', 'flight', 'flight'];

const LOCALE: Record<Lang, string> = { en: 'en-US', tr: 'tr-TR' };

function money(lang: Lang, currency: string, value: number) {
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

export type HeroStop = { code: string; name: string; lonLat: [number, number]; amount: string };
export type HeroJourney = { stops: HeroStop[]; legs: Transport[] };

export function heroJourney(lang: Lang): HeroJourney {
  if (STOPS.map((s) => s.code).join() !== JOURNEY_CODES.join()) throw new Error('journey stops out of step with journey-codes.mjs');
  return {
    legs: LEGS,
    stops: STOPS.map((s) => ({
      code: s.code,
      name: s.name[lang],
      lonLat: (geo as unknown as Record<string, [number, number]>)[s.code],
      amount: money(lang, s.currency, s.amount),
    })),
  };
}
