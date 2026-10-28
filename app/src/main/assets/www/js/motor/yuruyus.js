'use strict';
/* =========================================================
   4b. BEDEN SAHNEDE — yürüme, dönme, kadraj
   Karakter bir "gövde" grubunun içinde durur; grup sahnede yer değiştirir ve döner.
   ========================================================= */
const govde = new THREE.Group(); sahne.add(govde);
sahne.add(anaIsik.target);
const SINIR = { x:[-1.5, 1.5], z:[-1.6, 0.9] };
const hareketli = { hedef:null, yonHedef:null, yon:0, hiz:0, w:0, faz:0, amp:0, coz:null, sonra:'kamera' };
const aciFark = (a, b) => { let d = (a - b) % (Math.PI*2); if (d > Math.PI) d -= Math.PI*2; if (d < -Math.PI) d += Math.PI*2; return d; };
const kameraYonu = () => Math.atan2(kamera.position.x - govde.position.x, kamera.position.z - govde.position.z);
function hareketiDurdur(){ const c = hareketli.coz; hareketli.hedef = null; hareketli.yonHedef = null; hareketli.coz = null; c?.(false); }
function git(x, z, sonra='kamera'){
  hareketiDurdur();
  const S = tema === 'oda' ? {x:[-2.3, 2.3], z:[-2.0, 1.9]} : SINIR;
  x = Math.max(S.x[0], Math.min(S.x[1], +x || 0)); z = Math.max(S.z[0], Math.min(S.z[1], +z || 0));
  const yol = yolBul(new THREE.Vector2(govde.position.x, govde.position.z), new THREE.Vector2(x, z));
  return new Promise(res => { hareketli.hedef = yol.shift(); hareketli.yol = yol; hareketli.sonra = sonra; hareketli.coz = res; });
}
function don(aci){ hareketiDurdur(); return new Promise(res => { hareketli.yonHedef = aci; hareketli.coz = res; }); }
const GIT_YER = { merkez:[0,0], sana:[0,0.7], geri:[0,-1.3], sol:[-1.2,-0.2], sag:[1.2,-0.2] };
function gitHedefi(g){
  if (typeof g === 'string') return GIT_YER[g] || null;
  if (g && typeof g === 'object' && Number.isFinite(+g.x) && Number.isFinite(+g.z)) return [+g.x, +g.z];
  return null;
}
function hareketliGuncelle(dt){
  const h = hareketli; let istenen = 0, donuyor = false;
  if (akt.gecis || durus.w > 0.02){   // otururken ya da yatarken yürünmez; yürüme istenirse önce kalkar
    if ((h.hedef || h.yonHedef !== null) && akt.ad && akt.durum === 'yapiyor') aktiviteBitir();
    else if ((h.hedef || h.yonHedef !== null) && !akt.ad && !akt.gecis && durus.w > 0.5 && !durus.kalkiyor){ durus.kalkiyor = true; durusAyarla('ayakta').finally(() => durus.kalkiyor = false); }
    h.hiz = 0; h.amp += (0 - h.amp)*Math.min(1, dt*5); h.w += (0 - h.w)*Math.min(1, dt*6); return;
  }
  if (h.hedef){
    const dx = h.hedef.x - govde.position.x, dz = h.hedef.y - govde.position.z, mesafe = Math.hypot(dx, dz);
    if (mesafe < (h.yol && h.yol.length ? 0.2 : 0.05)){
      if (h.yol && h.yol.length) h.hedef = h.yol.shift();
      else {
        h.hedef = null;
        if (h.sonra === 'kamera') h.yonHedef = kameraYonu();
        else { const c = h.coz; h.coz = null; c?.(true); }
      }
    } else {
      const f = aciFark(Math.atan2(dx, dz), h.yon);
      h.yon += Math.max(-2.6*dt, Math.min(2.6*dt, f)); donuyor = Math.abs(f) > 0.05;
      if (Math.abs(f) < 0.9) istenen = Math.min(KLIP.yuru.adim/KLIP.yuru.sure, mesafe*1.4 + 0.15);
    }
  }
  if (!h.hedef && h.yonHedef !== null){
    const f = aciFark(h.yonHedef, h.yon);
    h.yon += Math.max(-2.3*dt, Math.min(2.3*dt, f)); donuyor = Math.abs(f) > 0.02;
    if (!donuyor){ h.yonHedef = null; const c = h.coz; h.coz = null; c?.(true); }
  }
  h.hiz += (istenen - h.hiz)*Math.min(1, dt*4);
  govde.position.x += Math.sin(h.yon)*h.hiz*dt; govde.position.z += Math.cos(h.yon)*h.hiz*dt;
  govde.rotation.y = h.yon;
  const amp = Math.max(h.hiz/0.7, donuyor ? 0.35 : 0);
  h.amp += (amp - h.amp)*Math.min(1, dt*5);
  h.w += ((amp > 0.02 ? 1 : 0) - h.w)*Math.min(1, dt*6);
  // faz = alınan yol / bir döngüde alınan yol → ayak yere bastığı yerde kalır (kayma yok); yerinde dönerken küçük adımlar
  h.faz = (h.faz + Math.max(h.hiz*dt/KLIP.yuru.adim, donuyor ? dt*0.45 : 0)) % 1;
  if (h.w < 0.01) h.faz = 0;
  // ışık ve gölge Nova'yla birlikte gelsin
  if (tema !== 'oda'){
    anaIsik.position.set(govde.position.x + 1.0, 4.4, govde.position.z + 1.7);
    anaIsik.target.position.set(govde.position.x, 0.8, govde.position.z); anaIsik.target.updateMatrixWorld();
  }
}
// Yürüme katmanı: bacaklar mutlak, gövde ve kollar eklemeli
function yurumeKatmani(poz, kolAgirlik){
  const h = hareketli, w = h.w; if (w < 0.005) return;
  const Y = KLIP.yuru, p = klipOrnekle('yuru', h.faz*Y.sure);
  for (const [b, v] of Object.entries(p)){
    if (b === 'head' || b === 'neck') continue;                       // bakış katmanı yönetir
    const kol = /Shoulder|Arm|Hand/.test(b) ? kolAgirlik : 1;
    if (b === '_kok'){ ekle(poz, '_kok', [v[0], v[1], 0], w); continue; }
    const q = poz[b] || varsayilan(b), ww = w*kol; poz[b] = q.map((x, i) => x + (v[i] - x)*ww);
  }
}
const yerelDunya = v => new THREE.Vector3(v[0], v[1], v[2]).applyAxisAngle(new THREE.Vector3(0,1,0), hareketli.yon).add(govde.position);
// Kadraj: dar (dikey) ekranda kollar ve ayaklar sığsın diye uzaklık en-boy oranına göre ayarlanır
const takipKatsayi = () => tema === 'oda' ? [(kamera.aspect || 1) < 0.9 ? 0.9 : 0.5, 0.3] : [0.85, 0.6];
function kameraPreset(ad){
  const a = kamera.aspect || 1, tan = Math.tan(15*D2R), [fx, fz] = takipKatsayi(), ox = govde.position.x*fx, oz = govde.position.z*fz;
  if (ad === 'yakin' && vrm){
    const k = vrm.humanoid.getRawBoneNode('head').getWorldPosition(new THREE.Vector3());
    const d = Math.min(2.2, Math.max(1.0, 0.24/(tan*a))), y = hareketli.yon;
    return [[k.x + Math.sin(y)*d, k.y + 0.06, k.z + Math.cos(y)*d], [k.x, k.y - 0.02, k.z], [ox, oz]];
  }
  const P = tema === 'oda' ? {
    tum: (() => { const d = a < 0.9 ? 7.4 : Math.min(8.5, Math.max(5.6, 2.9/(tan*a))); return [[0.15, 2.7, d], [0, 0.8, -0.35]]; })(),
    yan: [[-2.0, 1.9, 1.85], [0.5, 0.75, -0.6]],
    tepe: [[0, 7.4, 1.4], [0, 0, -0.25]],
  }[ad] : {
    tum: (() => { const d = Math.min(7.5, Math.max(3.7, 0.66/(tan*a))); return [[0, 1.02, d], [0, 0.86, 0]]; })(),
    yakin: [[0.04, 1.47, 1.6], [0, 1.41, 0]],
    yan: [[2.9, 1.2, 1.5], [0, 0.9, 0]],
    tepe: [[0, 4.8, 2.0], [0, 0.45, 0]],
  }[ad];
  return [[P[0][0]+ox, P[0][1], P[0][2]+oz], [P[1][0]+ox, P[1][1], P[1][2]+oz], [ox, oz]];
}
const takip = { x:0, z:0 };
function kameraTakip(dt){
  if (kameraGecis) return;
  const [fx, fz] = takipKatsayi(), hx = govde.position.x*fx, hz = govde.position.z*fz, k = Math.min(1, dt*2.5);
  const dx = (hx - takip.x)*k, dz = (hz - takip.z)*k;
  takip.x += dx; takip.z += dz;
  kontrol.target.x += dx; kontrol.target.z += dz; kamera.position.x += dx; kamera.position.z += dz;
}
