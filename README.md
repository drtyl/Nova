# Nova — telefonundaki asistan

Tek karakter, tek oda: Nova telefonunun içindeki devre kartı odasında yaşar, konuşur, hareket eder, giyinir.

## APK nasıl oluşur (bilgisayar gerekmez)

1. GitHub'da yeni, boş bir depo aç (ör. `nova`).
2. Bu klasörün **içindekileri** (`app/`, `.github/`, `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, `README.md` …) deponun köküne yükle ve gönder (push).
3. GitHub otomatik derler (~5 dakika). Deponun **Actions** sekmesinde yeşil tik görününce:
   - **Releases → "Nova (son derleme)" → Nova.apk** dosyasını telefondan indir ve kur
     (ilk kurulumda "bilinmeyen kaynaklardan yükleme" izni istenir).
4. Uygulamayı aç → sağ alttaki **Kontroller → Ayarlar → Yapay zekâ (Groq)** bölümüne
   ücretsiz anahtarını yapıştır (console.groq.com → API Keys) → **Kaydet ve bağlan**.

Her yeni gönderimde (push) APK yeniden derlenir; yeni sürümü üstüne kurarsın, verilerin silinmez.

> **Not:** 2.1, 2.0'ın üstüne kurulur (verilerin kalır). **1.0'dan geçerken bir kereliğine:** Uygulama artık her derlemede aynı sabit anahtarla imzalanıyor (`app/nova.keystore`).
> Eski 1.0 APK farklı bir anahtarla imzalandığı için 2.0 onun üstüne kurulamaz. Önce **Ayarlar → Yedek → Yedeği göster → Kopyala**
> ile yedeğini al, eski Nova'yı kaldır, 2.0'ı kur, **Ayarlar → Yedek → Yapıştırılanı yükle**. Bundan sonraki her sürüm üstüne kurulur.

## "Nova ses ver" — sesle çağır

**Nova sekmesi → Sesle çağır → "Nova ses ver" deyince uyansın.** Bunu dediğinde ekran kapalı olsa bile Nova gelir,
"Efendim?" der ve seni dinler. Dışarıdaysa (ana ekranda) orada dinler. Uyandırma sözünü değiştirebilirsin.

- Ses tanıma telefonun içinde, **internetsiz** çalışır (Vosk, Türkçe küçük model — GitHub derlerken otomatik indirilir).
  Yalnızca uyandırma sözünü bekler; hiçbir şey kaydetmez, hiçbir yere göndermez. Söz duyulduktan sonraki asıl konuşma
  telefonun kendi konuşma tanımasıyla (Google) yazıya çevrilir.
- Mikrofon göstergesi (yeşil nokta) ve "Nova seni duyuyor" bildirimi hep görünür; bildirimdeki **Durdur** ile kapatılır.
- Gerekenler (Nova sekmesinde düğmeleri var): **Mikrofon**, **Üstte gösterme** (öne gelebilmesi için), **Pil kısıtlamasını kaldır**.
  **Xiaomi / Redmi / POCO:** ayrıca **Otomatik başlatma** ve **Diğer izinler → "Arka planda çalışırken açılır pencereleri göster"** ile
  **"Kilit ekranında göster"** açılmalı; yoksa telefon Nova'yı uyutur ya da öne getirmez.
- Telefon yeniden başlayınca kendiliğinden devam eder (bazı telefonlarda bir kez Nova'yı açmak gerekir; bildirim hatırlatır).

## Telefon asistanı

Nova'ya söylemen yeterli (yapay zekâ bağlıysa doğal cümlelerle; değilse basit kalıplarla da anlar):

| Söyle | Yapar |
|---|---|
| "Sabah 7:30'a alarm kur", "10 dakikalık zamanlayıcı" | Saat uygulamasında kurar |
| "Yarın 9'da ilacımı hatırlat", "Hatırlatmalarım ne?" | Zamanı gelince bildirimle (ve dışarıdaysa ağzından) hatırlatır |
| "Annemi ara", "Ayşe'ye WhatsApp'tan geç kalacağımı yaz" | Numarayı çevirir / mesajı yazar — **göndermek, aramak için son dokunuş senin** |
| "Spotify'ı aç", "Feneri aç", "Müziği durdur", "Sesi kıs" | Yapar |
| "Eve yol tarifi", "Yakındaki eczane" | Haritada açar |
| "Cuma 14:00'e toplantı ekle", "Bugün takvimimde ne var?" | Takvimde hazırlar (sen kaydedersin) / okur |
| "Not al: süt, ekmek", "Alışveriş listem ne?" | Kendi defterine yazar, okur (Nova sekmesi → Hatırlatmalar ve notlar) |
| "Wi-Fi ayarları", "İnternette … ara" | Açar |

Rehber ve takvim ilk kullanımda izin ister.

## Nova dışarıda (ana ekranında yaşar)

**Nova sekmesi → Dışarı çık.** Nova odasında el sallar, küçülerek telefonun içine girer; ana ekranında **Nova simgesinden** çıkar.
Uygulama onun evi: uygulamayı açınca eve döner. Bildirimdeki **Eve çağır** ile de çağırabilirsin.

- **Dokun:** güler, el sallar, bir şey söyler (başına dokunursan utanır; uyurken uyanır; saklanmışsa "buldun!")
- **Çift dokun:** dinler — konuş, cevabı konuşma balonunda (ve sesli) verir; "eve dön", "dans et", "saklan", "otur", "uyu" dersen yapar
- **Basılı tut / sürükle:** onu taşırsın; bırakınca düşer, altındaki simgenin ya da arama çubuğunun üstüne iner
- Kendi kendine: simgelerin **üstüne oturur** (ayaklarını sallar), simgelerin **arkasına saklanıp** seslenir, aralarında **yürür ve zıplar**, arama çubuğunda **uyur**, ara sıra dans eder; pil azalınca / şarja takınca söyler
- **Pil:** yalnızca Nova'nın bedeni kadar küçük bir pencere; yürürken 30, dururken 18, uyurken 8 kare/sn; ekran kapalıyken ya da başka uygulama açıkken çizim tamamen durur

**İzinler** (Nova sekmesinde düğmeleri var):
1. **Diğer uygulamaların üzerinde göster** — gerekli.
2. **Erişilebilirlik → "Nova — ana ekran simgeleri"** — önerilir. Simgelerin yerini görür (üstlerine oturur, arkalarına saklanır) ve yalnızca ana ekrandayken görünür.
   Başka uygulamaların içeriğini okumaz; yalnızca ana ekran uygulamasının simge konumlarına bakar.
   Android 13+ "Kısıtlanmış ayar" derse: **Ayarlar → Uygulamalar → Nova → ⋮ (sağ üst) → Kısıtlanmış ayarlara izin ver**, sonra tekrar aç.
   Bu izin olmadan Nova ekranın altında gezer.
3. **Mikrofon** — dışarıdayken konuşmak için. 4. **Bildirim** — "Nova dışarıda" bildirimi.

Simgelerin üstüne tam oturmuyorsa (havada kalıyor ya da simgeye gömülüyorsa) **Nova → Dışarı çık → Simge** ayarını oynat; her telefonun ana ekranı farklı.

## İçinde ne var

| Ekran | Ne yapar |
|---|---|
| **Mikrofon** (yazı kutusunun yanındaki düğme) | Konuşarak yaz; Nova sesli yanıt verir (telefonun Türkçe sesi) |
| **Nova** | **Dışarı çık** (yukarıya bak) · **Beden** (göğüs, bel, kalça, boy oranları) · Kişilik (ad, 7 özellik, konuşma tarzı, sevdikleri/sevmedikleri, ses perdesi ve hızı) · **Hafıza** (senin hakkında hatırladıkları: sohbetten kendisi çıkarır, elle eklenir/silinir) · kalıcı sohbet geçmişi |
| **Gardırop** | Kıyafetler — Nova dolabına gider, kıyafeti eline alır ve **elleriyle giyinir** (kazağı başından geçirir, pantolonu bacak bacak giyip çeker, elbiseyi indirir) + **kıyafet atölyesi**: temel kesim, üst/alt renk, desen (puantiye, çizgili, ekose, çiçekli, yıldızlı). Nova sohbette kendi kıyafetini de tasarlar |
| **Oda** | Eşyaları taşı/döndür (Nova yolunu ve etkinlik yerlerini yeni düzene göre bulur), zemin ve duvar kaplaması |
| **Komutlar** | Kendi komutların: tetikleyici söz → adımlar (söz, hareket, ifade, yürüme, etkinlik, duruş, kıyafet…). Nova da bunları uygun gördüğünde kullanır |
| **Hareket / Atölye** | Hazır ve gerçek kayıttan hareketler; yeni hareket tasarlama |
| **Ayarlar** | Yapay zekâ anahtarı ve modeli, ses, uyku saatleri, ışık (telefonun açık/koyu moduna göre), görsel kalite, **pil modu** ve **otomatik kalite**, **hata günlüğü**, başlangıç rehberi, **yedek al / yükle** |

## Yapı

- `app/src/main/java/com/drtyl/nova/` — yerel kabuk:
  - `Kulak.kt` "Nova ses ver" (Vosk ile internetsiz anahtar söz) · `Telefon.kt` asistan işleri ve hatırlatmalar
  - `MainActivity.kt` uygulama (Nova'nın evi) · `Varlik.kt` dosyaları `https://nova.yerel/` adresinden sunar + hata günlüğü · `NovaKopru.kt` ortak köprü (depo, internet, pil, izin durumu) · `NovaSes.kt` mikrofon ve sesli okuma
  - `DisariServisi.kt` dışarıdaki Nova: şeffaf küçük pencere, konuşma balonu, dokunma/sürükleme, bildirim
  - `IkonServisi.kt` erişilebilirlik: ana ekranda mıyız + simgelerin yerleri
- `app/src/main/assets/www/` — uygulamanın kendisi (çevrimdışı çalışır; yalnızca yapay zekâ için internet gerekir):
  - `lib/` three.js r160 + three-vrm 2.1.0 (yerel kopya)
  - `model/nova.wasm` Nova'nın 3B modeli · `doku/` cilt, kıyafet ve oda dokuları
  - `disari.html` + `js/disari/` dışarıdaki Nova (yürüme, zıplama, oturma, saklanma, konuşma)
  - `js/beyin/telefon.js` telefon işleri ve not defteri
  - `js/platform.js` köprü · `js/beyin/` beyin (Groq), kişilik, hafıza, komutlar · `js/oda/` oda, gardırop, atölye, düzen · `js/motor/` hareket motoru · `js/arayuz/` ekranlar
- Ses tanıma: Vosk (alphacephei.com, Apache 2.0) ve Türkçe küçük modeli.
- Hareket kayıtları: CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), Nova'nın iskeletine çevrildi.
