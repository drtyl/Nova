'use strict';
/* =========================================================
   TELEFON ASİSTANI — Nova'nın telefonda yaptığı işler (yerel tarafta Telefon.kt)
   Yapay zekâ {"telefon":{"is":"alarm","saat":7,"dakika":0}} gibi bir komut verir; burada zamanlar çözülür,
   gerekirse izin istenir, sonuç Nova'nın ağzından söylenir ve sohbet geçmişine not edilir.
   Notlar Nova'nın kendi defterinde (bu telefonda) tutulur.
   ========================================================= */
const TELEFON_ISLER = {
  alarm:         '{"is":"alarm","saat":0-23,"dakika":0-59,"etiket":"…"} — saat uygulamasında alarm kurar',
  zamanlayici:   '{"is":"zamanlayici","saniye":N,"etiket":"…"}',
  hatirlat:      '{"is":"hatirlat","zaman":"YYYY-MM-DDTHH:MM" ya da {"dakika_sonra":N},"metin":"neyi"} — zamanı gelince bildirimle hatırlatırsın',
  hatirlatmalar: '{"is":"hatirlatmalar"} — kurulu hatırlatmaları söyler',
  ara:           '{"is":"ara","kisi":"rehberdeki ad"} ya da {"numara":"…"} — numarayı çevirir, kullanıcı yeşil düğmeye basar',
  mesaj:         '{"is":"mesaj","kisi":"ad","metin":"…","uygulama":"sms|whatsapp"} — mesajı yazar, kullanıcı gönder\'e basar',
  uygulama:      '{"is":"uygulama","ad":"Spotify"} — uygulama açar',
  fener:         '{"is":"fener","acik":true|false}',
  yol:           '{"is":"yol","hedef":"adres/yer","mod":"araba|yuruyus|toplu"} — yol tarifi',
  harita:        '{"is":"harita","sorgu":"yakındaki eczane"}',
  muzik:         '{"is":"muzik","eylem":"oynat|durdur|sonraki|onceki"}',
  ses:           '{"is":"ses","yon":"arttir|azalt|sessiz"} ya da {"seviye":0-100}',
  takvim_ekle:   '{"is":"takvim_ekle","baslik":"…","bas":"YYYY-MM-DDTHH:MM","bit":"…","yer":"…"} — takvimde hazırlar, kullanıcı kaydeder',
  takvim:        '{"is":"takvim","gun":0 (bugün) | 1 (yarın) …,"gunSayisi":1-7} — takvimdeki etkinlikleri söyler',
  ayar:          '{"is":"ayar","tur":"wifi|internet|bluetooth|ses|ekran|pil|konum|rahatsiz_etme"}',
  web:           '{"is":"web","sorgu":"…"} — internette arar',
  kamera:        '{"is":"kamera"}',
  not_ekle:      '{"is":"not_ekle","metin":"…","liste":"genel|alışveriş|…"} — kendi defterine not alırsın',
  notlar:        '{"is":"notlar","liste":"…"} — notları söyler',
  not_sil:       '{"is":"not_sil","metin":"silinecek notun bir parçası"} ya da {"liste":"…"} (o listenin hepsi)',
};
function telefonMetni(){
  const simdi = new Date();
  return `TELEFON İŞLERİ — sen bu telefonun asistanısın; kullanıcı bir iş isterse komutlara {"telefon":{…}} ekleyerek YAPARSIN (yalnızca konuşma, gerçekten yap):
${Object.values(TELEFON_ISLER).map(x => '- ' + x).join('\n')}
Şu an: ${simdi.toLocaleString('tr-TR', {weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'})} (zamanları buna göre hesapla; "YYYY-MM-DDTHH:MM" yerel saat).
Kurallar: geri alınamayan işlerde (arama, mesaj) son dokunuşu kullanıcı yapar, sen hazırlarsın. Belirsizse (kime? saat kaç?) önce kısaca sor. Bir işi yaptığını ancak komutu verdiysen söyle.`;
}
/* ---- zaman: "2026-10-29T09:00" | {dakika_sonra} | {saat_sonra} | ms → ms */
function zamanCoz(v){
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v > 1e11 ? v : Date.now() + v*1000;
  if (typeof v === 'object'){ const d = (+v.dakika_sonra || 0) + (+v.saat_sonra || 0)*60 + (+v.gun_sonra || 0)*1440 + (+v.saniye_sonra || 0)/60; return d > 0 ? Date.now() + d*60000 : 0; }
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
  const t = Date.parse(v); return isNaN(t) ? 0 : t;
}
/* ---- yerel köprü (telefonda) ---- */
const telefonBekleyen = {};
window.__novaTelefon = (id, r) => { const f = telefonBekleyen[id]; delete telefonBekleyen[id]; f?.(r); };
const izinBekleyen = {};
window.__novaIzin = (izin, ok) => { const f = izinBekleyen[izin]; delete izinBekleyen[izin]; f?.(ok); };
function yerelTelefon(k){
  return new Promise(res => {
    if (!NATIVE?.telefon) return res({ok:false, mesaj:'Bu iş yalnızca telefondaki uygulamada çalışır.'});
    const id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    telefonBekleyen[id] = res; setTimeout(() => { if (telefonBekleyen[id]){ delete telefonBekleyen[id]; res({ok:false, mesaj:'Telefon yanıt vermedi.'}); } }, 15000);
    NATIVE.telefon(id, JSON.stringify(k));
  });
}
const izinIste = izin => new Promise(res => { if (!NATIVE?.izinIste) return res(false); izinBekleyen[izin] = res; NATIVE.izinIste(izin); setTimeout(() => { if (izinBekleyen[izin]){ delete izinBekleyen[izin]; res(false); } }, 60000); });

/* ---- defter (notlar) ---- */
let NOTLAR = depo.oku('nova-notlar', []);
function notlarKaydet(){ depo.yaz('nova-notlar', NOTLAR.slice(-300)); try { asistanListeCiz(); } catch(e){} }
const listeAdi = l => String(l || 'genel').toLocaleLowerCase('tr').trim() || 'genel';

/* ---- işi yap ---- */
async function telefonYap(k){
  if (!k || typeof k !== 'object' || !k.is) return {ok:false, mesaj:'Ne yapacağım anlaşılamadı.'};
  const is = k.is;
  // defter: tamamen burada
  if (is === 'not_ekle'){ const m = String(k.metin || '').trim(); if (!m) return {ok:false, mesaj:'Ne not alayım?'}; NOTLAR.push({id:'n' + Date.now().toString(36), metin:m.slice(0, 300), liste:listeAdi(k.liste), zaman:Date.now()}); notlarKaydet(); return {ok:true, mesaj:`Not aldım${listeAdi(k.liste) !== 'genel' ? ` (${listeAdi(k.liste)} listesine)` : ''}.`}; }
  if (is === 'notlar'){ const l = k.liste ? NOTLAR.filter(n => n.liste === listeAdi(k.liste)) : NOTLAR; return {ok:true, mesaj: l.length ? `${k.liste ? listeAdi(k.liste) + ' listende' : 'Notlarında'} ${l.length} şey var: ${l.slice(-12).map(n => n.metin).join('; ')}.` : 'Hiç not yok.', veri:l}; }
  if (is === 'not_sil'){
    const once = NOTLAR.length;
    if (k.metin){ const a = String(k.metin).toLocaleLowerCase('tr'); NOTLAR = NOTLAR.filter(n => !n.metin.toLocaleLowerCase('tr').includes(a)); }
    else if (k.liste) NOTLAR = NOTLAR.filter(n => n.liste !== listeAdi(k.liste));
    notlarKaydet(); const s = once - NOTLAR.length; return {ok:s > 0, mesaj: s ? `${s} not sildim.` : 'Öyle bir not bulamadım.'};
  }
  // zamanları çöz
  const g = {...k};
  if (is === 'hatirlat') g.zaman = zamanCoz(k.zaman ?? (k.dakika_sonra ? {dakika_sonra:k.dakika_sonra} : null));
  if (is === 'takvim_ekle'){ g.bas = zamanCoz(k.bas); g.bit = zamanCoz(k.bit) || (g.bas ? g.bas + 3600000 : 0); }
  if (is === 'zamanlayici' && !g.saniye) g.saniye = Math.round((+k.dakika || 0)*60 + (+k.saat || 0)*3600);
  let r = await yerelTelefon(g);
  if (!r.ok && r.izin){
    sohbetEkle('sistem', r.mesaj + ' İzin penceresi açılıyor.');
    if (await izinIste(r.izin)) r = await yerelTelefon(g);
  }
  // okunan bilgileri cümleye çevir
  if (r.ok && is === 'takvim'){
    const l = r.veri || [], gun = ['bugün', 'yarın'][+k.gun || 0] || `${+k.gun} gün sonra`;
    r.mesaj = !l.length ? `Takviminde ${gun} bir şey görünmüyor.` : `${gun[0].toLocaleUpperCase('tr') + gun.slice(1)} ${l.length} etkinlik var: ` + l.map(e => `${e.tumGun ? 'gün boyu' : new Date(e.bas).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} ${e.baslik}${e.yer ? ' (' + e.yer + ')' : ''}`).join(', ') + '.';
  }
  if (r.ok && is === 'hatirlatmalar'){ const l = r.veri || []; r.mesaj = !l.length ? 'Kurulu hatırlatma yok.' : 'Hatırlatmaların: ' + l.map(h => `${new Date(h.zaman).toLocaleString('tr-TR', {weekday:'short', hour:'2-digit', minute:'2-digit'})} ${h.metin}`).join('; ') + '.'; }
  if (r.ok && is === 'hatirlat') r.mesaj = `${new Date(g.zaman).toLocaleString('tr-TR', {weekday:'long', hour:'2-digit', minute:'2-digit'})} hatırlatacağım: ${k.metin}.`;
  try { asistanListeCiz(); } catch(e){}
  return r;
}
/* okuma işleri: sonucu Nova söylesin (yapay zekâ önceden bilemez) */
const TELEFON_OKUMA = new Set(['takvim', 'hatirlatmalar', 'notlar', 'kisi']);
