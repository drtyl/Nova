'use strict';
/* =========================================================
   KIYAFET ATÖLYESİ — yeni kıyafet tasarla: temel kıyafet + üst/alt renk + desen
   Tasarımlar gardıroba eklenir; Nova da sohbette kendi kıyafetini tasarlayabilir (kiyafet_tasarla).
   ========================================================= */
const DESEN_AD = { duz:'Düz', puantiye:'Puantiye', cizgili:'Çizgili', ekose:'Ekose', cicekli:'Çiçekli', yildizli:'Yıldızlı' };
const desenOnbellek = {};
function desenDokusu(desen, renk){
  const k = desen + renk; if (desenOnbellek[k]) return desenOnbellek[k];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const r = new THREE.Color(renk), acik = r.clone().lerp(new THREE.Color(1, 1, 1), 0.75), koyu = r.clone().multiplyScalar(0.62);
  const css = x => '#' + x.getHexString();
  g.fillStyle = css(r); g.fillRect(0, 0, 256, 256);
  if (desen === 'puantiye'){ g.fillStyle = css(acik); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++){ g.beginPath(); g.arc(i*32 + (j % 2)*16 + 8, j*32 + 16, 6, 0, 7); g.fill(); } }
  if (desen === 'cizgili'){ g.fillStyle = css(acik); for (let i = 0; i < 8; i++) g.fillRect(i*32, 0, 11, 256); }
  if (desen === 'ekose'){ g.globalAlpha = 0.45; g.fillStyle = css(koyu); for (let i = 0; i < 4; i++){ g.fillRect(i*64, 0, 24, 256); g.fillRect(0, i*64, 256, 24); }
    g.globalAlpha = 0.6; g.fillStyle = css(acik); for (let i = 0; i < 4; i++){ g.fillRect(i*64 + 40, 0, 4, 256); g.fillRect(0, i*64 + 40, 256, 4); } g.globalAlpha = 1; }
  if (desen === 'cicekli'){ for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ const x = i*64 + (j % 2)*32 + 16, y = j*64 + 20;
    g.fillStyle = css(acik); for (let a = 0; a < 5; a++){ g.beginPath(); g.arc(x + Math.cos(a*1.257)*7, y + Math.sin(a*1.257)*7, 6, 0, 7); g.fill(); }
    g.fillStyle = '#f2c96b'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); g.fillStyle = '#9cc29a'; g.beginPath(); g.ellipse(x + 26, y + 26, 7, 3, 0.6, 0, 7); g.fill(); } }
  if (desen === 'yildizli'){ g.fillStyle = css(acik);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ const x = i*64 + (j % 2)*32 + 16, y = j*64 + 16; g.beginPath();
      for (let a = 0; a < 10; a++){ const t = a/10*Math.PI*2 - Math.PI/2, rr = a % 2 ? 3 : 8; g.lineTo(x + Math.cos(t)*rr, y + Math.sin(t)*rr); } g.closePath(); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.6, 0.6); t.anisotropy = 8;
  return desenOnbellek[k] = t;
}
/* kayıtlı tasarımları gardıroba ekle */
const TEMEL_KIYAFET = Object.keys(KIYAFET_TANIM);
let OZEL_KIYAFET = depo.oku('nova-ozel-kiyafet', {});
function ozelKiyafetleriYukle(){
  for (const k of Object.keys(KIYAFET_TANIM)) if (!TEMEL_KIYAFET.includes(k)) delete KIYAFET_TANIM[k];
  for (const [id, o] of Object.entries(OZEL_KIYAFET)) if (KIYAFET_TANIM[o.temel]) KIYAFET_TANIM[id] = {...KIYAFET_TANIM[o.temel], ad:o.ad, ozel:o};
}
ozelKiyafetleriYukle();
function kiyafetTasarla(t, kim = 'kullanici'){
  const temel = TEMEL_KIYAFET.includes(t.temel) ? t.temel : 'elbise';
  const renk = x => /^#[0-9a-f]{6}$/i.test(String(x || '')) ? String(x).toLowerCase() : null;
  const o = { ad:String(t.ad || 'Yeni kıyafet').slice(0, 30), temel, ust:renk(t.ust), alt:renk(t.alt), desen:DESEN_AD[t.desen] ? t.desen : 'duz', kim, zaman:Date.now() };
  const id = t.id && OZEL_KIYAFET[t.id] ? t.id : 'oz_' + sluglastir(o.ad) + '_' + Date.now().toString(36).slice(-4);
  OZEL_KIYAFET[id] = o; depo.yaz('nova-ozel-kiyafet', OZEL_KIYAFET); ozelKiyafetleriYukle();
  try { arayuzGiyim(); atolyeKiyafetCiz(); } catch(e){}
  return id;
}
function kiyafetSil(id){ delete OZEL_KIYAFET[id]; depo.yaz('nova-ozel-kiyafet', OZEL_KIYAFET); if (giyim.simdi === id) kiyafetUygula('gunluk'); ozelKiyafetleriYukle(); try { arayuzGiyim(); } catch(e){} }
/* renkleri uygula (giyme sonunda gardirop.js çağırır) */
function kiyafetBoyasi(ozel){
  const hex = (h, a) => { if (!h) return new THREE.Vector4(1, 1, 1, 0); const c = new THREE.Color(h).convertSRGBToLinear(); return new THREE.Vector4(c.r, c.g, c.b, a); };
  KUMAS_BOYA.ust.value.copy(hex(ozel?.ust, 0.92)); KUMAS_BOYA.alt.value.copy(hex(ozel?.alt || ozel?.ust, 0.92));
  vrm?.scene.traverse(o => { if (!o.isMesh) return;
    for (const m of [].concat(o.material)){ const u = m?.userData; if (!u?.kumas) continue;
      u.ilk2 ??= { renk:m.color.clone(), map:m.map };
      const ad = m.name || '', ust = /top_/.test(ad), etek = /Etek/.test(ad), alt = /bottom_/.test(ad);
      if (ust){ m.color.copy(ozel?.ust ? new THREE.Color(ozel.ust).lerp(new THREE.Color(1, 1, 1), 0.15) : u.ilk2.renk); }
      if (etek){ if (ozel?.alt && ozel.desen !== 'duz'){ m.map = desenDokusu(ozel.desen, ozel.alt); m.color.set(0xffffff); } else { m.map = u.ilk2.map; m.color.copy(ozel?.alt ? new THREE.Color(ozel.alt).lerp(new THREE.Color(1, 1, 1), 0.35) : u.ilk2.renk); } }
      if (alt && ozel?.alt){ if (ozel.desen !== 'duz'){ m.map = desenDokusu(ozel.desen, ozel.alt); m.color.set(0xffffff); } else { m.map = null; m.color.set(ozel.alt); } }
      m.needsUpdate = true; }
  });
}
