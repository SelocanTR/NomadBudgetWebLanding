// The comparison pages: Nomad Budget next to one other app at a time, under /alternatives/.
// English only — people search "<app> alternative" in English.
//
// Rules these pages live by (docs: the growth plan):
// - Every claim about another app comes from a source listed with it, and the page says
//   when it was checked. A row we could not confirm says so instead of guessing.
// - The table shows where the other app is stronger too. A comparison that only flatters
//   us is one nobody trusts, search engines included.
// - No prices: the site doesn't show ours, so it doesn't show theirs. "What the free
//   version includes" says what matters.
// - No logos, no screenshots of their apps: names only.
// - Re-check every three months; an app that gains a feature makes a stale row a wrong one.
//
// A comparison is built only under `astro dev` until `published` is true; then it joins
// the hub, the sitemap, llms.txt and the footer by itself.
//
// Each page's cover is src/assets/alternatives/<slug>.webp (the hub's is hub.webp), made
// the way the blog's covers are (docs/blog-yazim-rehberi.md §10).
//
// The prose may link with `[words](url)`: to the home page, the FAQ or a published blog
// post, so a reader who wants to know more finds it in the sentence they are reading.
// `(app)` is the App Store. Nothing else in the text is markup.

import type { ImageMetadata } from 'astro';
import { appStoreUrl } from '../i18n';

const COVERS = import.meta.glob<{ default: ImageMetadata }>('../assets/alternatives/*.webp', { eager: true });
/** A comparison's cover by its slug, or the hub's by 'hub'. */
export const coverOf = (key: string): ImageMetadata | undefined => COVERS[`../assets/alternatives/${key}.webp`]?.default;

export const ALTERNATIVES_PATH = '/alternatives/';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A sentence with its `[words](url)` links, `**bold**` and `` `code` `` as HTML,
 *  everything else escaped. */
export function linked(text: string): string {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, words: string, url: string) =>
      url === 'app'
        ? `<a href="${appStoreUrl('en')}" rel="noopener">${words}</a>`
        : `<a href="${url}"${url.startsWith('http') ? ' rel="nofollow noopener"' : ''}>${words}</a>`,
    );
}

/** The same sentence without its markup: for meta descriptions, llms.txt and the like. */
export const plain = (text: string) =>
  text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

export const HUB_COVER_ALT =
  'A stylised balance scale on a library reading table, a small globe on one pan and copper coins on the other.';

/** The rows every comparison table has, in this order. */
export const ROWS = [
  ['platforms', 'Platforms'],
  ['updates', 'Updates'],
  ['organised', 'Built around'],
  ['currencies', 'Currencies'],
  ['rates', 'Exchange rate kept per entry'],
  ['total', 'Total across countries'],
  ['budgets', 'Budgets'],
  ['offline', 'Works offline'],
  ['sharing', 'Travelling with others'],
  ['receipts', 'Receipt photos'],
  ['map', 'Map'],
  ['compare', 'Compare countries’ costs'],
  ['bank', 'Bank connection'],
  ['data', 'Import and export'],
  ['free', 'Free version includes'],
] as const;
export type RowKey = (typeof ROWS)[number][0];

/** Nomad Budget's side of every table: the same words on every page. */
export const OURS: Record<RowKey, string> = {
  platforms: 'iPhone. Not on Android yet.',
  updates: 'Active; first released in 2026',
  organised: 'One wallet per country, in that country’s currency; your trips and route are read from them',
  currencies: 'Every entry in the currency you paid in',
  rates: 'Yes: the rate of the day it was paid, kept for good',
  total: 'Everything adds up in one main currency you choose, and can change',
  budgets: 'A monthly budget with alerts (free); category and country budgets by the day or month (Pro)',
  offline: 'Yes',
  sharing: 'Shared wallets with edit or view-only access. No bill splitting or “who owes whom”.',
  receipts: 'No',
  map: 'A 3D globe of where you’ve been and what each country cost, drawn from your entries',
  compare: 'Yes: official price levels (World Bank ICP 2021, Eurostat) free; priced on your own spending with Pro',
  bank: 'None, by design',
  data: 'Imports CSV and Excel; exports CSV (Pro)',
  free: 'Unlimited entries, wallets and currencies, the globe, a monthly budget; one shared wallet, one goal, three recurring bills',
};

export interface Source { label: string; url: string }

export interface Alternative {
  slug: string;
  name: string;
  /** Who makes it, as its store listing says. */
  maker: string;
  published: boolean;
  /** When every row below was last checked against its sources. */
  checked: string;
  title: string;
  description: string;
  /** What the cover shows, concretely. */
  coverAlt: string;
  /** The opening: what the app is and why someone would look for another. */
  intro: string[];
  /** One line each: who is better served by which. */
  pickThem: string;
  pickUs: string;
  row: Partial<Record<RowKey, string>>;
  theyDoBetter: string[];
  weDoDifferently: string[];
  /** Taking your history along. */
  moving: { title: string; body: string[] };
  sources: Source[];
}

const UNSTATED = 'Not stated in its listing';

export const ALTERNATIVES: Alternative[] = [
  {
    slug: 'trail-wallet',
    coverAlt: 'A stylised open wallet on a wooden bench beside a mountain trail, a small globe rising from it and copper coins on the bench.',
    name: 'Trail Wallet',
    maker: 'Voyage Travel Apps',
    published: true,
    checked: '2026-10-04',
    title: 'A Trail Wallet alternative for long-term travellers',
    description:
      'Trail Wallet shut down in 2022. How Nomad Budget compares, what it does differently, and how to take your Trail Wallet history with you.',
    intro: [
      'Trail Wallet was one of the first travel budget apps for iPhone, made by two long-term travellers. Its makers announced in September 2022 that it was shutting down: no more updates or support, and a backup system they called unreliable since iOS 16. Copies already installed keep running, but nothing protects the data in them any more.',
      'If you are still using it, or miss it, this page is a fair look at how Nomad Budget compares, including the things Trail Wallet did that Nomad Budget doesn’t.',
    ],
    pickThem:
      'Trail Wallet can’t be downloaded any more, so the real choice is what to move to before the copy on your phone stops working.',
    pickUs:
      'Nomad Budget suits you if you stay in countries for weeks or months, want each country in its own currency, and want one total across all of them.',
    row: {
      platforms: 'iPhone and iPad',
      updates: 'Shut down in September 2022; no updates or support',
      organised: 'Trips with start and end dates',
      currencies: 'Currencies of 218 countries, in home or local currency',
      rates: 'Automatic rates when online, or a rate you enter yourself',
      total: 'Per trip, in your home currency',
      budgets: 'A daily budget that adjusts to what you have left; monthly or trip budgets',
      offline: 'Yes; rates update when online',
      sharing: 'No',
      receipts: 'Yes',
      map: 'No',
      compare: 'No',
      bank: 'No',
      data: 'Exports CSV with receipt images',
      free: 'Up to 25 items; more with an in-app purchase',
    },
    theyDoBetter: [
      'A daily budget that recalculates what you can spend today from what is left — Nomad Budget’s budgets are monthly, or daily per category and country with Pro.',
      'Receipt photos attached to an entry.',
      'Multiple tags on one entry.',
      'It ran on iPad; Nomad Budget is made for iPhone.',
    ],
    weDoDifferently: [
      'Countries rather than trips: each country you stay in gets a wallet in its own currency, and trips are read from where you spent.',
      'Every entry keeps the [exchange rate of its own day](/#faq), so a past month’s total doesn’t move when the rate does.',
      'One total across every country, in a main currency you can change at any time.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'Before a move, the cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
      'Shared wallets for travelling with a partner, and an account that syncs, so a lost phone doesn’t mean lost data.',
    ],
    moving: {
      title: 'Taking your Trail Wallet history with you',
      body: [
        'Trail Wallet can still export a trip: on the Summary screen tap Share, choose All Trip Data, then Export as CSV. Its makers recommend doing it now, while the app still runs.',
        '[Nomad Budget](app) imports CSV and Excel files and works out the columns itself. Trail Wallet isn’t one of the formats it knows by name, so check the summary it shows you; nothing is saved until you confirm, and an import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Trail Wallet: End of an Era (Voyage Travel Apps, 20 September 2022)', url: 'https://voyagetravelapps.com/trail-wallet-end-of-an-era/' },
      { label: 'Trail Wallet feature page (archived by its makers)', url: 'https://voyagetravelapps.com/trail-wallet/' },
    ],
  },
  {
    slug: 'travelspend',
    coverAlt: 'Three stylised coin pouches in a row on a train table by the window, joined by one rail line, with copper coins beside them.',
    name: 'TravelSpend',
    maker: 'Ori App Studio GmbH',
    published: true,
    checked: '2026-10-04',
    title: 'TravelSpend alternative: how Nomad Budget compares',
    description:
      'TravelSpend and Nomad Budget side by side: trips or countries, splitting costs, exchange rates, budgets and what each free version includes.',
    intro: [
      'TravelSpend is one of the most popular travel budget apps, on iPhone and Android, and it is actively developed. It is built around trips, and it is strong at what groups need: splitting costs and settling who owes whom.',
      'Nomad Budget is built around something else: a life spread across countries, each in its own currency, adding up to one total. Here is where each one is the better fit.',
    ],
    pickThem:
      'TravelSpend is the better fit for a holiday or a group trip, especially if you split costs with friends, or if you use Android.',
    pickUs:
      'Nomad Budget is the better fit if you live in one country after another for weeks or months and want each in its own currency, under one total, on iPhone.',
    row: {
      platforms: 'iPhone and Android',
      updates: 'Active; version 2.9.2 on 2 October 2026',
      organised: 'Trips',
      currencies: 'Any currency, converted to your home currency',
      rates: UNSTATED,
      total: 'Per trip, in your home currency',
      budgets: 'A trip budget, with your daily average',
      offline: 'Yes',
      sharing: 'Shared trips that sync in real time; bill splitting, balances and settling debts',
      receipts: 'Yes',
      map: UNSTATED,
      compare: 'No',
      bank: 'No',
      data: 'Exports CSV',
      free: 'Unlimited expenses on one trip at a time',
    },
    theyDoBetter: [
      'Splitting costs in a group: who owes whom, balances and settling up.',
      'Android as well as iPhone.',
      'Receipt photos, and spreading one expense over several days.',
      'A Home Screen widget with your daily average.',
      'Years of use behind it, and thousands of ratings.',
    ],
    weDoDifferently: [
      'Countries rather than trips: each country gets a wallet in its own currency, so a year of moving around isn’t forced into one “trip”.',
      'The free version has no trip or country limit: unlimited entries, wallets and currencies.',
      'Every entry keeps the [exchange rate of its own day](/#faq), and the total is in a main currency you can change at any time.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/), before you move there.',
    ],
    moving: {
      title: 'Moving from TravelSpend',
      body: [
        'Export your trips from TravelSpend as CSV, then import the file in [Nomad Budget](app) (Settings → Import). Nomad Budget works out the columns itself; TravelSpend isn’t one of the formats it knows by name, so check the summary before you confirm. An import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'TravelSpend on the App Store (version 2.9.2)', url: 'https://apps.apple.com/us/app/travelspend-travel-budget-app/id1434284824' },
      { label: 'TravelSpend website', url: 'https://travel-spend.com/' },
    ],
  },
  {
    slug: 'tripcoin',
    coverAlt: 'A stylised hourglass on an old-town stone terrace at dusk, copper coins falling through it instead of sand.',
    name: 'Tripcoin',
    maker: 'Causania',
    published: true,
    checked: '2026-10-04',
    title: 'Tripcoin alternative: how Nomad Budget compares',
    description:
      'Tripcoin and Nomad Budget side by side: trips or countries, historical exchange rates, budgets, offline use and moving your data.',
    intro: [
      'Tripcoin is a long-standing travel budget app for iPhone with a loyal following. It keeps historical exchange rates, works offline and sets a daily or total budget for each trip. Its last update was in August 2025.',
      'Nomad Budget shares much of its thinking about currencies, and differs in how it is organised. Here is a fair comparison.',
    ],
    pickThem:
      'Tripcoin suits you if you travel trip by trip, want daily trip budgets and receipt photos, and prefer your data in Dropbox or iCloud.',
    pickUs:
      'Nomad Budget suits you if you live in one country after another and want each in its own currency, one total across all of them, a globe of your route and a way to compare countries’ costs.',
    row: {
      platforms: 'iPhone and iPad',
      updates: 'Last updated 25 August 2025',
      organised: 'Trips',
      currencies: 'More than 150 currencies, with a converter',
      rates: 'Yes: historical rates are stored, and custom rates allowed',
      total: 'Per trip',
      budgets: 'A daily or total budget for each trip',
      offline: 'Yes',
      sharing: UNSTATED,
      receipts: 'Yes',
      map: 'Stores each expense’s location',
      compare: 'No',
      bank: 'No',
      data: 'Exports to Excel, Pages and Google Sheets; Dropbox and iCloud backups',
      free: 'Unlimited trips and entries',
    },
    theyDoBetter: [
      'A daily budget for each trip.',
      'Receipt photos, the location of every expense, and spreading one expense over several days.',
      'Custom categories and payment methods.',
      'Backups to your own Dropbox or iCloud.',
    ],
    weDoDifferently: [
      'Countries rather than trips: each country gets a wallet in its own currency, and trips are read from where you spent.',
      'One total across every country, in a main currency you can change at any time.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
      'Shared wallets with edit or view-only access, and an account that syncs between devices.',
      'Actively developed in 2026.',
    ],
    moving: {
      title: 'Moving from Tripcoin',
      body: [
        'Export your trips from Tripcoin to a spreadsheet, then import the CSV or Excel file in [Nomad Budget](app) (Settings → Import). Nomad Budget works out the columns itself; Tripcoin isn’t one of the formats it knows by name, so check the summary before you confirm. An import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Tripcoin on the App Store (version 4.5)', url: 'https://apps.apple.com/us/app/tripcoin-travel-budget/id896518806' },
    ],
  },
  {
    slug: 'toshl',
    coverAlt: 'A stylised wallet resting on a crate of oranges at an outdoor market, a small globe tucked inside and copper coins spilling out.',
    name: 'Toshl Finance',
    maker: 'Toshl Inc.',
    published: true,
    checked: '2026-10-04',
    title: 'Toshl alternative for travellers and digital nomads',
    description:
      'Toshl Finance and Nomad Budget side by side: a personal finance app with bank sync, and an expense tracker built for life across countries.',
    intro: [
      'Toshl Finance is a well-known personal finance app with almost 200 currencies, bank sync in the US and Canada, flexible budgets and a web app. Many people who travel use it for its currency support. Its iPhone app was last updated in December 2024.',
      'Nomad Budget is narrower: an expense tracker made for money spent across countries, without a bank connection. Here is how the two compare for someone on the move.',
    ],
    pickThem:
      'Toshl suits you if you want your whole financial life in one place — accounts, bank sync, bills — on iPhone, Android and the web.',
    pickUs:
      'Nomad Budget suits you if what you need to follow is spending across countries: a wallet per country, the rate of each day, one total, and what each country cost you.',
    row: {
      platforms: 'iPhone, Android and a web app',
      updates: 'iPhone app last updated 13 December 2024',
      organised: 'Accounts, categories and tags',
      currencies: 'Almost 200 currencies, including 30 cryptocurrencies',
      rates: UNSTATED,
      total: 'Across accounts, in your main currency',
      budgets: 'Budgets for any period, by category, tag or account, with rollover',
      offline: UNSTATED,
      sharing: 'Sync across your own devices',
      receipts: 'Yes (paid plans)',
      map: 'A map of expense locations',
      compare: 'No',
      bank: 'Yes, US and Canada (paid plan)',
      data: 'Imports bank files (CSV, Excel, QIF, OFX and more) in the web app',
      free: '2 financial accounts and 2 budgets',
    },
    theyDoBetter: [
      'Bank and card sync in the US and Canada.',
      'A web app for working on a large screen, and Android.',
      'More flexible budgets: any period, by tag or account, with rollover.',
      'Bill reminders and a wider view of personal finance than travel spending.',
    ],
    weDoDifferently: [
      'Built for life across countries: a wallet per country in its own currency, created from where you are.',
      'Every entry keeps the [exchange rate of its own day](/#faq).',
      'No bank connection at all, by design — it works the same with cash, foreign cards and any bank in any country.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
      'Unlimited wallets and currencies in the free version.',
    ],
    moving: {
      title: 'Moving from Toshl',
      body: [
        'Export your entries from Toshl, then import the file in [Nomad Budget](app) (Settings → Import). Nomad Budget knows the layout of Toshl’s export, and shows you a summary before anything is saved. An import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Toshl Finance on the App Store (version 3.5.13)', url: 'https://apps.apple.com/us/app/toshl-finance-best-budget/id921590251' },
      { label: 'Toshl website', url: 'https://toshl.com/' },
    ],
  },
  {
    slug: 'trabee-pocket',
    name: 'Trabee Pocket',
    maker: 'jhcho (Trabee)',
    published: true,
    checked: '2026-10-04',
    coverAlt: 'A stylised globe ringed by orbiting copper coins on the seats of an airport departure gate, planes blurred behind the glass.',
    title: 'Trabee Pocket alternative: how Nomad Budget compares',
    description:
      'Trabee Pocket and Nomad Budget side by side: two apps with a 3D globe, one built around trips and a travel log, the other around countries and their cost.',
    intro: [
      'Trabee Pocket is a long-running travel budget app on iPhone and Android. Its September 2026 update added a lot: AI that reads receipts, a Travel Log that keeps notes, photos and places like a chat, and a 3D globe of the countries you have visited that you can save as a video.',
      'Nomad Budget has a globe too, so the two can look alike at first. They are built around different things: Trabee Pocket around trips and their memories, Nomad Budget around the countries you live in and what each one costs. Here is a fair look at both.',
    ],
    pickThem:
      'Trabee Pocket suits you if you want a trip diary and an expense book in one: receipts read by AI, photos and notes, a globe video to share, on iPhone or Android.',
    pickUs:
      'Nomad Budget suits you if you stay in countries for weeks or months and want each in its own currency, one total across all of them, and to see what each country costs you.',
    row: {
      platforms: 'iPhone and Android',
      updates: 'Active; version 5.1.0 on 2 October 2026',
      organised: 'Trips, with a Travel Log of notes, photos, places and receipts',
      currencies: 'Converts to your home currency with daily rates; “multi-currency support” is listed as a Pro feature',
      rates: UNSTATED,
      total: 'In your home currency',
      budgets: 'A budget, with what you have left today',
      offline: 'Yes',
      sharing: 'Share a trip’s expenses with friends and split costs',
      receipts: 'Yes, read by AI (unlimited with Pro)',
      map: 'A 3D globe of the countries you visited and the routes between them, saved as a video',
      compare: 'No',
      bank: 'No',
      data: 'Exports PDF, CSV and Excel (Pro)',
      free: 'Trip budgets, the Travel Log and the globe; some AI receipt scans',
    },
    theyDoBetter: [
      'Receipts read by AI: amount, shop and currency from a photo.',
      'A Travel Log that turns the expense book into a trip diary, with photos and places.',
      'A globe video made to share with friends.',
      'Splitting a trip’s costs with friends, and Android as well as iPhone.',
      'Cash and card kept apart.',
    ],
    weDoDifferently: [
      'Countries rather than trips: each country gets a wallet in its own currency, and trips are read from where you spent.',
      'Every entry keeps the [exchange rate of its own day](/#faq), and every currency is free to use.',
      'The [globe](/#features) also shows what each country cost you, and colours the world by how expensive it is compared with where you are.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
      'Imports your history from CSV and Excel files.',
    ],
    moving: {
      title: 'Moving from Trabee Pocket',
      body: [
        'Exporting from Trabee Pocket is a Pro feature: export a trip as CSV or Excel, then import the file in [Nomad Budget](app) (Settings → Import). Nomad Budget works out the columns itself; Trabee Pocket isn’t one of the formats it knows by name, so check the summary before you confirm. An import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Trabee Pocket on the App Store (version 5.1.0)', url: 'https://apps.apple.com/us/app/trabee-pocket-travel-budget/id673659438' },
      { label: 'Trabee Pocket website', url: 'https://trabeepocket.com/' },
    ],
  },
  {
    slug: 'spendee',
    name: 'Spendee',
    maker: 'Cleevio s.r.o.',
    published: true,
    checked: '2026-10-04',
    coverAlt: 'A stylised wallet with three coloured tabs on the wooden bench of a ferry deck, the sea and a coastline softly blurred behind.',
    title: 'Spendee alternative for travellers and digital nomads',
    description:
      'Spendee and Nomad Budget side by side: a budgeting app with bank sync and wallets, and an expense tracker with a wallet for every country.',
    intro: [
      'Spendee is a popular budgeting app on iPhone, Android and the web. It connects to banks, e-wallets and crypto wallets, sorts spending into categories and wallets, and handles more than one currency. Many people use it for everyday money and take it along when they travel.',
      'Nomad Budget is narrower and made for one situation: money spent across countries. Here is where each is the better fit.',
    ],
    pickThem:
      'Spendee suits you if you want your everyday finances in one place, with bank sync, a web version and shared wallets for a household.',
    pickUs:
      'Nomad Budget suits you if you move between countries and want a wallet for each, the rate of each day kept, one total, and no bank connection at all.',
    row: {
      platforms: 'iPhone, Android and a web version',
      updates: 'Active; version 6.0.6 on 3 October 2026',
      organised: 'Wallets for cash, bank accounts or occasions; categories and labels',
      currencies: 'Multiple currencies',
      rates: UNSTATED,
      total: 'An overview of all your wallets',
      budgets: 'Budgets by category, with progress notifications',
      offline: UNSTATED,
      sharing: 'Shared wallets with a partner or flatmates (paid plans)',
      receipts: 'Yes, with an AI receipt scanner',
      map: UNSTATED,
      compare: 'No',
      bank: 'Yes: banks, e-wallets and crypto wallets',
      data: 'Imports and exports transactions',
      free: '1 cash wallet and 1 budget',
    },
    theyDoBetter: [
      'Bank, e-wallet and crypto wallet connections.',
      'A web version, and Android as well as iPhone.',
      'Home Screen widgets and an AI receipt scanner.',
      'Labels for slicing your spending in more ways.',
    ],
    weDoDifferently: [
      'A wallet for every country, created from where you are, in that country’s currency — and unlimited wallets in the free version.',
      'Every entry keeps the [exchange rate of its own day](/#faq).',
      'No bank connection, by design: it works the same with cash, foreign cards and any bank in any country.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
    ],
    moving: {
      title: 'Moving from Spendee',
      body: [
        'Export your transactions from Spendee, then import the file in [Nomad Budget](app) (Settings → Import). Nomad Budget knows the layout of Spendee’s export and shows you a summary before anything is saved. An import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Spendee on the App Store (version 6.0.6)', url: 'https://apps.apple.com/us/app/expense-budget-app-spendee/id635861140' },
      { label: 'Spendee pricing', url: 'https://www.spendee.com/pricing' },
    ],
  },
  {
    slug: 'money-lover',
    name: 'Money Lover',
    maker: 'Finsify JSC',
    published: true,
    checked: '2026-10-04',
    coverAlt: 'A stylised compass with copper coins resting on a seaside promenade railing, the sea and a lighthouse softly blurred behind.',
    title: 'Money Lover alternative for travellers and digital nomads',
    description:
      'Money Lover and Nomad Budget side by side: a money manager with a Travel Mode, and an expense tracker built around the countries you live in.',
    intro: [
      'Money Lover is a long-standing money manager on iPhone and Android, with budgets, bill reminders, debts and support for many currencies. For trips it has Events and a Travel Mode: switch it on, and every entry you add is tied to that trip.',
      'Nomad Budget starts from the other end: instead of tagging a trip onto your everyday finances, every country you stay in has its own wallet. Here is how the two compare.',
    ],
    pickThem:
      'Money Lover suits you if you want one app for your whole financial life — bills, debts, savings — and occasionally a trip on top of it.',
    pickUs:
      'Nomad Budget suits you if travel is your everyday life: a wallet per country in its own currency, the rate of each day kept, one total, and a globe of where your money went.',
    row: {
      platforms: 'iPhone and Android',
      updates: 'Active; version 8.89.0 on 23 September 2026',
      organised: 'Wallets and categories; Events for trips, with a Travel Mode that tags every new entry',
      currencies: 'Multi-currency support',
      rates: UNSTATED,
      total: UNSTATED,
      budgets: 'Budgets; detailed category budgets with Premium',
      offline: UNSTATED,
      sharing: 'Sync across your own devices',
      receipts: UNSTATED,
      map: UNSTATED,
      compare: 'No',
      bank: 'Linked wallets, a paid service for banks in the Philippines, Malaysia, Singapore, Vietnam, Thailand, Indonesia and more',
      data: 'Export to Google Sheets (Premium)',
      free: 'The basics with ads; multiple wallets, category budgets and export with Premium',
    },
    theyDoBetter: [
      'A wider view of personal finance: bill reminders, debts and savings goals.',
      'Bank links in several Southeast Asian countries.',
      'Android as well as iPhone, and a Home Screen widget.',
      'Premium can be bought once instead of as a subscription.',
    ],
    weDoDifferently: [
      'Countries instead of events: each country has its own wallet in its own currency, so nothing needs switching on when you arrive.',
      'Every entry keeps the [exchange rate of its own day](/#faq).',
      'Unlimited wallets and currencies in the free version, and no ads.',
      'A [3D globe](/#features) of your route and of what each country cost you.',
      'The cost of your own way of living in another country, from [official price levels](/blog/does-geo-arbitrage-work/).',
    ],
    moving: {
      title: 'Moving from Money Lover',
      body: [
        'Export your transactions from Money Lover, then import the file in [Nomad Budget](app) (Settings → Import). Nomad Budget knows the layout of Money Lover’s export, including the way it writes decimal commas, and was tested on a real export of several thousand entries. You see a summary before anything is saved, and an import can be undone for seven days.',
      ],
    },
    sources: [
      { label: 'Money Lover on the App Store (version 8.89.0)', url: 'https://apps.apple.com/us/app/money-lover-money-manager/id486312413' },
      { label: 'Money Lover help: How to use Events and Travel Mode', url: 'https://moneylover.zendesk.com/hc/en-us/articles/35969009741337-How-to-use-Events-and-Travel-Mode' },
    ],
  },
];

/** The comparisons a build shows: all of them under `astro dev`, the published ones otherwise. */
export const visibleAlternatives = () => ALTERNATIVES.filter((a) => a.published || import.meta.env.DEV);
export const publishedAlternatives = () => ALTERNATIVES.filter((a) => a.published);
export const alternativePath = (a: Alternative) => `${ALTERNATIVES_PATH}${a.slug}/`;
