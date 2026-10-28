'use strict';
/* =========================================================
   DIŞARIDAKİ NOVA — ana ekranda yaşayan küçük Nova
   Ekran koordinatları: telefonun piksel (px) koordinatları, sol üst (0,0).
   Dünya: 1 birim = 1 metre; ekran px → dünya: x/k, −y/k (k = Nova'nın boyuna göre px/metre).
   Kamera ortografik: pencere (Nova'nın küçük şeffaf penceresi) ekranın neresindeyse kamera da oraya bakar.
   Yüzeyler: simgelerin üst kenarı, arama çubuğu / widget üstü, ekranın altı.
   ========================================================= */
const DIS = window.NovaDisari || null;
const TEST = !DIS;
if (TEST) document.body.classList.add('test');
const AYAR = Object.assign({ boy:'orta', heryerde:false, sesli:true, konuskan:true, simgeOlcek:0.62, cerceve:false }, depo.oku('nova-disari', {}));
const BOY_DP = { kucuk:80, orta:100, buyuk:130 };
const rastgele = a => a[Math.floor(Math.random()*a.length)];
const arasi = (a, b) => a + Math.random()*(b - a);
const sinirla = (x, a, b) => Math.max(a, Math.min(b, x));

/* ---------------- ekran ---------------- */
let EKRAN = DIS ? JSON.parse(DIS.ekran()) : { w:Math.round(innerWidth*devicePixelRatio), h:Math.round(innerHeight*devicePixelRatio), yog:devicePixelRatio, ust:Math.round(28*devicePixelRatio), alt:Math.round(16*devicePixelRatio) };
const dp = v => v*EKRAN.yog;
let H = dp(BOY_DP[AYAR.boy] || BOY_DP.orta);   // Nova'nın ekrandaki boyu (px)
let k = H/1.6;                                 // px / metre (model ölçülünce düzeltilir)
let NOVA_BOY = 1.6;

/* pencere: ekrandaki yeri (px). Testte pencere = bütün ekran */
const PEN = TEST ? { x:0, y:0, w:EKRAN.w, h:EKRAN.h } : { x:-4000, y:-4000, w:10, h:10 };
let suruklenen = false;

/* ---------------- yüzeyler (simgeler, kutular, zemin) ---------------- */
let SIMGE = [], ZEMIN = [], NOVA_SIMGE = null, ERISIM = false, ANA_EKRAN = true;
function simgeKaresi(s){   // hücre (simge + etiket) → simgenin kendisi (kare)
  const w = s.w, h = s.h;
  if (s.etiketli){
    const boy = Math.min(w*AYAR.simgeOlcek*1.18, h*0.6), etiket = Math.max(dp(14), h*0.22);
    return { x:s.x + (w - boy)/2, y:s.y + Math.max(0, (h - etiket - boy)*0.45), w:boy, h:boy };
  }
  const boy = Math.min(w, h)*0.72;
  return { x:s.x + (w - boy)/2, y:s.y + (h - boy)/2, w:boy, h:boy };
}
function yuzeyleriKur(veri){
  ERISIM = !!veri?.erisim; ANA_EKRAN = veri?.anaEkran !== false;
  const sim = (veri?.simgeler || []).filter(s => s.y > EKRAN.ust*0.6 && s.y + s.h < EKRAN.h + 2);
  SIMGE = sim.map((s, i) => ({ id:'s' + i, ad:s.ad, kare:simgeKaresi(s), hucre:s }));
  NOVA_SIMGE = SIMGE.find(s => /^nova$/i.test(String(s.ad).trim())) || null;
  ZEMIN = [];
  for (const s of SIMGE){ const r = s.kare; ZEMIN.push({ id:s.id, x0:r.x + r.w*0.1, x1:r.x + r.w*0.9, y:r.y + r.w*0.02, tur:'simge', simge:s }); }
  for (const [i, b] of (veri?.bloklar || []).entries()){
    if (b.y < EKRAN.ust || b.y > EKRAN.h - dp(40)) continue;
    if (SIMGE.some(s => s.hucre.x >= b.x && s.hucre.x + s.hucre.w <= b.x + b.w && s.hucre.y >= b.y && s.hucre.y + s.hucre.h <= b.y + b.h + 2)) continue;   // simgeleri içeren kapsayıcı
    ZEMIN.push({ id:'b' + i, x0:b.x + dp(14), x1:b.x + b.w - dp(14), y:b.y + dp(2), tur:'blok' });
  }
  ZEMIN.push({ id:'zemin', x0:dp(18), x1:EKRAN.w - dp(18), y:EKRAN.h - EKRAN.alt - dp(4), tur:'zemin' });
  cerceveCiz();
  // üstünde durduğu yüzey gittiyse (sayfa kaydı vs.) düşer
  if (N.plat && !['dus', 'tutuldu', 'cikis', 'giris', 'yukleniyor'].includes(N.durum)){
    const y = altindakiYuzey(N.x, N.y - dp(4), true);
    if (y && Math.abs(y.y - N.y) < dp(6)){ N.plat = y; if (N.durum === 'otur' || N.durum === 'gidiyor') { /* devam */ } }
    else { N.plat = null; durumGec('dus'); }
  }
}
function altindakiYuzey(x, y, yakindanDa){
  let en = null;
  for (const z of ZEMIN) if (x >= z.x0 - dp(2) && x <= z.x1 + dp(2) && z.y >= y - (yakindanDa ? dp(8) : 0) && (!en || z.y < en.y)) en = z;
  return en;
}
function zeminBul(id){ return ZEMIN.find(z => z.id === id) || null; }

/* ---------------- Nova'nın durumu ---------------- */
const N = {
  x:0, y:0,            // ayak noktası (px)
  yaw:0, hedefYaw:0, olcek:1,
  durum:'yukleniyor', t:0, sure:0,
  plat:null, plan:null, zip:null, vy:0, vx:0,
  faz:0, saklanilan:null, sonEtkilesim:performance.now()/1000, dokunuslar:[],
  konusuyor:false, dinliyor:false, bekleyenIs:null, gizliBas:0,
};
const kok = new THREE.Group(); sahne.add(kok);          // ekrandaki yer
const donus = new THREE.Group(); kok.add(donus);        // yönü (yaw)
const golgeDoku = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(20,10,40,0.55)'); gr.addColorStop(0.5, 'rgba(20,10,40,0.22)'); gr.addColorStop(1, 'rgba(20,10,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const golge = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.13), new THREE.MeshBasicMaterial({map:golgeDoku, transparent:true, depthWrite:false}));
golge.position.z = -2; sahne.add(golge);
const perde = new THREE.Mesh(yuvarlakKare(0.24), new THREE.MeshBasicMaterial({colorWrite:false}));   // saklanırken önündeki simge
perde.renderOrder = -1; perde.visible = false; sahne.add(perde);
function yuvarlakKare(r){
  const s = new THREE.Shape(), a = 0.5, b = r;
  s.moveTo(-a + b, -a); s.lineTo(a - b, -a); s.quadraticCurveTo(a, -a, a, -a + b); s.lineTo(a, a - b); s.quadraticCurveTo(a, a, a - b, a);
  s.lineTo(-a + b, a); s.quadraticCurveTo(-a, a, -a, a - b); s.lineTo(-a, -a + b); s.quadraticCurveTo(-a, -a, -a + b, -a);
  return new THREE.ShapeGeometry(s, 8);
}

/* ---------------- poz ---------------- */
const ifadeAdlari = {}; const IFADE = { mutlu:['happy', 'joy'], kizgin:['angry'], uzgun:['sad', 'sorrow'], rahat:['relaxed', 'fun'], saskin:['surprised', 'Surprised'] };
const yuz = { ifade:null, w:0, hedefW:0, bitis:0, goz:0, sonrakiGoz:2, agiz:0 };
function ifade(ad, w = 0.8, sure = 2.5){ yuz.ifade = ad && ifadeAdlari[ad] ? ad : null; yuz.hedefW = yuz.ifade ? w : 0; yuz.bitis = performance.now()/1000 + sure; }
const TAM_KEMIK = [...KLIP_KEMIK];
function uygula(poz){
  const h = vrm.humanoid;
  for (const b of TAM_KEMIK) if (!poz[b]) poz[b] = varsayilan(b);
  for (const [b, v] of Object.entries(poz)){
    if (b === '_kok') continue;
    const n = h.getNormalizedBoneNode(kemikAdi(b)); if (!n) continue;
    if (vrm0) n.rotation.set(-(+v[0] || 0)*D2R, (+v[1] || 0)*D2R, -(+v[2] || 0)*D2R, 'XYZ'); else n.rotation.set((+v[0] || 0)*D2R, (+v[1] || 0)*D2R, (+v[2] || 0)*D2R, 'XYZ');
  }
  const q = poz._kok || [0, 0, 0];
  h.getNormalizedBoneNode('hips').position.set(kokDinlenme.x + (vrm0 ? -q[0] : q[0]), kokDinlenme.y + q[1], kokDinlenme.z + (vrm0 ? -q[2] : q[2]));
}
function ekle(poz, b, v, w = 1){ const p = poz[b] || varsayilan(b); poz[b] = [p[0] + v[0]*w, p[1] + v[1]*w, p[2] + v[2]*w]; }
const UST = new Set(['spine', 'chest', 'upperChest', 'neck', 'head', 'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand']);
function ustKaristir(alt, ust, w){ const o = {...alt}; for (const [b, v] of Object.entries(ust)) if (UST.has(b) || /Thumb|Index|Middle|Ring|Little/.test(b)) { const a = alt[b] || varsayilan(b); o[b] = [a[0] + (v[0] - a[0])*w, a[1] + (v[1] - a[1])*w, a[2] + (v[2] - a[2])*w]; } return o; }
/* jest: üst bedenle yapılan kısa hareket (el sallama, gülme…) */
const jest = { ad:null, t:0, sure:0, kareler:null, donem:1, el:null, dongu:false };
function jestYap(ad, sure){
  if (KLIP[ad]){ jest.ad = ad; jest.kareler = null; jest.sure = sure || KLIP[ad].sure; jest.t = 0; return; }
  const h = VERI.hareketler[ad]; if (!h) return;
  jest.ad = ad; jest.kareler = hazirla(h); jest.dongu = !!h.dongu; jest.donem = h.donem || h.sure || 1; jest.sure = sure || h.sure || 2; jest.t = 0; jest.el = h.el || null;
  if (h.ifade) ifade(h.ifade, 0.8, jest.sure);
}
function jestPozu(dt){
  if (!jest.ad) return null;
  jest.t += dt; if (jest.t >= jest.sure){ jest.ad = null; return null; }
  const giris = yumusak(Math.min(1, jest.t/0.3)), cikis = yumusak(Math.min(1, (jest.sure - jest.t)/0.4));
  const p = jest.kareler ? izOrnekle(jest.kareler, jest.dongu ? (jest.t/jest.donem) % 1 : Math.min(1, jest.t/jest.sure)) : klipOrnekle(jest.ad, jest.t, {yalnizUst:true});
  if (jest.el?.sag) Object.assign(p, VERI.el_sekilleri[jest.el.sag] || {});
  return { p, w:Math.min(giris, cikis) };
}
/* zıplama klibinin havada geçen bölümü (kayıttan bulunur) */
let ZIPLA_HAVA = [0.3, 0.7];
function ziplaKlibiniOlc(){
  const K = KLIP.ileri_zipla; if (!K) return;
  const y = []; for (let i = 0; i < K.n; i++) y.push(K.kok[i*3 + 1]);
  const taban = Math.min(...y.slice(0, 8)), esik = taban + 0.04;
  let a = y.findIndex(v => v > esik), b = y.length - 1 - [...y].reverse().findIndex(v => v > esik);
  if (a > 0 && b > a) ZIPLA_HAVA = [a/K.fps, b/K.fps];
}

/* ---------------- durumlar ---------------- */
function durumGec(d, sure = 0){ N.durum = d; N.t = 0; N.sure = sure; }
function bekle(sure){ durumGec('bekle', sure ?? arasi(3, 8)); N.hedefYaw = arasi(-0.25, 0.25); }
function git(plat, x, sonra){ N.plan = { plat, x:sinirla(x, plat.x0, plat.x1), sonra }; durumGec('gidiyor'); }
function siradakiAtlama(hedef){
  const cur = N.plat; if (!cur) return null;
  let en = null, enPuan = Infinity;
  const hedefX = N.plan.x, hedefY = hedef.y;
  for (const z of ZEMIN){
    if (z === cur) continue;
    const kalkX = sinirla((z.x0 + z.x1)/2, cur.x0, cur.x1);
    const inX = sinirla(z === hedef ? hedefX : kalkX, z.x0, z.x1);
    const dx = inX - kalkX, dy = z.y - cur.y;
    if (Math.abs(dx) > H*2.4 || dy < -H*1.25) continue;               // çok uzak ya da çok yüksek
    const kalan = Math.hypot((z === hedef ? 0 : (hedefX - inX)), hedefY - z.y);
    const puan = kalan + Math.hypot(dx, dy)*0.35 + (z === hedef ? -H : 0);
    if (puan < enPuan){ enPuan = puan; en = { z, kalkX, inX }; }
  }
  return en;
}
function ziplamaBasla(z, x1, y1){
  const x0 = N.x, y0 = N.y, d = Math.hypot(x1 - x0, y1 - y0)/k;
  const T = sinirla(0.42 + d*0.22, 0.45, 0.95), tepe = Math.max(H*0.28, (y0 - y1) + H*0.22);
  N.zip = { x0, y0, x1, y1, T, t:0, tepe, z };
  N.hedefYaw = (x1 >= x0 ? 1 : -1)*1.15;
  durumGec('zipla');
}

/* her kare: durum makinesi → bedenin pozu ve ekrandaki yeri */
function durumGuncelle(dt){
  N.t += dt; N.yOfs = 0;
  const yuruHiz = 0.5*k;   // px/s
  let poz = null;
  switch (N.durum){
    case 'yukleniyor': return null;
    case 'cikis': {    // Nova simgesinden çıkar
      const u = Math.min(1, N.t/0.9);
      N.olcek = yumusak(Math.min(1, u*1.4));
      const s = N.cikisSimge?.kare;
      if (s){ N.x = s.x + s.w/2; N.y = s.y + s.h*0.55 - Math.sin(u*Math.PI)*H*0.45 - (s.h*0.53)*yumusak(u); }
      poz = havaPozu(u);
      if (s && u < 0.45) perdeAyarla(s); else perde.visible = false;
      if (u >= 1){ N.plat = altindakiYuzey(N.x, N.y - dp(6), true) || ZEMIN[ZEMIN.length - 1]; N.y = N.plat.y; N.olcek = 1; jestYap('el_salla', 2.4); soyle(rastgele(['Ben geldim!', 'Hey! Dışarısı ne güzel.', 'Biraz dolaşayım mı?', 'Selam! Buradayım.']), 'mutlu'); bekle(3); }
      break;
    }
    case 'giris': {    // eve: simgesine girer
      const u = Math.min(1, N.t/0.8);
      N.olcek = 1 - yumusak(u);
      const s = N.girisSimge?.kare;
      if (s){ N.x = s.x + s.w/2; N.y = N.girisY + (s.h*0.6)*yumusak(u) - Math.sin(u*Math.PI)*H*0.25; }
      poz = havaPozu(u);
      if (s && u > 0.3) perdeAyarla(s);
      if (u >= 1){ N.olcek = 0; durumGec('bitti'); balon(''); setTimeout(() => DIS?.eveGirdi(), 120); }
      break;
    }
    case 'bitti': return null;
    case 'bekle': {
      poz = beklemePozu(dt);
      if (N.t > N.sure && !N.konusuyor && !N.dinliyor) sonrakiIs();
      break;
    }
    case 'gidiyor': {
      const P = N.plan; if (!P){ bekle(); break; }
      if (!N.plat){ durumGec('dus'); break; }
      let hedefX;
      if (P.plat === N.plat) hedefX = P.x;
      else {
        const a = siradakiAtlama(P.plat);
        if (!a){ N.plan = null; bekle(2); break; }
        hedefX = a.kalkX;
        if (Math.abs(N.x - hedefX) < dp(3)){ ziplamaBasla(a.z, a.inX, a.z.y); break; }
      }
      const fark = hedefX - N.x;
      if (Math.abs(fark) < dp(2.5)){
        N.x = hedefX;
        if (P.plat === N.plat){ const s = P.sonra; N.plan = null; if (s) s(); else bekle(); }
        poz = beklemePozu(dt); break;
      }
      N.hedefYaw = Math.sign(fark)*1.2;
      const adim = Math.min(Math.abs(fark), yuruHiz*dt)*Math.sign(fark);
      N.x += adim; N.faz = (N.faz + Math.abs(adim)/(KLIP.yuru.adim*k)) % 1;
      poz = klipOrnekle('yuru', N.faz*KLIP.yuru.sure); if (poz._kok) poz._kok = [0, poz._kok[1], 0];
      break;
    }
    case 'zipla': {
      const Z = N.zip; Z.t += dt;
      const hazirlik = 0.12, u = sinirla((Z.t - hazirlik)/Z.T, 0, 1);
      if (Z.t < hazirlik){ poz = ziplaPozu(0); break; }
      N.x = Z.x0 + (Z.x1 - Z.x0)*u;
      N.y = Z.y0 + (Z.y1 - Z.y0)*u - Z.tepe*4*u*(1 - u);
      poz = ziplaPozu(u);
      if (u >= 1){ N.plat = Z.z; N.y = Z.z.y; N.zip = null; N.inis = 0.18; durumGec(N.plan ? 'gidiyor' : 'bekle', 1.5); }
      break;
    }
    case 'dus': {
      N.vy += 3.4*H*dt; const once = N.y; N.y += N.vy*dt; N.x += N.vx*dt; N.vx *= Math.pow(0.2, dt);
      N.x = sinirla(N.x, dp(16), EKRAN.w - dp(16));
      const alt = altindakiYuzey(N.x, once, false);
      if (alt && N.y >= alt.y){ const sert = N.vy > 2.2*H; N.y = alt.y; N.plat = alt; N.vy = 0; N.vx = 0; N.inis = 0.22;
        if (sert){ ifade('saskin', 0.8, 1.6); soyle(rastgele(['Hop!', 'Ayy, indim!', 'Uff, sert iniş.']), 'saskin'); }
        bekle(2.5); }
      if (N.y > EKRAN.h + H){ N.plat = ZEMIN[ZEMIN.length - 1]; N.y = N.plat.y; N.vy = 0; bekle(); }
      poz = havaPozu(0.5, true);
      break;
    }
    case 'tutuldu': {
      N.x = PEN.x + N.tutOfs[0]; N.y = PEN.y + N.tutOfs[1];
      poz = sallanmaPozu(N.t);
      break;
    }
    case 'otur': {
      const gecis = 0.55, u = N.kalk != null ? 1 - Math.min(1, (N.t - N.kalk)/gecis) : Math.min(1, N.t/gecis);
      poz = karistir(beklemePozu(dt), oturmaPozu(N.t), yumusak(u));
      N.yOfs = (kokDinlenme.y - OTURMA_DUSUS - 0.075)*yumusak(u);   // kalça simgenin üst kenarına otursun
      N.hedefYaw = 0;
      if (N.kalk == null && N.t > N.sure && !N.konusuyor && !N.dinliyor) N.kalk = N.t;
      if (N.kalk != null && N.t - N.kalk > gecis){ N.kalk = null; bekle(2); }
      break;
    }
    case 'saklan': {
      const S = N.saklanilan; if (!S){ bekle(); break; }
      const r = S.kare;
      if (N.t < 0.55){   // simgenin arkasına süzül
        const u = yumusak(N.t/0.55); N.x = N.saklanBas[0] + (r.x + r.w*0.5 - N.saklanBas[0])*u; N.y = N.saklanBas[1] + (r.y + Math.min(r.h*0.95, H*0.36) - N.saklanBas[1])*u - Math.sin(u*Math.PI)*H*0.18;
      }
      perdeAyarla(r);
      poz = karistir(beklemePozu(dt), yerdeOturmaPozu(N.t), Math.min(1, N.t/0.5));
      const bak = Math.sin(N.t*1.6);
      ekle(poz, 'spine', [0, 0, bak*9]); ekle(poz, 'head', [0, bak*25, bak*8]);
      if (!N.seslendi && N.t > 1.4){ N.seslendi = true; soyle(rastgele(['Cee!', 'Bul beni! 🙈', 'Buradayım!', 'Beni göremezsin…']), 'mutlu'); }
      if (N.t > N.sure && !N.konusuyor) saklanmaBitir(false);
      break;
    }
    case 'cikiyor': {   // saklandığı simgenin üstüne zıplar
      perde.visible = N.t < 0.25;
      if (N.t > 0.08 && !N.zip){ const z = zeminBul(N.saklanilan?.id) || altindakiYuzey(N.x, N.y - H, false); N.saklanilan = null; if (z) ziplamaBasla(z, sinirla(N.x, z.x0, z.x1), z.y); else bekle(); }
      poz = ziplaPozu(0);
      break;
    }
    case 'dans': {
      poz = klipOrnekle(N.dans, N.t); if (poz._kok) poz._kok = [0, poz._kok[1], 0];
      N.hedefYaw = Math.sin(N.t*0.7)*0.4;
      if (N.t > N.sure) bekle(3);
      break;
    }
    case 'uyu': {
      const u = Math.min(1, N.t/1.2);
      poz = karistir(beklemePozu(dt), yatmaPozu(), yumusak(u));
      N.hedefYaw = N.uyuYon*1.57;
      if (N.t > 4 && (N.sonZzz || 0) < N.t - 9){ N.sonZzz = N.t; soyle('Zzz…', null, 2.2, true); }
      if (N.t > N.sure) uyan(false);
      break;
    }
    case 'uyaniyor': {
      const u = Math.min(1, N.t/1.3);
      poz = karistir(yatmaPozu(), beklemePozu(dt), yumusak(u));
      if (u >= 1){ jestYap('esne'); bekle(3); }
      break;
    }
  }
  return poz;
}
/* ---- pozlar ---- */
function havaPozu(u, dusuyor){
  const p = ziplaPozu(0.5);
  if (dusuyor){ const k2 = klipOrnekle('kork', 0.6, {yalnizUst:true}); return ustKaristir(p, k2, 0.8); }
  return p;
}
function ziplaPozu(u){
  const [a, b] = ZIPLA_HAVA, p = klipOrnekle('ileri_zipla', u <= 0 ? Math.max(0, a - 0.12) : a + (b - a)*u);
  if (p._kok) p._kok = [0, Math.min(0, p._kok[1] - (klipOrnekle('ileri_zipla', 0)._kok?.[1] || 0))*0.6, 0];
  return p;
}
function sallanmaPozu(t){
  const p = kopyala(DINLENME), s = Math.sin(t*5.2), s2 = Math.sin(t*4.1 + 1);
  p.rightUpperArm = [0, 0, -78 + s*5]; p.leftUpperArm = [0, 0, 78 - s*5];   // kollar yukarı (tutulmuş)
  p.rightLowerArm = [0, 0, -12]; p.leftLowerArm = [0, 0, 12];
  p.rightUpperLeg = [-12 + s*14, 0, 3]; p.leftUpperLeg = [-12 - s*14, 0, -3];
  p.rightLowerLeg = [25 + s2*12, 0, 0]; p.leftLowerLeg = [25 - s2*12, 0, 0];
  p.head = [8, s*6, 0]; p._kok = [0, 0, 0];
  return p;
}
function oturmaPozu(t){
  const p = kopyala(DINLENME), s = Math.sin(t*2.3), s2 = Math.sin(t*2.3 + 1.9);
  Object.assign(p, kopyala(OTURMA));
  p.rightLowerLeg = [70 + s*16, 0, 0]; p.leftLowerLeg = [70 + s2*16, 0, 0];   // ayaklarını sallar
  p.rightUpperArm = [0, 0, 64]; p.leftUpperArm = [0, 0, -64];   // eller yanında, kenara dayalı
  p.spine = [6, 0, 0]; p.head = [-4, Math.sin(t*0.4)*10, 0];
  p._kok = [0, -OTURMA_DUSUS, 0];
  return p;
}
function yerdeOturmaPozu(t){ return klipOrnekle('yerde', 2 + (t % 10)); }
function yatmaPozu(){ return klipOrnekle('yerde_yat', 0.5); }

/* ---------------- ne yapsın? ---------------- */
function sonrakiIs(){
  if (N.bekleyenIs){ const f = N.bekleyenIs; N.bekleyenIs = null; f(); return; }
  const saat = new Date().getHours(), gece = saat >= 0 && saat < 6, simdi = performance.now()/1000;
  const sikildi = simdi - N.sonEtkilesim > 150;
  const secenek = [
    ['gez', 34], ['otur', SIMGE.length ? 20 : 0], ['saklan', SIMGE.length ? 12 : 0], ['jest', 12],
    ['dans', gece ? 1 : 5], ['uyu', gece ? 22 : (sikildi ? 7 : 2)], ['yorum', AYAR.konuskan ? 6 : 0],
  ];
  let top = secenek.reduce((a, b) => a + b[1], 0), r = Math.random()*top, sec = 'gez';
  for (const [ad, w] of secenek){ r -= w; if (r <= 0){ sec = ad; break; } }
  if (sec === 'gez'){
    const z = rastgele(ZEMIN); git(z, arasi(z.x0, z.x1), () => { if (Math.random() < 0.3) jestYap(rastgele(['bak', 'eller_belde', 'gerin'])); bekle(); });
  } else if (sec === 'otur'){
    const s = rastgele(SIMGE), z = zeminBul(s.id); if (!z) return bekle();
    git(z, (z.x0 + z.x1)/2, () => { durumGec('otur', arasi(9, 24)); N.kalk = null; if (Math.random() < 0.35) soyle(rastgele(['Buradan manzara güzel.', 'Biraz oturayım.', s.ad ? `${s.ad} rahatmış.` : 'Oh, rahat.']), 'rahat'); });
  } else if (sec === 'saklan'){
    const s = rastgele(SIMGE), z = zeminBul(s.id); if (!z) return bekle();
    git(z, (z.x0 + z.x1)/2, () => saklan(s));
  } else if (sec === 'jest'){
    jestYap(rastgele(['el_salla', 'gerin2', 'esne', 'kutla', 'utangac', 'dusun', 'omuz_silk', 'alkis'].filter(a => VERI.hareketler[a] || KLIP[a]))); bekle(4);
  } else if (sec === 'dans'){
    N.dans = rastgele(['salsa', 'charleston', 'salsa2']); durumGec('dans', arasi(6, 11)); if (Math.random() < 0.5) soyle(rastgele(['🎵 La la la…', 'Biraz dans!', 'Hmm hm hmm 🎶']), 'mutlu');
  } else if (sec === 'uyu'){
    const genis = ZEMIN.filter(z => z.x1 - z.x0 > H*0.9), z = rastgele(genis.length ? genis : ZEMIN);
    git(z, sinirla((z.x0 + z.x1)/2 + arasi(-H, H), z.x0 + H*0.45, z.x1 - H*0.45), () => { N.uyuYon = Math.random() < 0.5 ? 1 : -1; durumGec('uyu', gece ? 900 : arasi(40, 120)); N.sonZzz = 0; ifade('rahat', 0.6, 9999); });
  } else if (sec === 'yorum'){
    kendiliginden(); bekle(4);
  }
}
function saklan(s){
  N.saklanilan = s; N.saklanBas = [N.x, N.y]; N.seslendi = false; N.plat = null;
  durumGec('saklan', arasi(8, 16));
}
function saklanmaBitir(bulundu){
  if (N.durum !== 'saklan') return;
  if (bulundu){ soyle(rastgele(['Buldun beni! 😄', 'Eyvah, yakalandım!', 'Hihi, buldun!']), 'mutlu'); ifade('mutlu', 0.9, 2); }
  N.zip = null; durumGec('cikiyor');
}
function uyan(dokunuldu){
  if (N.durum !== 'uyu') return;
  ifade(null); durumGec('uyaniyor');
  if (dokunuldu) setTimeout(() => soyle(rastgele(['Hıı? Uyuyordum…', 'Günaydın… 🥱', 'Beş dakika daha…']), 'rahat'), 900);
}
function perdeAyarla(r){
  perde.visible = true;
  perde.scale.set(r.w/k, r.h/k, 1);
  perde.position.set((r.x + r.w/2)/k, -(r.y + r.h/2)/k, 5);
}
function eveDon(){
  if (['giris', 'bitti'].includes(N.durum)) return;
  perde.visible = false; N.saklanilan = null; jest.ad = null;
  soyle(rastgele(['Tamam, eve dönüyorum!', 'Hadi eve!', 'Görüşürüz! 👋']), 'mutlu');
  const s = NOVA_SIMGE, bitir = () => {
    if (s){ N.girisSimge = s; N.girisY = N.y; durumGec('giris'); }
    else { const kenar = N.x < EKRAN.w/2 ? -H : EKRAN.w + H; const z = N.plat || ZEMIN[ZEMIN.length - 1]; N.plan = null; durumGec('kenaraGit'); N.kenar = kenar; N.plat = z; }
  };
  if (!N.plat){ N.plat = altindakiYuzey(N.x, N.y - dp(6), true) || ZEMIN[ZEMIN.length - 1]; N.y = N.plat.y; }
  if (s){ const z = zeminBul(s.id); if (z) return git(z, (z.x0 + z.x1)/2, bitir); }
  bitir();
}

/* ---------------- konuşma balonu ---------------- */
let balonMetin = '', balonBitis = 0, balonSonYer = '';
function balon(metin, sure){
  balonMetin = metin || ''; balonBitis = metin ? performance.now()/1000 + (sure || Math.max(2.6, metin.length*0.075)) : 0; balonSonYer = '';
  balonKonum(true);
}
function balonKonum(zorla){
  if (!balonMetin){ if (DIS) DIS.balon('', 0, 0); else $('testBalon').style.display = 'none'; return; }
  const b = ekranKutusu(); if (!b) return;
  const x = Math.round((b.x0 + b.x1)/2), y = Math.round(b.y0 - dp(2));
  const anahtar = x + ',' + y + balonMetin;
  if (!zorla && Math.abs(x - (balonKonum.x || 0)) < dp(3) && Math.abs(y - (balonKonum.y || 0)) < dp(3)) return;
  balonKonum.x = x; balonKonum.y = y;
  if (anahtar === balonSonYer) return; balonSonYer = anahtar;
  if (DIS) DIS.balon(balonMetin, x, y);
  else { const e = $('testBalon'); e.textContent = balonMetin; e.style.display = 'block'; e.style.left = x/EKRAN.yog + 'px'; e.style.top = (y/EKRAN.yog - 6) + 'px'; }
}
function soyle(metin, ifadeAd, sure, sessiz){
  balon(metin, sure);
  if (ifadeAd) ifade(ifadeAd, 0.8, 2.5);
  if (!sessiz && AYAR.sesli && DIS && !/^[^\p{L}]*$/u.test(metin)){
    const temiz = metin.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '').trim();
    if (temiz){ N.konusuyor = true; const sesAdi = (() => { const s = depo.oku('nova-ses', ''); return typeof s === 'string' ? s : (s?.ad || ''); })();
      Promise.resolve(platform.konus(temiz, {perde:KISILIK.ses.perde, hiz:KISILIK.ses.hiz, ses:sesAdi})).finally(() => { N.konusuyor = false; }); }
  }
}

/* ---------------- kendiliğinden konuşma (pil, saat) ---------------- */
let sonPil = null, sonYorum = performance.now()/1000;
function pilBak(){
  if (!DIS) return;
  let p; try { const r = JSON.parse(DIS.pil()); p = r.ok ? r.data : null; } catch(e){}
  if (!p) return;
  if (sonPil){
    if (p.sarj && !sonPil.sarj) soyle(rastgele(['Ohh, şarj! Teşekkürler 🔋', 'Mmm, enerji geliyor!']), 'mutlu');
    else if (!p.sarj && p.yuzde <= 15 && sonPil.yuzde > 15) soyle(`Pilin %${p.yuzde} kaldı, şarja takalım mı?`, 'uzgun');
  }
  sonPil = p;
}
function kendiliginden(){
  const s = new Date().getHours();
  const l = s < 6 ? ['Geç oldu… Sen de uyusan mı?', 'Gece sessiz, hoşuma gidiyor.'] :
            s < 11 ? ['Günaydın! Bugün ne yapıyoruz?', 'Sabah sabah enerjim yerinde!'] :
            s < 18 ? ['Şu simgelerin arasında saklambaç oynayalım mı?', 'Bana çift dokunursan konuşuruz.', 'Burası rahatmış.', 'Hmm hm hmm 🎵'] :
                     ['Akşam oldu, nasıldı günün?', 'Biraz dinlensen mi?', 'Bana çift dokun, anlat bakalım.'];
  soyle(rastgele(l), 'rahat'); sonYorum = performance.now()/1000;
}

/* ---------------- dokunma ---------------- */
function dokunuldu(yer){
  N.sonEtkilesim = performance.now()/1000;
  const sx = PEN.x + (yer?.x || 0), sy = PEN.y + (yer?.y || 0);
  const simdi = performance.now()/1000; N.dokunuslar = N.dokunuslar.filter(t => simdi - t < 6); N.dokunuslar.push(simdi);
  DIS?.titresim(12);
  if (N.durum === 'uyu') return uyan(true);
  if (N.durum === 'saklan') return saklanmaBitir(true);
  if (N.dokunuslar.length >= 5){ N.dokunuslar = []; jestYap('sinirlen'); return soyle(rastgele(['Yeter ama! 😤', 'Gıdıklanıyorum, dur!']), 'kizgin'); }
  const b = ekranKutusu(), basta = b && sy < b.y0 + (b.y1 - b.y0)*0.28;
  N.hedefYaw = 0;
  if (basta){ jestYap('utangac'); soyle(rastgele(['Hihi, saçım!', 'Başımı okşadın 😊', 'Hı?']), 'mutlu'); }
  else { jestYap(rastgele(['gul', 'el_salla', 'cok_mutlu'])); soyle(rastgele(['Selam!', 'Efendim?', 'Hihi, gıdıklanıyorum!', 'Buradayım!', 'Bana çift dokunursan konuşuruz.']), 'mutlu'); }
}
function tutuldu(){
  N.sonEtkilesim = performance.now()/1000;
  if (N.durum === 'saklan'){ perde.visible = false; N.saklanilan = null; }
  if (N.durum === 'uyu') ifade(null);
  N.plan = null; N.zip = null; N.plat = null; N.olcek = 1;
  N.tutOfs = [N.x - PEN.x, N.y - PEN.y];
  N.hedefYaw = 0; durumGec('tutuldu');
  soyle(rastgele(['Ayy! Yavaş!', 'Uçuyoruum!', 'Beni nereye götürüyorsun?', 'Hiii!']), 'saskin', 2);
}
function birakildi(){
  if (N.durum !== 'tutuldu') return;
  N.vy = 0; N.vx = 0; durumGec('dus');
}

/* ---------------- dinle & konuş (çift dokunuş) ---------------- */
let dinlemeKapat = null;
function dinle(){
  if (N.dinliyor){ dinlemeKapat?.(); return; }
  if (N.durum === 'uyu') uyan(false);
  if (N.durum === 'saklan') saklanmaBitir(false);
  N.sonEtkilesim = performance.now()/1000; N.hedefYaw = 0; N.dinliyor = true; jestYap('dusun', 30);
  balon('Dinliyorum… 🎙️', 30);
  platform.sus();
  dinlemeKapat = platform.dinle((olay, veri) => {
    if (olay === 'kismi') balon('“' + veri + '”', 30);
    else if (olay === 'sonuc'){ N.dinliyor = false; jest.ad = null; cevapla(String(veri || '')); }
    else if (olay === 'hata'){ N.dinliyor = false; jest.ad = null; soyle(veri || 'Duyamadım.', 'uzgun'); }
  });
}
const EYLEMLER = ['yok', 'el_salla', 'gul', 'cok_mutlu', 'dans', 'uzul', 'otur', 'saklan', 'uyu', 'zipla', 'eve_don', 'yanina_gel'];
async function cevapla(metin){
  if (!metin.trim()){ soyle('Bir şey duyamadım.', 'uzgun'); return; }
  balon('…', 20);
  let y = null;
  try { y = await aiCevap(metin); } catch(e){ y = null; }
  if (!y) y = yerelCevap(metin);
  eylemYap(y.eylem);
  soyle(y.soz || '…', y.ifade && y.ifade !== 'notr' ? y.ifade : 'mutlu');
}
function DIS_BAGLAM(){
  const saat = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
  const adlar = [...new Set(SIMGE.map(s => s.ad))].slice(0, 30).join(', ');
  return `ŞU AN: Evinden (uygulamandan) dışarı çıktın; kullanıcının telefonunun ANA EKRANINDA, simgelerin arasında küçücük bir hâlde geziyorsun (simgelerin üstüne oturuyor, arkalarına saklanıyor, aralarında yürüyorsun). Saat ${saat}.${sonPil ? ` Telefonun pili %${sonPil.yuzde}${sonPil.sarj ? ', şarj oluyor' : ''}.` : ''}${adlar ? ` Ana ekrandaki simgeler: ${adlar}.` : ''}
Kullanıcı sana çift dokunup konuştu. Kısa cevap ver (en fazla 2 cümle; konuşma balonuna sığmalı).
YANIT yalnızca JSON: {"soz":"…","ifade":"mutlu|uzgun|kizgin|rahat|saskin|notr","eylem":"${EYLEMLER.join('|')}"}
eylem: kullanıcı bir şey yapmanı isterse ona uygun olanı seç ("eve gel/dön" → eve_don, "dans et" → dans, "saklan" → saklan, "otur" → otur, "uyu" → uyu, "zıpla" → zipla, "yanıma gel / aşağı gel" → yanina_gel); yoksa "yok".`;
}
async function aiCevap(metin){
  const ai = Object.assign({anahtar:'', model:'llama-3.3-70b-versatile'}, depo.oku('nova-ai', {}));
  if (!ai.anahtar) return null;
  const gecmis = depo.oku('nova-gecmis', []);
  const son = gecmis.slice(-8).map(m => ({ role:m.role, content: m.role === 'assistant' ? (() => { try { return JSON.parse(m.content).soz || ''; } catch(e){ return String(m.content); } })() : String(m.content) })).filter(m => m.content);
  const mesajlar = [{role:'system', content:`${kisilikMetni()}\n\n${hafizaMetni(metin)}\n\n${DIS_BAGLAM()}`}, ...son, {role:'user', content:metin}];
  const r = await platform.http('https://api.groq.com/openai/v1/chat/completions', {method:'POST',
    headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + ai.anahtar},
    body:JSON.stringify({model:ai.model, messages:mesajlar, temperature:0.8, max_tokens:300, response_format:{type:'json_object'}})});
  if (r.status < 200 || r.status >= 300) return null;
  const icerik = JSON.parse(r.text).choices?.[0]?.message?.content || '';
  let y; try { y = JSON.parse(icerik); } catch(e){ const m = icerik.match(/\{[\s\S]*\}/); y = m ? JSON.parse(m[0]) : null; }
  if (!y || typeof y.soz !== 'string') return null;
  y.soz = y.soz.slice(0, 220); if (!EYLEMLER.includes(y.eylem)) y.eylem = 'yok';
  gecmis.push({role:'user', content:metin}, {role:'assistant', content:JSON.stringify({soz:y.soz, komutlar:[]})});
  depo.yaz('nova-gecmis', gecmis.slice(-24));
  return y;
}
function yerelCevap(metin){
  const m = metin.toLocaleLowerCase('tr');
  if (/eve|içeri gir|geri dön/.test(m)) return {soz:'Tamam, eve dönüyorum!', eylem:'eve_don', ifade:'mutlu'};
  if (/dans/.test(m)) return {soz:'Müzik nerede? Hadi!', eylem:'dans', ifade:'mutlu'};
  if (/saklan|saklambaç/.test(m)) return {soz:'Gözlerini kapat, sayıyorum!', eylem:'saklan', ifade:'mutlu'};
  if (/otur/.test(m)) return {soz:'Peki, oturuyorum.', eylem:'otur', ifade:'rahat'};
  if (/uyu|yat/.test(m)) return {soz:'İyi geceler…', eylem:'uyu', ifade:'rahat'};
  if (/zıpla/.test(m)) return {soz:'Hop!', eylem:'zipla', ifade:'mutlu'};
  if (/gel/.test(m)) return {soz:'Geliyorum!', eylem:'yanina_gel', ifade:'mutlu'};
  if (/merhaba|selam/.test(m)) return {soz:'Selam! Buradayım 😊', eylem:'el_salla', ifade:'mutlu'};
  return {soz:'Seni duydum! Yapay zekâm bağlı değil; Nova uygulamasında Ayarlar → Yapay zekâ bölümünden bağlayabilirsin.', eylem:'yok', ifade:'rahat'};
}
function eylemYap(e){
  if (!e || e === 'yok') return;
  const sonra = f => { N.bekleyenIs = f; if (N.durum === 'bekle') N.sure = Math.min(N.sure, N.t + 1.2); else if (['otur', 'dans', 'uyu'].includes(N.durum)) { N.sure = N.t; } };
  if (['el_salla', 'gul', 'cok_mutlu', 'uzul'].includes(e)) return jestYap(e);
  if (e === 'eve_don') return setTimeout(eveDon, 1500);
  if (e === 'dans') return sonra(() => { N.dans = rastgele(['salsa', 'charleston']); durumGec('dans', 9); });
  if (e === 'otur' && SIMGE.length) return sonra(() => { const s = rastgele(SIMGE), z = zeminBul(s.id); git(z, (z.x0 + z.x1)/2, () => { durumGec('otur', 25); N.kalk = null; }); });
  if (e === 'saklan' && SIMGE.length) return sonra(() => { const s = rastgele(SIMGE), z = zeminBul(s.id); git(z, (z.x0 + z.x1)/2, () => saklan(s)); });
  if (e === 'uyu') return sonra(() => { N.uyuYon = 1; durumGec('uyu', 300); ifade('rahat', 0.6, 9999); });
  if (e === 'zipla' && N.plat) return sonra(() => ziplamaBasla(N.plat, sinirla(N.x + (Math.random() < 0.5 ? -1 : 1)*H*0.4, N.plat.x0, N.plat.x1), N.plat.y));
  if (e === 'yanina_gel') return sonra(() => { const z = ZEMIN[ZEMIN.length - 1]; git(z, EKRAN.w/2, () => { jestYap('el_salla'); bekle(5); }); });
}

/* ---------------- ekran kutusu & pencere ---------------- */
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
const KUTU_KEMIK = ['head', 'neck', 'leftHand', 'rightHand', 'leftLowerArm', 'rightLowerArm', 'leftFoot', 'rightFoot', 'leftToes', 'rightToes', 'leftLowerLeg', 'rightLowerLeg', 'hips', 'upperChest', 'leftUpperArm', 'rightUpperArm'];
function ekranKutusu(){
  if (!vrm || N.olcek < 0.02) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const ekle_ = v => { const sx = v.x*k, sy = -v.y*k; if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; };
  for (const b of KUTU_KEMIK){ const n = vrm.humanoid.getRawBoneNode(b); if (!n) continue; n.getWorldPosition(_v); ekle_(_v);
    if (b === 'head'){ n.getWorldQuaternion(_q); ekle_(_v.clone().add(new THREE.Vector3(0, 0.17*N.olcek, 0).applyQuaternion(_q))); } }
  const p = H*0.075*N.olcek;   // saç, el, ayakkabı payı
  return { x0:x0 - p, y0:y0 - p*1.2, x1:x1 + p, y1:y1 + p*0.6 };
}
let sonGonderilen = '';
function pencereGuncelle(){
  if (TEST || suruklenen) return;
  const b = ekranKutusu(); if (!b) return;
  const gw = b.x1 - b.x0, gh = b.y1 - b.y0, adim = dp(8);
  let w = PEN.w, h = PEN.h;
  if (gw > w || gw < w - H*0.3) w = Math.ceil((gw + H*0.12)/adim)*adim;
  if (gh > h || gh < h - H*0.3) h = Math.ceil((gh + H*0.12)/adim)*adim;
  const x = Math.round((b.x0 + b.x1)/2 - w/2), y = Math.round((b.y0 + b.y1)/2 - h/2);
  const a = `${x},${y},${w},${h}`; if (a === sonGonderilen) return;
  sonGonderilen = a; PEN.x = x; PEN.y = y; PEN.w = w; PEN.h = h;
  DIS.pencere(x, y, w, h);
}
function kameraGuncelle(){
  const cw = TEST ? EKRAN.w : innerWidth*devicePixelRatio, ch = TEST ? EKRAN.h : innerHeight*devicePixelRatio;
  kamera.left = PEN.x/k; kamera.right = (PEN.x + cw)/k; kamera.top = -PEN.y/k; kamera.bottom = -(PEN.y + ch)/k;
  kamera.updateProjectionMatrix();
}
function boyutla(){ renderer.setSize(innerWidth, innerHeight, false); }
addEventListener('resize', boyutla);

/* ---------------- test: sahte ana ekran (yalnızca tarayıcıda) ---------------- */
function sahteEkranKur(){
  const e = $('sahteEkran'), W = innerWidth, Hh = innerHeight;
  e.style.background = 'linear-gradient(165deg,#2c2a5a,#6a4c9c 55%,#d58fb0)';
  const adlar = ['Saat', 'Takvim', 'Notlar', 'Hava', 'Mesajlar', 'Müzik', 'Ayarlar', 'Nova', 'Kamera', 'Galeri', 'Haritalar', 'Dosyalar', 'Play Store', 'Sağlık', 'Banka', 'Oyunlar'];
  const renk = ['#f5f5f5', '#ff8a65', '#ffd54f', '#4fc3f7', '#81c784', '#ba68c8', '#90a4ae', 'linear-gradient(135deg,#6a3ff0,#5ee6d4)', '#455a64', '#f06292', '#4db6ac', '#ffb74d', '#e8f5e9', '#ef5350', '#26a69a', '#7e57c2'];
  const simgeler = [], bloklar = [], hw = W/4, hh = 96, ust = 210;
  adlar.forEach((ad, i) => { const c = i % 4, r = Math.floor(i/4), x = c*hw, y = ust + r*hh;
    const d = document.createElement('div'); d.className = 'sahte-simge'; Object.assign(d.style, {left:x + 'px', top:y + 'px', width:hw + 'px', height:hh + 'px'});
    const boy = Math.min(hw*AYAR.simgeOlcek*1.18, hh*0.6), et = Math.max(14, hh*0.22), ic = Math.max(0, (hh - et - boy)*0.45);
    d.innerHTML = `<i style="width:${boy}px;height:${boy}px;margin-top:${ic}px;background:${renk[i]}"></i>${ad}`; e.appendChild(d);
    simgeler.push({ad, x:x*devicePixelRatio, y:y*devicePixelRatio, w:hw*devicePixelRatio, h:hh*devicePixelRatio, etiketli:true}); });
  const ara = document.createElement('div'); ara.className = 'sahte-blok'; Object.assign(ara.style, {left:'18px', width:(W - 36) + 'px', top:(ust + 4*hh + 18) + 'px', height:'48px'}); e.appendChild(ara);
  bloklar.push({x:18*devicePixelRatio, y:(ust + 4*hh + 18)*devicePixelRatio, w:(W - 36)*devicePixelRatio, h:48*devicePixelRatio});
  const dock = ['Telefon', 'Mesaj', 'Kamera', 'Tarayıcı'], dr = ['#66bb6a', '#42a5f5', '#455a64', '#ffca28'];
  dock.forEach((ad, i) => { const x = i*hw, y = Hh - 112;
    const d = document.createElement('div'); d.className = 'sahte-simge'; Object.assign(d.style, {left:x + 'px', top:y + 'px', width:hw + 'px', height:'76px'});
    d.innerHTML = `<i style="width:56px;height:56px;margin-top:10px;background:${dr[i]}"></i>`; e.appendChild(d);
    simgeler.push({ad, x:x*devicePixelRatio, y:y*devicePixelRatio, w:hw*devicePixelRatio, h:76*devicePixelRatio, etiketli:false}); });
  const saat = document.createElement('div'); Object.assign(saat.style, {position:'absolute', left:'24px', top:'70px', color:'#fff', font:'300 64px system-ui', textShadow:'0 2px 8px rgba(0,0,0,.25)'}); saat.textContent = '22:47'; e.appendChild(saat);
  return { erisim:true, anaEkran:true, simgeler, bloklar };
}
function cerceveCiz(){
  document.querySelectorAll('.cerceve').forEach(e => e.remove());
  if (!AYAR.cerceve || !TEST) return;
  for (const s of SIMGE){ const d = document.createElement('div'); d.className = 'cerceve'; const r = s.kare;
    Object.assign(d.style, {left:r.x/EKRAN.yog + 'px', top:r.y/EKRAN.yog + 'px', width:r.w/EKRAN.yog + 'px', height:r.h/EKRAN.yog + 'px'}); document.body.appendChild(d); }
}

/* ---------------- native olayları ---------------- */
let gorunur = true;
window.novaDis = (olay, v) => {
  try {
    if (olay === 'dokun') dokunuldu(v);
    else if (olay === 'cift') dinle();
    else if (olay === 'tut'){ suruklenen = true; PEN.x = v.x; PEN.y = v.y; tutuldu(); }
    else if (olay === 'surukle'){ PEN.x = v.x; PEN.y = v.y; }
    else if (olay === 'birak'){ PEN.x = v.x; PEN.y = v.y; suruklenen = false; sonGonderilen = ''; birakildi(); }
    else if (olay === 'simgeler') yuzeyleriKur(v);
    else if (olay === 'gorunur'){
      const once = gorunur; gorunur = !!v.acik;
      if (gorunur && !once){ const gizli = performance.now()/1000 - N.gizliBas; saat.getDelta(); if (gizli > 90 && N.durum === 'bekle' && Math.random() < 0.6) { jestYap('el_salla'); soyle(rastgele(['Hoş geldin!', 'Neredeydin? Seni bekliyordum.', 'Döndün! 😊']), 'mutlu'); } dongu(); }
      if (!gorunur){ N.gizliBas = performance.now()/1000; platform.sus(); }
    }
    else if (olay === 'eveDon') eveDon();
  } catch(e){ console.error('novaDis', olay, e); }
};

/* ---------------- yükle ---------------- */
const yukleyici = new GLTFLoader(); yukleyici.register(p => new VRMLoaderPlugin(p));
function yukle(){
  boyutla();
  const ilkVeri = TEST ? sahteEkranKur() : JSON.parse(DIS.simgeler());
  yuzeyleriKur(ilkVeri);
  DIS?.ayar(JSON.stringify({heryerde:!!AYAR.heryerde}));
  yukleyici.load('model/nova.wasm', gltf => {
    vrm = gltf.userData.vrm; vrm0 = vrm.meta?.metaVersion === '0';
    BASPARMAK_VRM1 = !!vrm.humanoid.getNormalizedBoneNode('leftThumbMetacarpal');
    VRMUtils.removeUnnecessaryVertices(gltf.scene); VRMUtils.rotateVRM0(vrm);
    gercekciYap(vrm);
    vrm.scene.traverse(o => {
      o.frustumCulled = false; if (!o.isMesh) return;
      const adlar = [].concat(o.material).map(m => m?.name || '').join(' ');
      for (const [parca, on] of Object.entries(KIYAFET_PARCA)) if (adlar.includes(on)){ (KIYAFET[parca] ||= []).push(o); o.visible = false; }
      for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial){ m.envMap = ORTAM; m.envMapIntensity = 0.55; m.needsUpdate = true; }
    });
    donus.add(vrm.scene);
    bedenUygula(vrm, {boyDahil:false});
    kiyafetUygula(depo.oku('nova-kiyafet', 'gunluk'));
    kokDinlenme.copy(vrm.humanoid.getNormalizedBoneNode('hips').position);
    vrm.scene.updateMatrixWorld(true);
    { const g = b => vrm.humanoid.getRawBoneNode(b).getWorldPosition(new THREE.Vector3());
      const kalca = g('leftUpperLeg'), diz = g('leftLowerLeg'), bilek = g('leftFoot');
      OTURMA_DUSUS = Math.max(0.2, kalca.y - (bilek.y + diz.distanceTo(bilek)));
      NOVA_BOY = g('head').y + 0.15; k = H/NOVA_BOY; }
    const em = vrm.expressionManager;
    for (const [a, adaylar] of Object.entries(IFADE)) ifadeAdlari[a] = adaylar.find(n => em?.getExpression(n));
    ziplaKlibiniOlc();
    vrm.lookAt && (vrm.lookAt.target = bakisHedefi);
    basla();
  }, undefined, e => console.error('Model yüklenemedi', e));
}
const bakisHedefi = new THREE.Object3D(); sahne.add(bakisHedefi);
function basla(){
  // nereden çıksın: Nova simgesinden; yoksa ekranın kenarından yürüyerek
  if (NOVA_SIMGE){ N.cikisSimge = NOVA_SIMGE; N.olcek = 0; const r = NOVA_SIMGE.kare; N.x = r.x + r.w/2; N.y = r.y + r.h*0.55; durumGec('cikis'); }
  else { const z = ZEMIN[ZEMIN.length - 1]; N.plat = z; N.y = z.y; N.x = EKRAN.w + H*0.4; git(z, EKRAN.w*0.7, () => { jestYap('el_salla'); soyle('Ben geldim!', 'mutlu'); bekle(3); }); N.plan.plat = z; N.x = z.x1; }
  setInterval(pilBak, 60000); pilBak();
  dongu();
}

/* ---------------- döngü ---------------- */
const saat = new THREE.Clock();
let sonKare = 0;
function dongu(){
  if (!gorunur && !TEST) return;
  const dt = Math.min(0.1, saat.getDelta());
  kare(dt);
  const hareketli = ['gidiyor', 'zipla', 'dus', 'tutuldu', 'cikis', 'giris', 'dans', 'cikiyor', 'kenaraGit'].includes(N.durum) || jest.ad || N.konusuyor;
  const fps = N.durum === 'bitti' ? 2 : N.durum === 'uyu' ? 8 : hareketli ? 30 : 18;
  setTimeout(() => requestAnimationFrame(dongu), Math.max(0, 1000/fps - 6));
}
function kare(dt){
  if (!vrm) return;
  if (N.durum === 'kenaraGit'){   // simgesi yoksa ekranın kenarından çıkar
    const fark = N.kenar - N.x; N.hedefYaw = Math.sign(fark)*1.2; const a = Math.min(Math.abs(fark), 0.55*k*dt)*Math.sign(fark); N.x += a; N.faz = (N.faz + Math.abs(a)/(KLIP.yuru.adim*k)) % 1;
    const p = klipOrnekle('yuru', N.faz*KLIP.yuru.sure); if (p._kok) p._kok = [0, p._kok[1], 0]; uygulaHepsi(p, dt);
    if (Math.abs(fark) < 2){ durumGec('bitti'); setTimeout(() => DIS?.eveGirdi(), 100); }
    return;
  }
  let poz = durumGuncelle(dt);
  if (!poz) poz = kopyala(DINLENME);
  uygulaHepsi(poz, dt);
}
function uygulaHepsi(poz, dt){
  // jest (üst beden)
  const j = jestPozu(dt); if (j) poz = ustKaristir(poz, j.p, j.w);
  // inişte diz bükülmesi
  if (N.inis > 0){ N.inis -= dt; const w = Math.max(0, N.inis/0.22); ekle(poz, '_kok', [0, -0.08*w, 0]); ekle(poz, 'rightUpperLeg', [-20*w, 0, 0]); ekle(poz, 'leftUpperLeg', [-20*w, 0, 0]); ekle(poz, 'rightLowerLeg', [40*w, 0, 0]); ekle(poz, 'leftLowerLeg', [40*w, 0, 0]); }
  // konuşurken / dinlerken kullanıcıya dönsün
  if (N.konusuyor || N.dinliyor) N.hedefYaw = 0;
  uygula({...DINLENME_EL, ...poz});
  N.yaw += (N.hedefYaw - N.yaw)*Math.min(1, dt*7);
  donus.rotation.y = N.yaw;
  kok.position.set(N.x/k, -N.y/k - (N.yOfs || 0)*N.olcek, 0);
  { // ayağının altındaki yüzeye düşen yumuşak gölge (havadayken küçülür)
    const alt = ['dus', 'zipla', 'tutuldu', 'cikis', 'giris', 'saklan', 'cikiyor'].includes(N.durum) ? altindakiYuzey(N.x, N.y - dp(2), false) : (N.plat || altindakiYuzey(N.x, N.y - dp(4), true));
    const yuk = alt ? Math.max(0, (alt.y - N.y)/H) : 9, g = Math.max(0, 1 - yuk*1.6)*N.olcek*(N.durum === 'saklan' ? 0 : 1);
    golge.visible = g > 0.02; if (alt){ golge.position.set(N.x/k, -alt.y/k + 0.012, -2); golge.scale.set((N.durum === 'uyu' ? 2.2 : 1)*(0.6 + 0.4*g), 0.6 + 0.4*g, 1); golge.material.opacity = g; } } kok.scale.setScalar(Math.max(0.001, N.olcek));
  if (!['saklan', 'cikiyor', 'cikis', 'giris'].includes(N.durum)) perde.visible = false;
  yuzGuncelle(dt);
  // bakış: kameraya (kullanıcıya), saklanırken yana
  bakisHedefi.position.set(N.x/k + (N.durum === 'saklan' ? Math.sin(N.t*1.6)*2 : 0), -N.y/k + NOVA_BOY*0.9, 6);
  vrm.update(dt);
  kameraGuncelle();
  renderer.render(sahne, kamera);
  pencereGuncelle();
  if (balonMetin){ if (performance.now()/1000 > balonBitis && !N.dinliyor) balon(''); else balonKonum(false); }
  if (AYAR.konuskan && N.durum === 'bekle' && performance.now()/1000 - sonYorum > arasi(200, 420)){ sonYorum = performance.now()/1000; kendiliginden(); }
}
function yuzGuncelle(dt){
  const em = vrm.expressionManager; if (!em) return;
  const simdi = performance.now()/1000;
  if (yuz.ifade && simdi > yuz.bitis) yuz.hedefW = 0;
  yuz.w += (yuz.hedefW - yuz.w)*Math.min(1, dt*6);
  for (const [a, ad] of Object.entries(ifadeAdlari)) if (ad) em.setValue(ad, a === yuz.ifade ? yuz.w : 0);
  // göz kırpma (uyurken kapalı)
  yuz.sonrakiGoz -= dt;
  if (yuz.sonrakiGoz <= 0){ yuz.goz = 0.16; yuz.sonrakiGoz = arasi(2, 6); }
  let kapali = 0; if (yuz.goz > 0){ yuz.goz -= dt; kapali = Math.sin((1 - yuz.goz/0.16)*Math.PI); }
  if (N.durum === 'uyu' && N.t > 1) kapali = 1;
  if (em.getExpression('blink')) em.setValue('blink', Math.min(1, kapali*(yuz.ifade === 'mutlu' ? 0.5 : 1)));
  // konuşurken ağız
  const agiz = N.konusuyor || platform.konusuyor ? 0.25 + 0.45*Math.abs(Math.sin(simdi*13)*Math.sin(simdi*4.7)) : 0;
  yuz.agiz += (agiz - yuz.agiz)*Math.min(1, dt*18);
  if (em.getExpression('aa')) em.setValue('aa', yuz.agiz);
}

yukle();
