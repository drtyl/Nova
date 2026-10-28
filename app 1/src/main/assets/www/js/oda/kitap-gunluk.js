'use strict';
/* ---- kitaplar: kaldığı sayfa saklanır ---- */
const KITAPLAR = [
  {ad:'Küçük Prens', yazar:'Antoine de Saint-Exupéry', sayfa:96, renk:0x8fc9e8},
  {ad:'Kürk Mantolu Madonna', yazar:'Sabahattin Ali', sayfa:160, renk:0xe87d9b},
  {ad:'Momo', yazar:'Michael Ende', sayfa:256, renk:0xffd58a},
  {ad:'Alice Harikalar Diyarında', yazar:'Lewis Carroll', sayfa:136, renk:0xb79ce9},
];
const okuma = depo.oku('nova-kitap', {kitap:0, sayfa:1, biten:[]});
const simdikiKitap = () => KITAPLAR[okuma.kitap % KITAPLAR.length];

/* ---- günlük: yalnızca gerçekten yaptıkları ---- */
const gunluk = depo.oku('nova-gunluk', []);
function gunlugeYaz(ad, sn, not){
  if (ad !== 'tablo_bitti' && sn < 8) return;
  gunluk.push({t:Date.now(), ad, dk:Math.max(1, Math.round(sn/60)), not:not || ''});
  while (gunluk.length > 30) gunluk.shift();
  depo.yaz('nova-gunluk', gunluk); try { gunlukCiz(); } catch(e){}
}
function gunlukMetni(n=8){
  if (!gunluk.length) return 'henüz bir kayıt yok';
  return gunluk.slice(-n).map(g => { const d = new Date(g.t); const s = d.toLocaleString('tr-TR', {weekday:'short', hour:'2-digit', minute:'2-digit'});
    return g.ad === 'tablo_bitti' ? `${s}: ${g.not}` : `${s}: ${g.dk} dk ${ISTASYON[g.ad]?.ad || g.ad}${g.not ? ' (' + g.not + ')' : ''}`; }).join('; ');
}
