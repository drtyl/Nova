'use strict';
/* =========================================================
   8. HER KARE — katmanları birleştir, sınırla, uygula
   ========================================================= */
const manuel = {};
const saat = new THREE.Clock();
const jest = { w:0, faz:[0,1,2,3].map(() => Math.random()*9) };
const sakkad = { v:new THREE.Vector3(), sonraki:0 };
let sinirsiz = false;   // gerçek kayıt (klip) oynarken eklem sınırları uygulanmaz; kayıt zaten insan sınırları içinde
function uygula(poz){
  const h = vrm.humanoid;
  for (const [b, v] of Object.entries(poz)){
    if (b === '_kok') continue;
    const n = h.getNormalizedBoneNode(kemikAdi(b)); if (!n) continue;
    const s = sinirsiz ? v.map(x => +x || 0) : sikistir(b, v);
    if (vrm0) n.rotation.set(-s[0]*D2R, s[1]*D2R, -s[2]*D2R, 'XYZ'); else n.rotation.set(s[0]*D2R, s[1]*D2R, s[2]*D2R, 'XYZ');
  }
  const k = poz._kok || [0,0,0];
  h.getNormalizedBoneNode('hips').position.set(kokDinlenme.x + (vrm0?-k[0]:k[0]), kokDinlenme.y + k[1], kokDinlenme.z + (vrm0?-k[2]:k[2]));
}
function ekle(poz, b, v, w=1){ const p = poz[b] || varsayilan(b); poz[b] = [p[0]+v[0]*w, p[1]+v[1]*w, p[2]+v[2]*w]; }
let sonEtkilesim = 0;
function dongu(){
  requestAnimationFrame(dongu);
  if (typeof perfKare === 'function' && !perfKare()) return;   // pil: kare hızı sınırı
  const dt = Math.min(0.05, saat.getDelta()), simdi = performance.now()/1000;
  if (kameraGecis){
    const u = yumusak(Math.min(1, (simdi - kameraGecis.bas)/0.9));
    kamera.position.lerpVectors(kameraGecis.p0, kameraGecis.p1, u); kontrol.target.lerpVectors(kameraGecis.t0, kameraGecis.t1, u);
    if (u >= 1) kameraGecis = null;
  }
  if (vrm){ aktGuncelle(dt); hareketliGuncelle(dt); kameraTakip(dt); icGuncelle(dt); }
  if (tema === 'oda'){ donanimKare(dt); dolapKare(dt); }
  kontrol.update();
  if (vrm){
    const tempo = akt.ad === 'uyu' && akt.durum === 'yapiyor' ? 0.45 : VERI.ruh_halleri[ruh].tempo;
    let poz = kopyala(oynatici.ornekle(simdi));
    const hareketVar = oynatici.calisiyor();
    // bekleme: hiçbir şey yapmazken gerçek bir insanın bekleyişi (ağırlık aktarma, küçük kıpırdanmalar)
    const beklemeHedef = !hareketVar && durus.w < 0.02 && !akt.gecis && $('nefes').checked ? 1 : 0;
    BEKLEME.w += (beklemeHedef - BEKLEME.w)*Math.min(1, dt*(beklemeHedef ? 1.2 : 4));
    if (BEKLEME.w > 0.005){ const b = beklemePozu(dt); delete b.head; delete b.neck; poz = karistir(poz, b, BEKLEME.w*(1 - hareketli.w)); }
    sinirsiz = !!oynatici.aktif?.klip || hareketli.w > 0.05 || BEKLEME.w > 0.3 || durus.w > 0.05;
    // el şekli (hareket kendi parmaklarını tanımlamadıysa)
    elGuncelle(dt);
    for (const [b, v] of Object.entries(elDeger)) if (!(b in poz)) poz[b] = [...v];
    // ruh hali
    ruhGuncelle(dt);
    for (const [b, v] of Object.entries(ruhDeger)) ekle(poz, b, v);
    if (VERI.ruh_halleri[ruh].zipla && !hareketVar) ekle(poz, '_kok', [0, Math.abs(Math.sin(simdi*Math.PI*1.6))*0.012, 0]);
    // nefes + ağırlık aktarma
    if ($('nefes').checked){
      const n = Math.sin(simdi*2*Math.PI/(4.2/tempo)), s = Math.sin(simdi*0.55*tempo), a = Math.sin(simdi*0.21*tempo);
      ekle(poz, 'chest', [-1.3*n,0,0]); ekle(poz, 'upperChest', [-0.9*n,0,0]);
      ekle(poz, 'rightShoulder', [0,0,-1.3*n]); ekle(poz, 'leftShoulder', [0,0,1.3*n]);
      ekle(poz, 'spine', [0,0.7*s,0.9*s]); ekle(poz, 'neck', [0,0,-0.7*s]);
      const w = (hareketVar ? 0.3 : 1)*(1 - hareketli.w)*(1 - durus.w)*(1 - BEKLEME.w);
      ekle(poz, 'hips', [0,0,2.2*a], w); ekle(poz, 'spine', [0,0,-1.6*a], w); ekle(poz, '_kok', [0.012*a,0,0], w);
      ekle(poz, 'rightUpperLeg', [0,0,-2.2*a], w); ekle(poz, 'leftUpperLeg', [0,0,-2.2*a], w);
    }
    // yürüme
    yurumeKatmani(poz, hareketVar ? 0.25 : 1);
    durusKatmani(poz);
    // konuşurken kendiliğinden el-kol jestleri ve baş vurguları (sabit klip değil, her seferinde farklı)
    const konusuyor = simdi - yuz.agizBas < yuz.agizSure || platform.konusuyor || (($('sesli').checked || sesliYanit) && window.speechSynthesis?.speaking);
    jest.w += ((konusuyor ? 1 : 0) - jest.w)*Math.min(1, dt*3);
    if (jest.w > 0.01){
      const g = jest.w*(hareketVar ? 0.2 : 1)*(1 - 0.6*hareketli.w)*(akt.ad === 'uyu' ? 0 : 1), t = simdi;
      const n = (i, f1, f2) => Math.sin(t*f1 + jest.faz[i])*0.6 + Math.sin(t*f2 + jest.faz[i]*1.7)*0.4;
      ekle(poz, 'rightLowerArm', [0, 30*Math.max(0, n(0,1.7,2.9)), 0], g);
      ekle(poz, 'rightUpperArm', [0, 10*n(1,1.1,2.3), -7*Math.max(0, n(0,1.7,2.9))], g);
      ekle(poz, 'rightHand', [0, 0, -14*n(2,2.2,3.1)], g);
      ekle(poz, 'leftLowerArm', [0, -24*Math.max(0, n(3,1.5,2.6)), 0], g*0.8);
      ekle(poz, 'leftUpperArm', [0, -8*n(2,1.3,2.1), 6*Math.max(0, n(3,1.5,2.6))], g*0.8);
      const sesEnerji = AGIZ.reduce((a, k) => a + (yuz[k] || 0), 0);
      ekle(poz, 'head', [5*sesEnerji, 3*n(1,0.9,1.6), 3*n(3,0.7,1.3)], g);
    }
    // bakış: hedefi seç, başı kısmen çevir, gözler tam baksın
    const kafaPoz = vrm.humanoid.getRawBoneNode('head').getWorldPosition(_v.clone());
    if (bakis.gecici && simdi < bakis.gecBit) bakis.hedef.copy(yerelDunya(BAKIS_YON[bakis.gecici]));
    else if (akt.bakis && !(simdi - ic.sonKullanici < 10)) bakis.hedef.copy(akt.bakis === 'kitap' ? aksesuar.kitap.position : akt.bakis);
    else if (dusunuyor) bakis.hedef.copy(yerelDunya([0.7, 2.4, 1.6]));
    else if (bakis.mod === 'imlec' && simdi - bakis.imlecZaman < 4) bakis.hedef.copy(bakis.imlec);
    else if (bakis.mod === 'serbest' || simdi - ic.sonKullanici > 25 && komutMesgul === 'serbest') bakis.hedef.copy(yerelDunya([0, 1.45, 5]));
    else bakis.hedef.copy(kamera.position);
    bakisHedef.position.lerp(bakis.hedef, Math.min(1, dt*8));
    const d = bakisHedef.position.clone().sub(kafaPoz);
    const cy = Math.cos(hareketli.yon), sy = Math.sin(hareketli.yon), lx = d.x*cy - d.z*sy, lz = d.x*sy + d.z*cy;
    const yaw = Math.atan2(lx, lz)*R2D, pitch = Math.atan2(d.y, Math.hypot(lx, lz))*R2D;
    const bw = durus.tur === 'yatma' && durus.w > 0.1 ? 0 : akt.durum === 'yapiyor' && simdi - ic.sonKullanici < 10 ? 0.85 : hareketVar ? 0.35 : 1, ky = Math.max(-35, Math.min(35, yaw*0.5))*bw, kx = Math.max(-20, Math.min(20, -pitch*0.45))*bw;
    bakis.kafa[0] += (kx - bakis.kafa[0])*Math.min(1, dt*5); bakis.kafa[1] += (ky - bakis.kafa[1])*Math.min(1, dt*5);
    ekle(poz, 'head', [bakis.kafa[0], bakis.kafa[1]*0.7, 0]); ekle(poz, 'neck', [bakis.kafa[0]*0.3, bakis.kafa[1]*0.3, 0]);
    if (dusunuyor) ekle(poz, 'head', [-4, 0, 8]);
    Object.assign(poz, kopyala(manuel));
    uygula(poz);
    if (simdi > sakkad.sonraki){ sakkad.v.set((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.28, 0); if (Math.random() < 0.35) sakkad.v.set(0,0,0); sakkad.sonraki = simdi + 0.5 + Math.random()*2.2; }
    vrm.lookAt?.lookAt(bakisHedef.position.clone().add(sakkad.v));
    yuzGuncelle(simdi, dt);
    vrm.update(dt);
    temasCoz(dt);
    aksesuarGuncelle(); golge.visible = durus.tur !== 'yatma';
    const kalca = vrm.humanoid.getRawBoneNode('hips').getWorldPosition(_v.clone());
    golge.position.x = kalca.x; golge.position.z = kalca.z;
    iskeletGuncelle(); balon.guncelle(simdi); etiketGuncelle();
    durumYaz();
  }
  gorusGuncelle(dt);
  sahneCiz();
}
dongu();
