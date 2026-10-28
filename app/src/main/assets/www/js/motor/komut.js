'use strict';
/* =========================================================
   9. KOMUT SÖZLEŞMESİ VE YÜRÜTÜCÜ
   ========================================================= */
const SOZLESME = {
  "eylem": "hareket adı (kütüphaneden)", "taraf": "sag | sol", "sure": "saniye (döngülü hareketlerde toplam süre)", "hiz": "0.5–2",
  "ifade": "mutlu | kizgin | uzgun | rahat | saskin | notr", "yogunluk": "0–1",
  "el": "rahat | acik | yumruk | isaret | zafer | kalp  ya da {\"sag\":…, \"sol\":…}",
  "bak": "kamera | sol | sag | yukari | asagi", "soz": "söylenecek cümle (ağız senkronu + balon + ses)",
  "poz": "{\"kemikAdı\": [x, y, z] derece}  — özel duruş", "ruh_hali": "notr | neseli | enerjik | merakli | gergin | uzgun | yorgun  (kalıcı)",
  "kalici": "true ise ifade / el şekli komut bitince sıfırlanmaz",
  "git": "{\"x\": -1.5…1.5, \"z\": -1.6…0.9}  ya da  merkez | sana | geri | sol | sag  — oraya yürür",
  "sonra": "git'ten sonra: kamera (sana döner) | serbest", "don": "kamera | derece (0 = sana bakar)",
  "aktivite": "kitap | resim | yaz | pencere | uyu | kalk  — odadaki etkinlik (uzun sürer; sure ile saniye)",
  "durus": "ayakta | otur | yere_otur | uzan  — kalıcı duruş; otururken konuşma ve jestler duruşu bozmaz",
  "ozel": "kullanıcının tanımladığı komutun id'si — o komutun adımları çalışır",
  "kiyafet_tasarla": "{ad, temel: gunluk|elbise|ev|pijama|spor|ic, ust: '#renk', alt: '#renk', desen: duz|puantiye|cizgili|ekose|cicekli|yildizli}  — yeni kıyafet tasarlar, gardıroba ekler ve giyer",
  "telefon": "{is, …} — telefonda iş yapar: alarm, zamanlayıcı, hatırlatma, arama, mesaj, uygulama, fener, yol, müzik, ses, takvim, ayar, web, not (bkz. TELEFON İŞLERİ)",
  "disari": "cik — evinden çıkıp kullanıcının ana ekranına gidersin (yalnızca kullanıcı isterse)",
  "kiyafet": "gunluk | elbise | ev | pijama | spor | ic  — gardıroba gidip kapağın önünde kıyafet değiştirir",
  "hareket": "{ad, sure, dongu, donem, simetrik, kareler:[…]}  — anında yeni hareket; Nova bunu öğrenir ve saklar"
};
function hareketBul(ad){ return VERI.hareketler[ad] || ozelHareketler[ad] || ogrenilenler[ad]; }
function dogrula(k){
  const h = [];
  if (typeof k !== 'object' || !k || Array.isArray(k)) return ['her komut bir nesne olmalı'];
  if (k.eylem && !hareketBul(k.eylem)) h.push(`"${k.eylem}" adında bir hareket yok`);
  if (k.ifade && k.ifade !== 'notr' && !IFADE[k.ifade]) h.push(`"${k.ifade}" adında bir ifade yok`);
  if (k.taraf && !['sag','sol'].includes(k.taraf)) h.push('taraf "sag" ya da "sol" olmalı');
  if (k.ruh_hali && !VERI.ruh_halleri[k.ruh_hali]) h.push(`"${k.ruh_hali}" adında bir ruh hali yok`);
  if (k.bak && !BAKIS_YON[k.bak] && k.bak !== 'kamera') h.push(`"${k.bak}" bakış yönü değil`);
  if (k.poz){ if (typeof k.poz !== 'object') h.push('poz bir nesne olmalı'); else for (const [b, v] of Object.entries(k.poz)) { if (b !== '_kok' && !vrm.humanoid.getNormalizedBoneNode(kemikAdi(b))) h.push(`"${b}" diye bir eklem yok`); else if (!Array.isArray(v) || v.length !== 3) h.push(`${b} için [x,y,z] gerekli`); } }
  if (k.git !== undefined && !gitHedefi(k.git)) h.push('git hedefi anlaşılamadı');
  if (k.aktivite !== undefined && !ISTASYON[k.aktivite] && k.aktivite !== 'kalk') h.push(`"${k.aktivite}" diye bir etkinlik yok`);
  if (k.don !== undefined && k.don !== 'kamera' && !Number.isFinite(+k.don)) h.push('don "kamera" ya da bir derece olmalı');
  if (k.durus !== undefined && !DURUSLAR.includes(k.durus) && k.durus !== 'kalk') h.push(`"${k.durus}" bir duruş değil (ayakta | otur | yere_otur | uzan)`);
  if (k.kiyafet !== undefined && !KIYAFET_TANIM[k.kiyafet]) h.push(`"${k.kiyafet}" diye bir kıyafet yok`);
  if (k.telefon !== undefined && (typeof k.telefon !== 'object' || !TELEFON_ISLER[k.telefon?.is])) h.push(`telefon işi anlaşılamadı (${k.telefon?.is || '?'})`);
  return h;
}
let nesil = 0, komutMesgul = null;
const bekle = sn => new Promise(r => setTimeout(r, sn*1000));
function siraGoster(liste, i){
  const s = $('sira'); s.innerHTML = '';
  if (!liste || liste.length < 2) return;
  liste.forEach((k, j) => { const e = document.createElement('span'); e.textContent = k.eylem || (k.poz ? 'poz' : k.ifade || k.soz ? 'söz' : '•'); e.className = j < i ? 'bitti' : j === i ? 'su' : ''; s.appendChild(e); });
}
async function calistir(komut, {kaynak='json'}={}){
  let liste = (Array.isArray(komut) ? komut : [komut]).filter(Boolean);
  // kullanıcı komutlarını aç (iç içe en fazla 3 kat) ve kıyafet tasarımlarını gardıroba kaydet
  for (let kat = 0; kat < 3 && liste.some(k => k && k.ozel); kat++)
    liste = liste.flatMap(k => { if (!k || !k.ozel) return [k]; const m = KOMUTLAR.find(x => x.id === k.ozel); if (!m) throw new Error(`"${k.ozel}" diye bir kullanıcı komutu yok`); const a = m.adimlar.map(x => ({...x})); if (k.soz && a.length) a[0].soz = a[0].soz || k.soz; return a; });
  for (const k of liste) if (k && k.kiyafet_tasarla && typeof k.kiyafet_tasarla === 'object'){ k.kiyafet = kiyafetTasarla(k.kiyafet_tasarla, 'nova'); delete k.kiyafet_tasarla; }
  for (const k of liste) if (k && k.hareket && !k.eylem){ k.eylem = ogrenKaydet(hareketiTemizle(k.hareket)); delete k.hareket; }
  for (const k of liste){ const h = dogrula(k); if (h.length) throw new Error(h.join('; ')); }
  const benim = ++nesil; komutMesgul = kaynak;
  if (kaynak !== 'serbest') ic.sikilma = 0;
  for (const b of Object.keys(manuel)) delete manuel[b];
  for (let i = 0; i < liste.length; i++){
    if (benim !== nesil) return;
    const k = liste[i]; if (kaynak !== 'serbest') siraGoster(liste, i);
    let erkenKonusma = null;
    // yalnızca yer değiştiren ya da bacakları kullanan komutlar oturuşu bozar; konuşma, jest ve baş hareketi bozmaz
    const bedensel = k.git !== undefined || k.don !== undefined || (k.eylem && tumBeden(k.eylem)) || (k.poz && Object.keys(k.poz).some(b => /Leg|Foot|Toes|hips|_kok/.test(b)));
    if (bedensel && !k.aktivite && !k.durus){ if (akt.ad) await aktiviteBitir(); else if (durus.w > 0.02) await durusAyarla('ayakta'); if (benim !== nesil) return; }
    if (k.durus){ if (k.soz) erkenKonusma = konus(String(k.soz).slice(0, 400)); await durusAyarla(k.durus); if (benim !== nesil) return; }
    if (k.telefon){   // önce işi yap; sonucu (olmadıysa nedenini, okuduysa bilgiyi) Nova söylesin
      const r = await telefonYap(k.telefon);
      if (benim !== nesil) return;
      const bilgi = !r.ok || TELEFON_OKUMA.has(k.telefon.is);
      if (bilgi || !k.soz) k.soz = r.mesaj;
      if (bilgi && r.mesaj){ sohbetEkle(r.ok ? 'nova' : 'sistem', r.mesaj); try { gecmis.push({role:'assistant', content:JSON.stringify({soz:r.mesaj, komutlar:[]})}); gecmisKaydet(); } catch(e){} }
    }
    if (k.disari){
      if (benim !== nesil) return;
      await disariCik(k.soz ? String(k.soz).slice(0, 200) : undefined);
      return;
    }
    if (k.kiyafet){
      if (k.soz) erkenKonusma = konus(String(k.soz).slice(0, 400));
      try { await kiyafetGiy(k.kiyafet); } catch(e){ sohbetEkle('sistem', e.message); }
      if (benim !== nesil) return;
    }
    if (k.aktivite){
      if (k.soz) erkenKonusma = konus(String(k.soz).slice(0, 400));
      if (k.aktivite === 'kalk') await aktiviteBitir();
      else { try { await aktiviteBasla(k.aktivite, Math.min(3600, +k.sure || 0) || null); } catch(e){ sohbetEkle('sistem', e.message); } }
      if (benim !== nesil) return;
    }
    if (k.git !== undefined){
      const g = gitHedefi(k.git);
      if (k.soz) erkenKonusma = konus(String(k.soz).slice(0, 400));
      await git(g[0], g[1], k.sonra === 'serbest' ? 'serbest' : 'kamera');
      if (benim !== nesil) return;
    }
    if (k.don !== undefined){ await don(k.don === 'kamera' ? kameraYonu() : (+k.don)*D2R); if (benim !== nesil) return; }
    else if (k.soz && k.git === undefined && !akt.ad && durus.w < 0.02 && kaynak !== 'serbest' && Math.abs(aciFark(kameraYonu(), hareketli.yon)) > 0.6) don(kameraYonu());
    if (k.ruh_hali) ruhHali(k.ruh_hali);
    let sure = 0, hareket = null;
    if (k.eylem && !k.aktivite){
      hareket = hareketBul(k.eylem);
      const hiz = Math.max(0.3, Math.min(3, +k.hiz || 1)), ad = k.eylem + (k.taraf === 'sol' ? ' · sol' : '');
      const kareler = hazirla(hareket, k.taraf);
      if (hareket.klip){ sure = hareket.dongu ? Math.max(0.5, Math.min(30, +k.sure || hareket.sure)) : hareket.sure/hiz; oynatici.oynatKlip(hareket.klip, {dongu:hareket.dongu, sure, hiz}); }
      else if (hareket.dongu){ sure = Math.max(0.5, Math.min(20, +k.sure || hareket.sure)); oynatici.oynat(ad, kareler, {dongu:true, donem:hareket.donem/hiz, sure}); }
      else { sure = hareket.sure/hiz; oynatici.oynat(ad, kareler, {sure}); }
    } else if (k.poz && !k.aktivite){
      const temiz = {}; for (const [b, v] of Object.entries(k.poz)) temiz[b] = b === '_kok' ? v.map(Number) : sikistir(b, v);
      const hedef = {...kopyala(oynatici.son), ...temiz};
      sure = k.sure ?? 2;
      oynatici.oynat('özel poz', [{t:0,poz:hedef},{t:1,poz:hedef}], {sure:Math.max(0.3, sure), tut: sure === 0});
    }
    // el şekli: komut > hareketin kendi önerisi (sol tarafta aynalanır)
    let el = k.el || hareket?.el || null;
    if (!k.el && el && k.taraf === 'sol' && typeof el === 'object') el = {sag:el.sol, sol:el.sag};
    if (el){ elAyarla(el); if (k.kalici && k.el) elTaban = {...elHedef}; }
    const ifade = k.ifade || hareket?.ifade || null;
    if (ifade) ifadeAyarla(ifade, k.yogunluk ?? hareket?.yogunluk ?? 0.8);
    if (k.bak){ bakis.gecici = k.bak === 'kamera' ? null : k.bak; bakis.gecBit = performance.now()/1000 + Math.max(sure, 2); }
    let konusma = null;
    if (erkenKonusma) konusma = erkenKonusma;
    else if (k.soz){ konusma = konus(String(k.soz).slice(0, 400)); sure = Math.max(sure, konusma.sure + 0.3); }
    if (k.bak && !k.eylem && !k.poz) sure = Math.max(sure, 1.6);
    await Promise.all([bekle(Math.max(sure, 0.35)), konusma ? konusma.bitti : null]);
    if (benim !== nesil) return;
    if (ifade && !k.kalici) ifadeAyarla(null);
    if (el && !k.kalici) elAyarla(elTaban);
  }
  siraGoster(null);
  if (benim === nesil) komutMesgul = null;
}
