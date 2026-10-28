'use strict';
/* ---- aksesuarlar: elindeki kitap, fırça, palet, kalem ---- */
const aksesuar = {};
{ const k = new THREE.Group(); const kapak = M(0x8fc9e8, {r:0.7}), sayfa = M(0xfffdf6, {r:0.95});
  for (const s of [-1, 1]){ const yarim = new THREE.Group(); yarim.rotation.y = s*0.32; k.add(yarim);
    kutu(0.105, 0.15, 0.006, kapak, s*0.052, 0, -0.004, yarim); kutu(0.1, 0.145, 0.012, sayfa, s*0.05, 0, 0.006, yarim); }
  k.userData.kapak = kapak; k.visible = false; sahne.add(k); aksesuar.kitap = k; }
{ const f = new THREE.Group(); silindir(0.006, 0.005, 0.19, M(0xc99a6b), 0, 0, 0, f); const uc = silindir(0.009, 0.002, 0.04, M(0xe87d9b), 0, 0.11, 0, f); f.userData.uc = uc; f.visible = false; sahne.add(f); aksesuar.firca = f; }
{ const p = new THREE.Group(); silindir(0.1, 0.1, 0.008, M(0xf2d9b0, {r:0.8}), 0, 0, 0, p, {s:[1,1,0.75]});
  for (const [x, z, c] of [[-0.05,0.03,0xe87d9b],[0,0.05,0x8fc9e8],[0.05,0.02,0xffd58a],[0.04,-0.04,0x9fd8c0],[-0.03,-0.04,0xb79ce9]]) kure(0.014, M(c, {r:0.4}), x, 0.006, z, p, {s:[1,0.4,1]});
  p.visible = false; sahne.add(p); aksesuar.palet = p; }
{ const k = new THREE.Group(); silindir(0.004, 0.004, 0.13, M(0x7d6fd1), 0, 0, 0, k); k.visible = false; sahne.add(k); aksesuar.kalem = k; }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _yuk = new THREE.Vector3(0,1,0);
function aksesuarGuncelle(){
  const h = vrm.humanoid, kemik = (b, v) => h.getRawBoneNode(b).getWorldPosition(v);
  if (aksesuar.kitap.visible){
    kemik('rightHand', _a); kemik('leftHand', _b); kemik('head', _c);
    aksesuar.kitap.position.copy(_a).add(_b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.04, 0));
    aksesuar.kitap.lookAt(_c);
  }
  for (const [ad, b, uz] of [['firca','rightHand',0.1],['kalem','rightHand',0.07]]){
    if (!aksesuar[ad].visible) continue;
    kemik('rightLowerArm', _a); kemik(b, _b); const yon = _b.clone().sub(_a).normalize();
    const ileri = new THREE.Vector3(Math.sin(hareketli.yon), 0, Math.cos(hareketli.yon));
    const eksen = yon.clone().lerp(ileri, 0.55).normalize();
    aksesuar[ad].position.copy(_b).addScaledVector(eksen, uz);
    aksesuar[ad].quaternion.setFromUnitVectors(_yuk, eksen);
  }
  if (aksesuar.palet.visible){ kemik('leftHand', _a); aksesuar.palet.position.copy(_a).add(new THREE.Vector3(0, 0.02, 0)); aksesuar.palet.rotation.set(0.2, hareketli.yon, 0); }
}
function aksesuarlariGizle(){ for (const a of Object.values(aksesuar)) a.visible = false; }
