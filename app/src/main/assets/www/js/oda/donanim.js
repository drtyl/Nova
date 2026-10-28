'use strict';
/* =========================================================
   DONANIM ODASI — telefonun içi: ekran pencere (gerçek saat), şerit kablolar, bileşenler,
   telefonun gerçek pil durumu (pil yatak göstergesi + şarjda ışıyan bobin), açık/koyu mod.
   ========================================================= */

/* ---- pencere = telefonun kilit ekranı: duvar kağıdı günün saatine göre, üstünde gerçek saat ---- */
const EKRAN = { tuval:document.createElement('canvas'), dilim:'gunduz' };
EKRAN.tuval.width = EKRAN.tuval.height = 512;
EKRAN.doku = new THREE.CanvasTexture(EKRAN.tuval); EKRAN.doku.colorSpace = THREE.SRGBColorSpace;
disarisi.material.map = EKRAN.doku; disarisi.material.needsUpdate = true;
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function ekranCiz(dilim){
  if (dilim) EKRAN.dilim = dilim;
  const g = EKRAN.tuval.getContext('2d'), d = new Date(), W = 512;
  g.drawImage(GOK[EKRAN.dilim].image, 0, 0, W, W);
  const gr = g.createLinearGradient(0, 0, 0, W); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W);
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.textAlign = 'center';
  g.font = '300 118px sans-serif'; g.fillText(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), W/2, 160);
  g.font = '500 28px sans-serif'; g.fillText(`${GUNLER[d.getDay()]}, ${d.getDate()} ${AYLAR[d.getMonth()]}`, W/2, 52);
  g.font = '500 20px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText(PIL.sarjda ? `Şarj oluyor · %${Math.round(PIL.seviye*100)}` : `%${Math.round(PIL.seviye*100)}`, W/2, 200);
  EKRAN.doku.needsUpdate = true;
}
setInterval(() => ekranCiz(), 20000);

/* ---- ekran ışığı: pencereden odaya yayılan soğuk ekran parıltısı ---- */
pencereIsik.distance = 5.5;

/* ---- telefonun pil durumu (destekleyen tarayıcılarda gerçek değer) ---- */
const PIL = { seviye:0.8, sarjda:false, gercek:false };
function pilGuncelle(b){ PIL.seviye = b.level; PIL.sarjda = b.charging; PIL.gercek = true; pilCiz(PIL.seviye, PIL.sarjda); ekranCiz(); }
navigator.getBattery?.().then(b => { pilGuncelle(b); b.addEventListener('levelchange', () => pilGuncelle(b)); b.addEventListener('chargingchange', () => pilGuncelle(b)); }).catch(() => {});
/* şarjdayken bobin yavaşça ışır, pil göstergesi yanıp söner (dongu.js her karede çağırır) */
let bobinAn = 0;
function donanimKare(dt){
  bobinAn += dt;
  const hedef = PIL.sarjda ? 0.22 + Math.sin(bobinAn*1.6)*0.1 : 0;
  bobinIsilti.material.opacity += (hedef - bobinIsilti.material.opacity)*Math.min(1, dt*3);
  if (PIL.sarjda && Math.floor(bobinAn*2) !== Math.floor((bobinAn - dt)*2)) pilCiz(PIL.seviye, true, bobinAn);
}

/* ---- telefonun açık/koyu modu ---- */
const KOYU_MOD = window.matchMedia?.('(prefers-color-scheme: dark)');
KOYU_MOD?.addEventListener?.('change', () => { sonDilim = null; odaIsikGuncelle(true); });

/* ---- şerit kablolar (FPC), bağlayıcılar, bileşenler, anten çizgileri ---- */
const fpcDoku = tuvalDoku(128, 512, (g, w, h) => { g.fillStyle = '#c98a2e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++){ g.fillStyle = 'rgba(255,214,140,0.55)'; g.fillRect(8 + i*8.4, 0, 3, h); }
  g.fillStyle = 'rgba(80,40,0,0.25)'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); }, [1, 3]);
const fpcMat = M(0xffffff, {r:0.35, yansima:0.8, ek:{map:fpcDoku, side:THREE.DoubleSide, transparent:true, opacity:0.96}});
function fpc(x, z, ry, yuk, uz){
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; oda.add(g);
  mesh(new THREE.PlaneGeometry(0.16, yuk), fpcMat, 0, yuk/2 + 0.08, 0.012, g, {golge:false});
  const kv = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16, 1, true, 0, Math.PI/2), fpcMat); kv.rotation.z = Math.PI/2; kv.position.set(0, 0.08, 0.092); g.add(kv);
  mesh(new THREE.PlaneGeometry(0.16, uz), fpcMat, 0, 0.003, 0.09 + uz/2, g, {rx:-Math.PI/2, golge:false});
  kutu(0.24, 0.05, 0.12, M(0x111214, {r:0.3}), 0, 0.025, 0.1 + uz, g);
  for (let i = 0; i < 8; i++) kutu(0.012, 0.012, 0.03, M(0xd8ab55, {m:1, r:0.25}), -0.07 + i*0.02, 0.053, 0.1 + uz, g, {golge:false});
  kutu(0.24, 0.03, 0.06, M(0x111214, {r:0.3}), 0, yuk + 0.09, 0.02, g);
}
fpc(0.75, -2.28, 0, 1.1, 0.5);
fpc(-2.58, 0.55, Math.PI/2, 0.7, 0.35);
// SMD kondansatörler / bobinler (iri bileşenler, oturma öğesi gibi de durur)
for (const [x, z, w, h, d, c, ry] of [[2.2, 1.55, 0.42, 0.22, 0.22, 0xc4a376, 0.3], [-0.85, 1.75, 0.34, 0.18, 0.18, 0xc4a376, -0.4], [2.25, 0.75, 0.3, 0.3, 0.3, 0x1a1b1e, 0]]){
  const g = new THREE.Group(); g.position.set(x, h/2, z); g.rotation.y = ry; oda.add(g);
  yuvarlak(w*0.72, h, d, 0.02, M(c, {r:c === 0x1a1b1e ? 0.5 : 0.65}), 0, 0, 0, g);
  if (c !== 0x1a1b1e) for (const s of [-1, 1]) yuvarlak(w*0.16, h*1.02, d*1.02, 0.015, M(0xd6d9de, {m:1, r:0.3}), s*w*0.43, 0, 0, g);
  else mesh(new THREE.CircleGeometry(w*0.36, 32), M(0x55585e, {m:0.6, r:0.4}), 0, h/2 + 0.001, 0, g, {rx:-Math.PI/2, golge:false});
}
// yan duvarlardaki anten çizgileri (alüminyum çerçevede plastik boşluklar)
for (const x of [-2.595, 2.595]) for (const z of [-1.6, 1.3]) kutu(0.006, 2.75, 0.03, M(0x2a2c30, {r:0.6}), x, 1.375, z, oda, {golge:false});
// tavana yakın LED şerit ışığı (soğuk beyaz)
kutu(5.0, 0.02, 0.04, new THREE.MeshBasicMaterial({color:0xe8f6ff}), 0, 2.72, -2.27, oda, {golge:false});
