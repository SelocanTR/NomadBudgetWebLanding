// The strip of country pictures behind "What is Nomad Budget?": the sample journey first, in
// the order the globe above draws it, then more places to go.
// Each tile carries what a wallet there would: the flag, the name, the currency.

import { STOPS } from './journey';
import { STRIP_CODES } from './strip-codes.mjs';
import flags from './flags.json';
import type { Lang } from '../i18n';

export type Tile = { code: string; currency: string; name: Record<Lang, string>; flag: string; src: string };

const MORE: Record<string, { currency: string; name: Record<Lang, string> }> = {
  JP: { currency: 'JPY', name: { en: 'Japan', tr: 'Japonya' } },
  PT: { currency: 'EUR', name: { en: 'Portugal', tr: 'Portekiz' } },
  VN: { currency: 'VND', name: { en: 'Vietnam', tr: 'Vietnam' } },
  GR: { currency: 'EUR', name: { en: 'Greece', tr: 'Yunanistan' } },
  IT: { currency: 'EUR', name: { en: 'Italy', tr: 'İtalya' } },
  PE: { currency: 'PEN', name: { en: 'Peru', tr: 'Peru' } },
  HR: { currency: 'EUR', name: { en: 'Croatia', tr: 'Hırvatistan' } },
  IS: { currency: 'ISK', name: { en: 'Iceland', tr: 'İzlanda' } },
  KE: { currency: 'KES', name: { en: 'Kenya', tr: 'Kenya' } },
};

const tile = (code: string, currency: string, name: Record<Lang, string>): Tile => ({
  code,
  currency,
  name,
  flag: (flags as Record<string, string>)[code],
  src: `/countries/${code.toLowerCase()}.webp`,
});

export const STRIP_TILES: Tile[] = [
  ...STOPS.map((s) => tile(s.code, s.currency, s.name)),
  ...STRIP_CODES.map((c) => tile(c, MORE[c].currency, MORE[c].name)),
];
