// Every word on the site, in both languages. One shape for both (`Strings`), so a
// section added to one and not the other is a type error, not a hole on the page.

export type Lang = 'en' | 'tr';

export const SITE = 'https://nomadbudget.rubeeks.co';
export const APP_STORE_ID = '6803787746';
export const CONTACT = 'nomadbudget@rubeeks.co';
export const LEGAL = 'https://legal.rubeeks.co/nomadbudget';

export const appStoreUrl = (lang: Lang) =>
  `https://apps.apple.com/${lang === 'tr' ? 'tr' : 'us'}/app/nomad-budget/id${APP_STORE_ID}`;

export const pathFor = (lang: Lang) => (lang === 'tr' ? '/tr/' : '/');
export const blogPath = (lang: Lang) => `${pathFor(lang)}blog/`;
export const postPath = (lang: Lang, slug: string) => `${blogPath(lang)}${slug}/`;

/** The blog's topics; every post has one. */
export const TOPICS = ['money', 'living-costs', 'rent', 'travel', 'tracking'] as const;
export type Topic = (typeof TOPICS)[number];

type Feature = { key: string; shot: string; accent: string; title: [string, string]; body: string; points: string[] };
type Card = { art: string; title: string; body: string };
type Blog = {
  title: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  empty: string;
  /** "{n}" is the minutes. */
  minRead: string;
  updated: string;
  disclaimer: string;
  aboutAuthor: string;
  authorTagline: string;
  authorBio: string;
  authorMore: string;
  cta: { title: string; body: string };
  related: string;
  /** The home page's section with the newest posts. */
  latest: string;
  all: string;
  rss: string;
  topics: Record<Topic, string>;
};

export type Strings = {
  locale: string;
  meta: { title: string; description: string; ogAlt: string };
  nav: { features: string; privacy: string; faq: string; blog: string; download: string; langName: string; otherLang: string };
  hero: {
    eyebrow: string;
    /** The eyebrow on a phone: one audience at a time, rolling through these. */
    audiences: string[];
    title: [string, string];
    lede: string;
    cta: string;
    qr: string;
    android: string;
    pause: string;
    play: string;
    globeAlt: string;
    perMonth: string;
  };
  what: { title: string; body: string };
  features: { eyebrow: string; title: string; items: Feature[] };
  more: { title: string; items: Card[] };
  steps: { title: string; items: { title: string; body: string }[] };
  audience: { title: string; body: string; items: { title: string; body: string }[] };
  privacy: { eyebrow: string; title: [string, string]; body: string; items: { title: string; body: string }[] };
  plans: {
    title: string;
    body: string;
    free: { name: string; tagline: string; items: string[] };
    pro: { name: string; tagline: string; items: string[] };
    note: string;
  };
  faq: { title: string; items: { q: string; a: string }[] };
  final: { title: string; body: string };
  footer: { tagline: string; legal: string; privacy: string; terms: string; kvkk?: string; disclaimer: string; licenses: string; contact: string; compare: string; imagery: string; rights: string };
  notFound: { title: string; body: string; home: string };
  blog: Blog;
};

const en: Strings = {
  locale: 'en_US',
  meta: {
    title: 'Nomad Budget — Multi-Currency Expense Tracker for Digital Nomads',
    description:
      'Nomad Budget is an expense tracker app for digital nomads, expats and long-term travellers: one wallet per country in its own currency, one total in yours, and your journey on a 3D globe.',
    ogAlt: 'Nomad Budget: a globe with a travel route and what each country cost',
  },
  nav: { features: 'Features', privacy: 'Privacy', faq: 'FAQ', blog: 'Blog', download: 'Download', langName: 'English', otherLang: 'Türkçe' },
  hero: {
    eyebrow: 'For digital nomads, expats and long-term travellers',
    audiences: ['For digital nomads', 'For expats', 'For long-term travellers'],
    title: ['The expense tracker', 'for life across borders.'],
    lede:
      'Every country you spend in gets its own wallet, in its own currency. Nomad Budget adds it all up in the currency you choose, and draws your journey on a globe as you travel.',
    cta: 'Download Now',
    qr: 'Scan with your phone camera',
    android: 'Android isn’t available yet — Nomad Budget is on iPhone for now.',
    pause: 'Pause the globe',
    play: 'Play the globe',
    globeAlt:
      'An animated globe showing a sample journey: France to Spain by train, a ferry to Morocco, a flight to Turkey, a drive to Georgia, a flight to Thailand, a bus to Malaysia, a ferry to Indonesia and a flight to Mexico. Each country shows its monthly spend in its own currency.',
    perMonth: '/mo',
  },
  what: {
    title: 'What is Nomad Budget?',
    body:
      'Nomad Budget is an expense tracker app for digital nomads, expats and long-term travellers. Most budget apps assume you live in one country and spend in one currency. Nomad Budget is made for the opposite: a life that keeps moving, and money that lives in several countries at once.',
  },
  features: {
    eyebrow: 'Features',
    title: 'Built for money that crosses borders',
    items: [
      {
        key: 'total',
        shot: 'total',
        accent: 'lime',
        title: ['One wallet per country.', 'One total.'],
        body:
          'Euros in Portugal, lira in Turkey, dollars back home. Each entry stays in the currency you actually paid, and your Total screen brings every wallet together in your main currency.',
        points: ['No mental exchange rates', 'Rates of the day you paid, not of today', 'Spending by category across every country'],
      },
      {
        key: 'entry',
        shot: 'entry',
        accent: 'magenta',
        title: ['Log it', 'in seconds.'],
        body:
          'A calculator keyboard, your recent categories one tap away, and the currency already set by the wallet you’re in. Add an expense on the way out of the café, not at the end of the day.',
        points: ['Calculator keyboard with maths built in', 'Recent categories and notes', 'Yesterday, today or any date'],
      },
      {
        key: 'capture',
        shot: 'capture',
        accent: 'lime',
        title: ['Payments that', 'add themselves.'],
        body:
          'Set up an iPhone automation once, and every Apple Pay payment and bank text message is handed to Nomad Budget as it happens: the amount, the currency and the shop, waiting for your OK. Nothing is recorded until you confirm it.',
        points: ['Apple Pay and bank text messages', 'Nothing saved until you confirm', 'What is read never leaves your phone'],
      },
      {
        key: 'journey',
        shot: 'journey',
        accent: 'blue',
        title: ['Your journey', 'on a globe.'],
        body:
          'Every entry remembers where it happened. Countries fill in as you travel, your route draws itself from one stop to the next, and each stop shows what it cost you. Flip to the cost view to see every country by what it actually cost.',
        points: ['Countries fill in as you go', 'Your route, stop by stop', 'Filter by year, the last 12 months, a trip or how you travelled'],
      },
      {
        key: 'compare',
        shot: 'compare',
        accent: 'orange',
        title: ['Compare countries', 'before you go.'],
        body:
          'Thinking about your next base? Nomad Budget prices your own spending pattern in another country, category by category — so the comparison is about how you live, not a generic index. Lived in both? See what you actually spent in each, side by side.',
        points: ['World Bank and Eurostat price levels, rent included', 'Your own basket, not an average one', 'See where you’d spend less — and on what'],
      },
      {
        key: 'crossings',
        shot: 'crossings',
        accent: 'lime',
        title: ['Every border,', 'on a timeline.'],
        body:
          'Add how you got there — plane, train, bus, ferry or car — and your crossings line up on a timeline, with a digital passport of every country you have spent money in.',
        points: ['Plane, train, bus, ferry, car', 'A passport of your countries', 'Crossings filtered by country'],
      },
      {
        key: 'pace',
        shot: 'pace',
        accent: 'blue',
        title: ['Know your pace', 'before the month ends.'],
        body:
          'Your spending pace compares this month with the last one while it’s still happening, so you can slow down in time — not find out afterwards.',
        points: ['This month against the last', 'Countries and goals at a glance', 'Every month back to your first'],
      },
      {
        key: 'budget',
        shot: 'budget',
        accent: 'orange',
        title: ['A budget that', 'travels with you.'],
        body:
          'Set a monthly budget and watch it fill as you spend, in your own currency whichever country you are in. You hear about it at 80% and again if you go over, while there is still time to change course.',
        points: ['A monthly budget, free', 'Alerts at 80% and when you go over', 'Category and country budgets with Pro, by the day or the month'],
      },
    ],
  },
  more: {
    title: 'And everything a traveller needs',
    items: [
      { art: 'slide-money', title: 'Shared wallets', body: 'Travelling with someone? Invite them by QR code or a link, with edit or view-only access. Everyone logs into the same place and sees the same numbers.' },
      { art: 'slide-plan', title: 'Goals', body: 'Put money aside for the next trip or a winter somewhere warm, and watch the goal fill up.' },
      { art: 'reminders', title: 'Recurring bills', body: 'Rent, subscriptions, insurance — set them once and they record themselves when they’re due.' },
      { art: 'import', title: 'Bring your history', body: 'Moving from another app? Import a CSV or Excel file. The file is read on your phone, never uploaded.' },
      { art: 'all-set', title: 'Works offline', body: 'No signal on the train? Entries are saved on the device and sync when you’re back online.' },
      { art: 'slide-journey', title: 'Many languages', body: 'In your language, including English, Turkish, Spanish, French, Russian and Arabic, with light and dark themes.' },
    ],
  },
  steps: {
    title: 'Up and running in a minute',
    items: [
      { title: 'Say where you are', body: 'The country you’re in becomes your first wallet, in its own currency.' },
      { title: 'Log what you spend', body: 'A few taps per expense. Switch countries and the currency follows.' },
      { title: 'See the whole picture', body: 'Your total in your currency, your pace, and your journey on the globe.' },
    ],
  },
  audience: {
    title: 'Made for people who don’t stay put',
    body: 'If your money moves between countries, Nomad Budget keeps it in one place.',
    items: [
      { title: 'Digital nomads', body: 'A new country every month or two, and one clear number at the end of it.' },
      { title: 'Expats', body: 'A salary in one currency, a life in another, and family back home.' },
      { title: 'Long-term travellers', body: 'Months on the road, a budget to stretch, and a route worth remembering.' },
      { title: 'Two-country lives', body: 'Half the year here, half there — two wallets, one total.' },
      { title: 'Geo-arbitrage & FIRE', body: 'Find out where your own lifestyle costs less before you move.' },
      { title: 'Couples & travel partners', body: 'One shared wallet for the trip, your own wallets for the rest.' },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: ['Your spending.', 'Not your bank.'],
    body: 'You enter what you spend; Nomad Budget tells you what it means. No bank login, no ads, no third-party tracking.',
    items: [
      { title: 'No bank connection', body: 'Nomad Budget never asks for your bank login or card details. Payments caught from your bank’s messages are read on your phone and wait for your OK.' },
      { title: 'Your data isn’t sold', body: 'No ads, no data brokers, no third-party analytics. Usage is measured on our own server, never with your amounts or notes.' },
      { title: 'Location stays coarse', body: 'Only the country is read, to pick the right wallet. Your position is never stored or read in the background.' },
      { title: 'Yours to delete', body: 'Try it without an account, and delete your account and all its data from inside the app at any time.' },
    ],
  },
  plans: {
    title: 'Free to use. Pro when you want more.',
    body: 'Keeping records is never limited. Pro adds the insight on top of them.',
    free: {
      name: 'Free',
      tagline: 'Everything you need to track spending across countries',
      items: [
        'Unlimited entries, wallets and currencies',
        'Total in your main currency',
        'Globe, route, crossings and passport',
        'Official price levels for countries worldwide',
        'Your countries ranked by what they cost you',
        'A monthly budget with alerts',
        'One shared wallet, one goal and three recurring bills',
        'Offline use and CSV / Excel import',
      ],
    },
    pro: {
      name: 'Pro',
      tagline: 'Insight built from your own spending',
      items: [
        'Country comparison built from your own spending',
        'What a month in a country would cost you',
        'Category and country budgets with alerts',
        'Export every transaction as CSV',
        'Unlimited goals, recurring transactions and shared wallets',
      ],
    },
    note: 'Pro is an optional in-app subscription, monthly or yearly; the yearly plan starts with a free trial. If it ends, nothing you recorded is lost.',
  },
  faq: {
    title: 'Questions, answered',
    items: [
      {
        q: 'What is Nomad Budget?',
        a: 'An expense tracker app for people whose money lives in more than one country. It keeps one wallet per country in its own currency, adds everything up in the main currency you choose, and shows your travels and their cost on a 3D globe.',
      },
      {
        q: 'Is Nomad Budget a good budget app for digital nomads?',
        a: 'It was built for them. Each country gets its own wallet, each entry keeps the exchange rate of its day, the total is always in your own currency, and before your next move you can see what your way of living would cost there.',
      },
      {
        q: 'How does it handle different currencies?',
        a: 'Every wallet has its own currency and every entry is stored in the currency you paid in, converted at that day’s exchange rate. The Total screen adds all wallets up in the main currency you pick in Settings, and you can change it at any time.',
      },
      {
        q: 'Does it connect to my bank?',
        a: 'No. Nomad Budget never asks for bank logins or card details. You log what you spend yourself, or let an iPhone automation hand it Apple Pay payments and bank text messages to confirm — which also means it works with cash, foreign cards and any bank in any country.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Entries are saved on your phone and sync to your account once you’re back online.',
      },
      {
        q: 'Can I share a wallet with my partner or travel buddy?',
        a: 'Yes. Invite someone to a wallet with edit or view-only access; both of you log into the same wallet and see the same numbers. Invite them with a QR code in person, or send a link that stays open for a week and approve them when they ask to join.',
      },
      {
        q: 'Can I import my history from another app?',
        a: 'Yes. Export a CSV or Excel file from your old app and import it into Nomad Budget. The file is read on your phone and never uploaded.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. With Pro you can export every transaction as a CSV file, to open in a spreadsheet or take anywhere else.',
      },
      {
        q: 'How does the country comparison work?',
        a: 'It takes what you actually spend by category and prices it in another country using official price levels from the World Bank (ICP 2021) and Eurostat. If you have lived in both countries, it also shows what you actually spent in each. The general price index is free; the comparison built from your own basket is part of Pro.',
      },
      {
        q: 'Can I set a budget?',
        a: 'Yes. A monthly budget for your total is free, and it alerts you at 80% and again if you go over. With Pro you can also give a category or a country a budget of its own, by the day or by the month.',
      },
      {
        q: 'Is it free?',
        a: 'Yes. Recording expenses, wallets, currencies, the globe, a monthly budget and offline use are free. The free plan includes one shared wallet, one goal and three recurring bills. Pro is an optional in-app subscription that adds insight built from your own spending, category and country budgets, and no limits on those three.',
      },
      {
        q: 'Is Nomad Budget available on Android?',
        a: 'Not yet. Nomad Budget is available for iPhone on the App Store.',
      },
      {
        q: 'Which languages does it support?',
        a: 'Many, including English, Turkish, Spanish, French, Russian and Arabic, with Arabic laid out right to left.',
      },
    ],
  },
  final: { title: 'Your next country is waiting.', body: 'Start with the one you’re in.' },
  footer: {
    tagline: 'The expense tracker for a life across borders.',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    disclaimer: 'Disclaimer',
    licenses: 'Licences',
    contact: 'Contact',
    compare: 'Compare apps',
    imagery: 'Earth imagery: NASA Blue Marble. Borders: Natural Earth. Sample figures on this page are illustrative.',
    rights: 'Rubeeks',
  },
  notFound: { title: 'This page took a wrong turn.', body: 'The page you’re looking for isn’t here.', home: 'Back to the start' },
  blog: {
    title: 'Money on the road',
    lede: 'Exchange rates, card fees, rent and the everyday costs of a life across borders — from the maker of Nomad Budget.',
    metaTitle: 'Blog — Nomad Budget',
    metaDescription:
      'Exchange rates, card fees, rent and the everyday costs of living as a digital nomad, from the maker of Nomad Budget.',
    empty: 'The first posts are on their way.',
    minRead: '{n} min read',
    updated: 'Updated',
    disclaimer:
      'This post is for information only and is not financial advice. Fees, rates and rules vary by bank, card and country; check with your own bank before you decide.',
    aboutAuthor: 'About the author',
    authorTagline: 'A designer who chases financial freedom by traveling · Digital Nomad',
    authorBio:
      'Designer and maker of Nomad Budget. I’ve been living as a digital nomad since 2020, and I built this app because tracking money in several currencies at once never worked for me — not in my head, and not in the expense apps I tried.',
    authorMore: 'More of my writing on Medium',
    cta: {
      title: 'Every country in its own currency',
      body: 'Nomad Budget keeps a wallet per country, records every expense at the rate of the day it was paid, and adds it all up in yours.',
    },
    related: 'Keep reading',
    latest: 'Latest from the blog',
    all: 'All posts',
    rss: 'RSS feed',
    topics: {
      money: 'Money & fees',
      'living-costs': 'Cost of living',
      rent: 'Rent & housing',
      travel: 'Life on the road',
      tracking: 'Tracking spending',
    },
  },
};

const tr: Strings = {
  locale: 'tr_TR',
  meta: {
    title: 'Nomad Budget — Dijital Göçebeler için Çok Para Birimli Harcama Takibi',
    description:
      'Nomad Budget; dijital göçebeler, yurt dışında yaşayanlar ve uzun süre seyahat edenler için bir harcama takip uygulaması: her ülkeye kendi para biriminde bir cüzdan, senin para biriminde tek toplam ve 3B kürede yolculuğun.',
    ogAlt: 'Nomad Budget: seyahat rotası ve her ülkenin maliyeti gösterilen bir küre',
  },
  nav: { features: 'Özellikler', privacy: 'Gizlilik', faq: 'SSS', blog: 'Blog', download: 'İndir', langName: 'Türkçe', otherLang: 'English' },
  hero: {
    eyebrow: 'Dijital göçebeler ve gurbetçiler için',
    audiences: ['Dijital göçebeler için', 'Gurbetçiler için', 'Uzun süre gezenler için'],
    title: ['Sınır tanımayan bir hayat için', 'harcama takibi.'],
    lede:
      'Harcama yaptığın her ülkenin kendi para biriminde bir cüzdanı olur. Nomad Budget hepsini seçtiğin para biriminde toplar ve sen gezdikçe yolculuğunu bir kürede çizer.',
    cta: 'Hemen İndir',
    qr: 'Telefon kamerasıyla okut',
    android: 'Android sürümü henüz yok — Nomad Budget şimdilik iPhone’da.',
    pause: 'Küreyi durdur',
    play: 'Küreyi oynat',
    globeAlt:
      'Örnek bir yolculuğu gösteren hareketli küre: Fransa’dan İspanya’ya trenle, Fas’a feribotla, Türkiye’ye uçakla, Gürcistan’a arabayla, Tayland’a uçakla, Malezya’ya otobüsle, Endonezya’ya feribotla ve Meksika’ya uçakla. Her ülke aylık harcamasını kendi para biriminde gösterir.',
    perMonth: '/ay',
  },
  what: {
    title: 'Nomad Budget nedir?',
    body:
      'Nomad Budget; dijital göçebeler, yurt dışında yaşayanlar ve uzun süre gezenler için bir harcama takip uygulamasıdır. Çoğu bütçe uygulaması tek bir ülkede yaşadığını ve tek para birimiyle harcadığını varsayar. Nomad Budget tam tersi için yapıldı: sürekli yer değiştiren bir hayat ve aynı anda birkaç ülkede duran para.',
  },
  features: {
    eyebrow: 'Özellikler',
    title: 'Sınır aşan para için yapıldı',
    items: [
      {
        key: 'total',
        shot: 'total',
        accent: 'lime',
        title: ['Her ülkeye bir cüzdan.', 'Tek toplam.'],
        body:
          'Portekiz’de euro, Türkiye’de lira, evde dolar. Her kayıt gerçekte ödediğin para biriminde kalır; Toplam ekranı tüm cüzdanları ana para biriminde bir araya getirir.',
        points: ['Kafadan kur hesabı yok', 'Bugünün değil, ödediğin günün kuru', 'Tüm ülkelerde kategori kategori harcama'],
      },
      {
        key: 'entry',
        shot: 'entry',
        accent: 'magenta',
        title: ['Saniyeler içinde', 'kaydet.'],
        body:
          'Hesap makinesi klavyesi, son kategorilerin tek dokunuş uzakta, para birimi zaten bulunduğun cüzdana göre ayarlı. Harcamayı gün sonunda değil, kafeden çıkarken gir.',
        points: ['İşlem yapabilen hesap makinesi klavyesi', 'Son kategoriler ve notlar', 'Dün, bugün ya da istediğin tarih'],
      },
      {
        key: 'capture',
        shot: 'capture',
        accent: 'lime',
        title: ['Kendi kendine', 'eklenen ödemeler.'],
        body:
          'Bir iPhone otomasyonunu bir kez kur; her Apple Pay ödemesi ve banka SMS’i olduğu anda Nomad Budget’a gelir: tutar, para birimi ve dükkân, senin onayını bekler. Sen onaylamadan hiçbir şey kaydedilmez.',
        points: ['Apple Pay ve banka SMS’leri', 'Onaylamadan hiçbir şey kaydedilmez', 'Okunan hiçbir şey telefonundan çıkmaz'],
      },
      {
        key: 'journey',
        shot: 'journey',
        accent: 'blue',
        title: ['Yolculuğun', 'bir kürede.'],
        body:
          'Her kayıt nerede yapıldığını hatırlar. Ülkeler sen gezdikçe dolar, rotan bir duraktan diğerine kendiliğinden çizilir ve her durak sana kaça mal olduğunu gösterir. Maliyet görünümüne geç, her ülkeyi gerçekte ne tuttuğuna göre gör.',
        points: ['Gezdikçe dolan ülkeler', 'Durak durak rotan', 'Yıla, son 12 aya, geziye ya da ulaşıma göre süz'],
      },
      {
        key: 'compare',
        shot: 'compare',
        accent: 'orange',
        title: ['Gitmeden önce', 'karşılaştır.'],
        body:
          'Sıradaki durağını mı düşünüyorsun? Nomad Budget kendi harcama düzenini başka bir ülkede kategori kategori fiyatlar. Karşılaştırma genel bir endekse değil, senin yaşayışına göre yapılır. İki ülkede de yaşadıysan, gerçekte ne harcadığını yan yana gör.',
        points: ['Dünya Bankası ve Eurostat fiyat seviyeleri, kira dahil', 'Ortalama değil, kendi sepetin', 'Nerede, neye daha az harcayacağını gör'],
      },
      {
        key: 'crossings',
        shot: 'crossings',
        accent: 'lime',
        title: ['Her sınır geçişi', 'bir zaman çizelgesinde.'],
        body:
          'Oraya nasıl gittiğini ekle — uçak, tren, otobüs, feribot ya da araba — geçişlerin bir zaman çizelgesine dizilsin; para harcadığın her ülke dijital pasaportunda dursun.',
        points: ['Uçak, tren, otobüs, feribot, araba', 'Ülkelerinin pasaportu', 'Ülkeye göre geçişler'],
      },
      {
        key: 'pace',
        shot: 'pace',
        accent: 'blue',
        title: ['Ay bitmeden', 'hızını bil.'],
        body:
          'Harcama hızın bu ayı, daha ay bitmeden geçen ayla karşılaştırır; sonradan öğrenmek yerine zamanında yavaşlarsın.',
        points: ['Bu ay, geçen aya karşı', 'Ülkeler ve hedefler tek bakışta', 'İlk ayına kadar ay ay'],
      },
      {
        key: 'budget',
        shot: 'budget',
        accent: 'orange',
        title: ['Seninle gezen', 'bir bütçe.'],
        body:
          'Aylık bir bütçe koy, hangi ülkede olursan ol harcadıkça kendi para biriminde dolduğunu izle. %80’e geldiğinde ve aşarsan haber verir; rotayı değiştirmek için hâlâ vaktin varken.',
        points: ['Aylık bütçe, ücretsiz', '%80’de ve aşınca uyarı', 'Pro ile günlük ya da aylık kategori ve ülke bütçeleri'],
      },
    ],
  },
  more: {
    title: 'Ve bir gezginin ihtiyacı olan her şey',
    items: [
      { art: 'slide-money', title: 'Paylaşılan cüzdanlar', body: 'Biriyle mi seyahat ediyorsun? QR koduyla ya da linkle, düzenleme veya yalnızca görüntüleme yetkisiyle davet et; herkes aynı yere girer, aynı rakamları görür.' },
      { art: 'slide-plan', title: 'Hedefler', body: 'Sıradaki gezi ya da sıcak bir yerde geçecek kış için para ayır, hedefin dolduğunu izle.' },
      { art: 'reminders', title: 'Tekrarlayan ödemeler', body: 'Kira, abonelikler, sigorta — bir kez kur, zamanı gelince kendiliğinden kaydedilsin.' },
      { art: 'import', title: 'Geçmişini getir', body: 'Başka bir uygulamadan mı geliyorsun? CSV ya da Excel dosyası içe aktar. Dosya telefonunda okunur, hiçbir yere yüklenmez.' },
      { art: 'all-set', title: 'Çevrimdışı çalışır', body: 'Trende çekmiyor mu? Kayıtlar cihazda saklanır, bağlantı gelince eşitlenir.' },
      { art: 'slide-journey', title: 'Birçok dil', body: 'Kendi dilinde: aralarında Türkçe, İngilizce, İspanyolca, Fransızca, Rusça ve Arapça var; açık ve koyu temayla.' },
    ],
  },
  steps: {
    title: 'Bir dakikada hazır',
    items: [
      { title: 'Nerede olduğunu seç', body: 'Bulunduğun ülke, kendi para biriminde ilk cüzdanın olur.' },
      { title: 'Harcadığını gir', body: 'Harcama başına birkaç dokunuş. Ülke değiştir, para birimi de değişsin.' },
      { title: 'Resmin tamamını gör', body: 'Kendi para biriminde toplamın, harcama hızın ve kürede yolculuğun.' },
    ],
  },
  audience: {
    title: 'Yerinde durmayanlar için',
    body: 'Paran ülkeler arasında dolaşıyorsa, Nomad Budget onu tek bir yerde tutar.',
    items: [
      { title: 'Dijital göçebeler', body: 'Bir iki ayda bir yeni ülke ve sonunda tek, net bir rakam.' },
      { title: 'Yurt dışında yaşayanlar', body: 'Bir para biriminde maaş, başka birinde hayat ve memlekette aile.' },
      { title: 'Uzun süre gezenler', body: 'Aylarca yolda, uzatılacak bir bütçe ve hatırlamaya değer bir rota.' },
      { title: 'İki ülkeli hayatlar', body: 'Yılın yarısı burada, yarısı orada — iki cüzdan, tek toplam.' },
      { title: 'Geo-arbitraj ve FIRE', body: 'Taşınmadan önce kendi yaşam tarzının nerede daha ucuza geldiğini öğren.' },
      { title: 'Çiftler ve yol arkadaşları', body: 'Gezi için tek ortak cüzdan, geri kalanı için kendi cüzdanların.' },
    ],
  },
  privacy: {
    eyebrow: 'Gizlilik',
    title: ['Senin harcaman.', 'Bankan değil.'],
    body: 'Sen ne harcadığını girersin; Nomad Budget ne anlama geldiğini söyler. Banka şifresi yok, reklam yok, üçüncü taraf takibi yok.',
    items: [
      { title: 'Banka bağlantısı yok', body: 'Nomad Budget banka şifreni ya da kart bilgini asla istemez. Bankanın mesajlarından yakalanan ödemeler telefonunda okunur ve senin onayını bekler.' },
      { title: 'Verin satılmaz', body: 'Reklam yok, veri simsarı yok, üçüncü taraf analiz yok. Kullanım kendi sunucumuzda ölçülür; tutarların ve notların asla bu ölçüme girmez.' },
      { title: 'Konum kaba kalır', body: 'Doğru cüzdanı seçmek için yalnızca ülke okunur. Konumun saklanmaz, arka planda okunmaz.' },
      { title: 'Silmek senin elinde', body: 'Hesap açmadan dene; hesabını ve tüm verini istediğin an uygulama içinden sil.' },
    ],
  },
  plans: {
    title: 'Kullanması ücretsiz. Daha fazlası için Pro.',
    body: 'Kayıt tutmak asla sınırlanmaz. Pro, kayıtlarının üstüne içgörü ekler.',
    free: {
      name: 'Ücretsiz',
      tagline: 'Ülkeler arası harcama takibi için gereken her şey',
      items: [
        'Sınırsız kayıt, cüzdan ve para birimi',
        'Ana para biriminde toplam',
        'Küre, rota, geçişler ve pasaport',
        'Dünya genelinde resmî ülke fiyat seviyeleri',
        'Ülkelerinin, sana maliyetine göre sıralaması',
        'Uyarılı aylık toplam bütçe',
        'Bir paylaşılan cüzdan, bir hedef ve üç tekrarlayan ödeme',
        'Çevrimdışı kullanım ve CSV / Excel içe aktarma',
      ],
    },
    pro: {
      name: 'Pro',
      tagline: 'Kendi harcamandan çıkan içgörü',
      items: [
        'Kendi harcamanla ülke karşılaştırması',
        'Bir ülkede bir ayın sana kaça mal olacağı',
        'Uyarılı kategori ve ülke bütçeleri',
        'Tüm işlemleri CSV olarak dışa aktarma',
        'Sınırsız hedef, tekrarlayan işlem ve paylaşılan cüzdan',
      ],
    },
    note: 'Pro, isteğe bağlı aylık ya da yıllık bir uygulama içi aboneliktir; yıllık plan ücretsiz denemeyle başlar. Sona ererse kaydettiğin hiçbir şey kaybolmaz.',
  },
  faq: {
    title: 'Sık sorulan sorular',
    items: [
      {
        q: 'Nomad Budget nedir?',
        a: 'Parası birden fazla ülkede olan insanlar için bir harcama takip uygulaması. Her ülke için kendi para biriminde bir cüzdan tutar, hepsini seçtiğin ana para biriminde toplar ve seyahatlerini maliyetleriyle birlikte 3B bir kürede gösterir.',
      },
      {
        q: 'Dijital göçebeler için iyi bir bütçe uygulaması mı?',
        a: 'Onlar için yapıldı. Her ülkenin kendi cüzdanı olur, her kayıt kendi gününün kurunu saklar, toplam hep senin para biriminde durur; bir sonraki taşınmadan önce de yaşayışının orada kaça mal olacağını görürsün.',
      },
      {
        q: 'Farklı para birimlerini nasıl yönetiyor?',
        a: 'Her cüzdanın kendi para birimi vardır ve her kayıt ödediğin para biriminde, o günün kuruyla saklanır. Toplam ekranı tüm cüzdanları Ayarlar’da seçtiğin ana para biriminde toplar; bunu istediğin an değiştirebilirsin.',
      },
      {
        q: 'Bankama bağlanıyor mu?',
        a: 'Hayır. Nomad Budget banka şifresi ya da kart bilgisi istemez. Harcamalarını kendin girersin ya da bir iPhone otomasyonu Apple Pay ödemelerini ve banka SMS’lerini onaylaman için getirir; bu yüzden nakitle, yabancı kartlarla ve her ülkedeki her bankayla çalışır.',
      },
      {
        q: 'Çevrimdışı çalışıyor mu?',
        a: 'Evet. Kayıtlar telefonunda saklanır, bağlantı gelince hesabınla eşitlenir.',
      },
      {
        q: 'Bir cüzdanı eşimle ya da yol arkadaşımla paylaşabilir miyim?',
        a: 'Evet. Birini cüzdana düzenleme ya da yalnızca görüntüleme yetkisiyle davet et; ikiniz de aynı cüzdana kayıt girer, aynı rakamları görürsünüz. Yanındaysa QR koduyla davet et; değilse bir hafta geçerli bir link gönder, katılmak istediğinde sen onayla.',
      },
      {
        q: 'Geçmişimi başka bir uygulamadan aktarabilir miyim?',
        a: 'Evet. Eski uygulamandan CSV ya da Excel dosyası dışa aktar ve Nomad Budget’a içe aktar. Dosya telefonunda okunur, hiçbir yere yüklenmez.',
      },
      {
        q: 'Verimi dışa aktarabilir miyim?',
        a: 'Evet. Pro ile tüm işlemlerini CSV dosyası olarak dışa aktarabilir, bir tabloda açabilir ya da istediğin yere götürebilirsin.',
      },
      {
        q: 'Ülke karşılaştırması nasıl çalışıyor?',
        a: 'Kategori kategori gerçekte ne harcadığını alır ve Dünya Bankası (ICP 2021) ile Eurostat’ın resmî fiyat seviyeleriyle başka bir ülkede fiyatlar. İki ülkede de yaşadıysan, her birinde gerçekte ne harcadığını da gösterir. Genel fiyat endeksi ücretsizdir; kendi sepetinle yapılan karşılaştırma Pro’nun parçasıdır.',
      },
      {
        q: 'Bütçe koyabilir miyim?',
        a: 'Evet. Toplamın için aylık bir bütçe ücretsizdir; %80’e geldiğinde ve aşarsan seni uyarır. Pro ile bir kategoriye ya da ülkeye de günlük veya aylık kendi bütçesini verebilirsin.',
      },
      {
        q: 'Ücretsiz mi?',
        a: 'Evet. Harcama kaydı, cüzdanlar, para birimleri, küre, aylık bütçe ve çevrimdışı kullanım ücretsizdir. Ücretsiz planda bir paylaşılan cüzdan, bir hedef ve üç tekrarlayan ödeme vardır. Pro; kendi harcamandan çıkan içgörüleri, kategori ve ülke bütçelerini ekleyen ve bu üçündeki sınırı kaldıran, isteğe bağlı bir uygulama içi aboneliktir.',
      },
      {
        q: 'Android’de var mı?',
        a: 'Henüz yok. Nomad Budget, App Store’da iPhone için mevcut.',
      },
      {
        q: 'Hangi dilleri destekliyor?',
        a: 'Birçok dili; aralarında Türkçe, İngilizce, İspanyolca, Fransızca, Rusça ve sağdan sola düzeniyle Arapça var.',
      },
    ],
  },
  final: { title: 'Sıradaki ülken seni bekliyor.', body: 'İçinde bulunduğunla başla.' },
  footer: {
    tagline: 'Sınır tanımayan bir hayat için harcama takibi.',
    legal: 'Yasal',
    privacy: 'Gizlilik Politikası',
    terms: 'Kullanım Koşulları',
    kvkk: 'KVKK Aydınlatma Metni',
    disclaimer: 'Sorumluluk Reddi',
    licenses: 'Lisanslar',
    contact: 'İletişim',
    compare: 'Uygulama karşılaştırmaları (EN)',
    imagery: 'Dünya görüntüsü: NASA Blue Marble. Sınırlar: Natural Earth. Bu sayfadaki örnek rakamlar temsilîdir.',
    rights: 'Rubeeks',
  },
  notFound: { title: 'Bu sayfa yanlış yola sapmış.', body: 'Aradığın sayfa burada değil.', home: 'Başa dön' },
  blog: {
    title: 'Yolda para',
    lede: 'Kur farkı, kart ücretleri, kira ve sınırlar arasında yaşamanın gündelik maliyetleri — Nomad Budget’ı yapan kişinin kaleminden.',
    metaTitle: 'Blog — Nomad Budget',
    metaDescription:
      'Dijital göçebe olarak yaşamanın kur farkı, kart ücretleri, kira ve gündelik maliyetleri üzerine yazılar; Nomad Budget’ı yapan kişinin kaleminden.',
    empty: 'İlk yazılar yolda.',
    minRead: '{n} dk okuma',
    updated: 'Güncellendi',
    disclaimer:
      'Bu yazı bilgi amaçlıdır, finansal tavsiye değildir. Ücretler, kurlar ve kurallar bankaya, karta ve ülkeye göre değişir; karar vermeden önce kendi bankanla kontrol et.',
    aboutAuthor: 'Yazar hakkında',
    authorTagline: 'Seyahat ederek finansal özgürlüğün peşinden koşan bir tasarımcı · Dijital Göçebe',
    authorBio:
      'Tasarımcı, Nomad Budget’ın yapımcısı. 2020’den beri dijital göçebe olarak yaşıyorum. Aynı anda birkaç para birimini ne aklımda tutabildim ne de denediğim harcama uygulamalarında; bu uygulamayı bu yüzden yaptım.',
    authorMore: 'Medium’daki diğer yazılarım',
    cta: {
      title: 'Her ülke kendi para biriminde',
      body: 'Nomad Budget her ülkeye bir cüzdan açar, her harcamayı ödendiği günün kuruyla kaydeder ve hepsini senin para biriminde toplar.',
    },
    related: 'Okumaya devam et',
    latest: 'Blog’dan son yazılar',
    all: 'Tüm yazılar',
    rss: 'RSS akışı',
    topics: {
      money: 'Para ve ücretler',
      'living-costs': 'Yaşam maliyeti',
      rent: 'Kira ve konaklama',
      travel: 'Yolda hayat',
      tracking: 'Harcama takibi',
    },
  },
};

export const STRINGS: Record<Lang, Strings> = { en, tr };
