'use strict';
/* =========================================================
   16. ODA — telefonun içi: devre kartı zeminli, alüminyum çerçeveli bir donanım odası (tamamı kodla çizilir)
   Oda: x −2.6…2.6 (ekranın solu/sağı), z −2.3 (arka duvar)…2.1 (öne, kullanıcıya)
   ========================================================= */
const oda = new THREE.Group(); oda.visible = false; sahne.add(oda);
const temasKok = new THREE.Group(); govde.add(temasKok);   // temas çözücüsünün beden düzeltmesi (fizik/temas.js)
const yatis = new THREE.Group(); temasKok.add(yatis);       // yatarken Nova bu eksende sırtüstü döner
const ODA_DOKU = {}, odaYukleyici = new THREE.TextureLoader();
function odaDoku(ad, tur, tekrar){
  const k = ad + tur + tekrar; if (ODA_DOKU[k]) return ODA_DOKU[k];
  const t = odaYukleyici.load(`doku/oda/${ad}_${tur}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...tekrar); t.anisotropy = 8;
  t.colorSpace = tur === 'renk' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return ODA_DOKU[k] = t;
}
/* M(renk, {r, m, doku:'parke', tekrar:[x,y], normal:1, ek}) — doku verilirse renk, normal ve pürüzlülük haritaları birlikte gelir */
const M = (renk, o={}) => {
  const d = o.doku, tk = o.tekrar || [1, 1];
  const ayar = {color:renk, roughness:o.r ?? 0.85, metalness:o.m ?? 0, envMap:ORTAM, envMapIntensity:o.yansima ?? 0.35};
  if (d){ Object.assign(ayar, {map:odaDoku(d, 'renk', tk), normalMap:odaDoku(d, 'nrm', tk), roughnessMap:odaDoku(d, 'puruz', tk), roughness:1,
    normalScale:new THREE.Vector2(o.normal ?? 1, o.normal ?? 1)});
    if (o.metal){ ayar.metalnessMap = odaDoku(d, 'metal', tk); ayar.metalness = 1; } }
  const Sinif = o.kadife ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const mat = new Sinif({...ayar, ...(o.ek||{})});
  if (o.kadife){ mat.sheen = 1; mat.sheenRoughness = 0.45; mat.sheenColor = new THREE.Color(o.kadife); }
  return mat;
};
const ISIK_MAT = renk => new THREE.MeshBasicMaterial({color:renk});
function mesh(geo, mat, x, y, z, ebeveyn=oda, o={}){
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
  if (o.s) m.scale.set(...o.s);
  m.castShadow = o.golge !== false; m.receiveShadow = true; ebeveyn.add(m); return m;
}
const kutu = (w,h,d,mat,x,y,z,e,o) => mesh(new THREE.BoxGeometry(w,h,d), mat, x,y,z,e,o);
const yuvarlak = (w,h,d,r,mat,x,y,z,e,o) => mesh(new RoundedBoxGeometry(w,h,d,4,r), mat, x,y,z,e,o);
const silindir = (rt,rb,h,mat,x,y,z,e,o) => mesh(new THREE.CylinderGeometry(rt,rb,h,28), mat, x,y,z,e,o);
const kure = (r,mat,x,y,z,e,o) => mesh(new THREE.SphereGeometry(r,24,16), mat, x,y,z,e,o);
function grup(x, z, ry=0, istasyon=null){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; if (istasyon) g.userData.istasyon = istasyon; oda.add(g); return g; }
function tuvalDoku(w, h, ciz, tekrar){ const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (tekrar){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...tekrar); } return t; }
const rnd = (a, b) => a + Math.random()*(b - a);

/* ---- duvarlar ve zemin ---- */
const parke = tuvalDoku(512, 512, (g, w, h) => {
  const satir = 8, sh = h/satir;
  for (let i = 0; i < satir; i++){
    let x = -Math.random()*w*0.5;
    while (x < w){ const uz = rnd(150, 300), t = rnd(-12, 10);
      g.fillStyle = `rgb(${233+t},${211+t},${180+t})`; g.fillRect(x, i*sh, uz, sh);
      g.fillStyle = 'rgba(150,110,70,0.25)'; g.fillRect(x, i*sh, 2, sh);
      for (let k = 0; k < 6; k++){ g.strokeStyle = `rgba(160,120,80,${rnd(0.04,0.1)})`; g.beginPath(); const yy = i*sh + rnd(4, sh-4); g.moveTo(x, yy); g.bezierCurveTo(x+uz*0.3, yy+rnd(-4,4), x+uz*0.6, yy+rnd(-4,4), x+uz, yy); g.stroke(); }
      x += uz; }
    g.fillStyle = 'rgba(140,100,60,0.3)'; g.fillRect(0, i*sh, w, 2);
  }
}, [3, 3]);
const odaZemin = mesh(new THREE.PlaneGeometry(5.2, 4.4), M(0x9fb0a8, {doku:'pcb', tekrar:[3.25, 2.75], metal:true, yansima:0.9, normal:0.8}), 0, 0, -0.1, oda, {rx:-Math.PI/2, golge:false});
const duvarMat = M(0xa9b6b0, {doku:'pcb', tekrar:[3.2, 1.7], metal:true, yansima:0.8, normal:0.6}), yanDuvarMat = M(0xffffff, {doku:'aluminyum', tekrar:[1, 2], normal:0.12, metal:true, yansima:1, normal:0.4}),
  lambriMat = M(0xffffff, {doku:'kalkan', tekrar:[6, 1.1], metal:true, yansima:1}), suvaMat = M(0xffffff, {doku:'aluminyum', normal:0.12, metal:true, yansima:1});
mesh(new THREE.PlaneGeometry(5.2, 2.75), duvarMat, 0, 1.375, -2.3, oda, {golge:false});
mesh(new THREE.PlaneGeometry(4.4, 2.75), yanDuvarMat, -2.6, 1.375, -0.1, oda, {ry:Math.PI/2, golge:false});
mesh(new THREE.PlaneGeometry(4.4, 2.75), yanDuvarMat, 2.6, 1.375, -0.1, oda, {ry:-Math.PI/2, golge:false});
// lambri (alt panel) ve süpürgelik
kutu(5.2, 0.9, 0.02, lambriMat, 0, 0.45, -2.29); kutu(5.2, 0.04, 0.04, suvaMat, 0, 0.91, -2.28);
kutu(0.02, 0.9, 4.4, lambriMat, -2.59, 0.45, -0.1); kutu(0.04, 0.04, 4.4, suvaMat, -2.58, 0.91, -0.1);
kutu(0.02, 0.9, 4.4, lambriMat, 2.59, 0.45, -0.1); kutu(0.04, 0.04, 4.4, suvaMat, 2.58, 0.91, -0.1);
for (let i = -4; i <= 4; i++) kutu(0.012, 0.86, 0.012, M(0x8d9298, {m:1, r:0.3}), i*0.58, 0.45, -2.275, oda, {golge:false});   // kalkan panel ekleri

/* ---- kablosuz şarj bobini (halı yerine): ferrit disk üstünde bakır sarmal ---- */
const bobin = new THREE.Group(); bobin.position.set(0.1, 0, -0.25); oda.add(bobin);
mesh(new THREE.CircleGeometry(1.18, 96), M(0x1b1c1f, {r:0.75, m:0.1}), 0, 0.004, 0, bobin, {rx:-Math.PI/2, golge:false});
const bakirMat = M(0xd98a52, {m:1, r:0.28, yansima:1.2});
{ const tur = 16, ic = 0.28, dis = 1.1, nokta = [];
  for (let i = 0; i <= tur*90; i++){ const t = i/(tur*90), a = t*tur*Math.PI*2, rr = ic + (dis - ic)*t; nokta.push(new THREE.Vector3(Math.cos(a)*rr, 0.016, Math.sin(a)*rr)); }
  const sarmal = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nokta), tur*90, 0.0125, 8), bakirMat, 0, 0, 0, bobin, {golge:false}); sarmal.receiveShadow = true; }
mesh(new THREE.TorusGeometry(1.15, 0.02, 10, 128), M(0x3a3d42, {m:0.8, r:0.35}), 0, 0.012, 0, bobin, {rx:Math.PI/2, golge:false});
const bobinIsilti = mesh(new THREE.RingGeometry(0.26, 1.13, 96), new THREE.MeshBasicMaterial({color:0x6fe8ff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false}), 0, 0.03, 0, bobin, {rx:-Math.PI/2, golge:false});

/* ---- pil göstergesi: telefonun gerçek pil seviyesini gösterir (donanim.js günceller) ---- */
const PIL_GOSTERGE = { tuval:document.createElement('canvas') };
PIL_GOSTERGE.tuval.width = 256; PIL_GOSTERGE.tuval.height = 64;
PIL_GOSTERGE.doku = new THREE.CanvasTexture(PIL_GOSTERGE.tuval); PIL_GOSTERGE.doku.colorSpace = THREE.SRGBColorSpace;
function pilCiz(seviye = 0.8, sarjda = false, an = 0){
  const g = PIL_GOSTERGE.tuval.getContext('2d'); g.fillStyle = '#071510'; g.fillRect(0, 0, 256, 64);
  const dolu = Math.max(1, Math.ceil(seviye*5)), renk = seviye <= 0.2 ? '#ff5a4f' : '#3fffb0';
  for (let i = 0; i < 5; i++){ const yanik = i < dolu - (sarjda && Math.floor(an*2) % 2 ? 1 : 0); g.fillStyle = yanik ? renk : '#1d4a3a'; g.fillRect(12 + i*48, 14, 38, 36); }
  PIL_GOSTERGE.doku.needsUpdate = true;
}
pilCiz();
/* ---- yatak (sol duvar boyunca, başı arkada) ---- */
const yatak = grup(-2.0, -1.2, 0, 'uyu');
const beyazAhsap = M(0xffffff, {doku:'aluminyum', normal:0.12, metal:true, yansima:1});   // donanım odasında mobilya iskeletleri fırçalanmış alüminyum
const pilMat = M(0x2b2e34, {r:0.38, m:0.35, yansima:0.8}), cipMat = M(0x16171a, {r:0.22, m:0.1, yansima:1, ek:{}}), altinMat = M(0xd8ab55, {m:1, r:0.25, yansima:1.2});
yuvarlak(1.12, 0.3, 2.16, 0.04, pilMat, 0, 0.17, 0, yatak);
yuvarlak(1.04, 0.2, 2.06, 0.06, M(0xf8f6f2, {doku:'keten', tekrar:[2, 4], normal:0.6}), 0, 0.42, 0, yatak).userData.temas = {tur:'yumusak', derin:0.025};
yuvarlak(1.16, 0.62, 0.1, 0.04, pilMat, 0, 0.33, -1.1, yatak);
kutu(0.62, 0.36, 0.02, M(0xc98a2e, {r:0.45, m:0.1}), 0, 0.5, -1.06, yatak, {golge:false});                     // pil esnek bağlantısı (bakır-sarı)
for (let i = 0; i < 6; i++) kutu(0.05, 0.12, 0.01, altinMat, -0.15 + i*0.06, 0.58, -1.05, yatak, {golge:false});
yuvarlak(1.16, 0.4, 0.06, 0.03, pilMat, 0, 0.22, 1.08, yatak);
{ const etiket = tuvalDoku(512, 128, (g, w, h) => { g.fillStyle = '#2b2e34'; g.fillRect(0, 0, w, h); g.fillStyle = '#e9edf2'; g.font = '700 46px sans-serif'; g.fillText('Li-ion  4500 mAh', 24, 62);
    g.font = '24px sans-serif'; g.fillStyle = '#9aa1ab'; g.fillText('3.87V  ·  17.4Wh  ·  NOVA-BT01', 26, 104); });
  mesh(new THREE.PlaneGeometry(0.9, 0.22), M(0xffffff, {r:0.5, ek:{map:etiket}}), 0.562, 0.17, 0.35, yatak, {ry:Math.PI/2, golge:false});
  mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({map:PIL_GOSTERGE.doku}), 0.562, 0.17, -0.5, yatak, {ry:Math.PI/2, golge:false}); }
const battaniyeDoku = tuvalDoku(256, 256, (g, w, h) => { g.fillStyle = '#c9b2f3'; g.fillRect(0,0,w,h); g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i+j)%2 === 0) g.fillRect(i*32, j*32, 32, 32); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++){ g.beginPath(); g.moveTo(i*32,0); g.lineTo(i*32,h); g.stroke(); g.beginPath(); g.moveTo(0,i*32); g.lineTo(w,i*32); g.stroke(); } }, [2, 3]);
const battaniye = yuvarlak(1.1, 0.06, 1.35, 0.03, M(0xb8a5c4, {doku:'keten', tekrar:[3, 4], normal:0.8}), 0, 0.53, 0.33, yatak); battaniye.userData.temas = {tur:'yumusak', derin:0.04};
yuvarlak(1.12, 0.07, 0.3, 0.03, M(0xa48fb3, {doku:'keten', tekrar:[3, 1]}), 0, 0.555, -0.3, yatak).userData.temas = {tur:'yumusak', derin:0.045};
yuvarlak(0.48, 0.13, 0.32, 0.06, M(0xf7f4ef, {doku:'keten', tekrar:[1.5, 1]}), -0.25, 0.6, -0.84, yatak, {rx:-0.25}).userData.temas = {tur:'yumusak', derin:0.07};
yuvarlak(0.48, 0.13, 0.32, 0.06, M(0xe8c6c2, {doku:'keten', tekrar:[1.5, 1]}), 0.25, 0.6, -0.84, yatak, {rx:-0.25}).userData.temas = {tur:'yumusak', derin:0.07};
yuvarlak(0.3, 0.1, 0.2, 0.04, M(0xeadfb8, {doku:'kadife', normal:0.25, kadife:0xfff6dc}), 0.3, 0.8, -0.99, yatak, {rx:-1.25, rz:0.15})   /* başucuna, yastığın arkasına dayalı */.userData.temas = {tur:'itilir'};
// peluş tavşan
{ const p = new THREE.Group(); p.position.set(0.32, 0.53, 0.75); p.rotation.y = -0.6; yatak.add(p); p.userData.temas = {tur:'itilir', grup:true};
  const pm = M(0xf1ebe4, {doku:'kadife', normal:0.25, kadife:0xffffff}), pp = M(0xd9a3a8, {r:1});
  kure(0.09, pm, 0, 0.09, 0, p, {s:[1,1.05,0.9]}); kure(0.075, pm, 0, 0.22, 0.01, p);
  kure(0.025, pm, -0.035, 0.31, 0, p, {s:[0.7,2.2,0.5], rz:0.2}); kure(0.025, pm, 0.035, 0.31, 0, p, {s:[0.7,2.2,0.5], rz:-0.2});
  kure(0.012, pp, 0, 0.21, 0.075, p); kure(0.008, M(0x3a2d4f), -0.028, 0.235, 0.065, p); kure(0.008, M(0x3a2d4f), 0.028, 0.235, 0.065, p); }

/* ---- komodin ve gece lambası ---- */
const komodin = grup(-1.2, -2.05);
yuvarlak(0.42, 0.5, 0.4, 0.03, cipMat, 0, 0.25, 0, komodin);
kutu(0.3, 0.004, 0.28, M(0xbfc3c9, {m:1, r:0.3}), 0, 0.502, 0, komodin, {golge:false});
kutu(0.36, 0.005, 0.01, M(0xd9d2c8), 0, 0.33, 0.2, komodin); kure(0.015, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0, 0.4, 0.21, komodin);
silindir(0.06, 0.08, 0.03, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0.04, 0.515, 0, komodin); silindir(0.012, 0.012, 0.22, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0.04, 0.64, 0, komodin);
const komodinAbajur = silindir(0.08, 0.13, 0.16, M(0xf6efe4, {doku:'keten', normal:0.5, ek:{emissive:0xffc985, emissiveIntensity:0}}), 0.04, 0.8, 0, komodin);
const komodinIsik = new THREE.PointLight(0xffc98a, 0, 3.2, 1.6); komodinIsik.position.set(0.04, 0.78, 0.1); komodin.add(komodinIsik);
silindir(0.035, 0.03, 0.08, M(0xffffff, {r:0.3}), -0.11, 0.54, 0.06, komodin); kutu(0.13, 0.025, 0.18, M(0x6f8fa8, {r:0.7}), -0.08, 0.512, -0.06, komodin, {ry:0.3});

/* ---- pencere, perde, dışarısı ---- */
const pencere = grup(-0.15, -2.3, 0, 'pencere');
const GOK = {
  gunduz: tuvalDoku(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#7fb6f2'); gr.addColorStop(0.65,'#cfe6fb'); gr.addColorStop(1,'#f4e7f6'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [x,y,s] of [[120,120,1],[360,80,0.8],[300,190,0.6]]){ for (let i = 0; i < 6; i++){ g.beginPath(); g.arc(x + i*22*s, y + Math.sin(i)*8*s, 26*s, 0, Math.PI*2); g.fill(); } }
    g.fillStyle = '#b9b1d6'; for (let i = 0; i < 9; i++){ const bw = rnd(40,70), bh = rnd(90,200); g.fillRect(i*60 - 10, h - bh, bw, bh); }
    g.fillStyle = '#9d95c4'; for (let i = 0; i < 7; i++){ const bw = rnd(50,80), bh = rnd(60,130); g.fillRect(i*80, h - bh, bw, bh); } }),
  aksam: tuvalDoku(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#5d5aa8'); gr.addColorStop(0.45,'#e58fb0'); gr.addColorStop(0.75,'#ffc394'); gr.addColorStop(1,'#ffe3b8'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = '#ffd99a'; g.beginPath(); g.arc(330, 360, 46, 0, Math.PI*2); g.fill();
    g.fillStyle = '#6f5c93'; for (let i = 0; i < 9; i++){ const bw = rnd(40,70), bh = rnd(90,200); g.fillRect(i*60 - 10, h - bh, bw, bh); }
    g.fillStyle = '#4d406e'; for (let i = 0; i < 7; i++){ const bw = rnd(50,80), bh = rnd(60,130); g.fillRect(i*80, h - bh, bw, bh); g.fillStyle = '#ffd98a'; for (let k = 0; k < 4; k++) g.fillRect(i*80 + rnd(8, bw-14), h - bh + rnd(10, bh-14), 6, 8); g.fillStyle = '#4d406e'; } }),
  gece: tuvalDoku(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#0f1030'); gr.addColorStop(0.7,'#2a2560'); gr.addColorStop(1,'#43397a'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    for (let i = 0; i < 90; i++){ g.fillStyle = `rgba(255,255,255,${rnd(0.3,1)})`; g.beginPath(); g.arc(rnd(0,w), rnd(0,h*0.65), rnd(0.6,1.8), 0, Math.PI*2); g.fill(); }
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(380, 110, 34, 0, Math.PI*2); g.fill(); g.fillStyle = '#0f1030'; g.beginPath(); g.arc(394, 100, 30, 0, Math.PI*2); g.fill();
    g.fillStyle = '#231e45'; for (let i = 0; i < 9; i++){ const bw = rnd(40,70), bh = rnd(90,200); g.fillRect(i*60 - 10, h - bh, bw, bh); g.fillStyle = '#ffd98a'; for (let k = 0; k < 5; k++) if (Math.random() < 0.6) g.fillRect(i*60 + rnd(0, bw-12), h - bh + rnd(10, bh-14), 6, 8); g.fillStyle = '#231e45'; } }),
};
const disarisi = mesh(new THREE.PlaneGeometry(1.24, 1.24), new THREE.MeshBasicMaterial({map:GOK.gunduz}), 0, 1.45, 0.004, pencere, {golge:false});
const cerceve = M(0x0c0d0f, {r:0.08, m:0.2, yansima:1.4});
kutu(1.4, 0.07, 0.08, cerceve, 0, 2.1, 0.03, pencere); kutu(1.4, 0.07, 0.08, cerceve, 0, 0.8, 0.03, pencere);
kutu(0.07, 1.36, 0.08, cerceve, -0.66, 1.45, 0.03, pencere); kutu(0.07, 1.36, 0.08, cerceve, 0.66, 1.45, 0.03, pencere);


// pervazda küçük saksılar
if (false) for (const [x, r] of [[-0.45, 0.06], [0.42, 0.05]]){ silindir(r, r*0.8, 0.1, M(0xb8704f, {r:0.8}), x, 0.86, 0.1, pencere); kure(r*1.25, M(0x5b8a5e, {r:0.6}), x, 0.95, 0.1, pencere, {s:[1,0.8,1]}); }
// perdeler (dalgalı)
const perdeMat = M(0xf1dcd6, {doku:'keten', tekrar:[0.6, 5], ek:{side:THREE.DoubleSide}});
if (false) for (const yon of [-1, 1]){ for (let i = 0; i < 5; i++) yuvarlak(0.075, 1.7, 0.05, 0.02, perdeMat, yon*(0.78 + i*0.055), 1.33, 0.14 + (i%2)*0.035, pencere); }


/* ---- kitaplık ---- */
const kitaplik = grup(1.35, -2.12, 0, 'kitap');
for (const x of [-0.5, 0.5]) kutu(0.03, 1.9, 0.34, beyazAhsap, x, 0.95, 0, kitaplik);
kutu(1.03, 0.02, 0.34, beyazAhsap, 0, 1.9, 0, kitaplik); kutu(1.0, 1.9, 0.01, M(0xffffff, {doku:'kalkan', tekrar:[2, 4], metal:true, yansima:1}), 0, 0.95, -0.165, kitaplik);
const KITAP_RENK = [0x8a6f9e,0xc99aa5,0x6f8fa8,0xd9b77a,0x88a68f,0xa5525f,0x5b5487,0xc2896a,0xefe9df,0x9bb07f,0x2f3b4f,0x7a3e48];
for (let r = 0; r < 5; r++){
  const y = 0.04 + r*0.38; kutu(1.0, 0.025, 0.33, beyazAhsap, 0, y, 0, kitaplik);
  let x = -0.46;
  while (x < 0.42){
    if (r === 4 && x > 0.05) break;
    if (Math.random() < 0.08){ x += 0.08; continue; }
    const kw = rnd(0.025, 0.05), kh = rnd(0.2, 0.3);
    const egik = Math.random() < 0.07 ? rnd(0.15, 0.3) : 0;
    kutu(kw, kh, rnd(0.18, 0.24), M(KITAP_RENK[Math.floor(Math.random()*KITAP_RENK.length)], {r:0.7}), x + kw/2, y + 0.0125 + kh/2, 0.02, kitaplik, {rz:egik});
    x += kw + 0.003;
  }
}
silindir(0.06, 0.05, 0.1, M(0xece8e2, {r:0.3}), 0.28, 1.6, 0.03, kitaplik); kure(0.08, M(0x5d8c60, {r:0.6}), 0.28, 1.7, 0.03, kitaplik, {s:[1.2,0.7,1.2]});
silindir(0.07, 0.07, 0.1, M(0xc9a2a0, {r:0.4}), -0.25, 1.96, 0, kitaplik); kure(0.035, M(0xe8dcb5), 0.3, 1.94, 0, kitaplik);

/* ---- köşedeki büyük bitki ---- */
const buyukBitki = grup(2.25, -1.95);
silindir(0.19, 0.14, 0.38, M(0xe9e4dc, {r:0.35}), 0, 0.19, 0, buyukBitki);
const yaprakMat = M(0x4d7a50, {r:0.7, ek:{side:THREE.DoubleSide}}); yaprakMat.userData.temasYok = true;
for (let i = 0; i < 9; i++){ const a = i/9*Math.PI*2, h = rnd(0.7, 1.25);
  silindir(0.008, 0.01, h, M(0x4a6b3f), Math.cos(a)*0.08, 0.38 + h/2, Math.sin(a)*0.08, buyukBitki, {rz:Math.cos(a)*0.25, rx:-Math.sin(a)*0.25});
  kure(0.15, yaprakMat, Math.cos(a)*0.22, 0.38 + h, Math.sin(a)*0.22, buyukBitki, {s:[1,0.18,0.7], ry:-a, rz:0.4}); }

/* ---- çalışma masası, sandalye, panodaki fotoğraflar ---- */
const masa = grup(2.25, -0.5, 0, 'yaz');
const ahsap = cipMat;
kutu(0.6, 0.04, 1.3, ahsap, 0, 0.73, 0, masa);
kutu(0.44, 0.006, 0.8, M(0xc3c7cd, {doku:'aluminyum', normal:0.12, metal:true, yansima:1}), 0, 0.753, 0.0, masa, {golge:false});     // ısı dağıtıcı kapak
mesh(new THREE.PlaneGeometry(0.34, 0.14), new THREE.MeshBasicMaterial({transparent:true, opacity:0.75, map:tuvalDoku(256, 104, (g) => { g.fillStyle = '#3a3e45'; g.font = '700 40px monospace'; g.fillText('NOVA', 70, 46); g.font = '20px monospace'; g.fillText('NEURAL CORE  N1', 40, 84); })}), 0.0, 0.7565, 0.38, masa, {rx:-Math.PI/2, rz:Math.PI/2, golge:false});
for (let i = 0; i < 26; i++) for (const s of [-1, 1]) kutu(0.03, 0.02, 0.022, altinMat, s*0.305, 0.72, -0.62 + i*0.0496, masa, {golge:false});   // yonga ayakları
for (const [x, z] of [[-0.26,-0.6],[0.26,-0.6],[-0.26,0.6],[0.26,0.6]]) kutu(0.03, 0.71, 0.03, altinMat, x, 0.355, z, masa);
kutu(0.5, 0.12, 0.45, beyazAhsap, 0.02, 0.65, 0.38, masa);
// dizüstü bilgisayar
{ const l = new THREE.Group(); l.position.set(0.02, 0.75, -0.2); masa.add(l);
  kutu(0.24, 0.012, 0.33, M(0xc9c9cc, {m:0.9, r:0.35, yansima:1}), 0, 0.006, 0, l);
  const ekran = new THREE.Group(); ekran.position.set(0.12, 0.012, 0); ekran.rotation.z = 0.22; l.add(ekran);
  kutu(0.012, 0.21, 0.33, M(0xc9c9cc, {m:0.9, r:0.35, yansima:1}), 0, 0.105, 0, ekran);
  mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshBasicMaterial({map:tuvalDoku(256, 160, (g, w, h) => { const gr = g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#b79ce9'); gr.addColorStop(1,'#f6c3d6'); g.fillStyle = gr; g.fillRect(0,0,w,h); g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 26px sans-serif'; g.fillText('Nova', 20, 50); g.fillRect(20, 70, 140, 8); g.fillRect(20, 90, 100, 8); })}), -0.007, 0.105, 0, ekran, {ry:-Math.PI/2, golge:false}); }
// defter, kalemlik, kupa, masa lambası
const defter = kutu(0.2, 0.015, 0.27, M(0xc98f97, {doku:'kadife', normal:0.25}), -0.12, 0.758, 0.22, masa, {ry:0.15});
kutu(0.18, 0.004, 0.25, M(0xfffdf6), -0.12, 0.767, 0.22, masa, {ry:0.15});
silindir(0.035, 0.035, 0.1, M(0x8fae9a, {r:0.35}), 0.18, 0.8, 0.45, masa);
for (const [dx, dz, c] of [[0,0,0xe87d9b],[0.012,0.01,0x7d6fd1],[-0.01,0.012,0x3a2d4f]]) silindir(0.004, 0.004, 0.16, M(c), 0.18 + dx, 0.86, 0.45 + dz, masa, {rz:dx*8});
silindir(0.04, 0.035, 0.09, M(0xffffff, {r:0.3}), 0.15, 0.795, 0.05, masa);
silindir(0.07, 0.08, 0.02, M(0xffffff, {r:0.4}), 0.18, 0.76, -0.55, masa);
silindir(0.01, 0.01, 0.36, M(0xffffff, {r:0.4}), 0.18, 0.94, -0.55, masa, {rz:0.25});
const masaAbajur = silindir(0.03, 0.09, 0.11, M(0xffffff, {r:0.4, ek:{emissive:0xffd29a, emissiveIntensity:0}}), 0.12, 1.1, -0.55, masa, {rz:0.6});
const masaIsik = new THREE.PointLight(0xffd29a, 0, 2.6, 1.6); masaIsik.position.set(0.05, 1.0, -0.5); masa.add(masaIsik);
// pano + fotoğraflar (sağ duvarda)
yuvarlak(0.03, 0.6, 0.95, 0.01, M(0xc49a6c, {doku:'yun', normal:0.6}), 0.33, 1.4, -0.05, masa);
const FOTO_RENK = ['#f6c3d6','#b79ce9','#8fc9e8','#ffd58a','#9fd8c0','#f2b98f'];
for (let i = 0; i < 6; i++){ const fx = 0.315, fy = 1.25 + (i%2)*0.27 + rnd(-0.02,0.02), fz = -0.4 + Math.floor(i/2)*0.33 + rnd(-0.03,0.03);
  const foto = tuvalDoku(64, 76, (g) => { g.fillStyle = '#fff'; g.fillRect(0,0,64,76); g.fillStyle = FOTO_RENK[i]; g.fillRect(5,5,54,52); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(32, 36, 12, 0, Math.PI*2); g.fill(); });
  mesh(new THREE.PlaneGeometry(0.11, 0.13), M(0xffffff, {ek:{map:foto}}), fx, fy, fz, masa, {ry:-Math.PI/2, rz:rnd(-0.15,0.15), golge:false});
  kure(0.01, M(0xe87d9b), fx - 0.01, fy + 0.055, fz, masa, {golge:false}); }
const sandalye = grup(1.74, -0.45, 0, 'yaz');
const sandalyeMat = M(0xffffff, {doku:'aluminyum', normal:0.12, metal:true, yansima:1});
yuvarlak(0.42, 0.05, 0.42, 0.02, sandalyeMat, 0, 0.44, 0, sandalye);
yuvarlak(0.05, 0.42, 0.42, 0.02, sandalyeMat, -0.2, 0.7, 0, sandalye, {rz:0.08});
for (const [x, z] of [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]]) silindir(0.015, 0.015, 0.42, beyazAhsap, x, 0.21, z, sandalye);

/* ---- şövale, tablo ve boya taburesi ---- */
const SOVALE_N = new THREE.Vector2(-0.862, 0.507);              // tuvalin baktığı yön
const sovale = grup(1.55, 1.05, Math.atan2(SOVALE_N.x, SOVALE_N.y), 'resim');
const sovaleAhsap = M(0xffffff, {doku:'aluminyum', normal:0.12, metal:true, yansima:1});
silindir(0.018, 0.018, 1.75, sovaleAhsap, -0.25, 0.86, -0.05, sovale, {rz:-0.14, rx:-0.05});
silindir(0.018, 0.018, 1.75, sovaleAhsap, 0.25, 0.86, -0.05, sovale, {rz:0.14, rx:-0.05});
silindir(0.018, 0.018, 1.7, sovaleAhsap, 0, 0.82, -0.32, sovale, {rx:0.32});
kutu(0.62, 0.035, 0.07, sovaleAhsap, 0, 0.88, 0.0, sovale);
const tabloTuval = document.createElement('canvas'); tabloTuval.width = 256; tabloTuval.height = 320;
const tabloDoku = new THREE.CanvasTexture(tabloTuval); tabloDoku.colorSpace = THREE.SRGBColorSpace;
kutu(0.56, 0.7, 0.025, M(0xfdfbf7), 0, 1.25, 0.01, sovale);
mesh(new THREE.PlaneGeometry(0.54, 0.675), M(0xffffff, {ek:{map:tabloDoku}, r:0.9}), 0, 1.25, 0.024, sovale, {golge:false});
const tabure = grup(1.95, 1.45);
silindir(0.17, 0.17, 0.04, sovaleAhsap, 0, 0.5, 0, tabure);
for (let i = 0; i < 3; i++){ const a = i/3*Math.PI*2; silindir(0.015, 0.015, 0.5, sovaleAhsap, Math.cos(a)*0.12, 0.25, Math.sin(a)*0.12, tabure); }
for (const [x, z, c] of [[-0.06,0.03,0xe87d9b],[0.05,-0.05,0x8fc9e8],[0.06,0.07,0xffd58a],[-0.04,-0.08,0x9fd8c0]]) silindir(0.03, 0.03, 0.07, M(c, {r:0.4}), x, 0.555, z, tabure);
// duvardaki son biten tablo
const duvarTabloTuval = document.createElement('canvas'); duvarTabloTuval.width = 256; duvarTabloTuval.height = 320;
const duvarTabloDoku = new THREE.CanvasTexture(duvarTabloTuval); duvarTabloDoku.colorSpace = THREE.SRGBColorSpace;
const duvarTablo = new THREE.Group(); duvarTablo.position.set(-1.95, 1.62, -2.28); oda.add(duvarTablo);
kutu(0.5, 0.61, 0.03, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0, 0, 0, duvarTablo);
const duvarTabloYuz = mesh(new THREE.PlaneGeometry(0.44, 0.55), M(0xffffff, {ek:{map:duvarTabloDoku}}), 0, 0, 0.017, duvarTablo, {golge:false});

/* ---- okuma koltuğu, sehpa, ayaklı lamba ---- */
const KOLTUK = { x:-1.75, z:1.15, f:new THREE.Vector2(0.55, 0.835).normalize() };
const koltuk = grup(KOLTUK.x, KOLTUK.z, Math.atan2(KOLTUK.f.x, KOLTUK.f.y), 'kitap');
const koltukMat = M(0xc98f97, {doku:'kadife', normal:0.25, kadife:0xf2c4c8});
yuvarlak(0.78, 0.3, 0.7, 0.1, koltukMat, 0, 0.27, 0, koltuk);
yuvarlak(0.66, 0.1, 0.56, 0.05, M(0xd39ea5, {doku:'kadife', normal:0.25, kadife:0xf6d0d3}), 0, 0.46, 0.04, koltuk).userData.temas = {tur:'yumusak', derin:0.04};
yuvarlak(0.78, 0.62, 0.18, 0.09, koltukMat, 0, 0.62, -0.3, koltuk, {rx:-0.12});
for (const x of [-0.36, 0.36]) yuvarlak(0.14, 0.42, 0.66, 0.07, koltukMat, x, 0.5, 0.0, koltuk);
yuvarlak(0.3, 0.26, 0.1, 0.05, M(0xe7d9b0, {doku:'kadife', normal:0.25, kadife:0xfff6dc}), 0.15, 0.62, -0.18, koltuk, {rx:-0.3, rz:-0.2}).userData.temas = {tur:'itilir'};
for (const [x, z] of [[-0.32,-0.28],[0.32,-0.28],[-0.32,0.28],[0.32,0.28]]) silindir(0.02, 0.015, 0.12, sovaleAhsap, x, 0.06, z, koltuk);
const sehpa = grup(-0.95, 1.9);
silindir(0.22, 0.22, 0.03, beyazAhsap, 0, 0.5, 0, sehpa); silindir(0.025, 0.025, 0.5, beyazAhsap, 0, 0.25, 0, sehpa); silindir(0.15, 0.15, 0.02, beyazAhsap, 0, 0.01, 0, sehpa);
silindir(0.04, 0.035, 0.08, M(0x9a88b0, {r:0.3}), 0.06, 0.555, 0.02, sehpa); kutu(0.14, 0.03, 0.2, M(0x6f8fa8, {r:0.7}), -0.07, 0.53, -0.03, sehpa, {ry:0.4});
const ayakliLamba = grup(-2.35, 1.75);
silindir(0.14, 0.16, 0.03, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0, 0.015, 0, ayakliLamba);
silindir(0.012, 0.012, 1.55, M(0xffffff, {doku:'pirinc', m:1, yansima:1}), 0, 0.78, 0, ayakliLamba);
const ayakliAbajur = silindir(0.1, 0.19, 0.24, M(0xf6efe4, {doku:'keten', normal:0.5, ek:{emissive:0xffc985, emissiveIntensity:0}}), 0, 1.6, 0, ayakliLamba);
const ayakliIsik = new THREE.PointLight(0xffc98a, 0, 4, 1.5); ayakliIsik.position.set(0.1, 1.45, -0.1); ayakliLamba.add(ayakliIsik);

/* ---- duvar süsleri: posterler, saat, peri ışıkları ---- */
const posterler = [
  [-1.2, 1.85, -2.285, 0, (g, w, h) => { g.fillStyle = '#2d2a5c'; g.fillRect(0,0,w,h); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(w*0.6, h*0.35, 44, 0, Math.PI*2); g.fill(); g.fillStyle = '#2d2a5c'; g.beginPath(); g.arc(w*0.6+20, h*0.35-12, 40, 0, Math.PI*2); g.fill(); for (let i = 0; i < 40; i++){ g.fillStyle = `rgba(255,255,255,${rnd(0.4,1)})`; g.fillRect(rnd(0,w), rnd(0,h), 2, 2); } g.fillStyle = '#b79ce9'; g.font = '600 22px sans-serif'; g.textAlign = 'center'; g.fillText('iyi geceler', w/2, h*0.82); }],
  [2.585, 1.6, 0.85, -Math.PI/2, (g, w, h) => { g.fillStyle = '#fdf3f6'; g.fillRect(0,0,w,h); const c = ['#f6a6be','#ffd58a','#b79ce9','#9fd8c0']; for (let i = 0; i < 4; i++){ const x = w*(0.25 + (i%2)*0.5), y = h*(0.3 + Math.floor(i/2)*0.38); for (let k = 0; k < 6; k++){ g.fillStyle = c[i]; g.beginPath(); g.arc(x + Math.cos(k)*22, y + Math.sin(k)*22, 16, 0, Math.PI*2); g.fill(); } g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(x, y, 12, 0, Math.PI*2); g.fill(); } }],
];
posterler.forEach(([x, y, z, ry, ciz], i) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.set(0, ry, i ? 0.03 : -0.02); oda.add(p);
  kutu(0.42, 0.56, 0.015, M(0xffffff), 0, 0, 0, p); mesh(new THREE.PlaneGeometry(0.38, 0.52), M(0xffffff, {ek:{map:tuvalDoku(192, 256, ciz)}}), 0, 0, 0.009, p, {golge:false}); });
const saatTuval = document.createElement('canvas'); saatTuval.width = saatTuval.height = 192;
const saatDoku = new THREE.CanvasTexture(saatTuval); saatDoku.colorSpace = THREE.SRGBColorSpace;
silindir(0.17, 0.17, 0.03, M(0xffffff, {r:0.3}), 2.585, 1.95, -1.55, oda, {rz:Math.PI/2});
mesh(new THREE.CircleGeometry(0.155, 48), new THREE.MeshBasicMaterial({map:saatDoku}), 2.568, 1.95, -1.55, oda, {ry:-Math.PI/2, golge:false});
function saatCiz(){
  const g = saatTuval.getContext('2d'), s = 192, m = s/2, d = new Date();
  g.fillStyle = '#fdfbff'; g.fillRect(0,0,s,s); g.translate(m, m);
  for (let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; g.fillStyle = i%3 ? '#c9b8ea' : '#7d6fd1'; g.beginPath(); g.arc(Math.sin(a)*76, -Math.cos(a)*76, i%3 ? 3 : 5, 0, Math.PI*2); g.fill(); }
  const el = (a, l, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.sin(a)*l, -Math.cos(a)*l); g.stroke(); };
  el((d.getHours()%12 + d.getMinutes()/60)/12*Math.PI*2, 42, 7, '#3a2d4f'); el(d.getMinutes()/60*Math.PI*2, 62, 4, '#3a2d4f');
  g.fillStyle = '#e87d9b'; g.beginPath(); g.arc(0,0,6,0,Math.PI*2); g.fill();
  g.setTransform(1,0,0,1,0,0); saatDoku.needsUpdate = true;
}
saatCiz(); setInterval(saatCiz, 20000);
const periIsiklari = [];
{ const n = 26, egri = t => [-2.45 + t*4.9, 2.42 - Math.sin(t*Math.PI*3)**2*0.16 - 0.04, -2.27];
  const cizgi = new THREE.BufferGeometry().setFromPoints(Array.from({length:80}, (_, i) => new THREE.Vector3(...egri(i/79))));
  oda.add(new THREE.Line(cizgi, new THREE.LineBasicMaterial({color:0x9b8f7a})));
  for (let i = 0; i < n; i++){ const k = kure(0.018, new THREE.MeshBasicMaterial({color:0xffe2a3}), ...egri((i+0.5)/n), oda, {golge:false}); periIsiklari.push(k); } }
const periIsik = new THREE.PointLight(0xffd59a, 0, 4, 1.4); periIsik.position.set(0, 2.2, -1.9); oda.add(periIsik);
const pencereIsik = new THREE.PointLight(0xe8f1ff, 0, 5, 1.2); pencereIsik.position.set(-0.15, 1.6, -1.6); oda.add(pencereIsik);
