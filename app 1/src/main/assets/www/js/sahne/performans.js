'use strict';
/* =========================================================
   PERFORMANS VE PİL — kare hızı sınırı ve otomatik kalite
   · Otomatik: dokunurken/konuşurken 60, boşta 30 kare/sn; uygulama arka plandayken çizim durur
   · Tasarruf: her zaman 30 · Performans: her zaman 60
   · Otomatik kalite: telefon zorlanırsa (ortalama < 24 kare/sn) sırayla ortam gölgesi → gölge → çözünürlük düşer
   ========================================================= */
const PERF = { son:0, kareler:0, pencereBas:performance.now(), seviye:0, sonDusurme:0, etkilesim:performance.now(), fps:0, gizli:false };
for (const o of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(o, () => { PERF.etkilesim = performance.now(); }, {passive:true});
function perfHedef(){
  const mod = $('pilModu')?.value || 'oto';
  if (mod === 'performans') return 60;
  if (mod === 'tasarruf') return 30;
  const mesgul = performance.now() - PERF.etkilesim < 8000 || (typeof platform !== 'undefined' && platform.konusuyor) || (typeof kameraGecis !== 'undefined' && kameraGecis);
  return mesgul ? 60 : 30;
}
/* dongu.js her rAF'ta sorar: bu karede çizilsin mi? */
function perfKare(){
  if (PERF.gizli) return false;
  const s = performance.now(), hedef = perfHedef();
  if (hedef < 59 && s - PERF.son < 1000/hedef - 4) return false;
  PERF.son = s; PERF.kareler++;
  if (s - PERF.pencereBas > 4000){
    PERF.fps = PERF.kareler*1000/(s - PERF.pencereBas); PERF.kareler = 0; PERF.pencereBas = s;
    if (($('otoKalite')?.checked ?? true) && PERF.fps < Math.min(24, hedef*0.75) && s - PERF.sonDusurme > 8000 && !document.hidden) perfDusur();
  }
  return true;
}
function perfDusur(){
  PERF.sonDusurme = performance.now();
  const kapat = id => { const e = $(id); if (e && e.checked){ e.checked = false; e.dispatchEvent(new Event('change')); return true; } return false; };
  if (kapat('aoAc')) return perfNot('ortam gölgesi kapatıldı');
  if (kapat('golgeAc')) return perfNot('yumuşak gölge kapatıldı');
  const k = $('kalite'); if (k && +k.value > 1){ k.value = +k.value > 1.5 ? '1.5' : '1'; k.dispatchEvent(new Event('change')); return perfNot('çözünürlük düşürüldü'); }
}
function perfNot(m){ console.info('Otomatik kalite: ' + m); try { if (typeof hataGunlugu !== 'undefined') hataGunlugu.push(`${new Date().toLocaleTimeString('tr-TR')} [kalite] ${m} (ortalama ${PERF.fps.toFixed(0)} kare/sn)`); } catch(e){} }
document.addEventListener('visibilitychange', () => { PERF.gizli = document.hidden; });
