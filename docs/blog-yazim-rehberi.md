# Blog yazım rehberi

Nomad Budget blogu için her şey: kimin adına, hangi sesle, hangi kurallarla, hangi dosyaya
yazıldığı. Yeni bir yazıya başlamadan önce baştan sona okunur; buradaki kararlar yeniden
sorulmaz.

Site: `https://nomadbudget.rubeeks.co/blog/` (EN) · `/tr/blog/` (TR) · Depo: `C:\NomadBudgetWeb`

**"Yeni blog yazısı üret" denince:** bu dosyayı oku → §8'deki akışı baştan sona uygula.
Yazarın bildiği şeyleri (§1) yeniden sorma; yalnız yazıya özgü deneyimi sor.

> Bu dosyayı düzenlerken bash heredoc + `node -e` kullanma: Git Bash çift ters eğik çizgiyi
> teke indiriyor, regex/yol bozuluyor (2026-09-29'da dosyanın başı bu yüzden silindi).
> Edit aracını kullan.

---

## 1. Yazar

Yazılar **Selçuk Sevindik**'in adıyla ve onun sesiyle yayınlanır. Yazar kutusu ve künye
sayfa şablonundan gelir, yazıya elle eklenmez.

- Başlık satırı: *A designer who chases financial freedom by traveling · Digital Nomad*
- Medium: https://medium.com/@selcuksevindik (EN yazılar) · Sarı Kalem yayını (TR yazılar)
- Nomad Budget'ın tasarımcısı ve yapımcısı; bu açıkça söylenir, gizlenmez.

### Yazıda kullanılabilecek gerçekler

| Konu | Bilgi |
|---|---|
| Göçebelik | 2020'den beri dijital göçebe |
| Kalış tarzı | Kısa kalışlar yerine 1, 3 ya da 6 aylık kalışlar |
| İlk uzun seyahat | Viyana, Budapeşte, Krakov, Prag — hostellerde kaldı, iki günde bir şehir değiştirdi |
| Kur farkı | İlk seyahatinin sonunda, eve dönüp hesap yapınca fark etti. Bankaların yüksek kurla çevirdiğini duyduğu için kart ekstresini EURO istedi (USD değil); seyahat sonunda euroyu kendisi alıp ödedi ama euro yükselmişti, beklediğinden fazla ödedi |
| Kartlar | Türk banka kartları + Wise gibi uluslararası platformlar |
| DCC | Gittiği her ülkede karşılaştı |
| ATM ücreti | Belgrad'da karşılaştı |
| Hat | Varışta sorun yaşamamak için mutlaka eSIM; uzun kalışlarda yerel SIM (tarifeler her zaman daha avantajlı) tercih ediyor. Eski yazıdaki "yeni SIM kart yöntemi"ni açıklamadı |
| İlk gün / ilk hafta | İlk iş hep market alışverişi (temel ihtiyaçlar hazırda). Sonra evin çevresini bol bol yürüyerek keşfediyor, bazen haritadan etrafa bakıyor. Merkezi yerleri bulmak için "kalabalığı takip et" stratejisi. Cevapta "yaptığımız" dedi → tekil yaz (eş kuralı). İlk haftayı ortalamadan AYIRMIYOR: "her şey yaşam maliyetinin parçası" |
| "Sadece nakit" | Özellikle seyahatin ilk zamanlarında sık başına geldi; ödeyemediği bir durum hiç olmadı; bu yüzden her zaman yanında nakit bulundurmaya çalışıyor. Yer/sahne vermedi (pazar tezgâhı vb. yazılmaz). Ülkeden ayrılırken elinde nakit kaldığı da oldu. Nakit yönetimi: çok bozdurmuyor, yalnız acil durumlara yetecek kadar; artan nakitle daha fazla bahşiş bırakıyor ya da son günlerde nakit harcıyor. Gitmeden önce ülkenin nakit mi kart mı ağırlıklı olduğunu araştırıyor |
| Gelir | USD ve TRY (para birimi söylenebilir, tutar asla) |
| Kur riski | Ay sonunda "bu ay biraz fazla gitmiş" deyip sonra bazı aylar aslında kurun hareket ettiğini fark ettiği oldu. Kur düşerken "pek bir şey hissetmiyorsun"; banka hesaplarını ve harcamaları kontrol ederken her gün aynı kahveye kendi para biriminde giderek daha fazla ödediğini görmek garip hissettiriyor. 2021'de yurt dışında olduğunu açıkça teyit etmedi. Seyahat bütçesini çoğu zaman USD üzerinden hazırlayıp tutuyor; "Batı'da enflasyona alışkın olmayana garip gelebilir, yüksek enflasyonla yaşamaya alışmış biri için bir sigorta". Takip: ana para birimi USD, ama TL'de de bakıyor. "Fazla harcadım" demeden önce kura bakıyor |
| Çalışma | Sürekli evde çalışınca motivasyonu düşer, değişiklik sever; kafeler bir tür ofis |
| "Ucuz ülke" | Polonya'ya "ucuz ülke" beklentisiyle gitti; ay sonu "evdekinin yarısı" hiç tutmadı, hiçbir ülkede tutmuyor |
| Kira | Tiflis'te aylık ev ararken kısa dönem primini gördü. Gittiği dönemde Tiflis'te büyük konut krizi vardı, fiyatlar çılgın gibi yükseliyordu; baktığı daireyi o anda tutmazsa bir daha boş bulmak imkânsız gibiydi (yıl vermedi; cevapta "bizim/baktığımız" → tekil yaz). Kalış kısa da uzun da olsa her zaman pazarlıkla fiyatı biraz indirmeyi deniyor; "bazen işe yarıyor bazen yaramıyor, ama hiç denememekten iyidir". Aylık evleri genelde 28+ geceyle arıyor. Ödemeyi platformda tutuyor (sorun çıkarsa güvence). İstediği daireyi bulamadıysa kısa tutuyor; daireden ve konumdan eminse birkaç aylığına hemen tutuyor. Gürcistan'da ev tutarken depozito istendi ("sonradan geri alsan bile önden ödemek ekstra yük"); emlakçı komisyonunu ev sahibi ödedi. Depozitonun ne zaman/ne kadar döndüğünü söylemedi. Cevapta "alsak" dedi → metinde tekil yaz (eş kuralı). Taşınırken evin durumunu genelde fotoğraflıyor, sonradan sorun yaşamamak için. Ev maliyetini depozito kaybı + komisyon dahil kalış ayına bölerek hesaplıyor ("sonuçta hepsini ben karşılıyorum"). Depozitonun geri gelmeyen kısmını o ülkenin harcaması olarak kaydediyor. Yerel ev / platform kararı (Claude'un önerdiği seçenekleri "uyguluyorum" diye onayladı): 1 ay → platform, 3–6 ay → yerel ev; ülke de etkiler (dil, sözleşme); bazen ilk haftalar platformda, şehri tanıyınca yerel eve geçiş |
| Ülke seçimi | İlk zamanlarda kira, market, dışarıda yemeği tek tek sıkı kontrol ederdi; artık daha iyi tahmin ediyor |
| Takip geçmişi | Nomad Budget'tan önce: başta hiç takip etmedi → sonra aklında tutmaya çalıştı, olmadı → son olarak harcama uygulamalarını denedi. **Tablo (Excel/Sheets) kullanmadı**; "tablolar çöktü" gibi bir şey yazılmaz. Uygulamaların hemen hepsinde çok eksik vardı, hiçbiri bir göçebenin isteklerini tam karşılamıyordu. |
| Uygulamanın fikri | "Sadece rakamlar olmamalıydı, biraz da duygular işin içine girmeliydi; böylece Nomad Budget ortaya çıktı." Küre bu duygu tarafı: "görsel bir hafıza yaratmak istedim." |
| Kafeler | Hep yeni kafeler dener; rahat oturulan, sakin yerleri seçer; Nomad Budget'ta kafe harcamalarını ayrı kategoride takip eder |
| Yemek | Hem dışarıda yer hem evde pişirir |
| Yalnızlık | Sevdiklerini özlüyor; en zoru ihtiyaç anında yardım edememek ve özel günleri kaçırmak. Yolda çok insanla tanışıyor ama sohbet çoğunlukla küçük sohbette kalıyor, devam ettirmek zor. "Biriyle seyahat etmek avantaj" yalnız genel "sen" ile yazılır, yazarın kendisi için değil (eş kuralı) |
| Valiz | Büyük değil, hep limitlerin içinde tutuyor. Düzen kolay, omuzda taşınmıyor, plastik: yağmur/çamur dert değil, silip geçiyor. Pahalı valiz almıyor; kırılmasına izin verip yenisini alıyor ("yoluma devam"). Uçakta kabinde mi kayıtlı mı söylemedi |
| Yolculuğu karşılaştırmak | Yalnız bilet/bagaj değil, gidilen yerde yaşamak için harcanan her şeyi karşılaştırıyor; ulaşım yaşam maliyetinin bir kalemi |
| Geride kalan sabit giderler | Çok uzun seyahatlerde az sabit ödeme bırakmaya çalışıyor; kısa seyahatlerde bazen telefon hattını en düşük pakete çeviriyor; dijital üyelikleri tutuyor (her yerde kullanılıyor). Evini kapatmıyor: dönebileceği bir ev onu rahat hissettiriyor, bazı sabit faturaları ödemeye devam ediyor. Türkiye'deki tüm harcamalarını Nomad Budget'ta Türkiye cüzdanında tutuyor (tekrarlayan işlem kullandığını SÖYLEMEDİ) |
| Kayıt alışkanlığı | Harcamaları her zaman aynı gün kaydediyor; artık alışkanlık |
| Yol masrafının kaydı | Nomad Budget'ta taşınmanın ulaşım masrafını genelde o an bulunduğu ülkenin cüzdanına ekliyor (gideceği ülkeye DEĞİL) |
| Ulaşım alışkanlığı | Seçenek varsa kendini zorlamıyor: çok geç/çok erken uçuşlardan kaçınıyor (bütçeye bağlı), bazen uçak yerine kara yolunu seçiyor |
| Sıkılmaya yer açmak | Her anı doldurmak zorunda hissetmiyor; kulaklıksız, yalnız düşünceleriyle yürüyor; kahvesini içip gün batımını izliyor. "Sadece düşünmek için biraz zaman lazım." |
| Geçmiş | Adana, işçi bir ailenin çocuğu; tasarımcı; kurumsal iş geçmişi; ailesinin ilk yurt dışı gezgini |
| Eski temalar | Finansal özgürlük, yatırımda kaybedip öğrenmek, erken emeklilik (FIRE'a mesafeli), sıkılmanın yaratıcılığa faydası, araç sahibi olmamak, sırt çantasından tekerlekli valize geçiş, yeni ülkeye varınca utangaçlık |

### ASLA

- **Eşten bahsedilmez.** Ne adı ne "eşimle" gibi bir ima.
- **Gelir tutarı, kişisel harcama tutarı ya da toplamı verilmez.** Hesaplar yuvarlak "birim"
  örnekleriyle yapılır. Harcama *alışkanlıkları* rakamsız anlatılabilir.
- **Ziyaret edilen ülke sayısı verilmez.**
- **Anekdot, rakam, ülke deneyimi uydurulmaz.** Yukarıdaki tabloda olmayan her kişisel
  ayrıntı yazara sorulur (bkz. §8). Bilinmeyen ya da emin olunmayan yer bir **taslak notu**
  olarak bırakılır (biçimi §9); yayından önce hepsi kapanmış olmalı (build kontrol eder).

---

## 2. Konular

**Odak:** ülkeler arası coğrafi arbitraj, kur, komisyon ve kart ücretleri (DCC, ATM, kur
marjı), harcamalar, kira ve konaklama. Yanında doğal seyahat zorlukları: yeni ülkede ilk
hafta, ulaşımın gizli maliyetleri, eşya ve bagaj, yalnızlık, rutin, sıkılmak.

**2026-09-29 yazar kararı:** yazılar hep sorun/para üzerine olmak zorunda değil. Göçebe
yaşam tarzı, hikâye ve keşif yazıları da üretilir (#16–25); plan bunları para yazılarıyla
dönüşümlü sıralar.

**Şimdilik konu DEĞİL:** vergi (183 gün, vergi mukimliği), vize ve kalış süreleri (Schengen
90/180), sağlık sigortası tavsiyesi.

### Aday listesi

| # | Konu | Durum |
|---|---|---|
| 1 | Kur farkı, komisyon ve DCC: paran nereye gidiyor | Yayında, 2 Eki 2026 (`fx-fees-dcc`) |
| 2 | "Kendi para biriminizde ödemek ister misiniz?" — DCC'ye kısa bakış | Yazılmayacak: #1 DCC'yi kapsıyor, ayrı yazı aynı aramada onunla yarışır |
| 3 | Nakit mi kart mı: ATM ücretleri, çekim limitleri | Planlandı, 26 Kas 2026 (`cash-or-card`) |
| 4 | Maaş bir kurda, hayat başka kurda: kur riski | Planlandı, 15 Eki 2026 (`currency-risk`) |
| 5 | Coğrafi arbitraj gerçekten işe yarıyor mu | Yayında, 2 Eki 2026 (`geo-arbitrage`) |
| 6 | Ucuz ülke, pahalı alışkanlık: her şey aynı oranda ucuz değil | Yazılmayacak: #5'in "Her şey aynı oranda ucuz değil" bölümü kapsıyor |
| 7 | Seri: "Bir ay X'te" (rakamsız, alışkanlık üzerinden) | Bekliyor: hangi ülkeyle başlanacağı yazara sorulacak |
| 8 | Kısa dönem kira primi ve aylık pazarlık | Planlandı, 29 Eki 2026 (`rent-premium`) |
| 9 | Depozito, komisyon, peşin kira | Planlandı, 12 Kas 2026 (`deposits`) |
| 10 | Geride bırakılan sabit giderler | Planlandı, 7 Oca 2027 (`fixed-costs`) |
| 11 | Neden Nomad Budget'ı yaptım: birkaç para biriminde takip neden hiç tutmadı (uygulamanın doğuşu) | Planlandı, 11 Şub 2027 (`origin`) |
| 12 | Harcama hangi kurla kaydedilmeli: o günün mü, bugünün mü | Planlandı, 17 Ara 2026 (`record-rate`) |
| 13 | Yeni ülkede ilk hafta | Yayında, 2 Eki 2026 (`first-week`) |
| 14 | Ulaşımın gizli maliyetleri | Planlandı, 31 Ara 2026 (`transport-costs`) |
| 15 | Sıkılmak, yalnızlık, rutin | Planlandı, 21 Oca 2027 (`boredom-routine`) |
| 16 | Kafeler benim ofisim | Planlandı, 8 Eki 2026 (`cafe-office`) |
| 17 | Yavaş seyahat: neden bir, üç ya da altı ay | Planlandı, 22 Eki 2026 (`slow-travel`) |
| 18 | Yeni bir şehri yürüyerek tanımak | Planlandı, 5 Kas 2026 (`city-on-foot`) |
| 19 | Hostelden aylık eve: seyahat şeklim nasıl değişti | Planlandı, 19 Kas 2026 (`hostels-to-flats`) |
| 20 | Bir valizde yaşamak | Planlandı, 14 Oca 2027 (`suitcase-life`) |
| 21 | Her zaman dönebileceğim bir ev | Planlandı, 10 Ara 2026 (`home-base`) |
| 22 | Ailemin ilk yurt dışı gezgini | Planlandı, 24 Ara 2026 (`first-in-family`) |
| 23 | Yolda mutfak | Planlandı, 3 Ara 2026 (`kitchen-on-the-road`) |
| 24 | Yeni yerler, yeni fikirler | Planlandı, 28 Oca 2027 (`new-places-ideas`) |
| 25 | Yolda bir günüm | Planlandı, 4 Şub 2027 (`day-on-the-road`) |

### Yayın planı (2026-10-02)

#1, #5 ve #13 2 Ekim 2026'da birlikte yayına girdi; kalanlar haftada bir, **perşembe**.
Sıra 2026-09-29 planının sırası, yalnız #7 çıkarıldı (yazılmadı) ve #20 ile #23 yer değiştirdi
(#20 #23'e link veriyor). Para/kira yazıları ile yaşam/hikâye yazıları dönüşümlü kaldı.

**Kendiliğinden yayın:** yazılar `draft: false` ve `pubDate` = yayın günü olarak `main`'de
durur. Build yalnız `pubDate`'i gelmiş yazıları alır (`src/blog.ts` → `holdOf`);
`.github/workflows/deploy.yml` her sabah 08:00 (TR) siteyi yeniden derler, o günün yazısı push
olmadan çıkar. Dev sunucusu gelecek tarihli yazıları da gösterir, kartta `scheduled` etiketiyle.
Bir yazıyı geri çekmek: `draft: true`. Tarihi gelmemiş yazının eksiği (eş, kapak, açık not)
bugünkü build'i durdurur, yani sorun yayın sabahına kalmaz.

**Kural:** bir yazı yalnız kendinden ÖNCE (ya da aynı gün) yayınlanan yazılara iç link verir;
sıra ya da tarih değişirse linkleri kontrol et. GitHub, 60 gün hiç commit olmayan açık
depolarda zamanlanmış workflow'u durdurur; uzun ara olursa Actions sekmesinden yeniden aç.

| Tarih | Yazı | Tür |
|---|---|---|
| 2 Eki 2026 | #1 Kur farkı, komisyon, DCC | para |
| 2 Eki | #5 Coğrafi arbitraj | para |
| 2 Eki | #13 Yeni ülkede ilk hafta | seyahat |
| 8 Eki | #16 Kafeler benim ofisim | yaşam |
| 15 Eki | #4 Kur riski | para |
| 22 Eki | #17 Yavaş seyahat | yaşam |
| 29 Eki | #8 Kısa dönem kira primi | kira |
| 5 Kas | #18 Şehri yürüyerek tanımak | keşif |
| 12 Kas | #9 Depozito, komisyon, peşin kira | kira |
| 19 Kas | #19 Hostelden aylık eve | hikâye |
| 26 Kas | #3 Nakit mi kart mı | para |
| 3 Ara | #23 Yolda mutfak | yaşam |
| 10 Ara | #21 Her zaman dönebileceğim bir ev | hikâye |
| 17 Ara | #12 Harcama hangi kurla kaydedilmeli | takip |
| 24 Ara | #22 Ailemin ilk yurt dışı gezgini | hikâye |
| 31 Ara | #14 Ulaşımın gizli maliyetleri | seyahat |
| 7 Oca 2027 | #10 Geride bırakılan sabit giderler | para |
| 14 Oca | #20 Bir valizde yaşamak | yaşam |
| 21 Oca | #15 Sıkılmak, yalnızlık, rutin | yaşam |
| 28 Oca | #24 Yeni yerler, yeni fikirler | düşünce |
| 4 Şub | #25 Yolda bir günüm | yaşam |
| 11 Şub | #11 Neden Nomad Budget'ı yaptım | kapanış yazısı |

#7 "Bir ay X'te" yazılınca 18 Şubat'tan itibaren boş perşembelere girer.

---

## 3. Ses — Türkçe

Kaynak: Sarı Kalem'deki "Araç Sahibi Olmamanın Verdiği Özgürlük" ve "Girişim Fikrimi
Batıran Tek Yanlış" (2021).

- **Sahneyle açılır.** Geçmişten bir an, hikâye gibi akan geçmiş zaman:
  *"18 yaşına yeni girmiştim."* — *"Kurumsal bir firmada iş hayatıma devam ederken bazı
  şeyler beni tatmin etmiyordu."*
- **Hitap:** tartışırken genel "sen" (*"ayakların uyuşuyor"*, *"stres eklemiş oluyorsun"*);
  okura doğrudan seslenirken ve kapanışta "siz" (*"emin olabilirsiniz"*).
- **Beklenti kurup ters çevirir:** *"…ne kadar çok ihtiyacım varmış bir arabaya öyle değil
  mi? Tabii ki öyle değil."*
- **Gündelik espri, konuşma dili:** "geziyor tozuyor", "Ha unutmadan", "yazarken bile içim
  sıkıldı". Abartısız, yerinde.
- **Rakamla ikna eder:** yuvarlak "birim" hesabı — *"(5x10) + 100 = 150 birim"*. Blogun
  imza formatı bu; oranlar "yuvarlak örnek" diye açıkça etiketlenir.
- **Başlık yapısı:** üst gruplar (Fiziki / Finansal / Yaşam şekli sebepleri) altında kısa,
  tek kelimelik ara başlıklar (Trafik, Park, Zaman).
- **Hatayı suçlamadan kabul eder,** sonunda ders çıkarır: *"…öğrendim."*,
  *"…kritik önemini gördüm."*
- **Alıntı azdır;** en fazla bir "derler".
- **Paragraflar 3–6 cümle,** İngilizcedekinden uzun.
- **Kendi eski yazılarına link verir.**
- Eski metinlerdeki yazım hataları (tabi, hala, yukarda) **taklit edilmez**.

## 4. Ses — İngilizce

Kaynak: Medium, 2021 (tam okunanlar: *You Don't Need Bitcoin to Become Rich…* ve
*"Retire Early" Doesn't Mean You Are Going to Be a Couch Potato*).

- **Soruyla ya da dobra bir cümleyle açılır:** *"Let's be honest; no one invests in
  cryptocurrencies to lose money."* — *"Do you want to retire early? We both know what the
  answer is."*
- **Kısa paragraflar,** çoğu tek cümle. Art arda kısa sorular (*"Happy? Excited? Worried?"*).
- **Okura "you" der, araya retorik sorular koyar:** *"You ask why?"*, *"So what happens
  next?"*
- **Kendi kaybını itiraf eder:** *"First, I earned a lot; then, I lost everything."*
- **Yumuşatılmış karşı görüş:** *"I'm not saying X… If the goal is Y, know that other ways
  exist."*
- **Aforizma cümleleri:** *"The opportunity that everyone sees at the same time is nothing
  but an illusion."*
- **Kapanış:** kendi tercihi (*"That's why I prefer…"*) + *"I wish you…"* dileği.
- **Alıntı:** Medium'da yazı başına 3–4 tane vardı; blogda **en fazla 1–2**, blockquote
  içinde, "— Ad" atfıyla. **Her alıntının gerçekten o kişiye ait olduğu birincil kaynaktan
  doğrulanır**; internette dolaşan alıntıların çoğu yanlış atıflı.
- İngilizcedeki Türkçe kaymalar (*"I wish you to…"*, *"precisely"* tekrarları) **taklit
  edilmez**; ses korunur, dil düzgün olur.
- Medium'un tık tuzağı başlıkları (*"Save Up $1,268,260…"*) kullanılmaz.

## 5. İki dil

- Her yazı **iki dilde** yayınlanır; eşi olmayan yazı yayına girmez (build hata verir).
- İki dil **birebir çeviri değildir.** Olgular, rakamlar, kaynaklar ve bölüm yapısı aynı;
  her dil kendi sesiyle yazılır: TR sahneyle açılıp hikâye gibi akar, EN soruyla açılıp kısa
  paragraflarla ilerler.
- İki dil aynı `translationKey`'i taşır.

---

## 6. Yazının yapısı

1. **Açılış** — TR sahne / EN soru; yazarın gerçek bir deneyimi (§1 tablosu ya da yazara
   sorulan).
2. **Sorun** — ara başlıklarla; her biri somut, kaynaklı.
3. **Hesap** — yuvarlak "birim" örneği, "oranlar değişir, amaç büyüklüğü görmek" notuyla.
4. **Şimdi ne yapıyorum** — kalın kısa cümleyle başlayan maddeler; yazarın gerçek
   alışkanlıkları.
5. **Kapanış** — açılıştaki sahneye dönüş + dilek. **Kapanış satırı sabit değil,** her
   yazıda yeniden yazılır ("…dileğiyle" / "I wish you…" ruhu korunur; Sarı Kalem'in
   "Yaratıcı ve renkli kalmanız dileğiyle…" imzası kullanılmaz).
6. **Kaynaklar** — `## Kaynaklar` / `## Sources`, yayıncı + başlık linki + yıl.

- **Uzunluk:** ~900–1.300 kelime (5–6 dk).
- **Uygulama:** metinde en fazla **bir** doğal cümle, yazarın deneyiminin parçası olarak
  (ör. "Nomad Budget'ı yaparken her kaydın ödendiği günün kuruyla saklanmasında ısrar
  etmemin sebebi de buydu."). İndirme kutusunu şablon ekler; yazıda "indir" çağrısı yok.
- Uygulama hakkında söylenen her şey doğru olmalı; referans: `public/llms.txt` ve
  `src/i18n.ts` (özellikler, ücretsiz / Pro). Fiyat yazılmaz; Android yok.

## 7. Doğruluk ve kaynak kuralları

- Her rakam, oran ve kural bir kaynağa dayanır; kaynak yazının sonunda listelenir.
  Birincil kaynak (banka / kart ağı / resmî kurum / hakemli çalışma) tercih edilir; ikincil
  kaynak kullanılıyorsa metinde öyle söylenir ("… aktardığı bir çalışmaya göre").
- **Fiyat seviyesi / ülke karşılaştırması:** World Bank ICP 2021 ve Eurostat. **Numbeo
  kullanılmaz.** Uygulamanın kira verisi (`rent-levels.json`, kaynağı belirsiz) yazılarda
  kullanılmaz.
- Değişen bilgiler (ücretler, kurallar) için `updatedDate` güncel tutulur.
- Para / ücret yazılarında `disclaimer: true` (şablon "bilgi amaçlıdır" kutusu ekler).
- Kontrol edilmiş kaynaklar (yeniden kullanılabilir):
  - DCC ortalama %7,6, yerel para biriminde %1,5–3 — Gerritsen, Lancee, Rigtering (Utrecht
    Üniversitesi), *The Conversation*, 2023. Birincil kaynak (Norveç Tüketici Konseyi,
    2017) artık erişilemiyor.
  - DCC seçimi kart sahibinindir, varsayılan olamaz — Visa DCC sayfası, Mastercard DCC
    Guide 2025.
  - AB'de DCC'de ECB kuruna göre yüzde fark gösterilmek zorunda — Tüzük (AB) 2019/518.
  - Hizmet fiyatları ülkeler arasında mallardan çok daha fazla farklılaşır (emek payı + maaş farkı); AB 2025: Danimarka ortalamanın %40 üstü, Bulgaristan %37 altı; gıdada Romanya %80 – Lüksemburg %122; iletişim ekipmanında fark çok daha küçük — Eurostat, *Comparative price levels of consumer goods and services*, Statistics Explained (2025 verisi).
  - "Geoarbitrage" terimini Tim Ferriss *The 4-Hour Workweek* (2007) ile popülerleştirdi.
  - *"Beware of little expenses; a small leak will sink a great ship."* — Benjamin
    Franklin, *The Way to Wealth* (1758).

## 8. Yeni yazı akışı

1. **Konu.** Yazar konu verdiyse o. Vermediyse §2'deki önerilen sıradan henüz yazılmamış ilk
   konuyu + iki alternatifi kısaca öner, yazar seçsin. Konuyu tek başına seçip yazmaya başlama.
2. **Deneyim soruları.** Yazara bu yazıya özgü **4–6 soru**: nerede oldu, ne yaşadı, ne
   öğrendi, şimdi ne yapıyor. §1'de olanı sorma; tutar asla sorulmaz.
3. **Kaynak araştırması;** her rakam ve alıntı doğrulanır (§7), kaynak listesi hazırlanır.
4. **TR ve EN taslak** yazılır (`draft: true`), iki ayrı sesle (§3–§5). Bilinmeyen ya da
   emin olunmayan yerler taslak notu olarak bırakılır (§9) — düz `[ANEKDOT: …]` metni yazılmaz,
   sayfada bozuk görünür. Uygunsa önceki blog yazılarına iç
   link verilir (EN yazı EN yazıya `/blog/<slug>/`, TR yazı TR yazıya `/tr/blog/<slug>/`).
5. **Kapak hemen ardından, sormadan** Higgsfield ile üretilir (§10), iki dilin klasörüne konur.
   Kapaksız taslak yarım iştir.
6. **Kontrol:** `npx astro check` temiz; dev sunucusunda (`npm run dev`, oturumda
   `.claude/launch.json` → `nomadbudget-web`, port 4399) iki yazı açılır. Uygulamanın
   tarayıcı paneli kaydırınca yeniden çizmiyor; görsel kontrol `node scripts/shot.mjs` ile.
7. **Teslim:** iki `index.md` ve kapak kullanıcıya **dosya olarak gönderilir** (SendUserFile;
   `C:\NomadBudget` oturumundan bu depodaki dosya linkleri açılmıyor). Yer tutucular ve
   yazarın düzeltmesi beklenir.
8. **Yayın** (yazar onaylayınca): iki yazıda `draft: false` ve `pubDate` = yayın günü (§2
   planındaki sıradaki boş perşembe); `npm run build` temiz (eşi, kapağı ya da açık notu olan
   yazı, tarihi gelmemiş olsa da build'i durdurur); commit/push yalnız yazar isteyince. `main`'e
   push edilen yazı tarihi gelince kendiliğinden yayına girer (§2 "Kendiliğinden yayın").
9. **Rehberi güncelle:** yeni öğrenilen gerçek §1 tablosuna, konu durumu §2'ye, yeni doğrulanmış
   kaynak §7'ye.
10. **X postları** (§11): yazının TR halinden 2–5 post, `from` = yayın günü.

---

## 9. Dosya ve frontmatter

```
src/content/blog/en/<slug>/index.md     →  /blog/<slug>/
src/content/blog/tr/<slug>/index.md     →  /tr/blog/<slug>/
src/content/blog/<lang>/<slug>/cover.webp   (yazının görselleri aynı klasörde)
```

- Klasör adı = adres. İngilizce slug İngilizce, Türkçe slug Türkçe kelimelerle, ASCII
  (`kur-farki-komisyon-dcc`). Yayından sonra değiştirilmez.
- Dil klasörden gelir, frontmatter'a yazılmaz.

```yaml
---
title: "Başlık — 60–70 karakter civarı, anahtar kelime başta"
description: "Arama sonucunda görünen özet, en fazla ~160 karakter (şema sınırı 200)"
translationKey: fx-fees-dcc        # iki dilde aynı
pubDate: 2026-10-01
updatedDate: 2026-11-15            # isteğe bağlı
topic: money                       # money | living-costs | rent | travel | tracking
cover: ./cover.webp                # yayında zorunlu (build kontrol eder); coverAlt da
coverAlt: "Görselin kısa ve somut tarifi"
disclaimer: true                   # para/ücret yazılarında
draft: true                        # yalnız `npm run dev`'de görünür; false + gelecek pubDate = planlı
---
```

- Gövdede `#` (h1) kullanılmaz; başlık sayfadan gelir. Bölümler `##`, alt bölümler `###`.
- Alıntı `>` ile; atıf ayrı paragraf olarak altında (sayfa onu küçük, soluk yazar):

  ```md
  > "Beware of little expenses; a small leak will sink a great ship."
  >
  > — Benjamin Franklin, *The Way to Wealth* (1758)
  ```

- **Taslak notu** (yazara açık soru): köşeli parantez değil, bu HTML etiketi. Sayfada ait
  olduğu cümlenin altında etiketli, amber bir not olarak görünür; içeren yazı yayına girmez.

  ```md
  <mark class="todo" data-label="Senden gelecek">Hangi ülkeydi, ilk ayın sonunda ne fark ettin?</mark>
  Cümlenin sonuna da eklenebilir. <mark class="todo" data-label="Doğrula">Bu gerçekten böyle mi oldu?</mark>
  ```

  Etiketler: TR `Senden gelecek` / `Doğrula`, EN `Your story` / `Verify`.
- Hesap maddeleri liste, sonuç **kalın**.
- Tasarım: blogda kenarı renkli kart/çizgi yok; kutular uygulamanın wash paneli ve lime daire ikonuyla.
- Sayfa çevresindeki metinler (blog başlığı, yazar biyografisi, uygulama kutusu, "bilgi
  amaçlıdır" notu, konu adları) `src/i18n.ts` → `blog` alanında; yazar fotoğrafı
  `src/assets/authors/selcuk-sevindik.jpg`, adı ve Medium linki `src/author.ts`.

---

## 10. Kapak

Her yazının kapağı yazı bitince **sormadan** üretilir.

### Stil: gerçek fotoğraf + içine yerleşmiş tek ikon objesi

Kilit 2026-09-29'da ilk kapakla kondu (`fx-fees-dcc` v2, job `550f97d1`). Düz zeminde tek
ikon (uygulama ikonu gibi) **reddedildi**; kapak bir *karma medya* işi:

- **Sahne gerçek bir fotoğraf:** fotogerçekçi, doğal gün ışığı, editoryal seyahat fotoğrafı
  hissi, sade, sığ alan derinliği. Mümkünse yazarın gerçek hayatından bir yer: sakin bir
  kafe masası, pencere kenarı, eski şehir sokağı, bir ATM, kiralık bir daire, istasyon…
  Sahne ikinci planda, hafif yumuşak.
- **İçine tek bir stilize obje:** uygulamanın onboarding ikon setinin stilinde 3B heykel —
  mat poster boyası, sert kenarlı renk bloklama (mint/zümrüt hâkim, kobalt ikincil, küçük
  magenta + amber), dış çizgi yok, parlaklık yok. Obje keskin ve ilk okunan şey; gerçek
  ışığı alır, gerçek yüzeye gölge düşürür, yani sahneye inandırıcı biçimde oturur ama açıkça
  stilize kalır.
- **Bakır:** pusula yıldızlı bakır paralar (uygulama ikonunun metali) — objenin parçası ya da
  ondan dökülen küçük ayrıntı olarak.
- **Fikir tek cümlede:** obje yazının tek fikrini anlatır (ilk kapak: kafe masasında, köşesi
  çatlamış renkli karttan masaya sızan bakır paralar = fark edilmeden kaçan para).
- Kadraj 16:9; obje grubu ortada ya da biraz sağda, üstte/altta nefes payı (paylaşım kartı
  1200×630'a kırpar).
- **Hiç yazı, harf, rakam, tabela, menü, para simgesi, logo, kart ağı işareti yok** —
  bardakta, camda, sokakta da. Çıktı büyütülüp kontrol edilir; bulanık tabelada bile okunur
  yazı varsa yeniden üretilir.

### Boru hattı (`higgsfield` CLI, model `nano_banana_2`)

```bash
# stil referansı = objenin stili: onboarding'in para-cüzdan ikonu (webp yüklenmez, PNG hali)
higgsfield upload create .work/covers/ref-style.png        # → upload id (080bca71-92fd-49e1-b32b-4c5d30ecf275)
higgsfield generate create nano_banana_2 --image <upload-id> --aspect_ratio 16:9 --resolution 2k --prompt "$(cat .work/covers/<key>.prompt.txt)"
higgsfield generate wait <job-id>                          # → sonuç PNG adresi
```

- Upload id geçerli olduğu sürece yeniden yüklemeye gerek yok. Gerekirse referansı yeniden
  üret: `node -e "require('sharp')('public/art/slide-money.webp').png().toFile('.work/covers/ref-style.png')"`.
- Prompt `.work/covers/<translationKey>.prompt.txt` dosyasına yazılır (`.work/` git'e girmez).
  İskelet aşağıda; yalnız **"The photograph"** (sahne) ve **"The placed object"** (obje)
  paragrafları yazıya göre değişir, geri kalanı aynen kalır. İlk kapağın prompt'u:

  ```text
  Editorial blog cover, wide 16:9, mixed media: a real photograph with one stylised 3D object placed into it.

  The photograph: photorealistic, natural daylight, a quiet café table by a large window in a European old town, calm and uncluttered. On the warm wooden table: a ceramic cup of flat white on a saucer and a small glass of water. Outside the window, a softly blurred cobblestone street. Shallow depth of field, gentle film-like colour, editorial travel photography.

  The placed object (match the reference image's style exactly): one chunky payment card rendered as a 3D sculpture in matte poster paint with hard-edged colour blocking — mint and emerald dominant, cobalt blue secondary, small magenta and amber accents — no outlines, no gloss. It hovers at a tilt just above the table, slightly right of centre, cracked at its lower corner. From the crack, polished copper coins engraved with a compass star (like the reference coins) leak out one by one: a short falling trail, and three coins already lying on the real wooden table. The object and coins cast soft, realistic shadows on the table and pick up the window light, so they sit convincingly in the photo while staying clearly stylised.

  The contrast between the real scene and the single stylised object is the idea. Keep the café scene secondary and slightly soft; the card and coins are sharp and read first.

  Absolutely no text, letters, numbers, signs, menus, currency symbols, logos, brand marks or card network marks anywhere, including on cups, windows and the street.
  ```
- Sonuç 2752×1536 PNG → 1600 px genişlik WebP q82 →
  `src/content/blog/{en,tr}/<slug>/cover.webp` (iki klasöre aynı dosya). `coverAlt` her
  dilde ayrı, sahneyi ve objeyi somut anlatır.
- Yükleme tuzağı: büyük PNG (~850 KB) `--image` ile asılıyor; önce `upload create`, sonra id.
- **Marka logosu tuzağı:** model gerçek nesnelere logo koyuyor (dizüstünde elma, 2026-09-29
  `currency-risk`). Dizüstü, telefon, bardak gibi nesneleri büyütüp kontrol et; logo varsa
  yeniden üretme, düzenle: `--image <job-id>` + "Keep this image exactly identical in every
  detail. Only remove the logo from … Change nothing else." (tek denemede tuttu).
- Sahneler tekrar etmesin: kafe masası, pencere pervazı, balkon, daire girişi, çalışma masası
  kullanıldı (§2 tablosundaki yazı sırasıyla); yeni yazıda farklı bir yer seç.

---

## 11. X postları

Her yazıdan X (Twitter) postları çıkarılır; uygulamanın admin panelindeki **X paylaşımları**
kuyruğuna düşer, admin oradan paylaşır ya da geçer (2026-10-04 kararı).

- **Yalnız Türkçe.** Kaynak TR yazı; adres `/tr/blog/<slug>/`.
- **Dosya:** `C:\NomadBudget\supabase\social\x-posts.tr.json` — her post `key`, `slug`,
  `from` (yazının `pubDate`'i), `format` (hesap / ipucu / istatistik / karşı-görüş / hikâye /
  soru / liste) ve `parts` (tek tweet ya da thread). Thread'in son parçasında `{link}`.
- **Yazı başına 2–5 post:** en fazla bir thread, gerisi tek tweet. Her tweet ≤ 280 karakter
  (link 23 sayılır).
- **Hesap postlarında `$`,** yuvarlak örnek olduğu açıkça yazılır ("Yuvarlak örnek: …").
  `$` yanıltacaksa (ör. yaşanan ülkenin parasıyla hesap) para simgesi konmaz.
- §1 ASLA kuralları burada da geçerli; yazıda olmayan olgu, rakam, anekdot posta girmez.
  Uygulamadan en fazla beş posttan birinde söz edilir.
- **Ekleme:** JSON'a yaz → `node scripts/build-social-seed.mjs` (C:\NomadBudget'ta; uzunluğu ve
  tarihi kontrol eder) → çıkan `supabase/social/x-posts.tr.sql` Supabase SQL editöründe
  çalıştırılır. Yeniden çalıştırmak güvenli: metin güncellenir, paylaşıldı/geçildi durumu
  korunur.

### Reddit

Aynı kuyrukta, **Sosyal medya** ekranının Reddit sekmesinde (2026-10-04 kararı).

- **Yalnız İngilizce,** kaynak EN yazı. Dosya: `supabase/social/reddit-posts.en.json` — her post
  `key`, `slug` (EN), `from`, `format`, `subreddit`, `title` (≤ 300 karakter) ve `body`
  (Markdown).
- **Hiç link yok, uygulamadan hiç söz yok** (build kontrol eder). Post kendi başına değer taşır:
  deneyim + hesap + sonda topluluğa bir soru.
- **Yazı başına 1–2 post,** her biri tek bir subreddit için; aynı metin birden fazla
  subreddit'e gitmez. Kullanılanlar: digitalnomad, solotravel, travel, TravelHacks, expats,
  expatFIRE, remotework.
