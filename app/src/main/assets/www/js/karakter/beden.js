'use strict';
/* =========================================================
   BEDEN — yeni beden yapmadan Nova'nın oranlarını ayarlar (kemik ölçekleri)
   · göğüs: modeldeki göğüs kemikleri (J_Sec_*_Bust1, yaylı kemik) büyür/küçülür
   · bel: bel kemiği daralır, göğüs kemiği ters ölçekle eski genişliğine döner (üst gövde etkilenmez)
   · kalça: kalça kemiği genişler (uyluklar da biraz dolgunlaşır), bel ters ölçekle dengelenir
   · boy: bütün beden (yalnızca evde; dışarıda boyu ekrana göre ayarlanır)
   Ayarlar evde ve dışarıda aynıdır (depo: nova-beden).
   ========================================================= */
const BEDEN_VARSAYILAN = { gogus:1.2, bel:0.96, kalca:1.05, boy:1.0 };
const BEDEN_SINIR = { gogus:[0.8, 1.6], bel:[0.85, 1.1], kalca:[0.92, 1.18], boy:[0.94, 1.06] };
const BEDEN_AD = { gogus:'Göğüs', bel:'Bel', kalca:'Kalça', boy:'Boy' };
const BEDEN = Object.assign({}, BEDEN_VARSAYILAN, depo.oku('nova-beden', {}));
function bedenKaydet(){ depo.yaz('nova-beden', BEDEN); }
function bedenUygula(v = (typeof vrm !== 'undefined' ? vrm : null), {boyDahil = true} = {}){
  if (!v) return;
  const s = k => Math.max(BEDEN_SINIR[k][0], Math.min(BEDEN_SINIR[k][1], +BEDEN[k] || BEDEN_VARSAYILAN[k]));
  for (const ad of ['J_Sec_L_Bust1', 'J_Sec_R_Bust1']){ const b = v.scene.getObjectByName(ad); if (b) b.scale.setScalar(s('gogus')); }
  const ham = n => v.humanoid.getRawBoneNode(n);
  const h = s('kalca'), w = s('bel');
  ham('hips')?.scale.set(h, 1, h);
  ham('spine')?.scale.set(w/h, 1, w/h);
  ham('chest')?.scale.set(1/w, 1, 1/w);
  if (boyDahil) v.scene.scale.setScalar(s('boy'));
}
