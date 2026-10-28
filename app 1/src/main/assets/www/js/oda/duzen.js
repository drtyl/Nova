'use strict';
/* =========================================================
   ODA TASARIMI — eşyaları taşı / döndür, zemin ve duvar kaplamasını değiştir.
   Eşya yer değiştirince engelleri (yol bulma) ve etkinlik noktaları da onunla birlikte taşınır.
   ========================================================= */
const MOBILYA = {
  yatak:    { ad:'Yatak (pil)',           g:yatak,       engel:[0], istasyon:['uyu'] },
  komodin:  { ad:'Komodin',               g:komodin,     engel:[1] },
  kitaplik: { ad:'Kitaplık',              g:kitaplik,    engel:[2] },
  bitki:    { ad:'Büyük bitki',           g:buyukBitki,  engel:[3] },
  masa:     { ad:'Çalışma masası',        g:masa,        engel:[4], istasyon:['yaz'], bakis:['yaz'] },
  sandalye: { ad:'Sandalye',              g:sandalye,    engel:[5] },
  sovale:   { ad:'Şövale',                g:sovale,      engel:[6], istasyon:['resim'], bakis:['resim'] },
  tabure:   { ad:'Boya taburesi',         g:tabure,      engel:[7] },
  koltuk:   { ad:'Okuma koltuğu',         g:koltuk,      engel:[8], istasyon:['kitap', 'otur'] },
  sehpa:    { ad:'Sehpa',                 g:sehpa,       engel:[9] },
  lamba:    { ad:'Ayaklı lamba',          g:ayakliLamba, engel:[10] },
  dolap:    { ad:'Gardırop',              g:dolap,       engel:[11], dolap:true },
  bobin:    { ad:'Şarj bobini (halı)',    g:bobin,       engel:[] },
};
const BAKIS_NOKTA = { resim:new THREE.Vector3(1.55, 1.25, 1.05), yaz:new THREE.Vector3(2.12, 0.76, -0.28) };
const ODA_SINIR = { x:[-2.35, 2.35], z:[-2.1, 2.0] };
/* ilk (tasarlanmış) durumları sakla */
for (const m of Object.values(MOBILYA)){
  m.p0 = m.g.position.clone(); m.r0 = m.g.rotation.y;
  m.engel0 = m.engel.map(i => JSON.parse(JSON.stringify(ENGEL[i])));
  m.ist0 = (m.istasyon || []).map(k => ({ yaklas:[...ISTASYON[k].yaklas], konum:[...ISTASYON[k].konum], yon:ISTASYON[k].yon }));
  m.bak0 = (m.bakis || []).map(k => BAKIS_NOKTA[k].clone());
  if (m.dolap) m.dolap0 = [...DOLAP_DUR];
}
let DUZEN = depo.oku('nova-oda-duzen', { esya:{}, zemin:'pcb', duvar:'devre' });
const donustur = (m, d) => {   // dünya (x,z) noktası → eşyanın yeni yerine göre
  const c = Math.cos(d.r), s = Math.sin(d.r);
  return (x, z) => { const ox = x - m.p0.x, oz = z - m.p0.z; return [m.p0.x + ox*c + oz*s + d.x, m.p0.z - ox*s + oz*c + d.z]; };
};
function esyaUygula(ad){
  if (typeof TEMAS !== 'undefined') TEMAS.hazir = false;   // kutular yeniden toplansın
  const m = MOBILYA[ad], d = Object.assign({x:0, z:0, r:0}, DUZEN.esya[ad]), T = donustur(m, d);
  m.g.position.set(m.p0.x + d.x, m.p0.y, m.p0.z + d.z); m.g.rotation.y = m.r0 + d.r;
  m.engel.forEach((i, j) => {
    const e0 = m.engel0[j];
    if (e0.d){ const [x, z] = T(e0.d[0], e0.d[1]); ENGEL[i] = {d:[x, z, e0.d[2]]}; }
    else { const k = e0.k, kose = [[k[0], k[2]], [k[1], k[2]], [k[0], k[3]], [k[1], k[3]]].map(([x, z]) => T(x, z));
      ENGEL[i] = {k:[Math.min(...kose.map(p => p[0])), Math.max(...kose.map(p => p[0])), Math.min(...kose.map(p => p[1])), Math.max(...kose.map(p => p[1]))]}; }
  });
  (m.istasyon || []).forEach((k, j) => { const s0 = m.ist0[j], I = ISTASYON[k];
    I.yaklas = T(...s0.yaklas); I.konum = T(...s0.konum); I.yon = s0.yon + d.r; });
  (m.bakis || []).forEach((k, j) => { const b = m.bak0[j], [x, z] = T(b.x, b.z); BAKIS_NOKTA[k].set(x, b.y, z); });
  if (m.dolap){ const [x, z] = T(...m.dolap0); DOLAP_DUR[0] = x; DOLAP_DUR[1] = z; m.dolapYon = -Math.PI/2 + d.r; }
}
/* kaplamalar */
const ZEMIN_SECENEK = {
  pcb:   ['Devre kartı',   () => M(0x9fb0a8, {doku:'pcb', tekrar:[3.25, 2.75], metal:true, yansima:0.9, normal:0.8})],
  parke: ['Meşe parke',    () => M(0xffffff, {doku:'parke', tekrar:[3.7, 3.1], yansima:0.5, normal:0.6})],
  hali:  ['Yumuşak halı',  () => M(0xd9cfc4, {doku:'yun', tekrar:[7, 6], normal:0.8})],
  beton: ['Cilalı beton',  () => M(0xb9b7b2, {doku:'siva', tekrar:[2, 2], normal:0.25, r:0.35, yansima:0.8})],
  metal: ['Fırçalı metal', () => M(0xffffff, {doku:'aluminyum', tekrar:[3, 3], metal:true, yansima:1, normal:0.12})],
};
const DUVAR_SECENEK = {
  devre: ['Devre kartı',   () => [M(0xa9b6b0, {doku:'pcb', tekrar:[3.2, 1.7], metal:true, yansima:0.8, normal:0.6}), M(0xffffff, {doku:'aluminyum', tekrar:[1, 2], metal:true, yansima:1, normal:0.12})]],
  krem:  ['Krem sıva',     () => [M(0xefe3df, {doku:'siva', tekrar:[2, 1], normal:0.18}), M(0xf3ebe6, {doku:'siva', tekrar:[1.8, 1], normal:0.18})]],
  pembe: ['Gül kurusu',    () => [M(0xe6c3c3, {doku:'siva', tekrar:[2, 1], normal:0.18}), M(0xf0d6d3, {doku:'siva', tekrar:[1.8, 1], normal:0.18})]],
  lacivert:['Gece mavisi', () => [M(0x3a4566, {doku:'siva', tekrar:[2, 1], normal:0.18}), M(0x46517a, {doku:'siva', tekrar:[1.8, 1], normal:0.18})]],
  metal: ['Alüminyum',     () => [M(0xffffff, {doku:'aluminyum', tekrar:[2, 1], metal:true, yansima:1, normal:0.12}), M(0xffffff, {doku:'aluminyum', tekrar:[1, 2], metal:true, yansima:1, normal:0.12})]],
};
const DUVARLAR = { arka:[], yan:[] };
oda.traverse(o => { if (!o.isMesh) return; if (o.material === duvarMat) DUVARLAR.arka.push(o); if (o.material === yanDuvarMat) DUVARLAR.yan.push(o); });
function kaplamaUygula(){
  const z = ZEMIN_SECENEK[DUZEN.zemin] || ZEMIN_SECENEK.pcb; odaZemin.material = z[1]();
  const [a, y] = (DUVAR_SECENEK[DUZEN.duvar] || DUVAR_SECENEK.devre)[1]();
  for (const m of DUVARLAR.arka) m.material = a; for (const m of DUVARLAR.yan) m.material = y;
  try { sonDilim = null; odaIsikGuncelle(true); } catch(e){}
}
function duzenKaydet(){ depo.yaz('nova-oda-duzen', DUZEN); }
function duzenUygula(){ for (const ad of Object.keys(MOBILYA)) esyaUygula(ad); kaplamaUygula(); }
duzenUygula();

/* ---- düzenleme modu ---- */
const duzenle = { secili:null, kutu:null };
function esyaSec(ad){
  duzenle.secili = ad;
  if (duzenle.kutu){ sahne.remove(duzenle.kutu); duzenle.kutu.geometry.dispose(); duzenle.kutu = null; }
  if (ad){ duzenle.kutu = new THREE.BoxHelper(MOBILYA[ad].g, 0x5ee6d4); duzenle.kutu.material.depthTest = false; duzenle.kutu.renderOrder = 9; sahne.add(duzenle.kutu); }
  try { odaEkranCiz(); } catch(e){}
}
function esyaOynat(dx, dz, dr){
  const ad = duzenle.secili; if (!ad) return;
  const m = MOBILYA[ad], d = Object.assign({x:0, z:0, r:0}, DUZEN.esya[ad]);
  // kamera tepeden bakarken "yukarı" = odanın arkası (−z)
  d.x += dx; d.z += dz; d.r = ((d.r + dr) % (Math.PI*2));
  d.x = Math.max(ODA_SINIR.x[0] - m.p0.x, Math.min(ODA_SINIR.x[1] - m.p0.x, d.x));
  d.z = Math.max(ODA_SINIR.z[0] - m.p0.z, Math.min(ODA_SINIR.z[1] - m.p0.z, d.z));
  DUZEN.esya[ad] = d; esyaUygula(ad); duzenKaydet();
  duzenle.kutu?.update();
}
function esyaSifirla(ad){ delete DUZEN.esya[ad]; esyaUygula(ad); duzenKaydet(); duzenle.kutu?.update(); }
function duzenModu(ac){
  app.classList.toggle('duzenleniyor', ac);
  if (ac){ if (tema !== 'oda') temaAyarla('oda');
    const dikey = (kamera.aspect || 1) < 0.9;
    kamera.fov = dikey ? 62 : 40; kamera.updateProjectionMatrix();   // telefonda bütün oda görünsün: yüksekten, tepeden
    kameraGecis = { bas:performance.now()/1000, p0:kamera.position.clone(), p1:new THREE.Vector3(takip.x, dikey ? 10.5 : 7.8, takip.z + (dikey ? 1.6 : 1.4)), t0:kontrol.target.clone(), t1:new THREE.Vector3(takip.x, 0, takip.z - 0.1) }; }
  else { esyaSec(null); kamera.fov = 30; kamera.updateProjectionMatrix(); kameraya('tum'); }
}
function odaDuzenMetni(){
  const tasinan = Object.keys(DUZEN.esya).filter(k => DUZEN.esya[k] && (DUZEN.esya[k].x || DUZEN.esya[k].z || DUZEN.esya[k].r)).map(k => MOBILYA[k].ad);
  return `Odanın kaplaması: zemin ${ZEMIN_SECENEK[DUZEN.zemin]?.[0] || 'devre kartı'}, duvarlar ${DUVAR_SECENEK[DUZEN.duvar]?.[0] || 'devre kartı'}.${tasinan.length ? ' Kullanıcı şu eşyaların yerini değiştirdi: ' + tasinan.join(', ') + '.' : ''}`;
}
