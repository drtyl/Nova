'use strict';
/* =========================================================
   EK KOMUTLAR — kullanıcının kendi yazdığı komutlar
   Bir komut: tetikleyici sözler + sırayla çalışan adımlar (motorun JSON komutları).
   Mesaj bir tetikleyiciyi içerirse yapay zekâya sorulmadan çalışır; Nova da {"ozel":"id"} ile kendisi çağırabilir.
   ========================================================= */
const KOMUT_ORNEK = [
  { id:'gunaydin', ad:'Günaydın', tetik:['günaydın'], aciklama:'Sabah selamı: gerinir, esner ve günaydın der', aktif:true,
    adimlar:[{eylem:'gerin2', soz:'Günaydın! Uykumu daha yeni attım.'}, {eylem:'el_salla'}] },
  { id:'iyi_geceler', ad:'İyi geceler', tetik:['iyi geceler', 'yatma vakti'], aciklama:'Pijamasını giyip yatağa gider', aktif:true,
    adimlar:[{soz:'İyi geceler! Pijamamı giyip yatıyorum.', ifade:'rahat'}, {kiyafet:'pijama'}, {aktivite:'uyu'}] },
  { id:'parti', ad:'Parti', tetik:['parti zamanı', 'dans et'], aciklama:'Salsa yapar', aktif:true,
    adimlar:[{soz:'Müzik nerede? Hadi!', ifade:'mutlu'}, {eylem:'salsa', sure:8}] },
];
let KOMUTLAR = depo.oku('nova-komutlar', null) || KOMUT_ORNEK.map(k => ({...k}));
function komutlarKaydet(){ depo.yaz('nova-komutlar', KOMUTLAR); }
const normalize = s => String(s || '').toLocaleLowerCase('tr').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
function komutBul(metin){
  const m = ' ' + normalize(metin) + ' ';
  for (const k of KOMUTLAR) if (k.aktif !== false && k.tetik.some(t => normalize(t) && m.includes(' ' + normalize(t) + ' '))) return k;
  return null;
}
function komutDogrula(adimlar){
  if (!Array.isArray(adimlar) || !adimlar.length) return ['en az bir adım gerekli'];
  const h = [];
  adimlar.forEach((a, i) => { if (a && a.ozel) return; for (const x of dogrula(a)) h.push(`${i + 1}. adım: ${x}`); });
  return h;
}
function komutlarMetni(){
  const l = KOMUTLAR.filter(k => k.aktif !== false);
  if (!l.length) return '';
  return `KULLANICININ TANIMLADIĞI KOMUTLAR (uygun düşerse komutlar listesine {"ozel":"id"} ekleyerek çalıştırabilirsin): ${l.map(k => `${k.id} (${k.ad}: ${k.aciklama || k.tetik.join(', ')})`).join('; ')}.`;
}
/* adım şablonları (ekrandaki "Adım ekle" düğmeleri) */
const ADIM_SABLON = {
  'Söz':        {soz:'Merhaba!'},
  'Hareket':    {eylem:'el_salla'},
  'İfade':      {ifade:'mutlu', soz:'…'},
  'Yürü':       {git:'sana'},
  'Etkinlik':   {aktivite:'kitap', sure:120},
  'Duruş':      {durus:'yere_otur'},
  'Kıyafet':    {kiyafet:'elbise'},
  'Ruh hali':   {ruh_hali:'neseli'},
  'Bak':        {bak:'sol'},
  'Özel poz':   {poz:{rightUpperArm:[0, 0, -60]}, sure:2},
};
