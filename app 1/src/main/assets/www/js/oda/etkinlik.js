'use strict';
/* ---- duruş katmanı (oturma / yatma) ---- */
const durus = { tur:'ayakta', w:0 };
let OTURMA_DUSUS = 0.368;   // model yüklenince bacak ölçüsünden yeniden hesaplanır
const OTURMA = { rightUpperLeg:[-88,0,4], leftUpperLeg:[-88,0,-4], rightLowerLeg:[88,0,0], leftLowerLeg:[88,0,0], rightFoot:[0,0,0], leftFoot:[0,0,0] };
const YATMA = { rightUpperLeg:[0,0,-2], leftUpperLeg:[0,0,2], rightLowerLeg:[4,0,0], leftLowerLeg:[4,0,0], rightFoot:[28,0,0], leftFoot:[28,0,0] };
function durusKatmani(poz){
  const w = durus.w; if (w < 0.003) return;
  if (durus.tur === 'yer' || durus.tur === 'uzan'){
    durus.t = (durus.t || 0) + 1/60;
    const p = klipOrnekle(durus.tur === 'yer' ? 'yerde' : 'yerde_yat', durus.t*0.8);
    const elle = oynatici.calisiyor() ? 0 : 1;                       // jest yaparken kollar ve baş jeste ait
    for (const [b, v] of Object.entries(p)){
      if (b === '_kok'){ const k = poz._kok || [0, 0, 0]; poz._kok = k.map((x, i) => x + (v[i] - x)*w); continue; }
      const ww = /Shoulder|Arm|Hand|head|neck/.test(b) ? w*elle : w;
      const q = poz[b] || varsayilan(b); poz[b] = q.map((x, i) => x + (v[i] - x)*ww);
    }
    return;
  }
  const P = durus.tur === 'oturma' ? OTURMA : durus.tur === 'yatma' ? YATMA : null; if (!P) return;
  for (const [b, v] of Object.entries(P)){ const p = poz[b] || varsayilan(b); poz[b] = p.map((x, i) => x + (v[i] - x)*w); }
  if (durus.tur === 'oturma') ekle(poz, '_kok', [0, -OTURMA_DUSUS, 0], w);
  if (durus.tur === 'yatma' && w < 0.995){   // yatağa girerken/kalkarken dizlerini çeker: ayaklar şilteyi sürümez
    const k = Math.sin(Math.PI*w);
    for (const y of ['right', 'left']){ ekle(poz, y + 'UpperLeg', [-48*k, 0, 0]); ekle(poz, y + 'LowerLeg', [88*k, 0, 0]); }
  }
}

/* ---- etkinlik döngüleri (üst gövde) ---- */
const IKA = {"okuma":{"rightUpperArm":[-13.8,21.4,69.6],"rightLowerArm":[3.7,74.7,3.8],"leftUpperArm":[-13.9,-20.9,-70.8],"leftLowerArm":[3.0,-74.7,-3.1]},"okuma_cevir":{"rightUpperArm":[-30.9,36.0,86.2],"rightLowerArm":[5.6,67.9,1.4]},"boyama0":{"rightUpperArm":[8.1,75.8,-1.9],"rightLowerArm":[8.4,48.1,-32.4]},"boyama1":{"rightUpperArm":[11.4,64.2,16.9],"rightLowerArm":[5.2,41.5,-35.7]},"boyama2":{"rightUpperArm":[13.8,87.1,14.7],"rightLowerArm":[-2.9,40.2,-24.9]},"boyama3":{"rightUpperArm":[3.6,63.9,-7.8],"rightLowerArm":[8.4,52.1,-35.5]},"palet":{"leftUpperArm":[9.9,-0.2,-62.9],"leftLowerArm":[5.7,-74.5,-3.6]},"yaz0":{"rightUpperArm":[-5.7,61.8,35.4],"rightLowerArm":[-12.9,58.3,-15.0]},"yaz1":{"rightUpperArm":[10.1,77.2,14.9],"rightLowerArm":[5.4,36.9,-32.0]},"yazsol":{"leftUpperArm":[-1.8,-53.6,-37.1],"leftLowerArm":[-14.1,-68.1,15.7]}};
const ETKINLIK_HAREKET = {
  kitap: { dongu:true, donem:16, kareler:[
    {t:0, poz:{...IKA.okuma, spine:[4,0,0], neck:[8,0,0], head:[16,0,0]}},
    {t:0.45, poz:{head:[18,4,3]}}, {t:0.8, poz:{head:[16,0,0]}},
    {t:0.86, poz:{...IKA.okuma_cevir, head:[17,-4,0]}}, {t:0.93, poz:{...IKA.okuma, head:[16,0,0]}}, {t:1, poz:{head:[16,0,0]}} ]},
  resim: { dongu:true, donem:2.8, kareler:[
    {t:0, poz:{...IKA.boyama0, ...IKA.palet, spine:[3,-6,0], head:[4,-4,0]}}, {t:0.25, poz:{...IKA.boyama1}}, {t:0.5, poz:{...IKA.boyama2, head:[6,-2,2]}}, {t:0.75, poz:{...IKA.boyama3}}, {t:1, poz:{...IKA.boyama0, head:[4,-4,0]}} ]},
  yaz: { dongu:true, donem:1.7, kareler:[
    {t:0, poz:{...IKA.yaz0, ...IKA.yazsol, spine:[10,0,0], chest:[4,0,0], neck:[6,0,0], head:[18,0,0]}}, {t:0.5, poz:{...IKA.yaz1, head:[19,-3,0]}}, {t:1, poz:{...IKA.yaz0, head:[18,0,0]}} ]},
  pencere: { dongu:true, donem:9, kareler:[
    {t:0, poz:{head:[-6,0,0], neck:[-2,0,0], rightUpperArm:[0,-14,70], leftUpperArm:[0,14,-70], rightLowerArm:[0,-20,0], leftLowerArm:[0,20,0]}},
    {t:0.5, poz:{head:[-4,10,3], neck:[-2,4,0], hips:[0,0,3]}}, {t:1, poz:{head:[-6,0,0], neck:[-2,0,0], hips:[0,0,0]}} ]},
  otur: { dongu:true, donem:8, kareler:[
    {t:0, poz:{...IKA.okuma, spine:[-4,0,0], chest:[-2,0,0], head:[2,0,0]}}, {t:0.5, poz:{head:[4,6,2]}}, {t:1, poz:{head:[2,0,0]}} ]},
  uyu: { dongu:true, donem:7, kareler:[
    {t:0, poz:{neck:[10,0,0], head:[16,10,6], rightUpperArm:[0,0,80], leftUpperArm:[0,0,-80], rightLowerArm:[0,20,0], leftLowerArm:[0,-20,0]}}, {t:1, poz:{head:[16,10,6]}} ]},
};

/* ---- etkinlik makinesi ---- */
const akt = { ad:null, durum:null, token:0, bas:0, basYapma:0, bitis:0, gecis:null, bakis:null, darbe:0, zzz:0, sayfaBas:0, yeniUyandi:false };
function gecis(hedef, sure){
  if (akt.gecis) akt.gecis.coz(false);
  return new Promise(res => {
    if (hedef.tur) durus.tur = hedef.tur;
    akt.gecis = { bas:performance.now()/1000, sure, p0:govde.position.clone(), p1:new THREE.Vector3(hedef.konum[0], hedef.y || 0, hedef.konum[1]),
      y0:hareketli.yon, y1:hedef.yon ?? hareketli.yon, r0:yatis.rotation.x, r1:hedef.yatik ? -Math.PI/2 : 0, w0:durus.w, w1:hedef.w, coz:res };
  });
}
function aktGuncelle(dt){
  const g = akt.gecis, simdi = performance.now()/1000;
  if (g){
    const u = yumusak(Math.min(1, (simdi - g.bas)/g.sure));
    govde.position.lerpVectors(g.p0, g.p1, u);
    hareketli.yon = g.y0 + aciFark(g.y1, g.y0)*u; govde.rotation.y = hareketli.yon;
    yatis.rotation.x = g.r0 + (g.r1 - g.r0)*u; durus.w = g.w0 + (g.w1 - g.w0)*u;
    if (u >= 1){ akt.gecis = null; if (durus.w < 0.01){ durus.w = 0; durus.tur = 'ayakta'; } g.coz(true); }
  }
  if (akt.durum !== 'yapiyor') return;
  if (simdi > akt.bitis){ aktiviteBitir(true); return; }
  if (akt.ad === 'resim' && simdi > akt.darbe){ akt.darbe = simdi + rnd(0.18, 0.4); fircaDarbesi(); }
  if (akt.ad === 'uyu' && simdi > akt.zzz){ akt.zzz = simdi + 6; balon.goster('Zzz…', 2.4, true); }
}
async function aktiviteBasla(ad, sure){
  if (!ISTASYON[ad]) throw new Error(`"${ad}" diye bir etkinlik yok`);
  if (tema !== 'oda') throw new Error('etkinlikler oda temasında yapılabilir');
  if (akt.ad === ad && akt.durum === 'yapiyor'){ if (sure) akt.bitis = performance.now()/1000 + sure; return true; }
  if (akt.ad) await aktiviteBitir();
  const I = ISTASYON[ad], tok = ++akt.token;
  akt.ad = ad; akt.durum = 'gidiyor'; akt.bas = performance.now()/1000;
  const vardi = await git(I.yaklas[0], I.yaklas[1], 'serbest');
  if (tok !== akt.token) return false;
  if (!vardi){ akt.ad = null; akt.durum = null; return false; }
  if (I.durus !== 'yatma'){ await don(I.yon); if (tok !== akt.token) return false; }
  akt.durum = 'yerlesiyor';
  if (I.durus === 'oturma') await gecis({konum:I.konum, yon:I.yon, tur:'oturma', w:1}, 0.9);
  else if (I.durus === 'yatma') await gecis({konum:I.konum, y:I.y, yon:I.yon, tur:'yatma', w:1, yatik:true}, 1.6);
  if (tok !== akt.token) return false;
  akt.durum = 'yapiyor'; akt.basYapma = performance.now()/1000;
  akt.bitis = akt.basYapma + (sure || rnd(I.sure[0], I.sure[1]));
  if (ad === 'uyu'){ const s = uykuyaKalan(); if (s > 0 && !sure) akt.bitis = akt.basYapma + s; akt.zzz = akt.basYapma + 3; }
  oynatici.oynat(ad, hazirla(ETKINLIK_HAREKET[ad]), {dongu:true, donem:ETKINLIK_HAREKET[ad].donem, sure:1e6});
  if (ad === 'kitap'){ aksesuar.kitap.visible = true; aksesuar.kitap.userData.kapak.color.set(simdikiKitap().renk); akt.sayfaBas = okuma.sayfa; }
  if (ad === 'resim'){ aksesuar.firca.visible = true; aksesuar.palet.visible = true; aksesuar.firca.userData.uc.material.color.set(PALETLER[tablo.palet % PALETLER.length].cicek[0]); }
  if (ad === 'yaz') aksesuar.kalem.visible = true;
  akt.bakis = ad === 'kitap' ? 'kitap' : ad === 'resim' ? BAKIS_NOKTA.resim.clone() : ad === 'yaz' ? BAKIS_NOKTA.yaz.clone() : ad === 'pencere' ? new THREE.Vector3(-0.15, 1.6, -4) : null;
  odaIsikGuncelle(true);
  return true;
}
async function aktiviteBitir(dogal){
  if (!akt.ad) return;
  const ad = akt.ad, I = ISTASYON[ad], tok = ++akt.token, oncekiDurum = akt.durum;
  if (oncekiDurum === 'gidiyor') hareketiDurdur();
  if (oncekiDurum === 'yapiyor'){
    const sn = performance.now()/1000 - akt.basYapma; let not = '';
    if (ad === 'kitap'){ const k = simdikiKitap(); const yeni = Math.max(1, Math.round(sn/40)); const s0 = okuma.sayfa; okuma.sayfa += yeni;
      if (okuma.sayfa >= k.sayfa){ okuma.biten.push(k.ad); okuma.kitap++; okuma.sayfa = 1; not = `${k.ad} kitabını bitirdin`; } else not = `${k.ad}, s.${s0}–${okuma.sayfa}`; depo.yaz('nova-kitap', okuma); }
    if (ad === 'resim'){ not = `tablo %${Math.round(tablo.ilerleme/TABLO_TAMAM*100)}`; tabloKaydet(); }
    gunlugeYaz(ad, sn, not);
  }
  akt.durum = 'kalkiyor'; akt.bakis = null; aksesuarlariGizle();
  if (oynatici.calisiyor()) oynatici.dur();
  if (durus.w > 0.01 || Math.abs(yatis.rotation.x) > 0.01) await gecis({konum:I.yaklas, yon:hareketli.yon, w:0, yatik:false}, ad === 'uyu' ? 1.4 : 0.8);
  if (ad === 'uyu' || ad === 'otur' || ad === 'kitap') itilirToparla();
  if (tok === akt.token){ akt.ad = null; akt.durum = null; durus.tur = 'ayakta'; durus.w = 0; odaIsikGuncelle(true);
    if (dogal && ad === 'uyu') calistir([{eylem:'gerin'}], {kaynak:'serbest'}).catch(() => {}); }
}

/* ---- kalıcı duruşlar: ayakta / koltukta otur / yere otur / yerde uzan ---- */
async function durusAyarla(tur){
  if (tur === 'otur') return aktiviteBasla('otur');
  if (tur === 'ayakta' || tur === 'kalk'){
    if (akt.ad) return aktiviteBitir();
    if (durus.tur === 'uzan' && durus.w > 0.5){                       // yerden kalkış: gerçek kayıt
      oynatici.oynatKlip('yat_kalk'); durus.w = 0; durus.tur = 'ayakta'; await bekle(KLIP.yat_kalk.sure - 0.35); return;
    }
    if (durus.w > 0.02) await gecis({konum:[govde.position.x, govde.position.z], yon:hareketli.yon, w:0}, 1.3);
    durus.tur = 'ayakta'; return;
  }
  if (akt.ad) await aktiviteBitir();
  if (oynatici.calisiyor()) oynatici.dur();
  durus.t = 0;
  const hedef = {konum:[govde.position.x, govde.position.z], yon:hareketli.yon, w:1};
  if (tur === 'yere_otur'){ if (durus.tur === 'yer' && durus.w > 0.9) return; await gecis({...hedef, tur:'yer'}, 1.6); }
  else if (tur === 'uzan'){ if (durus.tur === 'uzan' && durus.w > 0.9) return; await gecis({...hedef, tur:'uzan'}, 2.0); }
}
const DURUSLAR = ['ayakta', 'otur', 'yere_otur', 'uzan'];
function tumBeden(eylem){
  const h = hareketBul(eylem); if (!h) return false;
  if (h.klip) return !KLIP[h.klip].ust;
  return (h.kareler || []).some(k => k.poz && typeof k.poz === 'object' && Object.keys(k.poz).some(b => /Leg|Foot|Toes|hips|_kok/.test(b)));
}

/* ---- uyku saatleri ---- */
function saatDakika(s){ const [h, m] = String(s || '0:0').split(':').map(Number); return (h||0)*60 + (m||0); }
function uykuVakti(){ const d = new Date(), n = d.getHours()*60 + d.getMinutes(), b = saatDakika($('uykuBas')?.value || '23:30'), e = saatDakika($('uykuBit')?.value || '07:30'); return b < e ? n >= b && n < e : n >= b || n < e; }
function uykuyaKalan(){ if (!uykuVakti()) return 0; const d = new Date(), n = d.getHours()*60 + d.getMinutes(), e = saatDakika($('uykuBit')?.value || '07:30'); return ((e - n + 1440) % 1440)*60; }

/* ---- yapay zekâya oda bilgisi ---- */
function odaMetni(){
  if (tema !== 'oda') return 'Şu an boş bir stüdyo sahnesindesin; eşya yok, etkinlik yapılamaz.';
  const d = new Date(), saat = d.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}), dilim = gunDilimi();
  const k = simdikiKitap();
  const simdi = !akt.ad ? 'ayaktasın, bir etkinlik yapmıyorsun' : akt.durum === 'yapiyor' ? `şu an ${ISTASYON[akt.ad].ad} ile meşgulsün (${Math.round((performance.now()/1000 - akt.basYapma)/60)} dakikadır)` : `${ISTASYON[akt.ad].ad} için hazırlanıyorsun`;
  return `ODAN: Kullanıcının telefonunun içinde, donanımdan yapılmış kendi odandasın. Zemin ve arka duvar bir devre kartı (bakır yollar, altın lehim noktaları), yan duvarlar telefonun alüminyum çerçevesi, alt paneller delikli metal koruma kapakları. Sol duvarda yatağın telefonun pili (üstünde yumuşak yatak, lila battaniye, yastıklar, peluş tavşan; yanında pil seviyesini gösteren ışıklar ve küçük bir yonga komodin, gece lambası); arka duvarda pencere yerine telefonun ekranı (saati ve günün saatine göre duvar kağıdını gösterir), alüminyum kitaplık, posterler, peri ışıkları, şerit kablolar ve son bitirdiğin tablo; sağ duvarda çalışma masan ana işlemci yongası (üstünde dizüstü bilgisayar, defter, kupa, masa lambası), mantar pano, duvar saati; önde alüminyum şövale ve tablon, boya taburesi; pembe kadife okuma koltuğu, sehpa, ayaklı lamba; ortada yerde kablosuz şarj bobini (telefon şarj olurken ışır); köşede büyük bir bitki ve iri bileşenler (kondansatörler).
DURUŞUN: ${akt.ad === 'otur' ? 'koltukta oturuyorsun' : durus.tur === 'yer' && durus.w > 0.5 ? 'yerde oturuyorsun' : durus.tur === 'uzan' && durus.w > 0.5 ? 'yerde uzanıyorsun' : durus.w > 0.5 ? 'oturuyorsun' : 'ayaktasın'}. Otururken konuşabilir, jest yapabilir, başını çevirebilirsin; kalkman gerekmez.
ETKİNLİKLER ("aktivite" alanı): kitap (koltukta kitap okursun), resim (şövalede resim yaparsın), yaz (masada defterine yazarsın), pencere (pencereden dışarı bakarsın), uyu (yatağına yatarsın), kalk (o anki etkinliği bırakırsın). İstersen "sure" ile saniye ver (kitap/resim 60–900).
ŞİMDİ: saat ${saat} (${dilim === 'gunduz' ? 'gündüz' : dilim === 'aksam' ? 'akşam' : 'gece'}); ${simdi}. Uyku saatlerin ${$('uykuBas')?.value || '23:30'}–${$('uykuBit')?.value || '07:30'}.${akt.yeniUyandi ? ' Uyuyordun; kullanıcının mesajı seni az önce uyandırdı.' : ''}
OKUDUĞUN KİTAP: ${k.ad} (${k.yazar}), ${okuma.sayfa}. sayfa / ${k.sayfa}.${okuma.biten.length ? ' Bitirdiklerin: ' + okuma.biten.join(', ') + '.' : ''}
TABLON: şövaledeki manzara %${Math.round(tablo.ilerleme/TABLO_TAMAM*100)} tamam; şimdiye kadar ${tablo.biten} tablo bitirdin.
${giyimMetni()}
${typeof odaDuzenMetni === 'function' ? odaDuzenMetni() : ''}
GÜNLÜĞÜN (yalnızca gerçekten yaptıkların): ${gunlukMetni()}.
Masada yazarken ne yazdığın kaydedilmez; içeriğini uydurma. Odanda ya da geçmişinde bu bilgilerin dışında bir şey uydurma.`;
}
