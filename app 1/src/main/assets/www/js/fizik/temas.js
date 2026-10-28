'use strict';
/* =========================================================
   TEMAS — beden ile eşyalar iç içe geçmesin
   Nova'nın bedeni küre zinciriyle (kalça, gövde, baş, bacaklar, kollar) temsil edilir; eşyalar
   kendi parçalarının kutularıyla. Her karede:
   · katı eşya (yatak gövdesi, koltuk, masa, dolap, duvar, zemin): beden dışarı itilir
   · yumuşak eşya (şilte, yastık, battaniye, minder): biraz gömülmeye izin verilir, fazlası itilir
   · itilebilir eşya (küçük yastık, peluş, minder yastığı): eşya bedenin önünden kayar
   Ayaktayken yana itme gerçek yer değişimidir; otururken/yatarken yalnızca küçük bir düzeltmedir.
   ========================================================= */
const TEMAS = { diz:{left:{a:0, yon:new THREE.Vector3()}, right:{a:0, yon:new THREE.Vector3()}}, acik:true, kutular:[], itilir:[], yatayDuz:new THREE.Vector3(), olcum:{en:0, ad:''}, hazir:false };
const _m = new THREE.Matrix4(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

/* ---- eşya kutularını topla (oda düzeni değişince yeniden) ---- */
function temasKutulariKur(){
  TEMAS.kutular = []; TEMAS.itilir = [];
  const gruplar = Object.values(MOBILYA).filter(m => m.g !== bobin).map(m => m.g);   // bobin zeminle aynı hizada: zemin sayılır
  for (const g of gruplar){
    g.updateMatrixWorld(true);
    g.traverse(o => {
      if (o.userData.temas?.grup){ const b = new THREE.Box3().setFromObject(o); const inv = new THREE.Matrix4().copy(o.parent.matrixWorld).invert();
        TEMAS.itilir.push({o, kutuDunya:b, ilk:o.position.clone(), grup:true}); return; }
      if (!o.isMesh || !o.geometry || o.material?.userData?.temasYok || o.material?.isMeshBasicMaterial) return;
      let ust = o.parent; while (ust && !ust.userData.temas?.grup && ust !== g) ust = ust.parent;
      if (ust && ust.userData.temas?.grup) return;                              // gruba ait (peluş): grup olarak işlendi
      o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; const s = bb.getSize(_v1);
      const w = o.getWorldScale(_v2);
      const boy = [s.x*w.x, s.y*w.y, s.z*w.z].sort((a, b) => b - a);
      if (boy[0] < 0.06 || boy[1] < 0.015) return;                              // ince çubuk, kalem vb. yok say
      const t = o.userData.temas || {tur:'kati'};
      const k = {esya:Object.keys(MOBILYA).find(n => MOBILYA[n].g === g), o, min:bb.min.clone(), max:bb.max.clone(), tur:t.tur, derin:t.derin || 0, ilk:o.position.clone(), ters:new THREE.Matrix4()};
      if (t.tur === 'itilir') TEMAS.itilir.push(k); else TEMAS.kutular.push(k);
    });
  }
  TEMAS.hazir = true;
}
/* ---- beden küreleri ---- */
const TEMAS_ZINCIR = [   // [kemik, çocuk, yarıçap, örnek sayısı, kollar mı]
  ['hips', 'spine', 0.105, 2, false], ['spine', 'chest', 0.1, 2, false], ['chest', 'upperChest', 0.1, 1, false], ['upperChest', 'neck', 0.095, 1, false],
  ['head', null, 0.095, 1, false],
  ['leftUpperLeg', 'leftLowerLeg', 0.068, 3, false], ['rightUpperLeg', 'rightLowerLeg', 0.068, 3, false],
  ['leftLowerLeg', 'leftFoot', 0.05, 3, false], ['rightLowerLeg', 'rightFoot', 0.05, 3, false],
  ['leftFoot', 'leftToes', 0.04, 2, false], ['rightFoot', 'rightToes', 0.04, 2, false],
  ['leftUpperArm', 'leftLowerArm', 0.042, 2, true], ['rightUpperArm', 'rightLowerArm', 0.042, 2, true],
  ['leftLowerArm', 'leftHand', 0.036, 2, true], ['rightLowerArm', 'rightHand', 0.036, 2, true], ['leftHand', null, 0.04, 1, true], ['rightHand', null, 0.04, 1, true],
];
function bedenKureleri(){
  const h = vrm.humanoid, l = [];
  for (const [a, c, r, n, kol] of TEMAS_ZINCIR){
    const A = h.getRawBoneNode(a); if (!A) continue;
    const pa = A.getWorldPosition(new THREE.Vector3());
    if (a === 'head'){ const up = new THREE.Vector3(0, 0.085, 0.015).applyQuaternion(A.getWorldQuaternion(new THREE.Quaternion())); l.push({p:pa.add(up), r, kol, ad:a}); continue; }
    if (!c){ l.push({p:pa, r, kol, ad:a}); continue; }
    const C = h.getRawBoneNode(c); if (!C) continue; const pc = C.getWorldPosition(new THREE.Vector3());
    for (let i = 0; i < n; i++){ const t = n === 1 ? 0.5 : i/(n - 1)*0.85 + 0.075; l.push({p:pa.clone().lerp(pc, t), r, kol, ad:a}); }
  }
  return l;
}
/* küre ↔ yönlü kutu: dışarı itme vektörü (dünya) ya da null */
function kureKutu(k, p, r){
  _m.copy(k.o.matrixWorld); k.ters.copy(_m).invert();
  const yerel = _v1.copy(p).applyMatrix4(k.ters);
  const q = _v2.copy(yerel).clamp(k.min, k.max);
  if (!yerel.equals(q)){
    const qd = _v3.copy(q).applyMatrix4(_m); const d = p.clone().sub(qd), uz = d.length();
    if (uz >= r) return null; return d.multiplyScalar((r - uz)/Math.max(uz, 1e-6));
  }
  // merkez kutunun içinde: en yakın yüzeyden çık
  let en = Infinity, eksen = 0, isaret = 1;
  for (const [i, ad] of [[0, 'x'], [1, 'y'], [2, 'z']]){
    const a = yerel[ad] - k.min[ad], b = k.max[ad] - yerel[ad];
    if (a < en){ en = a; eksen = i; isaret = -1; } if (b < en){ en = b; eksen = i; isaret = 1; }
  }
  const yuz = yerel.clone(); const ad = ['x', 'y', 'z'][eksen]; yuz[ad] = isaret > 0 ? k.max[ad] : k.min[ad];
  const yd = yuz.applyMatrix4(_m); const d = yd.sub(p); const uz = d.length();
  return d.normalize().multiplyScalar(uz + r);
}
/* ---- her kare (dongu.js, beden güncellendikten sonra) ---- */
function temasCoz(dt){
  if (!TEMAS.acik || !vrm || tema !== 'oda'){ temasKok.position.multiplyScalar(Math.max(0, 1 - dt*4)); return; }
  if (!TEMAS.hazir) temasKutulariKur();
  vrm.scene.updateMatrixWorld(true);
  const kureler = bedenKureleri();
  const sabit = durus.w > 0.05 || akt.gecis || akt.durum === 'yapiyor';
  const dizTemas = {left:0, right:0};
  let yukari = 0; const yatay = new THREE.Vector3(); let enDerin = 0, enAd = '';
  const ekleYatay = v => { // eksen başına en büyük itmeyi al (toplamak titretir)
    for (const a of ['x', 'z']) if (Math.abs(v[a]) > Math.abs(yatay[a])) yatay[a] = v[a]; };
  for (const s of kureler){
    // zemin
    const zemin = (s.ad === 'hips' ? 0.06 : s.r*0.7) - s.p.y;   // eklem ile deri arası: yumuşak doku zemine biraz yaslanır if (zemin > 0 && !s.kol){ yukari = Math.max(yukari, zemin); }
    // duvarlar
    for (const [ad, deger, yon] of [['x', -2.58, 1], ['x', 2.58, -1], ['z', -2.28, 1]]){ const d = (s.p[ad] - deger)*yon; if (d < s.r && !s.kol){ const v = new THREE.Vector3(); v[ad] = (s.r - d)*yon; ekleYatay(v); } }
    if (s.kol) continue;
    // otururken/yatarken baldır ve ayaklar kökü oynatmaz (yoksa bacak koltuğun önüne değince Nova havalanır)
    if (sabit && /LowerLeg|Foot|Toes/.test(s.ad)){
      if (durus.tur !== 'oturma' && akt.ad !== 'yaz') continue;   // …onun yerine diz açılır, ayak eşyanın önüne çıkar
      const yan = s.ad.startsWith('left') ? 'left' : 'right';
      for (const k of TEMAS.kutular){ if (k.tur !== 'kati') continue; const v = kureKutu(k, s.p, s.r); if (!v) continue; v.y = 0;
        if (v.lengthSq() > 1e-6){ dizTemas[yan] = Math.max(dizTemas[yan], v.length()); TEMAS.diz[yan].yon.copy(v).normalize(); } }
      continue;
    }   // kollar katı eşyalarda bedeni itmez (yalnızca hafif eşyaları kaydırır)
    for (const k of TEMAS.kutular){
      const v = kureKutu(k, s.p, s.r); if (!v) continue;
      let boy = v.length(); if (k.tur === 'yumusak'){ boy -= k.derin; if (boy <= 0) continue; v.setLength(boy); }
      if (boy > enDerin){ enDerin = boy; enAd = s.ad + '@' + k.esya; }
      if (v.y > 0.6*boy){ if (sabit) yukari = Math.max(yukari, v.y); }   // aşağıdan: yalnızca otururken/yatarken bedeni kaldır (yürürken eşyanın üstüne çıkmasın)
      else ekleYatay(v);
    }
  }
  TEMAS.olcum.en = enDerin; TEMAS.olcum.ad = enAd;
  // dikey: hızlı kaldır, yavaş bırak (titremesin)
  const hedefY = temasKok.position.y + Math.min(sabit ? 0.06 : 0.25, yukari);
  if (yukari > 0.003) temasKok.position.y += (hedefY - temasKok.position.y)*Math.min(1, dt*14);
  else temasKok.position.y = Math.max(durus.w > 0.5 && (durus.tur === 'oturma' || durus.tur === 'yatma') ? -0.06 : 0, temasKok.position.y - dt*0.05);   // otururken/yatarken yüzeye otursun (havada kalmasın)
  if (sabit) temasKok.position.y = Math.min(0.1, temasKok.position.y);
  // yatay: ayaktayken gerçekten itilir, otururken/yatarken küçük düzeltme
  yatay.clampLength(0, 0.2);
  if (sabit){
    const yerel = yatay.clone().applyAxisAngle(_yukariEksen, -govde.rotation.y);
    TEMAS.yatayDuz.x += (TEMAS.yatayDuz.x + yerel.x - TEMAS.yatayDuz.x)*Math.min(1, dt*10);
    TEMAS.yatayDuz.z += (TEMAS.yatayDuz.z + yerel.z - TEMAS.yatayDuz.z)*Math.min(1, dt*10);
    TEMAS.yatayDuz.clampLength(0, 0.08);
    temasKok.position.x = TEMAS.yatayDuz.x; temasKok.position.z = TEMAS.yatayDuz.z;
  } else {
    TEMAS.yatayDuz.multiplyScalar(Math.max(0, 1 - dt*3)); temasKok.position.x = TEMAS.yatayDuz.x; temasKok.position.z = TEMAS.yatayDuz.z;
    if (yatay.lengthSq() > 1e-6) govde.position.addScaledVector(yatay, Math.min(1, dt*12));
  }
  // diz düzeltmesi: değiyorsa yavaşça aç, değmiyorsa geri bırak
  for (const yan of ['left', 'right']){ const D = TEMAS.diz[yan];
    D.a = dizTemas[yan] > 0.005 ? Math.min(0.9, D.a + dt*4) : Math.max(0, D.a - dt*0.6);
    if (!sabit) D.a = Math.max(0, D.a - dt*3);
    if (D.a > 0.001) dizAc(yan, D.a, D.yon); }
  // hafif eşyaları it (kollar dahil)
  for (const k of TEMAS.itilir) itilirGuncelle(k, kureler, dt);
}
const _yukariEksen = new THREE.Vector3(0, 1, 0);
function itilirGuncelle(k, kureler, dt){
  let it = new THREE.Vector3();
  if (k.grup){
    k.o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(k.o);
    for (const s of kureler){ const q = s.p.clone().clamp(b.min, b.max), d = q.clone().sub(s.p), uz = d.length(); if (uz < s.r){ d.y = 0; if (d.lengthSq() < 1e-8) d.set(1, 0, 0); it.add(d.setLength(s.r - uz)); } }
  } else {
    for (const s of kureler){ const v = kureKutu(k, s.p, s.r); if (v){ v.negate(); v.y = 0; it.add(v); } }
  }
  if (it.lengthSq() < 1e-7) return;
  it.clampLength(0, 0.05);
  // dünya itmesini ebeveyn uzayına çevir, ilk yerinden en fazla 40 cm uzaklaşsın
  const p = k.o.parent; const dun = k.o.getWorldPosition(new THREE.Vector3()).add(it);
  const yerel = p.worldToLocal(dun); yerel.y = k.o.position.y;
  const fark = yerel.clone().sub(k.ilk); if (fark.length() > 0.4) yerel.copy(k.ilk).add(fark.setLength(0.4));
  k.o.position.lerp(yerel, Math.min(1, dt*12));
  k.kirli = true;
}
/* yataktan kalkınca dağılan yastıklar yavaşça yerine (yatağı toplar) */
function itilirToparla(sure = 1.8){
  const bas = performance.now()/1000, liste = TEMAS.itilir.filter(k => k.kirli).map(k => ({k, p0:k.o.position.clone()}));
  if (!liste.length) return;
  const adim = () => { const u = Math.min(1, (performance.now()/1000 - bas)/sure);
    for (const {k, p0} of liste) k.o.position.lerpVectors(p0, k.ilk, yumusak(u));
    if (u < 1) requestAnimationFrame(adim); else for (const {k} of liste) k.kirli = false; };
  requestAnimationFrame(adim);
}
/* baldırı diz ekseninde, ayak 'yon'a doğru gidecek biçimde döndür (dünya uzayında) */
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
function dizAc(yan, a, yon){
  const h = vrm.humanoid, diz = h.getRawBoneNode(yan + 'LowerLeg'), ayak = h.getRawBoneNode(yan + 'Foot'); if (!diz || !ayak) return;
  const kp = diz.getWorldPosition(new THREE.Vector3()), v = ayak.getWorldPosition(new THREE.Vector3()).sub(kp);
  const eksen = new THREE.Vector3().crossVectors(v, yon); if (eksen.lengthSq() < 1e-8) return; eksen.normalize();
  const R = _q1.setFromAxisAngle(eksen, a), P = diz.parent.getWorldQuaternion(_q2);
  // yerel' = P⁻¹ · R · P · yerel
  diz.quaternion.premultiply(P.clone().invert().multiply(R).multiply(P));
  diz.updateMatrixWorld(true);
}
