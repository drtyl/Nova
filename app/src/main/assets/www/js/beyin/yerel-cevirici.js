'use strict';
/* ---- yerel çevirici: yapay zekâ yokken basit kelime eşleme ---- */
const SOZLUK = [
  [/salsa/, 'salsa'], [/charleston|çarliston/, 'charleston'], [/lambada/, 'lambada'], [/tavuk dans/, 'tavuk_dansi'], [/kahkaha|gülsene|güle güle/, 'gul'],
  [/ağla/, 'agla'], [/kork/, 'kork'], [/üşü/, 'usu'], [/esne/, 'esne'], [/ısın|egzersiz/, 'isin'], [/telefon/, 'telefon'], [/kahve/, 'kahve'], [/kumanda|kanal/, 'kumanda'],
  [/zıpla(y|r)ak|jimnastik/, 'jimnastik'], [/sinirlen/, 'sinirlen'], [/çok mutlu|sevin/, 'cok_mutlu'],
  [/başını salla|kafa salla|kafanı salla/, 'evet'],
  [/selam ver|eğil|reverans|saygı/, 'selam_ver'],
  [/asker|esas duruş|selam dur/, 'asker_selami'],
  [/el(ini|ler|lerini)? salla|salla/, 'el_salla'],
  [/alkış/, 'alkis'], [/dans|oyna/, 'dans'], [/zıpla|atla/, 'zipla'], [/yürü/, 'yuru'], [/geril|gerin|esne/, 'gerin'],
  [/düşün|hmm/, 'dusun'], [/işaret|göster/, 'isaret'], [/el(ini)? kaldır|söz iste/, 'el_kaldir'],
  [/bel(in|ine)?|eller(in)? bel/, 'eller_belde'], [/kavuştur|kollarını bağla/, 'kollari_kavustur'],
  [/kutla|yaşasın|kazandık/, 'kutla'], [/kalp/, 'kalp'], [/utan|utangaç|mahcup/, 'utangac'],
  [/omuz|bilmiyorum|bilmem/, 'omuz_silk'], [/(sağa|sola|yana) bak|etrafına bak/, 'bak'],
  [/hayır|olmaz|reddet/, 'hayir'], [/evet|onayla|tamam/, 'evet'],
];
const AKTS = [[/kalk|uyan/, 'kalk'], [/kitap|oku\b|okusana|okur musun/, 'kitap'], [/resim|boya|tablo|çiz/, 'resim'], [/uyu|uyku|yatağa|yat\b/, 'uyu'], [/yazı|ödev|ders çalış|masaya|defter/, 'yaz'], [/pencere|dışarı/, 'pencere']];
const KIYAFET_SOZ = [[/elbise/, 'elbise'], [/pijama|gecelik/, 'pijama'], [/spor|tayt/, 'spor'], [/şort|atlet|ev kıyafet|rahat/, 'ev'], [/iç çamaşır|soyun/, 'ic'], [/günlük|kendi kıyafet|normal/, 'gunluk']];
const DUYGU = [[/gül|mutlu|sevin/, 'mutlu'], [/kız|sinirlen/, 'kizgin'], [/üzül|üzgün|ağla/, 'uzgun'], [/şaşır|şaşkın/, 'saskin'], [/rahatla|sakin/, 'rahat']];
const RUH = [[/neşeli/, 'neseli'], [/enerjik|hareketli/, 'enerjik'], [/merak/, 'merakli'], [/gergin/, 'gergin'], [/yorgun|uykulu/, 'yorgun'], [/hüzünlü|morali bozuk/, 'uzgun'], [/normal ol|nötr/, 'notr']];
function metniCevir(metin){
  const parcalar = metin.split(/\s*(?:,|\bsonra\b|\bardından\b|\bve\b)\s*/i).filter(Boolean);
  const komutlar = [];
  for (const p0 of parcalar){
    const tirnak = p0.match(/["'“”‘’](.+?)["'“”‘’]/);
    const p = p0.toLocaleLowerCase('tr').replace(/["'“”‘’].+?["'“”‘’]/, '');
    const k = {};
    if (tirnak) k.soz = tirnak[1];
    const desene = p.match(/(?:de ki|söyle)[:\s]+(.+)/); if (!k.soz && desene) k.soz = desene[1];
    if (/dışarı (çık|git)|ana ekran(a|ıma)/.test(p)){ k.disari = 'cik'; komutlar.push(k); continue; }
    if (/yere otur|yerde otur|bağdaş/.test(p)) k.durus = 'yere_otur';
    else if (/uzan|sırtüstü/.test(p)) k.durus = 'uzan';
    else if (/\botur|koltuğa/.test(p)) k.durus = 'otur';
    else if (/ayağa kalk|kalk\b/.test(p)) k.durus = 'ayakta';
    if (k.durus) { komutlar.push(k); continue; }
    if (/giy|değiş|kıyafet|üstünü|soyun/.test(p)) for (const [r, a] of KIYAFET_SOZ) if (r.test(p)){ k.kiyafet = a; break; }
    if (!k.kiyafet) for (const [r, a] of AKTS) if (r.test(p)){ k.aktivite = a; break; }
    if (!k.aktivite) for (const [r, e] of SOZLUK) if (r.test(p)){ k.eylem = e; break; }
    if (k.eylem && /\bsol/.test(p)) k.taraf = 'sol';
    if (k.eylem === 'bak') k.taraf = /sola/.test(p) ? 'sol' : 'sag';
    for (const [r, d] of DUYGU) if (r.test(p)){ k.ifade = d; break; }
    for (const [r, d] of RUH) if (r.test(p)){ k.ruh_hali = d; break; }
    if (/yumruk/.test(p)) k.el = 'yumruk'; else if (/zafer|\bv\b/.test(p)) k.el = 'zafer';
    if (!k.eylem && /^(merhaba|selam|hey)\b/.test(p.trim())){ k.eylem = 'el_salla'; k.soz = k.soz || 'Merhaba!'; }
    if (Object.keys(k).length) komutlar.push(k);
  }
  if (!komutlar.length) return [{eylem:'omuz_silk', ifade:'saskin', yogunluk:0.5, soz:'Bunu henüz bilmiyorum.'}];
  return komutlar.reduce((o, k) => { const s = o[o.length-1]; if (s && !k.eylem && (!k.soz || !s.soz) && (!k.ifade || !s.ifade)) Object.assign(s, k); else o.push(k); return o; }, []);
}
