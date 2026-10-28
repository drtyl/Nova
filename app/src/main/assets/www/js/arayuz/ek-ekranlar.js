'use strict';
/* =========================================================
   EK EKRANLAR — Dışarı çık (ana ekranda Nova), beden oranları, hata günlüğü,
   ilk açılış rehberi
   ========================================================= */

/* ---------------- hata günlüğü ---------------- */
const hataGunlugu = [];
const hataEkle = m => { hataGunlugu.push(`${new Date().toLocaleTimeString('tr-TR')} ${m}`); if (hataGunlugu.length > 150) hataGunlugu.shift(); };
addEventListener('error', e => hataEkle(`[hata] ${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`));
addEventListener('unhandledrejection', e => hataEkle(`[söz] ${e.reason?.message || e.reason?.code || e.reason}`));
function hataGunluguCiz(){
  let yerel = ''; try { yerel = NATIVE?.gunluk?.() || ''; } catch(e){}
  const metin = [yerel, ...hataGunlugu].filter(Boolean).join('\n');
  $('hataGunluk').textContent = metin || 'Henüz kayıt yok.';
  return metin;
}

/* ---------------- dışarı çık ---------------- */
const DIS_AYAR = Object.assign({ boy:'orta', heryerde:false, sesli:true, konuskan:true, simgeOlcek:0.62 }, depo.oku('nova-disari', {}));
function disAyarKaydet(){ depo.yaz('nova-disari', DIS_AYAR); }
function disariDurumu(){
  if (!NATIVE?.disariDurumu) return null;
  try { const r = JSON.parse(NATIVE.disariDurumu()); return r.ok ? r.data : null; } catch(e){ return null; }
}
function izinleriCiz(){
  const kap = $('dIzinler'); if (!kap) return;
  kap.innerHTML = '';
  const d = disariDurumu();
  if (!d){ kap.append(eleman('p', {className:'not'}, 'Dışarı çıkma yalnızca telefondaki uygulamada (APK) çalışır.')); $('dCik').disabled = true; return; }
  const satir = (tamam, ad, aciklama, dugme, f, ek) => kap.append(eleman('div', {className:'izin' + (tamam ? ' tamam' : '')},
    eleman('i', {}, tamam ? '✓' : '!'), eleman('span', {}, ad, eleman('small', {}, aciklama)),
    tamam ? null : eleman('button', {className:'btn ikincil kucuk', type:'button', on:{click:f}}, dugme), ek || null));
  satir(d.ustteGoster, 'Üstte gösterme', 'Gerekli: Nova ana ekranda görünebilsin', 'İzin ver', () => NATIVE.ustteGosterIzniAc());
  satir(d.erisim, 'Simgeleri görme (erişilebilirlik)', 'Önerilir: simgelerin üstüne oturur, arkasına saklanır; yalnızca ana ekrandayken görünür. Başka uygulamaları okumaz.', 'Aç', () => { NATIVE.erisimAyarlariAc(); },
    d.erisim ? null : eleman('button', {className:'baglanti', type:'button', on:{click:() => NATIVE.uygulamaBilgisiAc()}}, 'Açılmıyor mu? ("Kısıtlanmış ayar") → Uygulama bilgisi → ⋮ → Kısıtlanmış ayarlara izin ver'));
  satir(d.mikrofon, 'Mikrofon', 'Dışarıdayken çift dokunup konuşabilmek için', 'İzin ver', () => NATIVE.mikrofonIzniIste?.());
  if (NATIVE.bildirimIzniVar && !NATIVE.bildirimIzniVar()) satir(false, 'Bildirim', '"Nova dışarıda" bildirimi ve oradan eve çağırma', 'İzin ver', () => NATIVE.bildirimIzniIste());
  $('dCik').disabled = !d.ustteGoster;
  $('dDurum').textContent = d.ustteGoster ? (d.erisim ? '' : 'Simge izni olmadan ekranın altında gezer.') : 'Önce "Üstte gösterme" iznini ver.';
}
window.__novaIzinDegisti = () => { try { izinleriCiz(); } catch(e){} };
function disariEkranKur(){
  $('dBoy').value = DIS_AYAR.boy; $('dSesli').checked = DIS_AYAR.sesli; $('dKonuskan').checked = DIS_AYAR.konuskan; $('dHeryerde').checked = DIS_AYAR.heryerde;
  $('dSimge').value = Math.round(DIS_AYAR.simgeOlcek*100); $('dSimgeD').textContent = $('dSimge').value;
  $('dBoy').addEventListener('change', e => { DIS_AYAR.boy = e.target.value; disAyarKaydet(); });
  for (const [id, k] of [['dSesli', 'sesli'], ['dKonuskan', 'konuskan'], ['dHeryerde', 'heryerde']]) $(id).addEventListener('change', e => { DIS_AYAR[k] = e.target.checked; disAyarKaydet(); });
  $('dSimge').addEventListener('input', e => { DIS_AYAR.simgeOlcek = +e.target.value/100; $('dSimgeD').textContent = e.target.value; disAyarKaydet(); });
  $('dCik').addEventListener('click', () => disariCik());
  izinleriCiz();
}
/* evden çık: el sallar, telefonun içine doğru küçülür, ana ekranda Nova simgesinden çıkar */
const olcekGecisi = (hedef, sure) => new Promise(res => {
  const bas = performance.now()/1000, ilk = govde.scale.x;
  const adim = () => { const u = Math.min(1, (performance.now()/1000 - bas)/sure); govde.scale.setScalar(Math.max(0.001, ilk + (hedef - ilk)*yumusak(u))); if (u < 1) requestAnimationFrame(adim); else res(); };
  requestAnimationFrame(adim);
});
let disariCikiyor = false;
async function disariCik(soz){
  if (disariCikiyor) return false;
  const d = disariDurumu();
  if (!d){ sohbetEkle('sistem', 'Dışarı çıkma yalnızca telefondaki uygulamada çalışır.'); return false; }
  if (!d.ustteGoster){ sohbetEkle('sistem', 'Nova\'nın ana ekranına çıkabilmesi için "Diğer uygulamaların üzerinde göster" iznini aç (Nova sekmesi → Dışarı çık).'); NATIVE.ustteGosterIzniAc(); return false; }
  disariCikiyor = true;
  try {
    if (akt.ad) await aktiviteBitir(); else if (durus.w > 0.02) await durusAyarla('ayakta');
    try { cekmece(false); } catch(e){}
    await don(kameraYonu());
    oynatici.oynat('el salla', hazirla(VERI.hareketler.el_salla), {dongu:true, donem:0.8, sure:1.8});
    const s = konus(soz || rastgeleSec(['Biraz dışarı çıkıyorum, ana ekranında görüşürüz!', 'Hadi bakalım, dışarı!', 'Ana ekranına geliyorum!']));
    await bekle(1.6);
    await olcekGecisi(0.001, 0.45);
    await Promise.race([s, bekle(1.2)]);
    const r = NATIVE.disariCik();
    if (r !== 'tamam'){ govde.scale.setScalar(1); return false; }
    return true;
  } finally { disariCikiyor = false; }
}
const rastgeleSec = a => a[Math.floor(Math.random()*a.length)];
/* dışarıdan eve geldi (uygulama açıldı) */
window.novaEveGeldi = async () => {
  govde.scale.setScalar(0.001);
  await bekle(0.25);
  await olcekGecisi(1, 0.55);
  calistir([{eylem:'el_salla', soz:rastgeleSec(['Eve döndüm!', 'Evim evim güzel evim.', 'Dışarısı güzeldi ama evim gibisi yok!'])}]).catch(() => {});
};
/* güvenlik: bir şey ters gider de küçük kalırsa düzelt */
document.addEventListener('visibilitychange', () => { if (!document.hidden && !disariCikiyor && govde.scale.x < 0.99) setTimeout(() => { if (govde.scale.x < 0.99 && !disariCikiyor) olcekGecisi(1, 0.4); }, 1500); });

/* ---------------- beden ---------------- */
function bedenEkranKur(){
  const kap = $('bAyarlar'); kap.innerHTML = '';
  for (const k of Object.keys(BEDEN_VARSAYILAN)){
    const [a, b] = BEDEN_SINIR[k], deger = eleman('span', {}, '');
    const g = eleman('input', {type:'range', min:Math.round(a*100), max:Math.round(b*100), value:Math.round(BEDEN[k]*100), 'aria-label':BEDEN_AD[k]});
    const yaz = () => { deger.textContent = '%' + g.value; };
    g.addEventListener('input', () => { BEDEN[k] = +g.value/100; yaz(); bedenUygula(); });
    g.addEventListener('change', () => { bedenKaydet(); bedenSonrasi(); });
    yaz(); kap.append(eleman('div', {className:'kaydirici'}, eleman('span', {}, BEDEN_AD[k]), g, deger));
  }
}
function bedenSonrasi(){   // oturma yüksekliği beden değişince yeniden ölçülür
  try { vrm.scene.updateMatrixWorld(true); const k = b => vrm.humanoid.getRawBoneNode(b).getWorldPosition(new THREE.Vector3());
    const kalca = k('leftUpperLeg'), diz = k('leftLowerLeg'), bilek = k('leftFoot'); OTURMA_DUSUS = Math.max(0.2, kalca.y - (bilek.y + diz.distanceTo(bilek))); TEMAS.hazir = false; } catch(e){}
}

/* ---------------- ilk açılış rehberi ---------------- */
function rehberAc(){
  const adimlar = [
    { b:'Merhaba, ben Nova!', m:'Telefonunun içinde, kendi odamda yaşıyorum. Benimle yazarak ya da mikrofonla konuşabilirsin; söylediklerini hatırlarım, kıyafet değiştiririm, odamı düzenleyebilirsin.',
      ek: () => eleman('label', {className:'blok'}, 'Sana nasıl hitap edeyim?', eleman('input', {type:'text', id:'rAd', maxLength:30, value:KISILIK.kullanici || '', placeholder:'ör. Tayyar'})) },
    { b:'Beynim: yapay zekâ', m:'Akıllıca konuşabilmem için ücretsiz bir Groq anahtarı gerekiyor: console.groq.com → API Keys. Anahtar yalnızca bu telefonda kalır. Şimdi atlayıp sonra Ayarlar\'dan da ekleyebilirsin.',
      ek: () => eleman('input', {type:'password', id:'rAnahtar', placeholder:'gsk_… (isteğe bağlı)', autocomplete:'off', spellcheck:false}) },
    { b:'Dışarı çıkabilirim', m:'İstersen ana ekranına çıkarım: simgelerinin üstüne oturur, arkasına saklanır, aralarında gezerim. Bunun için Nova sekmesinde birkaç izin var; istediğin zaman açabilirsin.' },
    { b:'Hazırız!', m:'Alttaki düğmeden kontrolleri açabilirsin. Bana "dans et", "kitap oku", "pijamanı giy" ya da "dışarı çık" diyebilirsin.' },
  ];
  let i = 0;
  const kap = eleman('div', {className:'rehber', role:'dialog', 'aria-modal':'true'});
  const kart = eleman('div', {className:'rehberKart'}); kap.append(kart); document.body.append(kap);
  const kaydet = () => {
    const ad = $('rAd')?.value.trim(); if (ad != null && $('rAd')){ KISILIK.kullanici = ad; kisilikKaydet(); try { kisilikEkranKur(); } catch(e){} }
    const an = $('rAnahtar')?.value.trim(); if (an){ AI_AYAR.anahtar = an; depo.yaz('nova-ai', AI_AYAR); try { $('aiAnahtar').value = an; beyinBagla(); } catch(e){} }
  };
  const ciz = () => {
    const a = adimlar[i]; kart.innerHTML = '';
    kart.append(eleman('div', {className:'rehberNokta'}, ...adimlar.map((_, j) => eleman('i', {className:j === i ? 'su' : ''}))),
      eleman('h3', {}, a.b), eleman('p', {}, a.m), a.ek ? a.ek() : null,
      eleman('div', {className:'satir'},
        eleman('button', {className:'btn ikincil', type:'button', on:{click:() => { kaydet(); kapat(); }}}, i < adimlar.length - 1 ? 'Atla' : 'Kapat'),
        eleman('button', {className:'btn', type:'button', on:{click:() => { kaydet(); if (i < adimlar.length - 1){ i++; ciz(); } else kapat(); }}}, i < adimlar.length - 1 ? 'İleri' : 'Başlayalım')));
  };
  const kapat = () => { kap.remove(); depo.yaz('nova-ilk-acilis', 1); };
  ciz();
}

/* ---------------- kur ---------------- */
function ekEkranlariKur(){
  try { disariEkranKur(); } catch(e){ console.warn('dışarı ekranı', e); }
  try { bedenEkranKur(); } catch(e){ console.warn('beden ekranı', e); }
  $('bSifirla').addEventListener('click', () => { Object.assign(BEDEN, BEDEN_VARSAYILAN); bedenKaydet(); bedenUygula(); bedenEkranKur(); bedenSonrasi(); });
  $('hataYenile').addEventListener('click', hataGunluguCiz);
  $('hataKopyala').addEventListener('click', async () => { const m = hataGunluguCiz(); try { await navigator.clipboard.writeText(m); $('hataKopyala').textContent = 'Kopyalandı'; } catch(e){ const r = document.createRange(); r.selectNodeContents($('hataGunluk')); getSelection().removeAllRanges(); getSelection().addRange(r); } });
  $('hataTemizle').addEventListener('click', () => { hataGunlugu.length = 0; try { NATIVE?.gunlukTemizle?.(); } catch(e){} hataGunluguCiz(); });
  $('rehberAc').addEventListener('click', () => { try { cekmece(false); } catch(e){} rehberAc(); });
  document.querySelector('[data-s="ayar"]')?.addEventListener('click', () => setTimeout(hataGunluguCiz, 50));
  document.querySelector('[data-s="nova"]')?.addEventListener('click', () => setTimeout(izinleriCiz, 50));
  if (!depo.oku('nova-ilk-acilis', 0)) setTimeout(() => { if (!document.querySelector('.rehber')) rehberAc(); }, 2500);
}
ekEkranlariKur();
