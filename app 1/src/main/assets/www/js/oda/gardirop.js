'use strict';
/* =========================================================
   GARDIROP — kıyafetler, dolap, değişim animasyonu
   Kıyafet = gövde dokusu takımı (bedene işlenmiş parçalar) + 3B parçalar (bluz, pantolon/şort, etek, ayakkabı, kolye).
   Değişimde baştan aşağı ışıklı bir tarama çizgisi geçer: çizginin üstü yeni kıyafet, altı eski.
   ========================================================= */
/* ---- tarama çizgisiyle değiş ---- */
function kiyafetDegisimi(ad, sure = 1.9){
  return new Promise(async res => {
    const T = KIYAFET_TANIM[ad], E = KIYAFET_TANIM[giyim.simdi];
    const [map, ek] = await Promise.all([giyimDokuYukle(T.govde, true), giyimDokuYukle(T.ek, false)]);
    const gl = govdeMalzemeleri(); if (!gl.length || !map){ await kiyafetUygula(ad); return res(true); }
    GECIS.eskiHarita.value = gl[0].map; for (const g of gl){ g.map = map; g.needsUpdate = true; }
    const giden = E.parcalar.filter(p => !T.parcalar.includes(p)), gelen = T.parcalar.filter(p => !E.parcalar.includes(p));
    const altDegisir = T.parcalar.includes('alt') && E.parcalar.includes('alt') && T.alt !== E.alt;
    for (const p of giden) parcaModu(p, 1);
    for (const p of gelen){ kiyafetGoster(p, true); parcaModu(p, 2); }
    const ust = govde.position.y + 1.72, alt = govde.position.y - 0.05, bas = performance.now()/1000;
    let ortaYapildi = false;
    GECIS.aktif.value = 1; GECIS.esik.value = GECIS.esikA.value = ust; GECIS.yonU.value = GECIS.yonA.value = 1;
    const adim = () => {
      const u = Math.min(1, (performance.now()/1000 - bas)/sure);
      GECIS.esik.value = GECIS.esikA.value = ust + (alt - ust)*yumusak(u);
      if (!ortaYapildi && GECIS.esik.value < govde.position.y + 0.95){ ortaYapildi = true; if (ek) for (const g of gl){ g.roughnessMap = ek; g.needsUpdate = true; } if (altDegisir) altTuru(T.alt); kiyafetBoyasi?.(T.ozel); }
      if (u < 1) return requestAnimationFrame(adim);
      GECIS.aktif.value = 0; GECIS.eskiHarita.value = map;
      for (const p of giden){ kiyafetGoster(p, false); parcaModu(p, 0); }
      for (const p of gelen) parcaModu(p, 0);
      if (!ortaYapildi){ if (ek) for (const g of gl) g.roughnessMap = ek; altTuru(T.alt); }
      if (!T.parcalar.includes('alt')) altTuru(null);
      else if (!altDegisir) altTuru(T.alt);
      kiyafetBoyasi?.(T.ozel);
      giyim.simdi = ad; depo.yaz('nova-kiyafet', ad); arayuzGiyim?.();
      res(true);
    };
    requestAnimationFrame(adim);
  });
}

/* ---- dolap (sol duvarda, yatağın ayak ucuyla koltuk arasında; kapak arkaya, yatağa doğru açılır) ---- */
const DOLAP = { x:-2.33, z:0.29, gen:0.66, der:0.48, yuk:1.95 };
const dolap = new THREE.Group(); dolap.position.set(DOLAP.x, 0, DOLAP.z); oda.add(dolap);
{
  const W = DOLAP.gen, D = DOLAP.der, H = DOLAP.yuk;
  const al = M(0xffffff, {doku:'aluminyum', normal:0.12, metal:true, yansima:1});
  const ic = M(0xffffff, {doku:'kalkan', tekrar:[2, 4], metal:true, yansima:1});
  kutu(D, 0.03, W, al, 0, 0.015, 0, dolap); kutu(D, 0.03, W, al, 0, H - 0.015, 0, dolap);
  kutu(D, H, 0.02, al, 0, H/2, -W/2 + 0.01, dolap); kutu(D, H, 0.02, al, 0, H/2, W/2 - 0.01, dolap);
  kutu(0.015, H, W, ic, -D/2 + 0.008, H/2, 0, dolap);
  kutu(D - 0.04, 0.02, W - 0.04, al, 0, 0.32, 0, dolap);                                   // alt raf
  silindir(0.008, 0.008, W - 0.04, al, 0, H - 0.2, 0, dolap, {rx:Math.PI/2});              // askı borusu
  kutu(0.012, 0.012, W - 0.06, new THREE.MeshBasicMaterial({color:0xe8f6ff}), D/2 - 0.04, H - 0.05, 0, dolap, {golge:false});
  const icIsik = new THREE.PointLight(0xe8f6ff, 0, 1.6, 1.6); icIsik.position.set(0.05, H - 0.25, 0); dolap.add(icIsik); DOLAP.isik = icIsik;
  // askıdaki kıyafetler (kenardan görünür) — renkleri gardıroptaki kıyafetlerden
  const ASKI = [['#e3b3bf', 0.82], ['#c7b6e6', 0.72], ['#b8a1e3', 0.38], ['#2e3036', 0.7], ['#f2ede8', 0.55], ['#dca3b0', 0.4]];
  ASKI.forEach(([renk, boy], i) => {
    const z = -W/2 + 0.08 + i*(W - 0.16)/(ASKI.length - 1);
    const a = new THREE.Group(); a.position.set(0, H - 0.2, z); a.rotation.x = (i % 2 ? 0.04 : -0.03); dolap.add(a);
    mesh(new THREE.TorusGeometry(0.012, 0.002, 6, 12, Math.PI), al, 0, 0.0, 0, a, {golge:false});
    kutu(0.32, 0.006, 0.006, al, 0, -0.04, 0, a, {golge:false});
    yuvarlak(0.34, boy, 0.035, 0.015, M(new THREE.Color(renk), {doku:'keten', tekrar:[1, 2], normal:0.5}), 0, -0.045 - boy/2, 0, a);
  });
  // alt rafta katlanmış kıyafetler ve spor ayakkabı
  yuvarlak(0.3, 0.06, 0.26, 0.02, M(0xc7b6e6, {doku:'keten'}), 0.02, 0.37, -0.15, dolap);
  yuvarlak(0.3, 0.06, 0.26, 0.02, M(0xdca3b0, {doku:'keten'}), 0.02, 0.43, -0.15, dolap);
  for (const z of [0.1, 0.2]) yuvarlak(0.26, 0.08, 0.09, 0.03, M(0xf4f2ee, {r:0.6}), 0.02, 0.07, z, dolap);
  // etiket: "NOVA · DEPOLAMA"
  mesh(new THREE.PlaneGeometry(0.36, 0.05), new THREE.MeshBasicMaterial({transparent:true, map:tuvalDoku(512, 72, (g) => { g.fillStyle = '#5b6068'; g.font = '700 34px monospace'; g.fillText('NOVA · DEPOLAMA  512GB', 14, 48); })}),
    D/2 + 0.002, H - 0.06, 0, dolap, {ry:Math.PI/2, golge:false});
  // kapak: menteşe arkada (z = -W/2), yatağa doğru açılır → Nova kapağın önünde, görünür kalır
  const mentese = new THREE.Group(); mentese.position.set(D/2, 0, -W/2); dolap.add(mentese); DOLAP.kapak = mentese;
  const cam = new THREE.MeshPhysicalMaterial({color:0xcfe6ff, roughness:0.05, metalness:0, transmission:0.85, thickness:0.01, transparent:true, opacity:0.35, envMap:ORTAM, envMapIntensity:1, side:THREE.DoubleSide, depthWrite:false});
  mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.08), cam, 0.012, H/2, W/2, mentese, {ry:Math.PI/2, golge:false});
  for (const [zz, hh, ww] of [[0.015, H, 0.03], [W - 0.015, H, 0.03]]) kutu(0.025, hh, ww, al, 0.012, H/2, zz, mentese);
  for (const yy of [0.015, H - 0.015]) kutu(0.025, 0.03, W, al, 0.012, yy, W/2, mentese);
  kutu(0.03, 0.42, 0.02, al, 0.04, 1.05, W - 0.06, mentese);                                // kulp
}
ENGEL.push({k:[DOLAP.x - DOLAP.der/2, DOLAP.x + DOLAP.der/2 + 0.02, DOLAP.z - DOLAP.gen/2, DOLAP.z + DOLAP.gen/2]});
let kapakHedef = 0, kapakAci = 0;
function dolapKare(dt){
  kapakAci += (kapakHedef - kapakAci)*Math.min(1, dt*5);
  DOLAP.kapak.rotation.y = kapakAci;
  DOLAP.isik.intensity = Math.min(1, kapakAci/1.2)*0.9;
}
const DOLAP_DUR = [DOLAP.x + DOLAP.der/2 + 0.5, DOLAP.z + 0.05];

/* ---- kıyafet değiştirme koreografisi: dolaba git, kapağı aç, al, sana dön, değiş, kapağı kapat ---- */
const GIYIN_HAREKET = {
  kapak: { kareler:[{t:0, poz:'dinlenme'}, {t:0.45, poz:{rightUpperArm:[0, 62, 30], rightLowerArm:[0, 18, 0], spine:[4, 0, 0], head:[6, 0, 0]}}, {t:0.75, poz:{rightUpperArm:[0, 40, 42], rightLowerArm:[0, 30, 0]}}, {t:1, poz:'dinlenme'}] },
  al: { kareler:[{t:0, poz:'dinlenme'}, {t:0.4, poz:{rightUpperArm:[0, 78, 0], rightLowerArm:[0, 12, 0], leftUpperArm:[0, -70, -6], leftLowerArm:[0, -14, 0], spine:[10, 0, 0], chest:[4, 0, 0], head:[8, 0, 0]}},
                                          {t:0.7, poz:{rightUpperArm:[0, 62, 26], rightLowerArm:[0, 70, 0], leftUpperArm:[0, -62, -26], leftLowerArm:[0, -70, 0], spine:[2, 0, 0], head:[14, 0, 0]}}, {t:1, poz:{rightUpperArm:[0, 55, 40], rightLowerArm:[0, 80, 0], leftUpperArm:[0, -55, -40], leftLowerArm:[0, -80, 0], spine:[0, 0, 0], head:[10, 0, 0]}}] },
  bak: { kareler:[{t:0, poz:{rightUpperArm:[0, 55, 40], rightLowerArm:[0, 80, 0], leftUpperArm:[0, -55, -40], leftLowerArm:[0, -80, 0]}}, {t:0.25, poz:{rightUpperArm:[0, -8, 52], rightLowerArm:[0, 14, 0], leftUpperArm:[0, 8, -52], leftLowerArm:[0, -14, 0], head:[22, 0, 0], neck:[8, 0, 0], spine:[-2, 0, 0]}},
                 {t:0.6, poz:{head:[18, -14, -4], hips:[0, -8, 0]}}, {t:0.8, poz:{head:[10, 10, 4], hips:[0, 8, 0]}}, {t:1, poz:'dinlenme'}] },
};
async function kiyafetGiy(ad){
  if (!KIYAFET_TANIM[ad]) throw new Error(`"${ad}" diye bir kıyafet yok`);
  if (!vrm || giyim.mesgul) return false;
  if (ad === giyim.simdi) return true;
  giyim.mesgul = true; const tok = ++giyim.token;
  try {
    if (tema !== 'oda'){ if (akt.ad) await aktiviteBitir(); else if (durus.w > 0.02) await durusAyarla('ayakta'); await kiyafetElle(ad); return true; }
    if (akt.ad) await aktiviteBitir();
    const vardi = await git(DOLAP_DUR[0], DOLAP_DUR[1], 'serbest'); if (!vardi || tok !== giyim.token) return false;
    await don(MOBILYA.dolap.dolapYon ?? -Math.PI/2);
    oynatici.oynat('dolabı aç', hazirla(GIYIN_HAREKET.kapak), {sure:1.3}); await bekle(0.55); kapakHedef = 1.75; await bekle(0.8);
    oynatici.oynat('kıyafeti al', hazirla(GIYIN_HAREKET.al), {sure:1.6}); await bekle(0.95);
    if (ad !== 'ic') eldekiKiyafet(ad); await bekle(0.65);
    await don(kameraYonu());
    await kiyafetElle(ad);
    oynatici.oynat('kendine bak', hazirla(GIYIN_HAREKET.bak), {sure:2.2});
    ifadeAyarla('mutlu', 0.8); setTimeout(() => ifadeAyarla(null), 2500); await bekle(1.4);
    await bekle(0.6);
    await don(MOBILYA.dolap.dolapYon ?? -Math.PI/2);
    oynatici.oynat('dolabı kapat', hazirla(GIYIN_HAREKET.kapak), {sure:1.2}); await bekle(0.5); kapakHedef = 0; await bekle(0.7);
    await don(kameraYonu());
    return true;
  } finally { giyim.mesgul = false; eldekiKiyafet(null); if (GECIS.aktif.value && !giyim.elle) GECIS.aktif.value = 0; if (kapakHedef && tok === giyim.token) setTimeout(() => kapakHedef = 0, 400); }
}

/* =========================================================
   ELLERİYLE GİYİNME
   Üst beden ve alt beden ayrı ayrı, Nova'nın elleriyle birlikte değişir:
   · üst: kazağı başından geçirir (gerçek kayıt) → yeni kıyafet elleri indikçe başından beline iner
   · alt: eğilir, önce bir bacağını sonra öbürünü sokar, belinden çeker → yeni alt, elleri yükseldikçe ayaklarından beline çıkar
   · elbise: elbiseyi başından geçirir, sonra kalçasından aşağı çeker
   · soyunurken (iç çamaşırı) tersi: önce altını indirir, sonra üstünü başından çıkarır
   Çizgi (ışıklı tarama) ellerin yüksekliğini izler; zamanla da ilerler ki el görünmese de takılmasın.
   ========================================================= */
const KIYAFET_RENK = { gunluk:'#c7b6e6', elbise:'#e3b3bf', ev:'#dca3b0', pijama:'#c7b6e6', spor:'#2e3036', ic:'#f2ede8' };
let elKiyafet = null;
function eldekiKiyafet(ad){
  if (elKiyafet){ elKiyafet.parent?.remove(elKiyafet); elKiyafet.geometry.dispose(); elKiyafet.material.dispose(); elKiyafet = null; }
  if (!ad || !vrm) return;
  const T = KIYAFET_TANIM[ad] || {}, renk = T.ozel?.ust || T.ozel?.alt || KIYAFET_RENK[ad] || KIYAFET_RENK[T.ozel?.temel] || '#d8cfee';
  elKiyafet = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.05, 0.15, 3, 0.02), new THREE.MeshPhysicalMaterial({color:renk, roughness:0.85, sheen:0.4, sheenColor:new THREE.Color(1, 1, 1), envMap:ORTAM, envMapIntensity:0.5}));
  const el = vrm.humanoid.getRawBoneNode('rightHand'); el.add(elKiyafet);
  elKiyafet.position.set(vrm0 ? -0.06 : 0.06, -0.035, 0.02); elKiyafet.castShadow = true;
}
const elYuksekligi = () => { const v = new THREE.Vector3(); let t = 0; for (const b of ['leftHand', 'rightHand']) t += vrm.humanoid.getRawBoneNode(b).getWorldPosition(v).y; return t/2; };
const kemikY = b => vrm.humanoid.getRawBoneNode(b).getWorldPosition(new THREE.Vector3()).y;
/* klibi kare dizisine çevir (tersten de oynatılabilsin) */
function klipKareleri(ad, ters){
  const K = KLIP[ad], n = 30, l = [];
  for (let i = 0; i <= n; i++){ const t = (ters ? 1 - i/n : i/n)*K.sure; l.push({t:i/n, poz:{...kopyala(DINLENME), ...klipOrnekle(ad, t, {yalnizUst:true})}}); }
  return l;
}
const PANTOLON_GIY = { kareler:[
  {t:0, poz:'dinlenme'},
  {t:0.14, poz:{spine:[28, 0, 0], chest:[10, 0, 0], neck:[8, 0, 0], rightUpperArm:[0, 40, 66], leftUpperArm:[0, -40, -66], rightLowerArm:[0, 15, 0], leftLowerArm:[0, -15, 0], rightUpperLeg:[-14, 0, 2], leftUpperLeg:[-14, 0, -2], rightLowerLeg:[24, 0, 0], leftLowerLeg:[24, 0, 0], _kok:[0, -0.045, 0]}},
  {t:0.28, poz:{rightUpperLeg:[-58, 0, 4], rightLowerLeg:[78, 0, 0], rightFoot:[-10, 0, 0]}},
  {t:0.40, poz:{rightUpperLeg:[-14, 0, 2], rightLowerLeg:[24, 0, 0], rightFoot:[0, 0, 0]}},
  {t:0.52, poz:{leftUpperLeg:[-58, 0, -4], leftLowerLeg:[78, 0, 0], leftFoot:[-10, 0, 0]}},
  {t:0.64, poz:{leftUpperLeg:[-14, 0, -2], leftLowerLeg:[24, 0, 0], leftFoot:[0, 0, 0]}},
  {t:0.84, poz:{spine:[10, 0, 0], chest:[4, 0, 0], neck:[2, 0, 0], rightUpperArm:[0, 26, 68], leftUpperArm:[0, -26, -68], rightLowerArm:[0, 34, 0], leftLowerArm:[0, -34, 0], rightUpperLeg:[0, 0, 0], leftUpperLeg:[0, 0, 0], rightLowerLeg:[0, 0, 0], leftLowerLeg:[0, 0, 0], _kok:[0, 0, 0]}},
  {t:1, poz:{spine:[0, 0, 0], chest:[0, 0, 0], neck:[0, 0, 0], rightUpperArm:[0, 12, 72], leftUpperArm:[0, -12, -72], rightLowerArm:[0, 42, 0], leftLowerArm:[0, -42, 0]}},
]};
const ETEK_CEK = { kareler:[
  {t:0, poz:{rightUpperArm:[0, 14, 70], leftUpperArm:[0, -14, -70], rightLowerArm:[0, 38, 0], leftLowerArm:[0, -38, 0]}},
  {t:0.55, poz:{spine:[22, 0, 0], chest:[6, 0, 0], rightUpperArm:[0, 30, 68], leftUpperArm:[0, -30, -68], rightLowerArm:[0, 8, 0], leftLowerArm:[0, -8, 0], rightUpperLeg:[-8, 0, 0], leftUpperLeg:[-8, 0, 0], rightLowerLeg:[14, 0, 0], leftLowerLeg:[14, 0, 0]}},
  {t:1, poz:'dinlenme'},
]};
const tersKareler = k => k.map(x => ({t:1 - x.t, poz:x.poz})).reverse();
/* bir aşama: hareketi oynat, her karede çizgiyi güncelle */
function giyinmeAsamasi(ad, kareler, sure, guncelle){
  return new Promise(res => {
    oynatici.oynat(ad, kareler, {sure, tut:true});
    const bas = performance.now()/1000;
    const adim = () => {
      const u = Math.min(1, (performance.now()/1000 - bas)/sure);
      try { guncelle(u, elYuksekligi()); } catch(e){}
      if (u < 1) requestAnimationFrame(adim); else res();
    };
    requestAnimationFrame(adim);
  });
}
async function kiyafetElle(ad){
  const T = KIYAFET_TANIM[ad], E = KIYAFET_TANIM[giyim.simdi];
  const [map, ek] = await Promise.all([giyimDokuYukle(T.govde, true), giyimDokuYukle(T.ek, false)]);
  const gl = govdeMalzemeleri(); if (!gl.length || !map){ eldekiKiyafet(null); return kiyafetDegisimi(ad); }
  giyim.elle = true;
  const zemin = govde.position.y - 0.06, bel = kemikY('hips') + 0.1, tepe = kemikY('head') + 0.2;
  const ustP = ['ust', 'kolye'], altP = ['alt', 'etek', 'ayakkabi'];
  const giden = E.parcalar.filter(p => !T.parcalar.includes(p)), gelen = T.parcalar.filter(p => !E.parcalar.includes(p));
  const soyunma = ad === 'ic', elbise = T.parcalar.includes('etek');
  GECIS.eskiHarita.value = gl[0].map; for (const g of gl){ g.map = map; g.needsUpdate = true; }
  for (const p of giden) parcaModu(p, 1);
  for (const p of gelen){ kiyafetGoster(p, true); parcaModu(p, 2); }
  // başlangıç: her iki bölge de eski
  if (soyunma){ GECIS.yonU.value = -1; GECIS.esik.value = bel; GECIS.yonA.value = 1; GECIS.esikA.value = bel; }
  else { GECIS.yonU.value = 1; GECIS.esik.value = tepe + 0.1; GECIS.yonA.value = elbise ? 1 : -1; GECIS.esikA.value = elbise ? bel : zemin; }
  GECIS.aktif.value = 1;
  let tepeyeCikti = false, ortaYapildi = false;
  const orta = () => { if (ortaYapildi) return; ortaYapildi = true; if (ek) for (const g of gl){ g.roughnessMap = ek; g.needsUpdate = true; } kiyafetBoyasi?.(T.ozel); };
  const ust = async () => {
    const klip = (elbise || E.parcalar.includes('etek')) ? 'giy_elbise' : 'giy_ust', sure = KLIP[klip].sure;
    eldekiKiyafet(null);
    if (!soyunma){
      tepeyeCikti = false;
      await giyinmeAsamasi('giyin (üst)', klipKareleri(klip), sure, (u, eY) => {
        if (eY > kemikY('head') - 0.05) tepeyeCikti = true;
        const zaman = tepe - (tepe - bel)*yumusak(sinirla01((u - 0.3)/0.6));
        GECIS.esik.value = Math.max(bel - 0.05, Math.min(GECIS.esik.value, zaman, tepeyeCikti ? eY + 0.1 : Infinity));
      });
      GECIS.esik.value = bel - 0.3;
    } else {
      await giyinmeAsamasi('soyun (üst)', klipKareleri('giy_ust', true), KLIP.giy_ust.sure, (u, eY) => {
        const zaman = bel + (tepe - bel)*yumusak(sinirla01((u - 0.15)/0.6));
        GECIS.esik.value = Math.min(tepe + 0.1, Math.max(GECIS.esik.value, Math.min(zaman, eY + 0.05)));
      });
      GECIS.esik.value = tepe + 0.3;
    }
    orta();
  };
  const alt = async () => {
    if (T.parcalar.includes('alt') && E.parcalar.includes('alt') && T.alt !== E.alt) altTuru(T.alt);
    if (soyunma){
      await giyinmeAsamasi('soyun (alt)', tersKareler(hazirla(PANTOLON_GIY)), 3.2, (u, eY) => {
        const zaman = bel - (bel - zemin)*yumusak(sinirla01((u - 0.05)/0.75));
        GECIS.esikA.value = Math.max(zemin - 0.05, Math.min(GECIS.esikA.value, Math.max(zaman, eY - 0.05)));
      });
      GECIS.esikA.value = zemin - 0.3;
    } else if (elbise){
      await giyinmeAsamasi('elbiseyi indir', hazirla(ETEK_CEK), 1.7, (u, eY) => {
        const zaman = bel - (bel - zemin)*yumusak(sinirla01(u/0.85));
        GECIS.esikA.value = Math.min(GECIS.esikA.value, Math.max(zaman, Math.min(bel, eY - 0.25)));
      });
      GECIS.esikA.value = zemin - 0.3;
    } else {
      await giyinmeAsamasi('giyin (alt)', hazirla(PANTOLON_GIY), 3.6, (u, eY) => {
        const zaman = zemin + (bel - zemin)*yumusak(sinirla01((u - 0.12)/0.85));
        GECIS.esikA.value = Math.min(bel + 0.05, Math.max(GECIS.esikA.value, Math.min(zaman, eY + 0.06)));
      });
      GECIS.esikA.value = bel + 0.4;
    }
  };
  try {
    if (soyunma){ await alt(); await ust(); } else { await ust(); await alt(); }
  } finally {
    oynatici.dur();
    GECIS.aktif.value = 0; GECIS.eskiHarita.value = map; GECIS.yonU.value = GECIS.yonA.value = 1;
    for (const p of giden){ kiyafetGoster(p, false); parcaModu(p, 0); }
    for (const p of gelen) parcaModu(p, 0);
    orta();
    if (!T.parcalar.includes('alt')) altTuru(null); else altTuru(T.alt);
    kiyafetBoyasi?.(T.ozel);
    giyim.simdi = ad; depo.yaz('nova-kiyafet', ad); arayuzGiyim?.();
    giyim.elle = false;
  }
}
const sinirla01 = x => Math.max(0, Math.min(1, x));

/* ---- ayarlar düğmeleri ---- */
function arayuzGiyim(){
  const kap = $('kiyafetler'); if (!kap) return;
  kap.innerHTML = '';
  for (const [k, T] of Object.entries(KIYAFET_TANIM)){
    if (k.startsWith('__')) continue;
    const b = document.createElement('button'); b.className = 'cip'; b.dataset.k = k; b.textContent = T.ad;
    b.onclick = () => calistir([{kiyafet:k}], {kaynak:'arayuz'}).catch(e => sohbetEkle('sistem', e.message));
    kap.appendChild(b);
  }
  for (const b of kap.children) b.setAttribute('aria-pressed', b.dataset.k === giyim.simdi);
}
function giyimMetni(){
  return `KIYAFETİN: şu an "${KIYAFET_TANIM[giyim.simdi].ad}" giyiyorsun. Gardırobun sol duvarda, yatağının ayak ucunda (alüminyum, cam kapaklı). Giyebileceklerin: ${Object.entries(KIYAFET_TANIM).filter(([k]) => !k.startsWith('__')).map(([k, T]) => `${k} (${T.ad})`).join(', ')}. Değiştirmek için "kiyafet" alanını kullan; dolaba gider, kapağı açar ve kapağın önünde değişirsin.`;
}
