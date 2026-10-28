'use strict';
/* =========================================================
   5. NOVA'YI YÜKLE
   ========================================================= */
let vrm = null, vrm0 = false, kokDinlenme = new THREE.Vector3(), ifadeAdlari = {}, KEMIKLER = [];
const IFADE = { mutlu:['happy'], kizgin:['angry'], uzgun:['sad'], rahat:['relaxed'], saskin:['surprised','Surprised'] };
const IFADE_AD = { notr:'Nötr', mutlu:'Mutlu', kizgin:'Kızgın', uzgun:'Üzgün', rahat:'Rahat', saskin:'Şaşkın' };
const EL_AD = { rahat:'Rahat', acik:'Açık', yumruk:'Yumruk', isaret:'İşaret', zafer:'Zafer (V)', kalp:'Kalp' };
const BAKIS_AD = { kamera:'Bana bak', sol:'Kendi soluna', sag:'Kendi sağına', yukari:'Yukarı', asagi:'Aşağı' };
const AGIZ = ['aa','ih','ou','ee','oh'];

const yukleyici = new GLTFLoader();
yukleyici.register(p => new VRMLoaderPlugin(p));
const MODEL_YOLU = 'model/nova.wasm';   // etekli sürüm (nova_v3)
/* Nova'nın kendi kıyafetleri modelde duruyor ama başlangıçta gizli; gardırop bunları açıp kapatacak. */
function modeliYukle(yol = MODEL_YOLU){
yukleyici.load(yol, gltf => {
  try { vrm = gltf.userData.vrm || glbdenKarakter(gltf); }
  catch(e){ $('yukleme').innerHTML = '<div>Model kullanılamadı.<br><small style="font-family:var(--f-mono)">' + String(e.message).replace(/[<>&]/g, '') + '</small></div>'; return; }
  vrm0 = vrm.meta?.metaVersion === '0';
  BASPARMAK_VRM1 = !!vrm.humanoid.getNormalizedBoneNode('leftThumbMetacarpal');
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.rotateVRM0(vrm);
  gercekciYap(vrm);
  vrm.scene.traverse(o => {
    o.frustumCulled = false;
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    const adlar = [].concat(o.material).map(m => m?.name || '').join(' ');
    for (const [parca, on] of Object.entries(KIYAFET_PARCA)) if (adlar.includes(on)){ (KIYAFET[parca] ||= []).push(o); o.visible = false; }
    for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial){ m.envMap = ORTAM; m.envMapIntensity = 0.55; m.needsUpdate = true; }
    // dış hat (toon çizgisi) yüzeyin biraz arkasında kalsın: kıvrım yerlerinde kesik kesik çizgi oluşmasın
    for (const m of [].concat(o.material)) if (m && m.isOutline){ m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 2; }
  });
  yatis.add(vrm.scene);
  sonDilim = null; odaIsikGuncelle(true);   // Nova'nın malzemeleri de günün ışığına uysun
  kiyafetUygula(depo.oku('nova-kiyafet', 'gunluk'));   // en son giydiği kıyafet
  bedenUygula(vrm);   // göğüs / bel / kalça / boy ayarları (beden.js)
  kokDinlenme.copy(vrm.humanoid.getNormalizedBoneNode('hips').position);
  { // oturunca kalça ne kadar iner: uyluk yatay, baldır dik → kalça eklemi = ayak bileği + baldır boyu
    const k = b => vrm.humanoid.getRawBoneNode(b).getWorldPosition(new THREE.Vector3());
    const kalca = k('leftUpperLeg'), diz = k('leftLowerLeg'), bilek = k('leftFoot');
    OTURMA_DUSUS = Math.max(0.2, kalca.y - (bilek.y + diz.distanceTo(bilek))); }
  KEMIKLER = Object.keys(vrm.humanoid.humanBones).filter(b => vrm.humanoid.getNormalizedBoneNode(b));
  const em = vrm.expressionManager;
  for (const [k, adaylar] of Object.entries(IFADE)) ifadeAdlari[k] = adaylar.find(n => em?.getExpression(n));
  iskeletKur();
  elDeger = kopyala({...elSekli('rahat','sag'), ...elSekli('rahat','sol')});
  $('yukleme').hidden = true;
  try { if (window.parent !== window) window.parent.postMessage({tip:'nova-hazir'}, '*'); } catch(_){}
  arayuzKur();
  ruhHali('neseli');
  setTimeout(() => {
    sohbetEkle('nova', 'Merhaba, ben Nova! Bana bir şey söyle ya da ne yapmamı istediğini yaz.', [{eylem:'el_salla'}]);
    calistir([{eylem:'el_salla', soz:'Merhaba, ben Nova!'}]);
  }, 400);
}, e => {
  if (e.total){ const y = Math.round(e.loaded/e.total*100); $('yuzde').textContent = y+'%'; $('bar').style.width = y+'%'; }
}, err => { $('yukleme').innerHTML = '<div>Model yüklenemedi.<br><small style="font-family:var(--f-mono)">'+String(err.message||err).replace(/[<>&]/g,'')+'</small></div>'; });
}
