'use strict';
/* =========================================================
   KIYAFET (ortak) — kıyafet tanımları ve anında giyme.
   Hem evdeki Nova (gardirop.js) hem dışarıdaki küçük Nova (disari.html) kullanır.
   ========================================================= */
/* Nova'nın kendi kıyafetleri modelde duruyor ama başlangıçta gizli; gardırop bunları açıp kapatır. */
const KIYAFET_PARCA = { ust:'top_', alt:'bottom_', ayakkabi:'shoes_', kolye:'neck_', etek:'Kiyafet_Etek' };
const KIYAFET = {};   // parça → [mesh]
function kiyafetGoster(parca, acik){ for (const m of KIYAFET[parca] || []) m.visible = !!acik; }
const KIYAFET_TANIM = {
  ic:     { ad:'İç çamaşırı', govde:'doku/govde_renk.jpg', ek:'doku/govde_ek.png', parcalar:[] },
  gunluk: { ad:'Günlük',      govde:'doku/govde_renk.jpg', ek:'doku/govde_ek.png', parcalar:['ust', 'alt', 'ayakkabi', 'kolye'], alt:'pantolon' },
  elbise: { ad:'Elbise',      govde:'doku/kiyafet/govde_renk_elbise.jpg', ek:'doku/kiyafet/govde_ek_elbise.png', parcalar:['etek'] },
  ev:     { ad:'Ev hali',     govde:'doku/kiyafet/govde_renk_ev.jpg', ek:'doku/kiyafet/govde_ek_ev.png', parcalar:['alt'], alt:'sort' },
  pijama: { ad:'Pijama',      govde:'doku/kiyafet/govde_renk_pijama.jpg', ek:'doku/kiyafet/govde_ek_pijama.png', parcalar:['alt'], alt:'pijama' },
  spor:   { ad:'Spor',        govde:'doku/kiyafet/govde_renk_spor.jpg', ek:'doku/kiyafet/govde_ek_spor.png', parcalar:['ayakkabi'] },
};
const giyim = { simdi:'ic', mesgul:false, token:0 };

/* ---- değişim gölgelendiricisinin ortak değerleri (gercekci.js malzemeleri bunları kullanır) ---- */
const GECIS = { esik:{value:-10}, esikA:{value:-10}, yonU:{value:1}, yonA:{value:1}, aktif:{value:0}, eskiHarita:{value:null} };

/* ---- doku önbelleği ---- */
const giyimDoku = {};
function giyimDokuYukle(yol, renkli){
  if (giyimDoku[yol]) return giyimDoku[yol];
  return giyimDoku[yol] = new Promise(res => dokuYukleyici.load(yol, t => { t.flipY = false; t.colorSpace = renkli ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
}

/* ---- pantolon parçasının türleri: kendi pantolonu, pijama altı (desenli), şort (kesik, pembe) ---- */
const pijamaDeseni = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#c7b6e6'; g.fillRect(0, 0, 256, 256);
  const yildiz = (x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++){ const a = i/10*Math.PI*2 - Math.PI/2, rr = i % 2 ? r*0.45 : r; g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.closePath(); g.fill(); };
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ const x = i*64 + (j % 2)*32 + 16, y = j*64 + 16;
    g.fillStyle = '#ffe6a6'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.fillStyle = '#c7b6e6'; g.beginPath(); g.arc(x + 4, y - 3, 8, 0, 7); g.fill();
    g.fillStyle = '#f7f3ff'; yildiz(x + 32, y + 32, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.6, 0.6); t.anisotropy = 8; return t; })();   // pantolonun UV'si zaten döşenmiş (1 birim ≈ 12 cm)
function altTuru(tur){
  for (const m of KIYAFET.alt || []) for (const mat of [].concat(m.material)){
    if (!mat?.userData?.kumas) continue;
    const u = mat.userData; u.ilk ??= { map:mat.map, renk:mat.color.clone() };
    if (tur === 'pijama'){ mat.map = pijamaDeseni; mat.color.set(0xffffff); u.kesY.value = -10; }
    else if (tur === 'sort'){ mat.map = null; mat.color.set(0xdca3b0); u.kesY.value = 0.70; }   // dinlenme pozunda uyluk ortası
    else { mat.map = u.ilk.map; mat.color.copy(u.ilk.renk); u.kesY.value = -10; }
    mat.needsUpdate = true;
  }
}
function govdeMalzemeleri(){ const l = []; vrm?.scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (m?.userData?.govde) l.push(m); }); return l; }   // gövde 4 ilkelden oluşur
function parcaModu(parca, mod){ for (const m of KIYAFET[parca] || []) for (const mat of [].concat(m.material)) if (mat?.userData?.gecisMod) mat.userData.gecisMod.value = mod; }

/* ---- anında giy (yüklemede ve stüdyo temasında) ---- */
async function kiyafetUygula(ad){
  const T = KIYAFET_TANIM[ad]; if (!T || !vrm) return false;
  const [map, ek] = await Promise.all([giyimDokuYukle(T.govde, true), giyimDokuYukle(T.ek, false)]);
  if (map) for (const g of govdeMalzemeleri()){ g.map = map; g.roughnessMap = ek || g.roughnessMap; g.needsUpdate = true; }
  if (map) GECIS.eskiHarita.value = map;
  for (const p of Object.keys(KIYAFET)) kiyafetGoster(p, T.parcalar.includes(p));
  altTuru(T.alt); (typeof kiyafetBoyasi === 'function' && kiyafetBoyasi(T.ozel)); giyim.simdi = ad; depo.yaz('nova-kiyafet', ad);
  if (typeof arayuzGiyim === 'function') arayuzGiyim();
  return true;
}

