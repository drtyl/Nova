'use strict';
/* =========================================================
   11. ATÖLYE — kare kare hareket yap, yapay zekâya tasarlat
   ========================================================= */
const atolye = { kareler:[], secili:-1 };
function mevcutPoz(){ return {...kopyala(DINLENME), ...kopyala(manuel)}; }
function farkPoz(p){ const o = {}; for (const [b, v] of Object.entries(p)){ const d = dinlenmeDegeri(b); if (b === '_kok' ? v.some(x => Math.abs(x) > 1e-4) : v.some((x,i) => Math.abs(x - d[i]) > 0.5)) o[b] = v.map(x => Math.round(x*100)/100); } return o; }
function atolyeHareketi(){
  const n = atolye.kareler.length, dinlen = $('atDinlen').checked, kareler = [];
  if (!n) return null;
  if (dinlen && !$('atDongu').checked) kareler.push({t:0, poz:'dinlenme'});
  // her kare tam poz olsun: devralma yüzünden dinlenmeye dönen eklem önceki açıda kalmasın
  const tum = new Set(); atolye.kareler.forEach(k => Object.keys(k.poz).forEach(b => tum.add(b)));
  const tam = k => Object.fromEntries([...tum].map(b => [b, k.poz[b] || dinlenmeDegeri(b)]));
  atolye.kareler.forEach((k, i) => {
    const t = k.t ?? (dinlen && !$('atDongu').checked ? (i+1)/(n+1) : n === 1 ? 0 : i/(n-1));
    kareler.push({t:Math.round(t*1000)/1000, poz:tam(k)});
  });
  if ($('atDongu').checked){ if (kareler[0].t !== 0) kareler[0].t = 0; kareler.push({t:1, poz:kareler[0].poz}); }
  else if (dinlen) kareler.push({t:1, poz:'dinlenme'});
  else if (kareler.length === 1) kareler.push({t:1, poz:kareler[0].poz});
  kareler.sort((a,b) => a.t - b.t);
  const sure = Math.max(0.4, Math.min(12, +$('atSure').value || 2.4));
  const h = {ad:$('atAd').value.trim() || 'Yeni hareket', sure, kareler};
  if ($('atDongu').checked){ h.dongu = true; h.donem = sure; h.sure = sure*2; }
  if (atolye.el) h.el = atolye.el; if (atolye.ifade) h.ifade = atolye.ifade;
  return h;
}
function atolyeCiz(){
  const kap = $('kareler'); kap.innerHTML = '';
  if (!atolye.kareler.length){ kap.innerHTML = '<div class="bos" style="flex:1">Henüz kare yok. Eklemleri ayarla ve <b>+ Kare ekle</b>, ya da yukarıda yapay zekâya tarif et.</div>'; }
  atolye.kareler.forEach((k, i) => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'kare' + (i === atolye.secili ? ' secili' : '');
    d.innerHTML = `<b>${i+1}</b><small>${Object.keys(k.poz).length} eklem</small>`;
    d.onclick = () => { atolye.secili = i; for (const b of Object.keys(manuel)) delete manuel[b]; Object.assign(manuel, kopyala(k.poz)); nesil++; oynatici.dur(); kaydiricilariKur(); atolyeCiz(); };
    const s = document.createElement('span'); s.className = 'sil'; s.textContent = '×'; s.title = 'Kareyi sil'; s.setAttribute('role','button');
    s.onclick = ev => { ev.stopPropagation(); atolye.kareler.splice(i, 1); atolye.secili = -1; atolyeCiz(); };
    d.appendChild(s); kap.appendChild(d);
  });
  const h = atolyeHareketi();
  $('atJson').textContent = h ? JSON.stringify(h, null, 1) : '—';
}
function hareketiAtolyeyeYukle(h){
  const tamlar = hazirla(h);
  atolye.kareler = h.kareler.map((k, i) => ({k, p:tamlar[i].poz})).filter(x => x.k.poz !== 'dinlenme').map(x => ({t:x.k.t, poz:farkPoz(x.p)}));
  atolye.secili = -1; atolye.el = h.el; atolye.ifade = h.ifade;
  $('atAd').value = h.ad || ''; $('atDongu').checked = !!h.dongu; $('atSure').value = h.dongu ? (h.donem || 1) : (h.sure || 2.4);
  $('atDinlen').checked = h.kareler[0]?.poz === 'dinlenme';
  atolyeCiz();
}
function hareketiTemizle(h){
  if (!h || !Array.isArray(h.kareler) || h.kareler.length < 2) throw new Error('kare listesi eksik');
  const kareler = h.kareler.slice(0, 16).map(k => {
    const t = Math.max(0, Math.min(1, +k.t || 0));
    if (k.poz === 'dinlenme' || !k.poz) return {t, poz:'dinlenme'};
    const p = {};
    for (const [b, v] of Object.entries(k.poz)){
      if (!Array.isArray(v) || v.length !== 3) continue;
      if (b === '_kok') p[b] = v.map(x => Math.max(-0.2, Math.min(0.25, +x || 0)));
      else if (KEMIKLER.includes(b)) p[b] = sikistir(b, v);
    }
    return {t, poz:p};
  }).sort((a,b) => a.t - b.t);
  kareler[0].t = 0; kareler[kareler.length-1].t = 1;
  const temiz = {ad:String(h.ad || 'Yeni hareket').slice(0, 40), sure:Math.max(0.5, Math.min(10, +h.sure || 2.5)), kareler};
  if (h.dongu){ temiz.dongu = true; temiz.donem = Math.max(0.3, Math.min(4, +h.donem || 1)); temiz.sure = Math.max(temiz.donem, temiz.sure); }
  if (h.simetrik) temiz.simetrik = true;
  if (h.ifade && IFADE[h.ifade]) temiz.ifade = h.ifade;
  if (h.el) temiz.el = typeof h.el === 'string' ? h.el : {sag:h.el.sag, sol:h.el.sol};
  return temiz;
}
async function tarifEt(){
  const tarif = $('tarif').value.trim(); if (!tarif || !sample) return;
  const ornek = (ad) => JSON.stringify({ad:VERI.hareketler[ad].ad, ...VERI.hareketler[ad]});
  $('tarifEt').disabled = true; $('tarifDurum').textContent = 'Nova hareketi tasarlıyor…'; dusunuyor = true;
  const ctl = new AbortController();
  try {
    const istem = `Bir 3B karakter (Nova) için anahtar karelerden oluşan bir hareket tasarla. İstenen hareket: "${tarif}".
${iskeletKurallari()}
KARE KURALLARI: "kareler" listesindeki her kare bir öncekini devralır (yalnızca değişen kemikleri yaz). "poz":"dinlenme" tam dinlenme duruşudur. t 0'dan 1'e artar (sürenin oranı). Doğal görünmesi için 3–8 kare kullan, açıları sınırlar içinde tut, anatomik olarak mümkün duruşlar seç. Döngülü (tekrarlayan) hareketlerde "dongu":true, "donem": bir tur saniyesi ver ve ilk/son kareyi aynı yap. Sağ-sol aynı hareket ediyorsa yalnızca sağı yazıp "simetrik":true ver.
Opsiyonel: "ifade" (mutlu|kizgin|uzgun|rahat|saskin), "el" ({"sag":"acik|yumruk|isaret|zafer|kalp|rahat","sol":...}).
Örnek 1: ${ornek('el_salla')}
Örnek 2: ${ornek('kutla')}
YALNIZCA şu biçimde bir JSON nesnesi ver: {"ad":"kısa Türkçe ad","sure":saniye,"dongu":bool,"donem":saniye,"simetrik":bool,"ifade":"...","el":{...},"kareler":[...]}`;
    const h = hareketiTemizle(await sample.json(istem, {modelTier:'default', cache:false, signal:ctl.signal}));
    dusunuyor = false;
    hareketiAtolyeyeYukle(h);
    $('tarifDurum').textContent = `“${h.ad}” hazır: ${h.kareler.length} kare. Oynatılıyor; kareleri düzeltip kaydedebilirsin.`;
    ozelOynat(h);
  } catch(e){
    dusunuyor = false;
    $('tarifDurum').textContent = e?.code ? aiHataMetni(e) : 'Gelen hareket kullanılamadı (' + (e?.message || 'bilinmeyen hata') + ').';
    if (['not_granted','sampling_disabled'].includes(e?.code)){ aiDurum = 'yerel'; beyinYaz(); }
  } finally { $('tarifEt').disabled = !sample || aiDurum !== 'acik'; }
}
function ozelOynat(h){
  const ad = '__onizleme'; ozelHareketler[ad] = h;
  calistir([{eylem:ad}]).catch(e => $('atDurum').textContent = e.message).finally(() => { delete ozelHareketler[ad]; });
}
function ozelleriCiz(){
  for (const [kume, izgara, bolum, anahtar] of [[ozelHareketler,'ozelIzgara','ozelBolum','nova-hareketlerim'], [ogrenilenler,'ogrenIzgara','ogrenBolum','nova-ogrendikleri']]){
    const kap = $(izgara); kap.innerHTML = '';
    const adlar = Object.keys(kume).filter(a => !a.startsWith('__'));
    $(bolum).hidden = !adlar.length;
    for (const ad of adlar){
      const b = document.createElement('button'); b.className = 'hbtn ozel'; b.type = 'button'; b.dataset.e = ad;
      b.innerHTML = `<span></span><code>sil ×</code>`; b.firstChild.textContent = kume[ad].ad;
      b.onclick = ev => {
        if (ev.target.tagName === 'CODE'){ if (b.dataset.onay){ delete kume[ad]; depo.yaz(anahtar, kume); ozelleriCiz(); } else { b.dataset.onay = 1; ev.target.textContent = 'emin misin?'; setTimeout(() => { delete b.dataset.onay; ev.target.textContent = 'sil ×'; }, 2500); } return; }
        calistir({eylem:ad, ...(tarafSecim === 'sol' ? {taraf:'sol'} : {})}).catch(hataGoster);
      };
      kap.appendChild(b);
    }
  }
}
