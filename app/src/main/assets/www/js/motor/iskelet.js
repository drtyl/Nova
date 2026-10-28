'use strict';
/* =========================================================
   1. İSKELET BİLGİSİ — adlar, aynalama, sınırlar
   ========================================================= */
const KOK_AD = { hips:'Kalça', spine:'Bel', chest:'Göğüs', upperChest:'Üst göğüs', neck:'Boyun', head:'Baş', leftEye:'Sol göz', rightEye:'Sağ göz',
  Shoulder:'omuz', UpperArm:'üst kol', LowerArm:'dirsek', Hand:'el bileği', UpperLeg:'kalça eklemi', LowerLeg:'diz', Foot:'ayak bileği', Toes:'ayak parmakları',
  ThumbProximal:'başparmak 1', ThumbIntermediate:'başparmak 2', ThumbDistal:'başparmak 3', IndexProximal:'işaret 1', IndexIntermediate:'işaret 2', IndexDistal:'işaret 3',
  MiddleProximal:'orta 1', MiddleIntermediate:'orta 2', MiddleDistal:'orta 3', RingProximal:'yüzük 1', RingIntermediate:'yüzük 2', RingDistal:'yüzük 3',
  LittleProximal:'serçe 1', LittleIntermediate:'serçe 2', LittleDistal:'serçe 3' };
const PARMAK = /(Thumb|Index|Middle|Ring|Little)/;
const aynaAd = b => b.startsWith('right') ? 'left'+b.slice(5) : b.startsWith('left') ? 'right'+b.slice(4) : b;
const aynaDeg = v => [v[0], -v[1], -v[2]];
function aynaPoz(p){ const o = {}; for (const [b,v] of Object.entries(p)) o[b==='_kok'?b:aynaAd(b)] = b==='_kok' ? [-v[0],v[1],v[2]] : aynaDeg(v); return o; }
function simetrikGenislet(p){ const o = {...p}; for (const [b,v] of Object.entries(p)) if (b.startsWith('right')) o[aynaAd(b)] = aynaDeg(v); return o; }
function sinir(b){
  const S = VERI.sinirlar;
  const sag = PARMAK.test(b) ? (b.includes('Thumb') ? S._basparmak : S._parmak) : S[b.startsWith('left') ? aynaAd(b) : b];
  if (!sag) return null;
  if (b.startsWith('left')) return [sag[0], [-sag[1][1],-sag[1][0]], [-sag[2][1],-sag[2][0]]];
  return sag;
}
const sikistir = (b,v) => { const L = sinir(b); return L ? v.map((x,i)=>Math.min(L[i][1],Math.max(L[i][0],+x||0))) : v.map(x=>+x||0); };
function kemikEtiketi(b){
  if (KOK_AD[b]) return KOK_AD[b];
  const t = b.startsWith('right') ? 'Sağ ' : b.startsWith('left') ? 'Sol ' : '';
  return t + (KOK_AD[b.replace(/^(right|left)/,'')] || b);
}
