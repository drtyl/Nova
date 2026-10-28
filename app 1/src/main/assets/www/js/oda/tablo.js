'use strict';
/* ---- tablo: fırça darbeleriyle gerçekten ilerler ve saklanır ---- */
const PALETLER = [
  {gok:['#c9b6f2','#f6c3d6','#ffe0c2'], tepe:['#9a88d6','#7d6fd1'], cayir:['#9fd8a8','#7cc49a','#b8e3a0'], cicek:['#f6a6be','#ffd58a','#ffffff','#e87d9b'], gunes:'#fff1b8'},
  {gok:['#8fc9e8','#cfe6fb','#f4f7ff'], tepe:['#6aa0c8','#4f86b0'], cayir:['#f2d07c','#e8b86a','#f6dc9a'], cicek:['#e87d9b','#ffffff','#7d6fd1','#ff9e6e'], gunes:'#ffd58a'},
  {gok:['#2d2a5c','#4b3f86','#7a68b6'], tepe:['#231e45','#3a2d6a'], cayir:['#3f5d7a','#35506b','#4b6e8a'], cicek:['#fff6d8','#b79ce9','#8fc9e8','#ffffff'], gunes:'#fff6d8'},
];
const tablo = depo.oku('nova-tablo', {ilerleme:0, palet:0, biten:0});
const TABLO_TAMAM = 360;
function tabloBaslat(){
  const g = tabloTuval.getContext('2d'); g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, 256, 320);
  g.fillStyle = 'rgba(200,190,170,0.08)'; for (let i = 0; i < 300; i++) g.fillRect(rnd(0,256), rnd(0,320), 2, 2);
  tabloDoku.needsUpdate = true;
}
function resimYukle(veri, tuval, doku){ if (!veri) return false; const im = new Image(); im.onload = () => { tuval.getContext('2d').drawImage(im, 0, 0); doku.needsUpdate = true; }; im.src = veri; return true; }
if (!resimYukle(depo.oku('nova-tablo-resim', null), tabloTuval, tabloDoku)) tabloBaslat();
if (!resimYukle(depo.oku('nova-tablo-duvar', null), duvarTabloTuval, duvarTabloDoku)){ const g = duvarTabloTuval.getContext('2d'); g.fillStyle = '#f3effb'; g.fillRect(0,0,256,320); g.fillStyle = '#c9b8ea'; g.font = '500 22px sans-serif'; g.textAlign = 'center'; g.fillText('henüz boş', 128, 168); duvarTabloDoku.needsUpdate = true; }
function fircaDarbesi(){
  const g = tabloTuval.getContext('2d'), p = PALETLER[tablo.palet % PALETLER.length], n = tablo.ilerleme, sec = a => a[Math.floor(Math.random()*a.length)];
  g.save(); g.lineCap = 'round';
  if (n < 90){ const y = rnd(0, 200), t = y/200; g.strokeStyle = p.gok[Math.min(2, Math.floor(t*3 + rnd(-0.3, 0.3)))] || p.gok[0]; g.globalAlpha = 0.5; g.lineWidth = rnd(10, 22); g.beginPath(); const x = rnd(-20, 200); g.moveTo(x, y); g.bezierCurveTo(x+30, y+rnd(-6,6), x+60, y+rnd(-6,6), x+rnd(70,110), y+rnd(-4,4)); g.stroke(); }
  else if (n < 150){ const x = rnd(-10, 266), y = 175 + Math.sin(x/40 + tablo.palet)*18 + rnd(0, 30); g.strokeStyle = sec(p.tepe); g.globalAlpha = 0.55; g.lineWidth = rnd(10, 18); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(20, 50), y + rnd(-6, 10)); g.stroke(); }
  else if (n < 240){ const x = rnd(-10, 266), y = rnd(225, 330); g.strokeStyle = sec(p.cayir); g.globalAlpha = 0.6; g.lineWidth = rnd(8, 16); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(25, 60), y + rnd(-5, 5)); g.stroke();
    if (Math.random() < 0.4){ g.strokeStyle = sec(p.cayir); g.lineWidth = 2; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-3,3), y - rnd(8, 18)); g.stroke(); } }
  else if (n < 315){ const x = rnd(8, 248), y = rnd(240, 312); g.fillStyle = sec(p.cicek); g.globalAlpha = 0.9; for (let k = 0; k < 5; k++){ g.beginPath(); g.arc(x + Math.cos(k*1.26)*4, y + Math.sin(k*1.26)*4, 3.2, 0, Math.PI*2); g.fill(); } g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(x, y, 2, 0, Math.PI*2); g.fill(); }
  else if (n < 350){ const cx = 70 + (tablo.palet%2)*110, cy = 70; g.fillStyle = p.gunes; g.globalAlpha = 0.35; g.beginPath(); g.arc(cx + rnd(-4,4), cy + rnd(-4,4), rnd(18, 30), 0, Math.PI*2); g.fill(); }
  else { g.globalAlpha = 1; g.fillStyle = '#7d6fd1'; g.font = 'italic 600 16px serif'; g.fillText('Nova', 210, 306); }
  g.restore(); tabloDoku.needsUpdate = true;
  tablo.ilerleme++;
  if (tablo.ilerleme % 15 === 0) tabloKaydet();
  if (tablo.ilerleme >= TABLO_TAMAM){
    duvarTabloTuval.getContext('2d').drawImage(tabloTuval, 0, 0); duvarTabloDoku.needsUpdate = true;
    depo.yaz('nova-tablo-duvar', duvarTabloTuval.toDataURL('image/jpeg', 0.85));
    tablo.biten++; tablo.palet++; tablo.ilerleme = 0; tabloBaslat();
    gunlugeYaz('tablo_bitti', 0, 'bir manzara resmini bitirip duvara astın');
    tabloKaydet();
  }
}
function tabloKaydet(){ depo.yaz('nova-tablo', tablo); try { depo.yaz('nova-tablo-resim', tabloTuval.toDataURL('image/jpeg', 0.85)); } catch(e){} }
