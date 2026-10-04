// The comparison section's longer pages: a round-up of travel budget apps, and two guides
// for people who track their money another way (a spreadsheet; a Revolut or Wise card).
// They live under /alternatives/ next to the one-to-one comparisons and follow the same
// rules (see data/alternatives.ts): every claim about another product sourced and dated,
// the other side's strengths said plainly, no prices, no logos. The text may use the same
// `[words](url)`, `**bold**` and `` `code` `` markup.
//
// Nobody here speaks in the author's voice: these are the product's pages, written as
// "we". The blog's personal stories stay on the blog.

export interface Section {
  /** An anchor for links within the page. */
  id?: string;
  h2: string;
  body?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  /** Paragraphs after the list or table. */
  after?: string[];
}

export interface Guide {
  slug: string;
  published: boolean;
  checked: string;
  /** The small label over the title. */
  kicker: string;
  title: string;
  description: string;
  coverAlt: string;
  intro: string[];
  sections: Section[];
  sources: { label: string; url: string }[];
}

const STORE = {
  nomad: 'https://apps.apple.com/us/app/nomad-budget/id6803787746',
  travelspend: 'https://apps.apple.com/us/app/travelspend-travel-budget-app/id1434284824',
  trabee: 'https://apps.apple.com/us/app/trabee-pocket-travel-budget/id673659438',
  tripcoin: 'https://apps.apple.com/us/app/tripcoin-travel-budget/id896518806',
  splitwise: 'https://apps.apple.com/us/app/splitwise/id458023433',
  tricount: 'https://apps.apple.com/us/app/tricount-split-settle-bills/id349866256',
  spendee: 'https://apps.apple.com/us/app/expense-budget-app-spendee/id635861140',
  moneylover: 'https://apps.apple.com/us/app/money-lover-money-manager/id486312413',
  toshl: 'https://apps.apple.com/us/app/toshl-finance-best-budget/id921590251',
  revolut: 'https://apps.apple.com/us/app/revolut-send-spend-and-save/id932493382',
  wise: 'https://apps.apple.com/us/app/wise-global-money-transfer/id612261027',
};

export const GUIDES: Guide[] = [
  {
    slug: 'best-travel-budget-apps',
    published: true,
    checked: '2026-10-04',
    kicker: 'Round-up',
    title: 'The best travel budget apps in 2026, by how you travel',
    description:
      'Nomad Budget, TravelSpend, Trabee Pocket, Tripcoin, Splitwise, Tricount, Spendee, Money Lover and Toshl: which one fits a holiday, a group trip, or a life across countries.',
    coverAlt: 'A row of five small stylised wallets in different colours on the window ledge of an airport lounge, planes softly blurred outside.',
    intro: [
      'There is no single best travel budget app, because there is no single way to travel. A week away with friends, a three-month trip and a life spread across countries ask different things of an app.',
      'So this list is sorted by how you travel, not ranked. We make one of the apps on it, Nomad Budget, and say so where it appears. Everything about the others comes from their own App Store listings and websites, checked on the date above.',
    ],
    sections: [
      {
        h2: 'At a glance',
        table: {
          head: ['App', 'Best for', 'Platforms', 'Last updated'],
          rows: [
            ['[Nomad Budget](#nomad-budget) (ours)', 'Living in one country after another', 'iPhone', 'Active, 2026'],
            ['[TravelSpend](#trips-and-groups)', 'Trips, alone or with a group', 'iPhone, Android', '2 October 2026'],
            ['[Trabee Pocket](#a-trip-diary)', 'A trip diary with an expense book', 'iPhone, Android', '2 October 2026'],
            ['[Tripcoin](#trips-offline)', 'Trip budgets, offline', 'iPhone, iPad', '25 August 2025'],
            ['[Splitwise](#splitting)', 'Splitting costs in a group', 'iPhone, Android, web', '20 September 2026'],
            ['[Tricount](#splitting)', 'Splitting costs, free', 'iPhone, Android', '13 July 2026'],
            ['[Spendee](#everyday-finances)', 'Everyday budgets with bank sync', 'iPhone, Android, web', '3 October 2026'],
            ['[Money Lover](#everyday-finances)', 'Everyday finances with a Travel Mode', 'iPhone, Android', '23 September 2026'],
            ['[Toshl Finance](#everyday-finances)', 'Personal finance in many currencies', 'iPhone, Android, web', '13 December 2024'],
          ],
        },
      },
      {
        id: 'nomad-budget',
        h2: 'If you live in one country after another',
        body: [
          '**Nomad Budget** (ours) is built for digital nomads, expats and long-term travellers whose money lives in more than one country. Each country you stay in gets a wallet in its own currency, every entry keeps the exchange rate of the day it was paid, and everything adds up in one main currency you choose. A [3D globe](/#features) shows your route and what each country cost you, and before a move you can see what your own way of living would cost elsewhere, from [official price levels](/blog/does-geo-arbitrage-work/).',
          'What it doesn’t do: split bills in a group, read receipts, or run on Android yet. It has no bank connection, on purpose. [Free on iPhone](app); Pro adds the comparisons built from your own spending.',
        ],
      },
      {
        id: 'trips-and-groups',
        h2: 'If you travel trip by trip, alone or with a group',
        body: [
          '**TravelSpend** is one of the most popular travel budget apps, actively developed, on iPhone and Android. It is built around trips: expenses in any currency converted to your home currency, a trip budget with your daily average, receipt photos, spreading an expense over several days, and splitting costs with the people you travel with. The free version covers one trip at a time. [Compared with Nomad Budget](/alternatives/travelspend/).',
        ],
      },
      {
        id: 'a-trip-diary',
        h2: 'If you want a trip diary and an expense book in one',
        body: [
          '**Trabee Pocket** added a lot in 2026: AI that reads receipts, a Travel Log of notes, photos and places, and a 3D globe of the countries you visited that you can save as a video. It works offline and lets you share a trip’s costs with friends; on iPhone and Android. [Compared with Nomad Budget](/alternatives/trabee-pocket/).',
        ],
      },
      {
        id: 'trips-offline',
        h2: 'If you want trip budgets that work offline',
        body: [
          '**Tripcoin** keeps historical exchange rates, allows custom rates, works without a connection and sets a daily or total budget for each trip, with receipts and the location of each expense. It has a loyal following on iPhone, but its last update was in August 2025. [Compared with Nomad Budget](/alternatives/tripcoin/).',
        ],
      },
      {
        id: 'splitting',
        h2: 'If what you need is splitting costs',
        body: [
          '**Splitwise** is the standard for sharing expenses and settling who owes whom, on phones and the web, with unequal splits, multiple payers and debt simplification. **Tricount** does the same job for free and without limits, and works offline with multiple currencies.',
          'Neither is built to follow your own spending across countries, so many travellers use one of them for the group and a budget app for themselves.',
        ],
      },
      {
        id: 'everyday-finances',
        h2: 'If you want your everyday finances, with travel on top',
        body: [
          '**Spendee** connects to banks, e-wallets and crypto wallets, has shared wallets on its paid plans and a web version; its free version has one cash wallet and one budget. [Compared with Nomad Budget](/alternatives/spendee/).',
          '**Money Lover** is a long-standing money manager with bills, debts and budgets; its Travel Mode ties every new entry to a trip. [Compared with Nomad Budget](/alternatives/money-lover/).',
          '**Toshl Finance** supports almost 200 currencies, bank sync in the US and Canada and a web app, though its iPhone app was last updated in December 2024. [Compared with Nomad Budget](/alternatives/toshl/).',
        ],
      },
      {
        h2: 'What about Trail Wallet?',
        body: [
          'Trail Wallet was a much-loved travel budget app for iPhone. Its makers shut it down in September 2022; if you still use it, export your data while the app runs. [How it compares, and how to move](/alternatives/trail-wallet/).',
        ],
      },
      {
        h2: 'How to choose',
        list: [
          'How long do you stay? A week suits a trip app; months in one country after another suit an app built around countries.',
          'Who pays? If you split costs with others, a splitting app (or an app with splitting) will save arguments.',
          'Which phone? Several of these apps are on Android; Nomad Budget is iPhone only for now.',
          'Do you want a bank connection? Some of these apps sync with banks; others, Nomad Budget among them, never ask for one.',
        ],
      },
    ],
    sources: [
      { label: 'Nomad Budget on the App Store', url: STORE.nomad },
      { label: 'TravelSpend on the App Store', url: STORE.travelspend },
      { label: 'Trabee Pocket on the App Store', url: STORE.trabee },
      { label: 'Tripcoin on the App Store', url: STORE.tripcoin },
      { label: 'Splitwise on the App Store', url: STORE.splitwise },
      { label: 'Tricount on the App Store', url: STORE.tricount },
      { label: 'Spendee on the App Store', url: STORE.spendee },
      { label: 'Money Lover on the App Store', url: STORE.moneylover },
      { label: 'Toshl Finance on the App Store', url: STORE.toshl },
      { label: 'Trail Wallet: End of an Era (Voyage Travel Apps, 2022)', url: 'https://voyagetravelapps.com/trail-wallet-end-of-an-era/' },
    ],
  },
  {
    slug: 'travel-budget-spreadsheet-or-app',
    published: true,
    checked: '2026-10-04',
    kicker: 'Guide',
    title: 'Travel budget spreadsheet or app? What each is good at',
    description:
      'A spreadsheet is free and endlessly flexible; an app is in your hand at the till. What each does well for a budget across currencies, and how to use both.',
    coverAlt: 'A stylised grid sheet folding itself into a wallet on the table of a quiet hostel common room, copper coins beside it.',
    intro: [
      'Plenty of travellers keep their budget in Google Sheets or Excel, and for good reasons. Plenty of others start one, and by the second country the sheet has fallen behind.',
      'This is an honest look at what a spreadsheet does well, where it gets hard once several currencies are involved, and how an app like Nomad Budget can sit next to it rather than replace it.',
    ],
    sections: [
      {
        h2: 'What a spreadsheet does well',
        list: [
          'It is free, and it is yours: any column, any formula, any chart.',
          'Planning: before a trip, a sheet is the best place to lay out flights, rent and a rough daily budget.',
          'Sharing and reviewing on a large screen.',
          'It lasts. A file from ten years ago still opens.',
        ],
      },
      {
        h2: 'Where it gets hard abroad',
        list: [
          '**Entering on the spot.** A coffee costs five seconds to pay and a minute to log on a phone spreadsheet. Entries pile up for “later”, and later gets lost.',
          '**The rate of the day.** To convert each entry at the rate of the day it was paid, you need a rate per row. Google Sheets can fetch one with `GOOGLEFINANCE("CURRENCY:EURUSD", "price", A2)`, which returns a small table you then have to unpack — for every row, every currency.',
          '**Many currencies at once.** Euro, lira, baht and dollars in one sheet means a currency column, a rate column and a converted column, and every summary has to use the converted one.',
          '**Countries, not just currencies.** France and Spain share the euro; a currency column alone can’t tell you what each country cost.',
          '**No signal.** Phone spreadsheets cope offline, but not always gracefully.',
        ],
      },
      {
        h2: 'What an app takes off your hands',
        body: [
          'A travel budget app is built for the moment at the till: amount, category, done. [Nomad Budget](app) puts each country in its own wallet in its own currency, keeps the [exchange rate of the day](/#faq) with every entry, and adds everything up in your main currency — no formulas. It works offline and syncs later, and it draws your route and each country’s cost on a [globe](/#features).',
        ],
      },
      {
        h2: 'Using both',
        list: [
          'Plan in the spreadsheet, track in the app.',
          'Already have years of history in a sheet? Save it as CSV or Excel and import it into Nomad Budget: it works out the columns itself and shows you a summary before anything is saved.',
          'Want the numbers back in a sheet? With Pro, Nomad Budget exports every transaction as CSV, in the currency it was paid in.',
        ],
      },
    ],
    sources: [
      { label: 'Google Docs Editors Help: GOOGLEFINANCE', url: 'https://support.google.com/docs/answer/3093281' },
      { label: 'Nomad Budget: features and FAQ', url: 'https://nomadbudget.rubeeks.co/' },
    ],
  },
  {
    slug: 'track-spending-revolut-wise',
    published: true,
    checked: '2026-10-04',
    kicker: 'Guide',
    title: 'Using Revolut or Wise abroad? How to see what each country really costs',
    description:
      'Multi-currency cards show what went through the card. What they can’t show — cash, other cards, one currency across several countries — and a simple routine for the whole picture.',
    coverAlt: 'A stylised payment card and a small globe on the counter of a street-food stall at dusk, a separate pile of copper coins beside them.',
    intro: [
      'Revolut and Wise are favourites of people who live abroad: accounts in many currencies, a card that pays in the local one, and a notification for every payment. It is tempting to treat the card’s app as your budget.',
      'It is a good start. But a card only knows about the card. Here is what it shows, what it misses, and a routine that fills the gaps in a few minutes a week.',
    ],
    sections: [
      {
        h2: 'What the card apps already do well',
        list: [
          'A notification for every payment, so nothing goes through unseen.',
          'Balances in many currencies, converted when you pay.',
          'Revolut adds budgeting and analytics tools to its app.',
          'Both let you download your statements as files.',
        ],
      },
      {
        h2: 'What they can’t see',
        list: [
          '**Cash.** Once you withdraw it, the card app sees one withdrawal, not the twenty meals it paid for.',
          '**Other cards and accounts.** The home bank card you used for rent, the credit card for the flight.',
          '**Countries.** A euro account doesn’t tell France from Spain, and a payment from your home-currency balance in Thailand is filed under that home currency.',
          '**Money that isn’t yours.** The dinner your friend paid back, the deposit you will get back next month.',
        ],
      },
      {
        h2: 'A routine that fills the gaps',
        list: [
          'Keep paying with the card — it is still one of the cheapest ways to pay abroad. (Why the rate and fees matter: [where your money goes when you pay abroad](/blog/exchange-rates-card-fees-dcc/).)',
          'Log cash on the spot in a travel budget app: amount and category, in the currency you paid in.',
          'Once a month, download your Revolut or Wise statement and import it into [Nomad Budget](app). It knows both statement layouts, asks which wallet each account’s entries belong to, keeps the rate of each entry’s day, and shows you a summary before anything is saved.',
          'Look at the whole: one total in your main currency, and on the [globe](/#features), what each country cost.',
        ],
      },
      {
        h2: 'Why the numbers may differ slightly',
        body: [
          'Your statement shows what left your account, after the card’s rate and any fee. Nomad Budget records what you paid in the local currency and converts it at a reference rate for that day. The small gap between the two is roughly the price of the conversion, and worth knowing about.',
        ],
      },
    ],
    sources: [
      { label: 'Revolut on the App Store', url: STORE.revolut },
      { label: 'Wise on the App Store', url: STORE.wise },
      { label: 'Nomad Budget: features and FAQ', url: 'https://nomadbudget.rubeeks.co/' },
    ],
  },
];

export const visibleGuides = () => GUIDES.filter((g) => g.published || import.meta.env.DEV);
export const publishedGuides = () => GUIDES.filter((g) => g.published);
export const guidePath = (g: Guide) => `/alternatives/${g.slug}/`;
