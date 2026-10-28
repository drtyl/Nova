'use strict';
/* =========================================================
   14. DIŞ BAĞLANTI — Lonca ve diğer uygulamalar için
   ========================================================= */
window.Liz = window.Nova = Object.freeze({
  komut: k => calistir(k, {kaynak:'dis'}),
  konus: s => calistir({soz:String(s)}, {kaynak:'dis'}),
  ruhHali: a => ruhHali(a),
  ifade: (a, y) => ifadeAyarla(a, y),
  el: e => elAyarla(e),
  tema: a => temaAyarla(a),
  arayuz: g => sadeMod(!g),
  hazir: () => !!vrm,
  hareketler: () => [...Object.keys(VERI.hareketler), ...Object.keys(ozelHareketler), ...Object.keys(ogrenilenler)],
  git: (x, z) => calistir({git:{x, z}}, {kaynak:'dis'}),
  aktivite: a => calistir({aktivite:a}, {kaynak:'dis'}),
  durum: () => ({etkinlik:akt.ad, durum:akt.durum, konum:[govde.position.x, govde.position.z], ruh_hali:ruh}),
});
addEventListener('message', e => {
  const d = e.data;
  if (!d || typeof d !== 'object' || d.tip !== 'nova') return;
  const cevap = m => { try { e.source?.postMessage({tip:'nova-cevap', id:d.id, ...m}, '*'); } catch(_){} };
  if (!vrm) return cevap({durum:'hata', hata:'model henüz yüklenmedi'});
  try {
    if (d.tema) temaAyarla(d.tema);
    if ('arayuz' in d) sadeMod(!d.arayuz);
    if (d.ruh_hali) ruhHali(d.ruh_hali);
    if (d.komut) calistir(d.komut, {kaynak:'dis'}).then(() => cevap({durum:'bitti'}), err => cevap({durum:'hata', hata:err.message}));
    else cevap({durum:'tamam'});
  } catch(err){ cevap({durum:'hata', hata:err.message}); }
});
