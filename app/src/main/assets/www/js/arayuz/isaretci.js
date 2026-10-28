'use strict';
/* ---- işaretçi: imleç takibi, eklem seçme, Nova'ya dokunma ---- */
const isin = new THREE.Raycaster(), ndc = new THREE.Vector2();
let basNokta = null;
tuval.addEventListener('pointermove', e => {
  const r = tuval.getBoundingClientRect();
  ndc.set(((e.clientX - r.left)/r.width)*2-1, -((e.clientY - r.top)/r.height)*2+1);
  isin.setFromCamera(ndc, kamera);
  const duzlem = new THREE.Plane(new THREE.Vector3(0,0,1), -0.9);
  if (isin.ray.intersectPlane(duzlem, bakis.imlec)) bakis.imlecZaman = performance.now()/1000;
});
tuval.addEventListener('pointerdown', e => { basNokta = [e.clientX, e.clientY]; });
tuval.addEventListener('pointerup', e => {
  if (!basNokta || !vrm) return;
  const kaydi = Math.hypot(e.clientX - basNokta[0], e.clientY - basNokta[1]); basNokta = null;
  if (kaydi > 6) return;
  const r = tuval.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const ekran = v => { const p = v.clone().project(kamera); return [(p.x*0.5+0.5)*r.width, (-p.y*0.5+0.5)*r.height]; };
  if (gorunum !== 'model'){
    let en = null, enD = 22;
    for (const ek of eklemler){ const [sx, sy] = ekran(ek.m.position); const dd = Math.hypot(sx-x, sy-y); if (dd < enD){ enD = dd; en = ek.b; } }
    if (en){ kemikSecildi(en); return; }
  }
  // Nova'ya dokunuldu mu? (baş ile ayak arasındaki şerit)
  const kafa = ekran(vrm.humanoid.getRawBoneNode('head').getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0.12,0)));
  const ayak = ekran(vrm.humanoid.getRawBoneNode('hips').getWorldPosition(new THREE.Vector3()).setY(0));
  const gen = Math.abs(ayak[1] - kafa[1]) * 0.22;
  if (y > kafa[1] && y < ayak[1] && Math.abs(x - (kafa[0]+ayak[0])/2) < gen){ hih(); return; }
  // zemine dokunuldu → oraya yürü
  if (gorunum !== 'model') return;
  ndc.set((x/r.width)*2-1, -(y/r.height)*2+1); isin.setFromCamera(ndc, kamera);
  if (tema === 'oda'){
    for (const hit of isin.intersectObjects(oda.children, true)){
      let o = hit.object; while (o && !o.userData.istasyon) o = o.parent;
      if (o){ ic.sonKullanici = performance.now()/1000; ic.sikilma = 0; calistir([{aktivite:o.userData.istasyon}], {kaynak:'dokunma'}).catch(() => {}); return; }
      if (hit.object !== odaZemin) break;
      break;
    }
  }
  const nokta = new THREE.Vector3();
  if (isin.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), 0), nokta) && nokta.distanceTo(kamera.position) < 14 && !(tema === 'oda' && engelde(nokta.x, nokta.z, 0.1))){
    ic.sonKullanici = performance.now()/1000; ic.sikilma = 0; nesil++; komutMesgul = null; oynatici.dur(); siraGoster(null);
    git(nokta.x, nokta.z, 'kamera');
  }
});
function hih(){
  bakis.gecici = null;
  if (akt.ad && akt.ad !== 'uyu'){ kullaniciGeldi(false); calistir([{ifade:'saskin', yogunluk:0.5, soz:'Hıh?'}], {kaynak:'dokunma'}).catch(() => {}); return; }
  kullaniciGeldi(false);
  calistir([{poz:{head:[-6,0,10], neck:[-3,0,3]}, sure:1.1, ifade:'saskin', yogunluk:0.55, soz:'Hıh?'}], {kaynak:'dokunma'});
}
