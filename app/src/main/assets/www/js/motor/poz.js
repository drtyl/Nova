'use strict';
/* =========================================================
   2. POZ MATEMATİĞİ
   ========================================================= */
const DINLENME = simetrikGenislet(VERI.dinlenme.poz);
const kopyala = p => Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[...v]]));
const yumusak = u => u*u*(3-2*u);
let elDeger = {};   // el katmanının o anki parmak açıları (ileride tanımlanır)
const varsayilan = k => k==='_kok' ? [0,0,0] : (DINLENME[k] || elDeger[k] || [0,0,0]);
function karistir(a, b, w){
  const o = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])){
    const x = a[k] || varsayilan(k), y = b[k] || varsayilan(k);
    o[k] = [x[0]+(y[0]-x[0])*w, x[1]+(y[1]-x[1])*w, x[2]+(y[2]-x[2])*w];
  }
  return o;
}
// Her kare bir öncekini devralır; "dinlenme" tam dinlenme pozudur.
function hazirla(h, taraf){
  let cur = kopyala(DINLENME); const kareler = [];
  for (const k of h.kareler){
    if (k.poz === 'dinlenme') cur = kopyala(DINLENME);
    else { let p = h.simetrik ? simetrikGenislet(k.poz) : k.poz; if (taraf === 'sol') p = aynaPoz(p); cur = {...cur, ...kopyala(p)}; }
    kareler.push({t:k.t, poz:kopyala(cur)});
  }
  return kareler;
}
const DINLENME_EL = (() => { const p = VERI.el_sekilleri.rahat; return {...kopyala(p), ...aynaPoz(p)}; })();
const dinlenmeDegeri = b => b === '_kok' ? [0,0,0] : (DINLENME[b] || DINLENME_EL[b] || [0,0,0]);
function izOrnekle(kareler, faz){
  for (let i=0;i<kareler.length-1;i++){
    const a = kareler[i], b = kareler[i+1];
    if (faz <= b.t) return karistir(a.poz, b.poz, yumusak(Math.max(0,(faz-a.t))/Math.max(1e-4,b.t-a.t)));
  }
  return kareler[kareler.length-1].poz;
}
