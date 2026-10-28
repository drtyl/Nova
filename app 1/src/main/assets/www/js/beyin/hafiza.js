'use strict';
/* =========================================================
   HAFIZA — Nova'nın kullanıcı hakkında hatırladıkları
   · Kısa süreli: son sohbet (beyin.js, kalıcı, son 24 mesaj)
   · Uzun süreli: tek tek kayıtlar (bilgi, tercih, olay, plan, şaka/takma ad)
   Sohbetten kendiliğinden çıkarılır (her 5 kullanıcı mesajında bir) ya da elle eklenir.
   Yalnızca kullanıcının gerçekten söylediği şeyler kaydedilir; Nova uydurmaz.
   ========================================================= */
const HAFIZA_TUR = { bilgi:'Bilgi', tercih:'Tercih', olay:'Olay', plan:'Plan', sakalasma:'Şaka / takma ad' };
let HAFIZA = depo.oku('nova-hafiza', []);
const hafizaDurum = { sayac: depo.oku('nova-hafiza-sayac', 0), calisiyor: false, son: '' };
function hafizaKaydet(){ HAFIZA = HAFIZA.slice(-150); depo.yaz('nova-hafiza', HAFIZA); try { hafizaCiz(); } catch(e){} }
function hafizaEkle(metin, tur = 'bilgi', kaynak = 'elle'){
  metin = String(metin || '').trim().slice(0, 220); if (!metin) return null;
  const ayni = HAFIZA.find(h => h.metin.toLocaleLowerCase('tr') === metin.toLocaleLowerCase('tr')); if (ayni) return ayni;
  const h = { id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), metin, tur: HAFIZA_TUR[tur] ? tur : 'bilgi', zaman: Date.now(), kaynak };
  HAFIZA.push(h); hafizaKaydet(); return h;
}
function hafizaSil(id){ HAFIZA = HAFIZA.filter(h => h.id !== id); hafizaKaydet(); }
/* İlgili anıları seç: hafıza büyüyünce hepsi yerine konuşulan konuyla ilgili olanlar + en yeniler + temel bilgiler */
const hafizaKelimeleri = s => new Set(String(s || '').toLocaleLowerCase('tr').split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2).map(w => w.slice(0, 5)));
function hafizaSec(sorgu, adet = 40){
  if (HAFIZA.length <= adet) return HAFIZA;
  const q = hafizaKelimeleri(sorgu), n = HAFIZA.length;
  const puan = HAFIZA.map((h, i) => {
    let ortak = 0; for (const w of hafizaKelimeleri(h.metin)) if (q.has(w)) ortak++;
    return { h, i, p: ortak*3 + (i/n)*1.5 + (h.tur === 'bilgi' ? 1 : h.tur === 'tercih' ? 0.7 : 0) + (i >= n - 8 ? 2 : 0) };
  });
  return puan.sort((a, b) => b.p - a.p).slice(0, adet).sort((a, b) => a.i - b.i).map(x => x.h);
}
function hafizaMetni(sorgu){
  if (!HAFIZA.length) return 'HAFIZAN: kullanıcı hakkında henüz kayıtlı bir bilgin yok; tanımadığın şeyleri tahmin etme, gerekirse sor.';
  const konu = sorgu ?? (typeof gecmis !== 'undefined' ? gecmis.filter(m => m.role === 'user').slice(-3).map(m => m.content).join(' ') : '');
  const satir = hafizaSec(konu).map(h => `- (${HAFIZA_TUR[h.tur]}, ${new Date(h.zaman).toLocaleDateString('tr-TR')}) ${h.metin}`).join('\n');
  return `HAFIZAN (kullanıcı hakkında gerçekten bildiklerin; uygun düştüğünde doğal biçimde kullan, şakalara gönderme yapabilirsin):\n${satir}`;
}
/* sohbetten yeni anılar çıkar */
function hafizaTetik(){
  if (!$('hafizaOto')?.checked) return;
  hafizaDurum.sayac++; depo.yaz('nova-hafiza-sayac', hafizaDurum.sayac);
  if (hafizaDurum.sayac % 5 === 0) hafizaCikar();
}
async function hafizaCikar(){
  if (hafizaDurum.calisiyor || !sample || aiDurum !== 'acik') return 0;
  const son = gecmis.slice(-12).map(m => (m.role === 'user' ? 'Kullanıcı: ' : 'Nova: ') + (m.role === 'user' ? m.content : (() => { try { return JSON.parse(m.content).soz || ''; } catch(e){ return ''; } })())).filter(s => !/: $/.test(s)).join('\n');
  if (!son.trim()) return 0;
  hafizaDurum.calisiyor = true;
  try {
    const istem = `Aşağıdaki sohbetten, kullanıcı hakkında ileride hatırlanmaya değer YENİ bilgileri çıkar.
Kurallar: Yalnızca kullanıcının AÇIKÇA söylediği şeyler (adı, işi, sevdikleri/sevmedikleri, planları, önemli olaylar, aranızdaki şakalar ve takma adlar). Tahmin, yorum, Nova'nın kendi söyledikleri ve geçici şeyler (şu an acıktım gibi) KAYDEDİLMEZ. Zaten bilinenleri tekrar etme. Her biri kısa, üçüncü tekil kişiyle bir cümle olsun ("Kullanıcının adı Ahmet.").
Bilinenler:\n${HAFIZA.slice(-60).map(h => '- ' + h.metin).join('\n') || '(yok)'}
Sohbet:\n${son}
YANIT yalnızca JSON: {"yeni":[{"metin":"…","tur":"bilgi|tercih|olay|plan|sakalasma"}]}  (yeni bilgi yoksa "yeni": [])`;
    const y = await sample.json([{role:'user', content:istem}], {modelTier:'quick', cache:false});
    let n = 0;
    for (const h of (Array.isArray(y?.yeni) ? y.yeni : []).slice(0, 6)) if (h && h.metin && hafizaEkle(h.metin, h.tur, 'otomatik')) n++;
    hafizaDurum.son = n ? `${n} yeni şey hatırladı` : 'yeni bir şey yok';
    if (n) sohbetEkle('sistem', `Nova ${n} yeni şeyi hafızasına kaydetti (Nova → Hafıza).`);
    return n;
  } catch(e){ hafizaDurum.son = 'çıkarılamadı'; return 0; }
  finally { hafizaDurum.calisiyor = false; try { hafizaCiz(); } catch(e){} }
}
