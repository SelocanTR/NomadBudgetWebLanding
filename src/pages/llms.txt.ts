import { SITE, STRINGS, appStoreUrl, blogPath, type Lang } from '../i18n';
import { allPosts, holdOf, postsIn, urlOf } from '../blog';

// What AI assistants read first: the app in a paragraph and a list, the pages, and the
// blog's posts, which join the list by themselves as they are published.
const BASE = `# Nomad Budget

> ${STRINGS.en.meta.description}

It is for people whose money lives in more than one country. Every entry is stored at the exchange rate of the day it was paid, and everything adds up in the main currency the user chooses; the globe shows where the user has been and what each country cost.

- Platform: iPhone (App Store: https://apps.apple.com/app/id6803787746). Not on Android yet.
- Price: free; Pro is an optional in-app subscription (country comparison built from the user's own spending, cost-of-a-month estimates, unlimited goals / recurring transactions / shared wallets, category and country budgets).
- No bank connection; data is not sold; location is read only at country level and never stored.
- A monthly budget is free, with alerts at 80% and when it is exceeded.
- Works offline; imports CSV / Excel history from other apps; shared wallets with edit or view-only access.
- Country comparison uses World Bank ICP 2021 and Eurostat price levels applied to the user's own spending by category.
- Languages: many, including English, Turkish, Spanish, French, Russian and Arabic.
- Made by Rubeeks — nomadbudget@rubeeks.co

## Pages

- [Nomad Budget (English)](https://nomadbudget.rubeeks.co/): features, privacy, free vs Pro, FAQ
- [Nomad Budget (Türkçe)](https://nomadbudget.rubeeks.co/tr/): the same in Turkish
- [Privacy Policy](https://legal.rubeeks.co/nomadbudget/privacy.en.html)
- [Terms of Use](https://legal.rubeeks.co/nomadbudget/terms.en.html)
- [App Store](${appStoreUrl('en')})
- [YouTube: Nomad Budget](https://www.youtube.com/@NomadBudgetInt): a short video of the app's globe`;

const NAME: Record<Lang, string> = { en: 'Blog (English)', tr: 'Blog (Türkçe)' };

export async function GET() {
  const posts = (await allPosts()).filter((p) => !holdOf(p.entry));
  const sections = (['en', 'tr'] as Lang[])
    .map((l) => postsIn(l, posts))
    .filter((own) => own.length)
    .map((own) =>
      [`## ${NAME[own[0].lang]}`, '', `All posts: ${SITE}${blogPath(own[0].lang)} · RSS: ${SITE}${blogPath(own[0].lang)}rss.xml`, '', ...own.map((p) => `- [${p.entry.data.title}](${SITE}${urlOf(p)}): ${p.entry.data.description}`)].join('\n'),
    );
  const body = [BASE, ...sections].join('\n\n') + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
