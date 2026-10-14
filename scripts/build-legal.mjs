#!/usr/bin/env node
// The legal documents, from the app repo, as one data file the site's pages render:
// src/data/legal.json. Committed, like the other files from the app (GitHub Actions only
// sees this repo).
//
//   node scripts/build-legal.mjs            (APP defaults to ../NomadBudget)
//
// The five documents come from the app's `src/legal` — the same data the app shows and
// `scripts/export-legal.mjs` publishes to legal.rubeeks.co — so the wording has one
// source. The account-deletion page is hand-written HTML in the app's `legal/`; its body
// is lifted out of that file (English in the page, Turkish in its script) rather than
// copied here. Run again whenever `export-legal.mjs` is.
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const APP = path.resolve(process.env.APP ?? '../NomadBudget');
const OUT = path.resolve('src/data/legal.json');
const app = (...p) => path.join(APP, ...p);

// The app's sources import each other without an extension, as Metro expects.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (err) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(`${specifier}.ts`, context);
      throw err;
    }
  },
});

const load = (file) => import(pathToFileURL(app('src', 'legal', file)).href);
const { LEGAL } = await load('config.ts');
const { LEGAL_SLUGS } = await load('types.ts');
const { enDocs } = await load('content.en.ts');
const { trDocs } = await load('content.tr.ts');

/** `delete-account.html`: the English body sits in `#doc`, the Turkish one is the
 *  array of strings its script swaps in. Each gives its <h1> as the title. */
function deletePage() {
  const html = fs.readFileSync(app('legal', 'delete-account.html'), 'utf8');
  const en = html.match(/<div class="doc" id="doc">([\s\S]*?)<\/div>\s*<\/main>/)?.[1];
  const trArray = html.match(/getElementById\('doc'\)\.innerHTML = \[([\s\S]*?)\]\.join\(''\)/)?.[1];
  if (!en || !trArray) throw new Error('delete-account.html: its layout changed, update build-legal.mjs');
  const tr = [...trArray.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]).join('');

  const split = (body) => {
    const title = body.match(/<h1>([\s\S]*?)<\/h1>/)?.[1].trim();
    if (!title) throw new Error('delete-account.html: no <h1>');
    const rest = body
      .replace(/<h1>[\s\S]*?<\/h1>/, '')
      .replace(/<p class="meta">[\s\S]*?<\/p>/, '')
      .replace(/\n\s+/g, '\n')
      .trim();
    return { title, html: rest };
  };
  return { en: split(en), tr: split(tr) };
}

const strip = (doc) => ({ slug: doc.slug, title: doc.title, summary: doc.summary, intro: doc.intro, sections: doc.sections });

const data = {
  appName: LEGAL.appName,
  publisher: LEGAL.publisherName,
  contact: LEGAL.contactEmail,
  version: LEGAL.version,
  effective: LEGAL.effectiveDate,
  slugs: [...LEGAL_SLUGS],
  docs: {
    en: Object.fromEntries(LEGAL_SLUGS.map((s) => [s, strip(enDocs[s])])),
    tr: Object.fromEntries(LEGAL_SLUGS.map((s) => [s, strip(trDocs[s])])),
  },
  deleteAccount: deletePage(),
};

fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`src/data/legal.json — v${data.version}, ${data.effective}, ${data.slugs.length} documents + delete-account`);
