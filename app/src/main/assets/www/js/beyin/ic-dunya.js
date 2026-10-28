'use strict';
/* =========================================================
   15. İÇ DÜNYA — Nova boş kalınca ne yapacağına kendi karar verir
   ========================================================= */
const ic = { sikilma:0.55, sonKullanici:performance.now()/1000, son:[], aiSon:-999, aiMesgul:false, yazmaSon:0 };
function bosMu(){ return !akt.ad && !komutMesgul && !hareketli.hedef && hareketli.yonHedef === null && !oynatici.calisiyor() && !dusunuyor && !Object.keys(manuel).length && !ic.aiMesgul; }
function kullaniciGeldi(yaklas){
  ic.sonKullanici = performance.now()/1000; ic.sikilma = 0;
  if (akt.ad){   // bir şeyle meşgulse yerinden kalkmaz, başını kaldırıp bakar; uyuyorsa uyanır
    if (akt.ad === 'uyu' && akt.durum !== 'kalkiyor'){ akt.yeniUyandi = true; setTimeout(() => akt.yeniUyandi = false, 120000); if (komutMesgul === 'serbest'){ nesil++; komutMesgul = null; } aktiviteBitir(); }
    else if (akt.durum === 'gidiyor' && komutMesgul === 'serbest'){ nesil++; komutMesgul = null; aktiviteBitir(); }
    return;
  }
  if (komutMesgul === 'serbest'){ nesil++; komutMesgul = null; oynatici.dur(); siraGoster(null); }
  if (yaklas && Math.hypot(govde.position.x, govde.position.z - 0.1) > 0.7) git((Math.random()-0.5)*0.3, 0.1, 'kamera');
  else if (Math.abs(aciFark(kameraYonu(), hareketli.yon)) > 0.35) don(kameraYonu());
  else hareketiDurdur();
}
function icGuncelle(dt){
  if (!vrm || !$('serbestDav').checked || !bosMu()) return;
  const simdi = performance.now()/1000, sessiz = simdi - ic.sonKullanici;
  if (sessiz < 8 && Math.abs(aciFark(kameraYonu(), hareketli.yon)) > 0.6){ don(kameraYonu()); return; }
  ic.sikilma += dt*VERI.ruh_halleri[ruh].tempo/(sessiz < 25 ? 45 : 16);
  if (ic.sikilma < 1) return;
  ic.sikilma = Math.random()*0.35;
  if ($('serbestAI').checked && sample && aiDurum === 'acik' && simdi - ic.aiSon > 75) aiSerbest(); else kuralSerbest();
}
function kuralSerbest(){
  const odada = tema === 'oda';
  if (odada && uykuVakti() && Math.random() < 0.85){ ic.son.push('uyu'); calistir([...(giyim.simdi !== 'pijama' ? [{kiyafet:'pijama'}] : []), {aktivite:'uyu'}], {kaynak:'serbest'}).catch(() => {}); return; }
  if (odada && !uykuVakti() && ['pijama', 'ic'].includes(giyim.simdi) && Math.random() < 0.6){ ic.son.push('giyin'); calistir([{kiyafet:['gunluk', 'ev', 'elbise'][Math.floor(Math.random()*3)]}], {kaynak:'serbest'}).catch(() => {}); return; }
  const uzak = Math.hypot(govde.position.x, govde.position.z), simdi = performance.now()/1000, r = ruh;
  const secenekler = [
    ['dolas', r === 'enerjik' ? 5 : r === 'yorgun' ? 1 : 3.2], ['etrafa', 2], ['gerin', r === 'yorgun' ? 3 : 0.8],
    ['dans', r === 'enerjik' ? 3 : r === 'neseli' ? 1 : 0.25], ['dusun', r === 'merakli' ? 2.2 : 0.8],
    ['kitap', odada ? 3 : 0], ['resim', odada ? 2.6 : 0], ['yaz', odada ? 1.6 : 0], ['pencere', odada ? 1.4 : 0],
    ['geri', !odada && uzak > 0.9 ? 2.6 : 0], ['salla', uzak > 0.8 && simdi - ic.sonKullanici < 90 ? 1.4 : 0], ['bekle', 1.2],
  ].filter(([d, w]) => w > 0 && d !== ic.son[ic.son.length-1]);
  let t = Math.random()*secenekler.reduce((s, [, w]) => s + w, 0), secim = secenekler[0][0];
  for (const [d, w] of secenekler){ t -= w; if (t <= 0){ secim = d; break; } }
  const rx = () => (Math.random()*2 - 1)*1.3, rz = () => -1.45 + Math.random()*2.1;
  const komut = {
    dolas: () => { const d = DOLASMA[Math.floor(Math.random()*DOLASMA.length)]; return [{git: odada ? {x:d[0], z:d[1]} : {x:rx(), z:rz()}, sonra:'serbest'}, {bak: Math.random() < 0.5 ? 'sol' : 'sag'}]; },
    kitap: () => [{aktivite:'kitap'}], resim: () => [{aktivite:'resim'}], yaz: () => [{aktivite:'yaz'}], pencere: () => [{aktivite:'pencere'}],
    etrafa: () => [{bak:'sol'}, {bak:'sag'}, {bak:'yukari'}],
    gerin: () => [{eylem:'gerin'}],
    dans: () => [{eylem:'dans', sure:2.2, hiz:0.9}],
    dusun: () => [{eylem:'dusun'}],
    geri: () => [{git:{x:(Math.random()-0.5)*0.4, z:0.1}, sonra:'kamera'}],
    salla: () => [{don:'kamera'}, {eylem:'el_salla', sure:1.6}],
    bekle: () => [{bak: Math.random() < 0.5 ? 'asagi' : 'yukari'}],
  }[secim]();
  ic.son.push(secim); if (ic.son.length > 6) ic.son.shift();
  calistir(komut, {kaynak:'serbest'}).catch(() => {});
}
async function aiSerbest(){
  ic.aiMesgul = true; ic.aiSon = performance.now()/1000;
  const saat = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
  const istem = `${kimlikMetni()}
${odaMetni()}
Şu an kullanıcıyla konuşmuyorsun; kendi başınasın ve ne yapacağına tamamen kendin karar veriyorsun. Kimse sana bir şey yaptırmıyor.
DURUM: konumun x=${govde.position.x.toFixed(2)}, z=${govde.position.z.toFixed(2)}; ruh halin ${ruh}; saat ${saat}; kullanıcı ${Math.round(performance.now()/1000 - ic.sonKullanici)} saniyedir sessiz; son yaptıkların: ${ic.son.slice(-5).join(', ') || 'yok'}.
${yetenekMetni()}
Çeşitli ol; az önce yaptığını tekrarlama. Bazen sakin kalmak da bir seçimdir (komutlar boş olabilir). Kullanıcıya bir şey söylemek istersen yalnızca gerçek ve şimdiye ait bir şey söyle, nadiren.
YALNIZCA JSON: {"niyet":"şu an ne yapmak istediğin, kısa, şimdiki zaman","soz":"opsiyonel","komutlar":[ ... ]}`;
  try {
    const y = await sample.json(istem, {modelTier:'quick', cache:false});
    if (!bosMu_ai()) return;
    const {komutlar} = aiYanitiniTemizle({soz:typeof y?.soz === 'string' ? y.soz : '', komutlar:y?.komutlar});
    if (y?.niyet) sohbetEkle('sistem', 'Nova kendi kararıyla: ' + String(y.niyet).slice(0, 140), komutlar);
    ic.son.push('kendi: ' + String(y?.niyet || '').slice(0, 40)); if (ic.son.length > 6) ic.son.shift();
    ic.aiMesgul = false;
    if (komutlar.length) await calistir(komutlar, {kaynak:'serbest'});
  } catch(e){
    if (['not_granted','sampling_disabled','not_declared'].includes(e?.code)) $('serbestAI').checked = false;
    ic.aiMesgul = false; kuralSerbest();
  } finally { ic.aiMesgul = false; }
}
function bosMu_ai(){ return !akt.ad && !komutMesgul && !hareketli.hedef && !oynatici.calisiyor() && !dusunuyor && !Object.keys(manuel).length; }
