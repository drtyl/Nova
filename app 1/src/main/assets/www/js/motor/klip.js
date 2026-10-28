'use strict';
/* =========================================================
   KLİPLER — gerçek insan hareket kayıtları (CMU mocap → Nova iskeleti, veri/klipler.js)
   Her kare: kemik başına [x,y,z] derece (motorun poz biçimi) + kök ötelemesi (m).
   ========================================================= */
const KLIP = {};
(function klipleriAc(){
  const coz = (b64, olcek) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    const a = new Int16Array(u.buffer), f = new Float32Array(a.length); for (let i = 0; i < a.length; i++) f[i] = a[i]/olcek; return f; };
  for (const [ad, k] of Object.entries(KLIP_VERI)){
    KLIP[ad] = { ...k, aci:coz(k.aci, 10), kok:coz(k.kok, 1000), sure:(k.n - (k.dongu ? 0 : 1))/k.fps, bosK:new Set((k.bos || []).map(i => KLIP_KEMIK[i])) };
  }
})();
const KLIP_ALT = new Set(['hips', 'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'leftToes', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'rightToes']);
/* t saniyedeki pozu verir (döngülü kliplerde sarar; diğerlerinde uçlara yapışır) */
function klipOrnekle(ad, t, {kok=true, yalnizUst=false}={}){
  const k = KLIP[ad]; if (!k) return {};
  const n = k.n, K = KLIP_KEMIK.length;
  let f = t*k.fps;
  if (k.dongu){ f %= n; if (f < 0) f += n; } else f = Math.max(0, Math.min(n - 1, f));
  const i0 = Math.floor(f), i1 = k.dongu ? (i0 + 1) % n : Math.min(n - 1, i0 + 1), u = f - i0;
  const poz = {};
  for (let b = 0; b < K; b++){
    const ad_ = KLIP_KEMIK[b];
    if (k.bosK.has(ad_) || (yalnizUst && KLIP_ALT.has(ad_))) continue;
    const o0 = (i0*K + b)*3, o1 = (i1*K + b)*3, a = k.aci;
    poz[ad_] = [a[o0] + (a[o1] - a[o0])*u, a[o0+1] + (a[o1+1] - a[o0+1])*u, a[o0+2] + (a[o1+2] - a[o0+2])*u];
  }
  if (kok && !k.ust && !yalnizUst){ const r = k.kok; poz._kok = [r[i0*3] + (r[i1*3] - r[i0*3])*u, r[i0*3+1] + (r[i1*3+1] - r[i0*3+1])*u, r[i0*3+2] + (r[i1*3+2] - r[i0*3+2])*u]; }
  return poz;
}
/* Kütüphaneye ekle: yapay zekâ ve arayüz bunları diğer hareketler gibi adıyla kullanır */
for (const [ad, k] of Object.entries(KLIP)){
  if (!['hareket', 'duygu', 'dans', 'spor'].includes(k.tur)) continue;
  VERI.hareketler[ad] = { ad:k.ad, sure:k.sure, klip:ad, dongu:k.dongu, donem:k.sure, tur:k.tur, kareler:[{t:0, poz:'dinlenme'}, {t:1, poz:'dinlenme'}] };
}

/* ---- bekleme (canlılık): dururken gerçek bir insanın bekleme kayıtlarından biri, aralarında yumuşak geçişle ---- */
const BEKLEME = { liste:['bekle1', 'bekle2', 'bekle3'], ad:'bekle1', t:0, onceki:null, ot:0, gecis:1, w:0 };
function beklemePozu(dt){
  const B = BEKLEME; B.t += dt; B.ot += dt;
  if (B.t > KLIP[B.ad].sure - 0.01 || B.t > 14 + Math.random()*0.02){
    B.onceki = B.ad; B.ot = B.t; B.gecis = 0;
    const digerleri = B.liste.filter(x => x !== B.ad); B.ad = digerleri[Math.floor(Math.random()*digerleri.length)]; B.t = 0;
  }
  let p = klipOrnekle(B.ad, B.t);
  if (B.gecis < 1 && B.onceki){ B.gecis = Math.min(1, B.gecis + dt/1.6); p = karistir(klipOrnekle(B.onceki, B.ot), p, yumusak(B.gecis)); }
  return p;
}
