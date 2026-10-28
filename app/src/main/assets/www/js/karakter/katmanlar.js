'use strict';
/* =========================================================
   6. KATMANLAR — el şekli, ruh hali, bakış, yüz
   ========================================================= */
// El şekli
const elHedef = { sag:'rahat', sol:'rahat' };
let elTaban = { sag:'rahat', sol:'rahat' };
function elSekli(ad, taraf){ const p = VERI.el_sekilleri[ad] || VERI.el_sekilleri.rahat; return taraf === 'sol' ? aynaPoz(p) : kopyala(p); }
function elAyarla(el){
  if (!el) return;
  if (typeof el === 'string') el = {sag:el, sol:el};
  for (const t of ['sag','sol']) if (el[t] && VERI.el_sekilleri[el[t]]) elHedef[t] = el[t];
}
function elGuncelle(dt){
  const hedef = {...elSekli(elHedef.sag,'sag'), ...elSekli(elHedef.sol,'sol')}, h = Math.min(1, dt*12);
  for (const [b, v] of Object.entries(hedef)){ const c = elDeger[b] || [0,0,0]; elDeger[b] = [c[0]+(v[0]-c[0])*h, c[1]+(v[1]-c[1])*h, c[2]+(v[2]-c[2])*h]; }
}
// Ruh hali: duruşa eklenen kalıcı katman + tempo + taban ifade
let ruh = 'notr', ruhDeger = {};
function ruhHali(ad){ if (!VERI.ruh_halleri[ad]) return; ruh = ad; }
function ruhGuncelle(dt){
  const hedef = VERI.ruh_halleri[ruh].poz, h = Math.min(1, dt*2.2);
  for (const b of new Set([...Object.keys(hedef), ...Object.keys(ruhDeger)])){
    const v = hedef[b] || [0,0,0], c = ruhDeger[b] || [0,0,0];
    ruhDeger[b] = [c[0]+(v[0]-c[0])*h, c[1]+(v[1]-c[1])*h, c[2]+(v[2]-c[2])*h];
  }
}
// Bakış
const bakis = { mod:'kamera', gecici:null, gecBit:0, imlec:new THREE.Vector3(0,1.4,3), imlecZaman:-99, kafa:[0,0], hedef:new THREE.Vector3() };
const bakisHedef = new THREE.Object3D(); sahne.add(bakisHedef);
const BAKIS_YON = { sol:[1.6,1.45,1.4], sag:[-1.6,1.45,1.4], yukari:[0.2,2.9,1.4], asagi:[0,0.3,1.3] };
let dusunuyor = false;
// Yüz
const yuz = { hedef:{}, deger:{}, kirpSonraki:2, kirpBas:-1, agiz:[], agizBas:0, agizSure:0, komutIfade:null };
function ifadeAyarla(ad, yog=0.8){ yuz.komutIfade = (ad && ad !== 'notr' && IFADE[ad]) ? [ad, Math.max(0, Math.min(1, +yog || 0))] : null; }
function simdikiIfade(){ if (yuz.komutIfade) return yuz.komutIfade; const r = VERI.ruh_halleri[ruh].ifade; return r || null; }
// Konuşma → ağız şekilleri
const SESLI = {a:'aa', e:'ee', ı:'ih', i:'ih', o:'oh', ö:'oh', u:'ou', ü:'ou'};
function agizCizelgesi(metin){
  const c = []; let t = 0, onceki = null;
  for (const h of metin.toLocaleLowerCase('tr')){
    let d, s = null, g = 0;
    if (SESLI[h]){ s = SESLI[h]; d = 0.105; g = 0.85; onceki = s; }
    else if ('mbp'.includes(h)){ d = 0.075; }
    else if ('fv'.includes(h)){ s = 'ih'; g = 0.2; d = 0.06; }
    else if (/[.,!?;:…]/.test(h)){ d = 0.24; onceki = null; }
    else if (h === ' '){ d = 0.05; }
    else { s = onceki; g = 0.28; d = 0.055; }
    c.push({t, s, d, g}); t += d;
  }
  return {c, sure:t};
}
let sesler = [];
function sesleriYukle(){
  if (platform.native){
    const l = platform.sesler(), sec = $('sesSec'), once = depo.oku('nova-ses', '');
    sec.innerHTML = '<option value="">Otomatik</option>';
    for (const v of l){ const o = document.createElement('option'); o.value = v.ad; o.textContent = v.ad.replace(/^tr-tr-x-/, '') + (v.internet ? ' (internet)' : ''); sec.appendChild(o); }
    sec.value = once; $('sesNot').textContent = l.length ? l.length + ' Türkçe ses bulundu' : 'Telefonda Türkçe ses bulunamadı';
    return;
  }
  if (!('speechSynthesis' in window)) { $('sesNot').textContent = 'Bu tarayıcıda ses yok'; return; }
  sesler = speechSynthesis.getVoices().filter(v => /^tr/i.test(v.lang));
  const sec = $('sesSec'), once = sec.value; sec.innerHTML = '<option value="">Otomatik</option>';
  for (const v of sesler){ const o = document.createElement('option'); o.value = v.name; o.textContent = v.name; sec.appendChild(o); }
  sec.value = once; $('sesNot').textContent = sesler.length ? sesler.length + ' Türkçe ses bulundu' : 'Türkçe ses bulunamadı';
}
function konus(metin){
  const {c, sure} = agizCizelgesi(metin);
  yuz.agiz = c; yuz.agizBas = performance.now()/1000; yuz.agizSure = sure;
  balon.goster(metin, sure + 1.4);
  let bitti = Promise.resolve();
  const sesliOlsun = $('sesli').checked || sesliYanit;
  const S = (typeof KISILIK !== 'undefined' && KISILIK.ses) || {perde:1.15, hiz:1.02};
  if (sesliOlsun && platform.native){
    yuz.agizSure = Math.max(sure, metin.length*0.075);
    bitti = platform.konus(metin, {perde:S.perde, hiz:S.hiz, ses:$('sesSec').value}).then(() => { yuz.agizSure = 0; });
  } else if (sesliOlsun && 'speechSynthesis' in window){
    bitti = new Promise(res => {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(metin); u.lang = 'tr-TR'; u.pitch = S.perde; u.rate = S.hiz;
        const v = sesler.find(v => v.name === $('sesSec').value) || sesler.find(v => /female|kadın|yelda|seda|filiz/i.test(v.name)) || sesler[0];
        if (v) u.voice = v;
        u.onend = u.onerror = () => res();
        // ağız, gerçek sesin süresine yayılsın
        u.onstart = () => { yuz.agizBas = performance.now()/1000; };
        speechSynthesis.speak(u);
        setTimeout(res, (sure*2.6 + 2)*1000);
      } catch(e){ res(); }
    });
  }
  return {sure, bitti};
}
const balon = {
  el:$('balon'), bit:0,
  goster(metin, sn, dus=false){ this.el.textContent = metin; this.el.classList.toggle('dus', dus); this.el.hidden = false; this.bit = performance.now()/1000 + sn; },
  gizle(){ this.el.hidden = true; },
  guncelle(simdi){
    if (this.el.hidden) return;
    if (simdi > this.bit){ this.el.hidden = true; return; }
    // Balon yüzü kapatmaz: başın yanına (yer varsa sağına, yoksa soluna) oturur; yer yoksa altta altyazı olur.
    const r = sahneEl.getBoundingClientRect(), mobil = r.width <= 760, acik = app.classList.contains('acik');
    const panelR = $('panel').getBoundingClientRect();
    const sagSinir = acik && !mobil ? r.width - panelR.width : r.width;
    const altSinir = acik && mobil ? panelR.top - r.top : r.height - 78;
    const kafa = vrm.humanoid.getRawBoneNode('head').getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.07, 0));
    const p = kafa.clone().project(kamera), q = kafa.clone().add(new THREE.Vector3(0, 0.13, 0)).project(kamera);
    const hx = (p.x*0.5+0.5)*r.width, hy = (-p.y*0.5+0.5)*r.height;
    const yar = Math.max(16, Math.abs((-q.y*0.5+0.5)*r.height - hy));
    const w = Math.min(this.el.offsetWidth, 240), h = this.el.offsetHeight;
    const uzun = this.el.textContent.length > 120, onde = p.z < 1;
    let mod = 'alt', x, y;
    if (!uzun && onde && hx + yar + 14 + w < sagSinir - 10){ mod = 'sag'; x = hx + yar + 14; }
    else if (!uzun && onde && hx - yar - 14 - w > 10){ mod = 'sol'; x = hx - yar - 14 - w; }
    if (mod !== 'alt'){
      y = Math.max(64, Math.min(altSinir - h - 8, hy - h*0.6));
      this.el.style.setProperty('--ok', Math.max(12, Math.min(h - 12, hy - y)) + 'px');
    } else { x = Math.max(12, (sagSinir - this.el.offsetWidth)/2); y = altSinir - h - 12; }
    for (const m of ['sag','sol','alt']) this.el.classList.toggle('b-' + m, m === mod);
    this.el.style.transform = `translate(${x}px, ${y}px)`;
  }
};
function yuzGuncelle(simdi, dt){
  const em = vrm.expressionManager; if (!em) return;
  const [ia, iy] = simdikiIfade() || [null, 0];
  for (const k of Object.keys(IFADE)){
    const h = k === ia ? iy : 0, d = yuz.deger[k] || 0;
    yuz.deger[k] = d + (h-d)*Math.min(1, dt*6);
    if (ifadeAdlari[k]) em.setValue(ifadeAdlari[k], yuz.deger[k]);
  }
  const tempo = VERI.ruh_halleri[ruh].tempo;
  let kirp = 0;
  if (simdi > yuz.kirpSonraki && yuz.kirpBas < 0) yuz.kirpBas = simdi;
  if (yuz.kirpBas >= 0){
    const u = (simdi - yuz.kirpBas)/(0.15/Math.max(0.7,tempo));
    kirp = u < 0.5 ? u*2 : Math.max(0, 2-u*2);
    if (u >= 1){ yuz.kirpBas = -1; yuz.kirpSonraki = simdi + (1.6 + Math.random()*3.6)/tempo; if (Math.random() < 0.15) yuz.kirpSonraki = simdi + 0.25; }
  }
  em.setValue('blink', kirp * (1 - Math.min(1, ((yuz.deger.mutlu||0) + (yuz.deger.rahat||0)*0.6)*1.25)));
  if (akt.ad === 'uyu' && (akt.durum === 'yapiyor' || durus.w > 0.6)) em.setValue('blink', 1);
  const ag = {aa:0,ih:0,ou:0,ee:0,oh:0}, t = simdi - yuz.agizBas;
  if (t < yuz.agizSure){
    const seg = yuz.agiz.find(s => t >= s.t && t < s.t+s.d);
    if (seg?.s) ag[seg.s] = seg.g * (0.55 + 0.45*Math.sin(Math.PI * (t-seg.t)/seg.d));
  }
  for (const k of AGIZ){ yuz[k] = (yuz[k]||0) + (ag[k]-(yuz[k]||0))*Math.min(1, dt*20); em.setValue(k, yuz[k]); }
}
