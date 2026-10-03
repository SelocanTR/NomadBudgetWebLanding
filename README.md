# Nomad Budget — tanıtım sitesi

`https://nomadbudget.rubeeks.co` · Astro (statik) · GitHub Pages · EN (`/`) + TR (`/tr/`)

## Komutlar

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # dist/
npx astro check      # tip denetimi
```

## Blog

Yazılar `src/content/blog/<dil>/<slug>/index.md`; adresler `/blog/<slug>/` ve `/tr/blog/<slug>/`.
Yazım kuralları, yazar bilgisi ve frontmatter: **`docs/blog-yazim-rehberi.md`**.

- `draft: true` yazılar ve `pubDate`'i gelmemiş yazılar yalnız `npm run dev`'de görünür; build'e
  girmez. Deploy workflow'u her sabah 08:00'de (TR) yeniden çalışır, o günün yazısı push olmadan
  yayına girer. Plan: `docs/blog-yazim-rehberi.md` §2.
- Yayındaki her yazının öbür dilde eşi (aynı `translationKey`) olmalı, yoksa build durur.
- Menüdeki Blog linki, sitemap ve `llms.txt`'deki liste ilk yayındaki yazıyla kendiliğinden gelir;
  o zamana kadar `/blog/` boş ve `noindex`.
- RSS: `/blog/rss.xml`, `/tr/blog/rss.xml`.

## Uygulama deposundan gelen dosyalar

Site, uygulama deposunun (`../NomadBudget`) küre dokusunu, taşıt sprite'larını, bayrakları,
`Store/screenshots` altındaki ham iPhone ekran görüntülerini (kırpılmadan, oranı korunarak),
ve illüstrasyonları kullanır. Bunlar üretilip **commit'lenir**;
GitHub Actions yalnız bu depoyu görür.

```bash
node scripts/build-assets.mjs   # public/globe, transport, shots, art, icons + src/data/geo.json, flags.json
node scripts/build-og.mjs       # public/og-en.jpg, og-tr.jpg (1200×630 paylaşım kartları)
```

Uygulamada küre, sprite ya da mağaza görselleri değişince ikisi yeniden çalıştırılır.
`APP=/başka/yol node scripts/build-assets.mjs` ile farklı bir uygulama klasörü verilebilir.

## Hero küresi

`src/globe/` — WebGL, kütüphanesiz (~8 KB gzip).

| Dosya | Görev |
|---|---|
| `renderer.ts` | Uygulamanın Skia shader'ının (Globe.tsx) GLSL karşılığı + yolculuk ülkelerinin dolgusu |
| `routes.ts` | Rota çizgileri (uygulamanın çizgi dili), taşıt, rozetler — Canvas 2D |
| `stars.ts` | Uygulamanın yıldız hash'i, boyut başına bir kez |
| `geo.ts` | Uygulamanın `src/lib/globe.ts` matematiği |
| `hero.ts` | Zaman çizelgesi, kamera, sürükleme, chip'ler, toplam kartı |

Örnek yolculuk `src/data/journey.ts` (tutarlar temsilî; sayfada "Örnek yolculuk" yazar).
Ülke sırası `src/data/journey-codes.mjs` — değişirse `build-assets.mjs` yeniden çalıştırılmalı
(`ids.png` bu sıraya göre boyanır).

`?globe-t=12000` küreyi o milisaniyede dondurur (ekran görüntüsü için). Donmuş modda
`document.querySelector('.hero').dataset.schedule` tüm zamanlamaları verir.

Hareket azaltma açıksa tek bir durağan kare, WebGL yoksa illüstrasyon gösterilir; sekme
gizliyken ya da hero ekran dışındayken döngü durur.

## Yayın (bir kerelik kurulum)

1. **GitHub → Settings → Pages → Source: GitHub Actions.** `main`'e her push
   `.github/workflows/deploy.yml` ile yayınlanır.
2. **Settings → Pages → Custom domain:** `nomadbudget.rubeeks.co` (`public/CNAME` zaten var).
3. **Cloudflare DNS:** `CNAME nomadbudget → selocantr.github.io`. `legal` kaydıyla aynı düzen
   (proxy'li, TLS'i Cloudflare sonlandırır).
4. **Cloudflare → Security → Bots / AI Crawl Control:** yapay zeka tarayıcılarını engelleyen
   ayar bu alan için **kapalı** olmalı; yoksa `robots.txt`'deki izinler işe yaramaz.
5. **Google Search Console + Bing Webmaster Tools:** alanı DNS TXT ile doğrula,
   `https://nomadbudget.rubeeks.co/sitemap.xml` gönder. Bing'de IndexNow'u aç.

## Açık işler

- Ödeme yakalama özelliğinin (v1.0.4) ekran görüntüsü yok; yerinde uygulamanın yakalama çizimi
  duruyor. Görüntü `Store/Screenshots/`'a konup `scripts/build-assets.mjs` → `SHOTS.capture`'a
  dosya adı yazılır, betik yeniden çalıştırılır.
- App Store rozeti şu an metin butonu. Apple'ın resmî "Download on the App Store" rozeti
  (Apple Marketing Tools) indirilip `DownloadIcon`/buton yerine konabilir.
- Android yayınlanınca: `i18n.ts` → `hero.android` metni ve FAQ, Play butonu.
- `legal/join.html` içindeki `STORE` sabiti (uygulama deposu) hâlâ boş.
