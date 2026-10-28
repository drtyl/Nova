'use strict';
/* =========================================================
   KARAKTER ADAPTÖRÜ — VRM ya da düz GLB (gerçekçi modeller) aynı arayüzle çalışır.
   Motorun beklediği arayüz (VRM ile aynı):
     humanoid.getNormalizedBoneNode(ad) · humanoid.getRawBoneNode(ad) · humanoid.humanBones
     expressionManager.getExpression(ad) / setValue(ad, değer)
     lookAt.lookAt(dünyaKonumu) · update(dt) · scene · meta.metaVersion
   ========================================================= */

/* VRM 1.0 başparmak adları VRM 0.x'ten farklıdır; veriler VRM 0.x adlarıyla yazıldı. */
let BASPARMAK_VRM1 = false;
const BASPARMAK_CEVIR = { ThumbProximal:'ThumbMetacarpal', ThumbIntermediate:'ThumbProximal', ThumbDistal:'ThumbDistal' };
function kemikAdi(b){
  if (!BASPARMAK_VRM1 || !b.includes('Thumb')) return b;
  const m = b.match(/^(left|right)(Thumb\w+)$/); return m ? m[1] + (BASPARMAK_CEVIR[m[2]] || m[2]) : b;
}

/* Mixamo / Avaturn / MetaPerson / Ready Player Me tarzı kemik adları → insan kemiği adları */
const KEMIK_ESLE = (() => {
  const t = { hips:'hips', pelvis:'hips', spine:'spine', spine1:'chest', spine2:'upperChest', chest:'chest', upperchest:'upperChest', neck:'neck', head:'head', lefteye:'leftEye', righteye:'rightEye' };
  for (const [y, Y] of [['left','Left'], ['right','Right']]){
    Object.assign(t, {
      [y+'shoulder']:y+'Shoulder', [y+'clavicle']:y+'Shoulder', [y+'arm']:y+'UpperArm', [y+'upperarm']:y+'UpperArm', [y+'forearm']:y+'LowerArm', [y+'lowerarm']:y+'LowerArm', [y+'hand']:y+'Hand',
      [y+'upleg']:y+'UpperLeg', [y+'upperleg']:y+'UpperLeg', [y+'thigh']:y+'UpperLeg', [y+'leg']:y+'LowerLeg', [y+'lowerleg']:y+'LowerLeg', [y+'calf']:y+'LowerLeg', [y+'foot']:y+'Foot', [y+'toebase']:y+'Toes', [y+'toes']:y+'Toes',
    });
    const parmak = { thumb:'Thumb', index:'Index', middle:'Middle', ring:'Ring', pinky:'Little', little:'Little' };
    for (const [k, P] of Object.entries(parmak)){
      const adlar = P === 'Thumb' ? ['Proximal','Intermediate','Distal'] : ['Proximal','Intermediate','Distal'];
      adlar.forEach((a, i) => { t[y+'hand'+k+(i+1)] = y+P+a; t[y+k+(i+1)] = y+P+a; });
    }
  }
  return t;
})();
const sadeAd = n => String(n).toLowerCase().replace(/^.*mixamorig:?/, '').replace(/^(armature|rig|root)[_:|.]/, '').replace(/[^a-z0-9]/g, '');

/* ARKit / Oculus viseme karışım şekilleri → motorun ifade adları */
const IFADE_ESLE = {
  blink:[['eyeBlinkLeft',1],['eyeBlinkRight',1],['blink',1],['eyesClosed',1]],
  blinkLeft:[['eyeBlinkLeft',1]], blinkRight:[['eyeBlinkRight',1]],
  aa:[['viseme_aa',1]], ih:[['viseme_I',1]], ou:[['viseme_U',1]], ee:[['viseme_E',1]], oh:[['viseme_O',1]],
  happy:[['mouthSmileLeft',0.85],['mouthSmileRight',0.85],['cheekSquintLeft',0.5],['cheekSquintRight',0.5],['eyeSquintLeft',0.3],['eyeSquintRight',0.3],['mouthSmile',1]],
  angry:[['browDownLeft',0.9],['browDownRight',0.9],['mouthPressLeft',0.5],['mouthPressRight',0.5],['noseSneerLeft',0.35],['noseSneerRight',0.35]],
  sad:[['browInnerUp',0.8],['mouthFrownLeft',0.7],['mouthFrownRight',0.7],['mouthShrugLower',0.3]],
  relaxed:[['mouthSmileLeft',0.35],['mouthSmileRight',0.35],['eyeSquintLeft',0.25],['eyeSquintRight',0.25]],
  surprised:[['browInnerUp',0.9],['browOuterUpLeft',0.8],['browOuterUpRight',0.8],['eyeWideLeft',0.7],['eyeWideRight',0.7],['jawOpen',0.3]],
};
// viseme yoksa ARKit ağız şekilleriyle yaklaşık ağız
const AGIZ_YEDEK = { aa:[['jawOpen',0.65],['mouthOpen',0.6]], ih:[['jawOpen',0.2],['mouthStretchLeft',0.35],['mouthStretchRight',0.35]], ou:[['mouthPucker',0.8],['jawOpen',0.15]], ee:[['jawOpen',0.25],['mouthSmileLeft',0.25],['mouthSmileRight',0.25]], oh:[['mouthFunnel',0.7],['jawOpen',0.4]] };

/* Kolları T-pozuna getir: motorun açıları T-poz dinlenmesine göre yazıldı (A-pozlu modeller için) */
function tPozunaGetir(kemik){
  const v = new THREE.Vector3(), w = new THREE.Vector3(), q = new THREE.Quaternion(), pq = new THREE.Quaternion();
  for (const [ust, alt, el, yon] of [['leftUpperArm','leftLowerArm','leftHand',1], ['rightUpperArm','rightLowerArm','rightHand',-1]]){
    for (const [a, b] of [[ust, alt], [alt, el]]){
      const A = kemik[a], B = kemik[b]; if (!A || !B) continue;
      A.updateWorldMatrix(true, true);
      A.getWorldPosition(v); B.getWorldPosition(w);
      const simdi = w.sub(v).normalize(), hedef = new THREE.Vector3(yon, 0, 0);
      if (simdi.dot(hedef) > 0.995) continue;
      q.setFromUnitVectors(simdi, hedef);
      A.parent.getWorldQuaternion(pq);
      const dunyaQ = A.getWorldQuaternion(new THREE.Quaternion());
      A.quaternion.copy(pq.clone().invert().multiply(q.multiply(dunyaQ)));
      A.updateWorldMatrix(true, true);
    }
  }
}

function glbdenKarakter(gltf){
  const sahneKok = gltf.scene, kemik = {};
  sahneKok.traverse(o => {
    if (!o.isBone && o.type !== 'Bone' && !(o.isObject3D && o.children.some(c => c.isBone))) return;
    const ad = KEMIK_ESLE[sadeAd(o.name)];
    if (ad && !kemik[ad]) kemik[ad] = o;
  });
  for (const zorunlu of ['hips','spine','head','leftUpperArm','rightUpperArm','leftUpperLeg','rightUpperLeg'])
    if (!kemik[zorunlu]) throw new Error(`Modelde "${zorunlu}" kemiği bulunamadı; insan iskeletli (Mixamo tarzı) bir GLB gerekiyor.`);
  const yuz = kemikYuzKur(sahneKok);   // dinlenme pozunda (T-poz düzeltmesinden önce) kaydedilir
  tPozunaGetir(kemik);
  const humanBones = {}; for (const [ad, node] of Object.entries(kemik)) humanBones[ad] = {node};
  const humanoid = new VRMHumanoid(humanBones, {autoUpdateHumanBones:true});
  sahneKok.add(humanoid.normalizedHumanBonesRoot);
  // karışım şekilleri
  const morflar = [];
  sahneKok.traverse(o => { if (o.isMesh && o.morphTargetDictionary) morflar.push(o); });
  const var_ = ad => morflar.some(m => ad in m.morphTargetDictionary);
  const visemeVar = var_('viseme_aa');
  const harita = {};
  for (const [ifade, liste] of Object.entries(IFADE_ESLE)){
    let l = liste.filter(([m]) => var_(m));
    if (!l.length && AGIZ_YEDEK[ifade] && !visemeVar) l = AGIZ_YEDEK[ifade].filter(([m]) => var_(m));
    if (l.length) harita[ifade] = l;
  }
  const degerler = {};
  const expressionManager = {
    getExpression: ad => (harita[ad === 'Surprised' ? 'surprised' : ad] || yuz?.destekler(ad)) ? {} : null,
    setValue: (ad, v) => { degerler[ad === 'Surprised' ? 'surprised' : ad] = v; },
    uygula(){
      const toplam = {};
      for (const [ifade, v] of Object.entries(degerler)) for (const [m, k] of (harita[ifade] || [])) toplam[m] = Math.min(1, (toplam[m] || 0) + v*k);
      for (const mesh of morflar) for (const [m, i] of Object.entries(mesh.morphTargetDictionary)) if (m in toplam) mesh.morphTargetInfluences[i] = toplam[m];
    },
  };
  // göz kemikleriyle bakış
  let bakisHedefi = null;
  const lookAt = {
    lookAt(hedef){
      if (yuz){ bakisHedefi = hedef.clone(); return; }
      for (const g of ['leftEye','rightEye']){
        const n = kemik[g]; if (!n) continue;
        const p = n.getWorldPosition(new THREE.Vector3()), kafa = kemik.head.getWorldQuaternion(new THREE.Quaternion());
        const d = hedef.clone().sub(p).applyQuaternion(kafa.clone().invert()).normalize();
        const yaw = Math.max(-0.45, Math.min(0.45, Math.atan2(d.x, d.z))), pitch = Math.max(-0.3, Math.min(0.3, Math.asin(-d.y)));
        if (!n.userData.dinlenme) n.userData.dinlenme = n.quaternion.clone();
        n.quaternion.copy(n.userData.dinlenme).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')));
      }
    },
  };
  return {
    scene:sahneKok, humanoid, expressionManager, lookAt, meta:{metaVersion:'1', kaynak:'glb'},
    update(dt){ humanoid.update(); expressionManager.uygula(); if (yuz) yuz.uygula(degerler, bakisHedefi); },
  };
}

/* ---------------------------------------------------------
   Kemik tabanlı yüz (karışım şekli olmayan gerçekçi modeller için)
   veri/yuz-*.js içindeki YUZ_RIG tanımını kullanır: çene ekseni, göz kapağı, dudak ve kaş ötelemeleri.
   --------------------------------------------------------- */
const INSAN_ADLARI = ['hips','spine','chest','upperChest','neck','head','jaw','leftEye','rightEye',
  ...['left','right'].flatMap(y => ['Shoulder','UpperArm','LowerArm','Hand','UpperLeg','LowerLeg','Foot','Toes',
    'ThumbMetacarpal','ThumbProximal','ThumbDistal', ...['Index','Middle','Ring','Little'].flatMap(f => ['Proximal','Intermediate','Distal'].map(p => f+p))].map(k => y+k))];
for (const a of INSAN_ADLARI) KEMIK_ESLE[a.toLowerCase()] = a;   // zaten insan adı taşıyan kemikler

function kemikYuzKur(sahneKok){
  if (typeof YUZ_RIG === 'undefined' || !sahneKok.getObjectByName('DEF-lid.T.L')) return null;
  const R = YUZ_RIG, ayna = a => a.includes('.L') ? a.replace('.L', '.R') : a;
  sahneKok.updateMatrixWorld(true);
  const kokTers = sahneKok.matrixWorld.clone().invert();
  const dinlenme = n => kokTers.clone().multiply(n.matrixWorld);
  const bas = sahneKok.getObjectByName('head'); if (!bas) return null;
  const H = dinlenme(bas), Hters = H.clone().invert();
  // ifadeleri aç: {ad: {cene, t: {kemik: Vector3}}}
  const IF = {};
  for (const [ad, e] of Object.entries(R.ifadeler)){
    const t = {};
    for (const [k, v] of Object.entries(e.t || {})){ t[k] = new THREE.Vector3(...v); if (!e.tek) t[ayna(k)] = new THREE.Vector3(-v[0], v[1], v[2]); }
    IF[ad] = {cene:e.cene || 0, t};
  }
  if (IF.blinkLeft){ const t = {}; for (const [k, v] of Object.entries(IF.blinkLeft.t)) t[ayna(k)] = new THREE.Vector3(-v.x, v.y, v.z); IF.blinkRight = {cene:0, t}; }
  const kayit = {};
  const ekle = a => { if (kayit[a]) return; const n = sahneKok.getObjectByName(a); if (n) kayit[a] = {n, W:dinlenme(n)}; };
  [...R.cene, ...R.cene_yari, ...R.goz.L.kemik, ...R.goz.R.kemik].forEach(ekle);
  for (const e of Object.values(IF)) Object.keys(e.t).forEach(ekle);
  const pivot = new THREE.Vector3(...R.cene_pivot), _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4();
  const etrafinda = (rot, p) => _t.makeTranslation(p.x, p.y, p.z).clone().multiply(rot).multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
  const gozMerkez = {L:new THREE.Vector3(...R.goz.L.merkez), R:new THREE.Vector3(...R.goz.R.merkez)};
  return {
    destekler: ad => !!IF[ad === 'Surprised' ? 'surprised' : ad === 'blink' ? 'blinkLeft' : ad],
    uygula(degerler, hedef){
      let cene = 0; const tasi = {};
      for (const [ad0, w] of Object.entries(degerler)){
        if (!w) continue;
        const liste = ad0 === 'blink' ? ['blinkLeft', 'blinkRight'] : [ad0 === 'Surprised' ? 'surprised' : ad0];
        for (const ad of liste){ const e = IF[ad]; if (!e) continue; cene += e.cene*w;
          for (const [k, v] of Object.entries(e.t)) (tasi[k] = tasi[k] || new THREE.Vector3()).addScaledVector(v, w); }
      }
      const delta = {};
      const ceneR = etrafinda(_r.makeRotationX(cene*Math.PI/180), pivot), yariR = etrafinda(new THREE.Matrix4().makeRotationX(cene*Math.PI/360), pivot);
      for (const a of R.cene) delta[a] = ceneR; for (const a of R.cene_yari) delta[a] = yariR;
      // bakış: hedefi başın dinlenme uzayına taşı, göz merkezinden yönü bul
      if (hedef){
        bas.updateWorldMatrix(true, false);
        const T = hedef.clone().applyMatrix4(bas.matrixWorld.clone().invert()).applyMatrix4(H);
        for (const taraf of ['L', 'R']){
          const d = T.clone().sub(gozMerkez[taraf]);
          const yaw = Math.max(-0.5, Math.min(0.5, Math.atan2(d.x, d.z))), pitch = Math.max(-0.35, Math.min(0.35, -Math.atan2(d.y, Math.hypot(d.x, d.z))));
          const rot = new THREE.Matrix4().makeRotationY(yaw).multiply(new THREE.Matrix4().makeRotationX(pitch));
          const M = etrafinda(rot, gozMerkez[taraf]); for (const a of R.goz[taraf].kemik) delta[a] = M;
        }
      }
      for (const [a, k] of Object.entries(kayit)){
        _m.copy(k.W); if (delta[a]) _m.premultiply(delta[a]);
        if (tasi[a]){ _m.elements[12] += tasi[a].x; _m.elements[13] += tasi[a].y; _m.elements[14] += tasi[a].z; }
        _m.premultiply(Hters).decompose(k.n.position, k.n.quaternion, k.n.scale);
      }
    },
  };
}
