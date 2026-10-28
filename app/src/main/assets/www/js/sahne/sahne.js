'use strict';
/* =========================================================
   4. SAHNE — stüdyo ışığı, gölge, temalar
   ========================================================= */
const tuval = $('tuval'), sahneEl = tuval.parentElement, app = $('app');
const renderer = new THREE.WebGLRenderer({canvas:tuval, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Sinema tonu (ACES) ve gerçekçi malzemeler için yumuşak bir ortam yansıması
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
const ORTAM = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
const sahne = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
kamera.position.set(0, 1.15, 3.4);
const kontrol = new OrbitControls(kamera, tuval);
kontrol.target.set(0, 0.92, 0); kontrol.enableDamping = true; kontrol.dampingFactor = 0.08;
kontrol.minDistance = 0.6; kontrol.maxDistance = 9; kontrol.maxPolarAngle = Math.PI*0.52; kontrol.enablePan = false;
kontrol.update();

/* Stüdyo ışığı: üstten yumuşak gök + sıcak ana ışık (gölge düşürür) + soğuk dolgu + arkadan kontur */
const gok = new THREE.HemisphereLight(0xffffff, 0xcbbde8, 1.05); sahne.add(gok);
const anaIsik = new THREE.DirectionalLight(0xfff6f0, 1.45); anaIsik.position.set(1.3, 3.4, 2.4);
anaIsik.castShadow = true; anaIsik.shadow.mapSize.set(1024, 1024);
Object.assign(anaIsik.shadow.camera, {left:-1.1, right:1.1, top:2.1, bottom:-0.7, near:0.5, far:9});
anaIsik.shadow.bias = -0.0005; anaIsik.shadow.normalBias = 0.02; anaIsik.shadow.radius = 7;
sahne.add(anaIsik);
const dolgu = new THREE.DirectionalLight(0xe4dcff, 0.45); dolgu.position.set(-2.2, 1.6, 1.6); sahne.add(dolgu);
const kontur = new THREE.DirectionalLight(0xc9b4ff, 0.6); kontur.position.set(-0.9, 2.3, -2.6); sahne.add(kontur);
const zemin = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({opacity:0.16, color:0x2c1a5c}));
zemin.rotation.x = -Math.PI/2; zemin.receiveShadow = true; sahne.add(zemin);

function dokuCiz(boyut, ciz){ const c = document.createElement('canvas'); c.width = c.height = boyut; ciz(c.getContext('2d'), boyut); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const radyal = (renkler) => dokuCiz(256, (g, s) => { const gr = g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); renkler.forEach(([o,c])=>gr.addColorStop(o,c)); g.fillStyle = gr; g.fillRect(0,0,s,s); });
// Ayakların altında temas gölgesi (gerçek gölgeyi tamamlar)
const golgeMat = new THREE.MeshBasicMaterial({map:radyal([[0,'rgba(40,22,90,0.55)'],[0.45,'rgba(40,22,90,0.22)'],[1,'rgba(40,22,90,0)']]), transparent:true, depthWrite:false});
const golge = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), golgeMat);
golge.rotation.x = -Math.PI/2; golge.position.y = 0.002; sahne.add(golge);

/* Sahne temaları: yalnızca ışık/gölge/iskelet renkleri; fon CSS'te (.app[data-tema]) */
const TEMA = {
  studyo:{ad:'Stüdyo', gok:[0xffffff,0xcbbde8,1.05], ana:1.45, dolgu:0.45, kontur:[0xc9b4ff,0.6], golge:0.16, temas:1, eklem:0x6a3ff0, secili:0xe0457b, cizgi:0x9a7cf0},
  gece:{ad:'Gece stüdyo', gok:[0xc8b8ff,0x1c1530,0.75], ana:1.25, dolgu:0.3, kontur:[0xb08cff,1.6], golge:0.4, temas:1.3, eklem:0x5ee6d4, secili:0xffb86b, cizgi:0xb28bff},
  oda:{ad:'Oda', gok:[0xfff8f0,0xbfb0dd,1.0], ana:1.25, dolgu:0.35, kontur:[0xc9b4ff,0.35], golge:0, temas:0.5, eklem:0x6a3ff0, secili:0xe0457b, cizgi:0x9a7cf0},
  seffaf:{ad:'Şeffaf', gok:[0xffffff,0xcbbde8,1.05], ana:1.45, dolgu:0.45, kontur:[0xc9b4ff,0.6], golge:0.14, temas:0.8, eklem:0x6a3ff0, secili:0xe0457b, cizgi:0x9a7cf0},
};
let tema = 'studyo';
function temaAyarla(ad){
  const t = TEMA[ad]; if (!t) return; tema = ad;
  app.dataset.tema = ad;
  gok.color.set(t.gok[0]); gok.groundColor.set(t.gok[1]); gok.intensity = t.gok[2];
  anaIsik.color.set(0xfff6f0); anaIsik.intensity = t.ana; dolgu.intensity = t.dolgu; kontur.color.set(t.kontur[0]); kontur.intensity = t.kontur[1];
  zemin.material.opacity = t.golge; golgeMat.opacity = t.temas;
  if (typeof EKLEM_RENK !== 'undefined'){ EKLEM_RENK.set(t.eklem); SECILI_RENK.set(t.secili); cizgiMat?.color.set(t.cizgi); }
  for (const b of document.querySelectorAll('#temalar .tema')) b.setAttribute('aria-pressed', b.dataset.t === ad);
  depo.yaz('nova-tema2', ad);
  const odada = ad === 'oda';
  oda.visible = odada; zemin.visible = !odada && $('golgeAc').checked;
  Object.assign(anaIsik.shadow.camera, odada ? {left:-3.7, right:3.7, top:3.7, bottom:-3.7, near:0.5, far:16} : {left:-1.1, right:1.1, top:2.1, bottom:-0.7, near:0.5, far:9});
  anaIsik.shadow.camera.updateProjectionMatrix();
  if (anaIsik.shadow.map){ anaIsik.shadow.map.dispose(); anaIsik.shadow.map = null; }
  anaIsik.shadow.mapSize.set(odada ? 2048 : 1024, odada ? 2048 : 1024);
  $('etkinlikBolum').hidden = !odada;
  if (odada){
    anaIsik.position.set(1.6, 5.4, 3.8); anaIsik.target.position.set(0, 0, -0.4); anaIsik.target.updateMatrixWorld();
    kontrol.minAzimuthAngle = -1.05; kontrol.maxAzimuthAngle = 1.05; kontrol.maxPolarAngle = 1.38;
    sonDilim = null; odaIsikGuncelle(true);
  } else {
    delete app.dataset.dilim; kontrol.minAzimuthAngle = -Infinity; kontrol.maxAzimuthAngle = Infinity; kontrol.maxPolarAngle = Math.PI*0.52;
    if (akt.ad) aktiviteBitir();
    if (Math.hypot(govde.position.x, govde.position.z) > 1.4) govde.position.set(0, 0, 0);
  }
  if (vrm) kameraya('tum');
}

function boyutla(){
  const r = sahneEl.getBoundingClientRect(), pr = Math.min(+$('kalite').value, devicePixelRatio || 1);
  renderer.setPixelRatio(pr); renderer.setSize(r.width, r.height, false);
  if (typeof efekt !== 'undefined' && efekt){ efekt.c.setPixelRatio(pr); efekt.c.setSize(r.width, r.height); }
  kamera.aspect = r.width / Math.max(1, r.height); kamera.updateProjectionMatrix();
}
/* Ortam gölgesi (GTAO): eşyaların birleştiği köşeler, dipler ve kıvrımlar gerçek odadaki gibi yumuşakça kararır.
   Yalnızca oda temasında ve ayarlardan açıksa çalışır (telefonda ağır gelirse kapatılabilir). */
let efekt = null;
function efektKur(){
  const r = sahneEl.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
  const c = new EffectComposer(renderer);
  c.addPass(new RenderPass(sahne, kamera));
  const ao = new GTAOPass(sahne, kamera, w, h, undefined,
    {radius:0.35, distanceExponent:1.4, thickness:1.2, scale:1.15, samples:12, distanceFallOff:1},
    {lumaPhi:10, depthPhi:2, normalPhi:3, radius:5, rings:2, samples:12});
  ao.blendIntensity = 0.95;
  c.addPass(ao); c.addPass(new OutputPass());
  efekt = {c, ao};
}
function sahneCiz(){
  if (tema === 'oda' && ($('aoAc')?.checked ?? true)){
    if (!efekt){ try { efektKur(); boyutla(); } catch(e){ console.warn('AO kurulamadı', e); $('aoAc') && ($('aoAc').checked = false); } }
    if (efekt){ efekt.c.render(); return; }
  }
  renderer.render(sahne, kamera);
}
new ResizeObserver(boyutla).observe(sahneEl); boyutla();

/* Çekmece açıkken görüşü kaydır: Nova panelin altında kalmasın */
const kaydir = {x:0, y:0};
function gorusGuncelle(dt){
  const r = sahneEl.getBoundingClientRect(), acik = app.classList.contains('acik'), mobil = r.width <= 760;
  const p = $('panel').getBoundingClientRect();
  const tx = acik && !mobil ? p.width/2 : 0, ty = acik && mobil ? p.height*0.45 : 0;
  kaydir.x += (tx - kaydir.x)*Math.min(1, dt*7); kaydir.y += (ty - kaydir.y)*Math.min(1, dt*7);
  if (!tx && !ty && Math.abs(kaydir.x) < 0.5 && Math.abs(kaydir.y) < 0.5){ kaydir.x = kaydir.y = 0; if (kamera.view?.enabled) kamera.clearViewOffset(); return; }
  kamera.setViewOffset(r.width, r.height, kaydir.x, kaydir.y, r.width, r.height);
}
