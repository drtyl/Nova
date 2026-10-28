'use strict';
/* ---- kamera açıları ---- */
const KAMERA = { tum:[[0,1.15,3.4],[0,0.92,0]], yakin:[[0.05,1.47,1.05],[0,1.41,0]], yan:[[2.7,1.2,1.3],[0,0.92,0]], tepe:[[0,4.4,1.7],[0,0.55,0]] };
let kameraGecis = null;
function kameraya(ad){
  const [p, t, o] = kameraPreset(ad); takip.x = o[0]; takip.z = o[1];
  kameraGecis = { bas:performance.now()/1000, p0:kamera.position.clone(), t0:kontrol.target.clone(), p1:new THREE.Vector3(...p), t1:new THREE.Vector3(...t) };
  for (const b of document.querySelectorAll('.kameralar button')) b.setAttribute('aria-pressed', b.dataset.k === ad);
}
