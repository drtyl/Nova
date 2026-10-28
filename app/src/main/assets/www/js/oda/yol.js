'use strict';
/* ---- engeller, yol bulma, istasyonlar ---- */
const ENGEL = [
  {k:[-2.6,-1.42,-2.3,-0.08]}, {k:[-1.45,-0.95,-2.3,-1.8]}, {k:[0.82,1.9,-2.3,-1.92]}, {d:[2.25,-1.95,0.32]},
  {k:[1.92,2.6,-1.2,0.2]}, {k:[1.5,1.98,-0.7,-0.2]}, {d:[1.55,1.05,0.38]}, {d:[1.95,1.45,0.22]},
  {d:[KOLTUK.x, KOLTUK.z, 0.55]}, {d:[-0.95,1.9,0.24]}, {d:[-2.35,1.75,0.2]},
];
function engelde(x, z, pay=0.2){
  for (const e of ENGEL){
    if (e.k && x > e.k[0]-pay && x < e.k[1]+pay && z > e.k[2]-pay && z < e.k[3]+pay) return true;
    if (e.d && Math.hypot(x - e.d[0], z - e.d[1]) < e.d[2] + pay) return true;
  }
  return false;
}
function yolAcik(a, b){
  const n = Math.ceil(a.distanceTo(b)/0.08);
  for (let i = 1; i < n; i++){ const t = i/n, x = a.x + (b.x-a.x)*t, z = a.y + (b.y-a.y)*t;
    if (b.distanceTo(new THREE.Vector2(x, z)) < 0.4 || a.distanceTo(new THREE.Vector2(x, z)) < 0.25) continue;
    if (engelde(x, z)) return false; }
  return true;
}
const MERKEZLER = [[0.15,-0.3],[0.2,0.7],[-0.5,-1.1],[0.6,-1.25],[-0.6,0.55],[0.9,0.1]].map(([x,z]) => new THREE.Vector2(x, z));
function yolBul(a, b){
  if (tema !== 'oda' || yolAcik(a, b)) return [b];
  for (const m of MERKEZLER) if (yolAcik(a, m) && yolAcik(m, b)) return [m, b];
  for (const m of MERKEZLER) for (const n of MERKEZLER) if (m !== n && yolAcik(a, m) && yolAcik(m, n) && yolAcik(n, b)) return [m, n, b];
  return [b];
}
const DOLASMA = [[0,0],[-0.6,-0.9],[0.5,-1.1],[0.4,0.6],[-0.5,0.4],[0.9,-0.1],[-0.3,1.3],[0.2,-1.5],[0.6,1.5]];
const derece = r => r*R2D;
const KOLTUK_KALCA = [KOLTUK.x - KOLTUK.f.x*0.07, KOLTUK.z - KOLTUK.f.y*0.07];
const SOVALE_DUR = [1.55 + SOVALE_N.x*0.6, 1.05 + SOVALE_N.y*0.6];
const ISTASYON = {
  kitap:   { ad:'kitap okumak',       yaklas:[KOLTUK_KALCA[0] + KOLTUK.f.x*0.78, KOLTUK_KALCA[1] + KOLTUK.f.y*0.78], konum:KOLTUK_KALCA, yon:Math.atan2(KOLTUK.f.x, KOLTUK.f.y), durus:'oturma', sure:[70, 160] },
  resim:   { ad:'resim yapmak',       yaklas:SOVALE_DUR, konum:SOVALE_DUR, yon:Math.atan2(-SOVALE_N.x, -SOVALE_N.y), durus:'ayakta', sure:[50, 130] },
  yaz:     { ad:'masada yazı yazmak', yaklas:[1.05, -0.45], konum:[1.62, -0.45], yon:Math.PI/2, durus:'oturma', sure:[45, 110] },
  otur:    { ad:'koltukta oturmak',   yaklas:[KOLTUK_KALCA[0] + KOLTUK.f.x*0.78, KOLTUK_KALCA[1] + KOLTUK.f.y*0.78], konum:KOLTUK_KALCA, yon:Math.atan2(KOLTUK.f.x, KOLTUK.f.y), durus:'oturma', sure:[600, 1500] },
  pencere: { ad:'pencereden bakmak',  yaklas:[-0.15, -1.62], konum:[-0.15, -1.62], yon:Math.PI, durus:'ayakta', sure:[14, 28] },
  uyu:     { ad:'uyumak',             yaklas:[-1.1, -0.6], konum:[-2.0, -0.42], yon:0, durus:'yatma', y:0.63, sure:[90, 180] },
};
const AKTIVITE_AD = { otur:'Koltuğa otur', kitap:'Kitap oku', resim:'Resim yap', yaz:'Masada yaz', pencere:'Pencereden bak', uyu:'Uyu', kalk:'Kalk' };
