'use strict';
/* =========================================================
   7. İSKELET GÖRÜNÜMÜ — neon eklemler, tıklanabilir
   ========================================================= */
const iskelet = new THREE.Group(); iskelet.visible = false; iskelet.renderOrder = 999; sahne.add(iskelet);
let eklemler = [], cizgiGeo, seciliKemik = 'rightUpperArm', gorunum = 'model';
const EKLEM_RENK = new THREE.Color(0x6a3ff0), SECILI_RENK = new THREE.Color(0xe0457b); let cizgiMat = null;
function iskeletKur(){
  const hamDugum = new Map(KEMIKLER.map(b => [vrm.humanoid.getRawBoneNode(b), b]));
  const cizgiler = [];
  for (const b of KEMIKLER){
    if (/Eye/.test(b)) continue;
    const parmak = PARMAK.test(b), r = parmak ? 0.0065 : /Hand|Foot|Toes/.test(b) ? 0.012 : b === 'head' ? 0.022 : 0.016;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshBasicMaterial({color:EKLEM_RENK.clone(), depthTest:false, transparent:true, opacity:0.95}));
    m.renderOrder = 1000; iskelet.add(m);
    let p = vrm.humanoid.getRawBoneNode(b).parent; while (p && !hamDugum.has(p)) p = p.parent;
    const ebeveyn = p ? hamDugum.get(p) : null;
    eklemler.push({b, m, ebeveyn, dugum:vrm.humanoid.getRawBoneNode(b)});
    if (ebeveyn) cizgiler.push([b, ebeveyn]);
  }
  cizgiGeo = new THREE.BufferGeometry(); cizgiGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cizgiler.length*6), 3));
  cizgiGeo.userData.cifler = cizgiler;
  const cizgi = new THREE.LineSegments(cizgiGeo, cizgiMat = new THREE.LineBasicMaterial({color:new THREE.Color(TEMA[tema].cizgi), depthTest:false, transparent:true, opacity:0.9}));
  cizgi.renderOrder = 999; cizgi.frustumCulled = false; iskelet.add(cizgi);
}
const _v = new THREE.Vector3();
function iskeletGuncelle(){
  if (!iskelet.visible) return;
  const konum = {};
  for (const e of eklemler){
    e.dugum.getWorldPosition(e.m.position); konum[e.b] = e.m.position;
    const s = e.b === seciliKemik; e.m.material.color.copy(s ? SECILI_RENK : EKLEM_RENK); e.m.scale.setScalar(s ? 1.9 : 1);
  }
  const a = cizgiGeo.attributes.position;
  cizgiGeo.userData.cifler.forEach(([b, p], i) => { const x = konum[b], y = konum[p]; if (x && y){ a.setXYZ(i*2, x.x, x.y, x.z); a.setXYZ(i*2+1, y.x, y.y, y.z); } });
  a.needsUpdate = true;
}
function gorunumAyarla(g){
  gorunum = g; iskelet.visible = g !== 'model';
  vrm.scene.traverse(o => { if (o.isMesh) o.visible = g !== 'xray'; });
  for (const b of document.querySelectorAll('.gorunum button')) b.setAttribute('aria-pressed', b.dataset.g === g);
  $('etiket3d').hidden = g === 'model';
}
function etiketGuncelle(){
  if (gorunum === 'model') return;
  const e = eklemler.find(e => e.b === seciliKemik); if (!e) return;
  const p = e.m.position.clone().project(kamera), r = sahneEl.getBoundingClientRect(), el = $('etiket3d');
  el.textContent = kemikEtiketi(seciliKemik);
  el.style.transform = `translate(${(p.x*0.5+0.5)*r.width + 12}px, ${(-p.y*0.5+0.5)*r.height - 10}px)`;
}
