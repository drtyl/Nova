'use strict';
/* =========================================================
   12. ARAYÜZ
   ========================================================= */
let tarafSecim = 'sag', elTarafSecim = 'sag', sekme = 'sohbet';
function durumYaz(){
  const a = oynatici.aktif, ad = a && !a.sabit ? a.ad.replace('__onizleme','önizleme') : 'dinlenme';
  const [ia, iy] = simdikiIfade() || ['notr', 0];
  const parca = [['', ad.replace(/_/g,' '), !!(a && !a.sabit)], ['', VERI.ruh_halleri[ruh].ad, false, true], ['', IFADE_AD[ia], false, true]];
  const yeni = parca.map(([e, v, c, k]) => `<span class="durum cam${c?' canli':''}${k?' kucukGizle':''}"><b>${v}</b></span>`).join('');
  if (durumYaz.son !== yeni){ $('durumlar').innerHTML = yeni; durumYaz.son = yeni; }
  for (const el of document.querySelectorAll('.hbtn')) el.classList.toggle('aktif', !!a && !a.sabit && a.ad.split(' · ')[0] === el.dataset.e);
}
function hataGoster(e){ $('jsonHata').textContent = 'Çalıştırılamadı: ' + e.message; $('jsonHata').style.color = 'var(--kirmizi)'; }
function sekmeAc(s){
  sekme = s;
  for (const x of document.querySelectorAll('.sekmeler button')){ x.setAttribute('aria-selected', x.dataset.s === s); $('s-'+x.dataset.s).hidden = x.dataset.s !== s; }
  if (s === 'atolye'){ kaydiricilariKur(); atolyeCiz(); }
}
function sohbetEkle(kim, metin, komutlar, dusun){
  const m = document.createElement('div'); m.className = 'msj ' + kim + (dusun ? ' dusunuyor' : '');
  if (kim === 'nova'){ const av = document.createElement('div'); av.className = 'av'; av.textContent = 'N'; m.appendChild(av); }
  const g = document.createElement('div'); g.className = 'gov';
  const y = document.createElement('div'); y.className = 'yazi';
  if (dusun) y.innerHTML = 'düşünüyor <i></i><i></i><i></i>'; else y.textContent = metin;
  g.appendChild(y);
  const gorunen = (komutlar || []).filter(k => k.eylem || k.poz || k.ifade || k.el || k.bak || k.ruh_hali || k.aktivite || k.git !== undefined || k.don !== undefined);
  if (gorunen.length){
    const h = document.createElement('div'); h.className = 'hareketler';
    for (const k of gorunen){
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = [k.eylem && (hareketBul(k.eylem)?.ad || k.eylem) + (k.taraf === 'sol' ? ' (sol)' : ''), k.poz && 'özel poz', k.ifade && IFADE_AD[k.ifade], k.el && 'el: ' + (typeof k.el === 'string' ? EL_AD[k.el] : Object.values(k.el).map(x => EL_AD[x]).join('/')), k.bak && 'bak: ' + BAKIS_AD[k.bak], k.git !== undefined && 'yürü', k.don !== undefined && 'dön', k.aktivite && (AKTIVITE_AD[k.aktivite] || k.aktivite), k.ruh_hali && 'ruh: ' + VERI.ruh_halleri[k.ruh_hali].ad].filter(Boolean).join(' · ');
      b.title = 'JSON\'u göster'; b.onclick = () => m.classList.toggle('acik');
      h.appendChild(b);
    }
    g.appendChild(h);
    const j = document.createElement('pre'); j.className = 'json'; j.textContent = JSON.stringify(komutlar.map(k => { const c = {...k}; return c; }), null, 1); g.appendChild(j);
  }
  m.appendChild(g); $('sohbet').appendChild(m);
  $('sohbet').scrollTop = $('sohbet').scrollHeight;
  return m;
}
function arayuzMesgul(m){ $('gonder').hidden = m; $('durdur').hidden = !m; $('mesaj').disabled = m; $('hizliMesaj').disabled = m; $('hizliMesaj').placeholder = m ? 'Nova düşünüyor…' : "Nova'ya bir şey söyle…"; }
function arayuzKur(){
  for (const b of document.querySelectorAll('.sekmeler button')) b.onclick = () => sekmeAc(b.dataset.s);
  for (const b of document.querySelectorAll('.gorunum button')) b.onclick = () => gorunumAyarla(b.dataset.g);
  for (const b of document.querySelectorAll('.kameralar button')) b.onclick = () => kameraya(b.dataset.k);
  // sohbet
  const ornekler = ['Merhaba! Nasılsın?', 'Bana bir kalp yap', 'Dans eder misin?', 'Bugün çok yorgunum', 'Kollarını kavuştur ve bana kızgın bak', 'Asker selamı ver'];
  for (const o of ornekler){ const c = document.createElement('button'); c.className = 'cip'; c.type = 'button'; c.textContent = o; c.onclick = () => { if (!$('mesaj').disabled) mesajGonder(o); }; $('ornekler').appendChild(c); }
  $('sohbetForm').addEventListener('submit', e => { e.preventDefault(); const m = $('mesaj').value.trim(); if (!m) return; $('mesaj').value = ''; mesajGonder(m); });
  $('durdur').onclick = () => aiKontrol?.abort();
  // hareketler
  for (const [ad, h] of Object.entries(VERI.hareketler)){
    const b = document.createElement('button'); b.className = 'hbtn'; b.type = 'button'; b.dataset.e = ad;
    b.innerHTML = `<span>${h.ad}</span><code>${ad}</code>`;
    b.onclick = () => calistir({eylem:ad, hiz:+$('hiz').value/100, ...(tarafSecim === 'sol' ? {taraf:'sol'} : {})}).catch(hataGoster);
    $('hareketIzgara').appendChild(b);
  }
  ozelleriCiz();
  $('hiz').oninput = e => $('hizD').textContent = (e.target.value/100).toFixed(1) + '×';
  const segment = (kap, fn) => { for (const t of kap.querySelectorAll('button')) t.onclick = () => { for (const x of kap.querySelectorAll('button')) x.setAttribute('aria-pressed', x === t); fn(t.dataset.t); }; };
  segment($('tarafSec'), t => tarafSecim = t); segment($('elTaraf'), t => elTarafSecim = t);
  const cipGrubu = (kap, liste, fn, secili) => {
    for (const [k, ad] of liste){
      const c = document.createElement('button'); c.className = 'cip'; c.type = 'button'; c.textContent = ad; c.dataset.k = k;
      if (secili !== undefined) c.setAttribute('aria-pressed', k === secili);
      c.onclick = () => { if (secili !== undefined) for (const x of kap.children) x.setAttribute('aria-pressed', x === c); fn(k); };
      kap.appendChild(c);
    }
  };
  cipGrubu($('ruhlar'), Object.entries(VERI.ruh_halleri).map(([k,v]) => [k, v.ad]), k => ruhHali(k), 'neseli');
  cipGrubu($('ifadeler'), Object.entries(IFADE_AD).filter(([k]) => k === 'notr' || ifadeAdlari[k]), k => { ifadeAyarla(k, $('yogunluk').value/100); });
  $('yogunluk').oninput = e => { $('yogunlukD').textContent = e.target.value; if (yuz.komutIfade) ifadeAyarla(yuz.komutIfade[0], e.target.value/100); };
  cipGrubu($('eller'), Object.entries(EL_AD), k => {
    const el = elTarafSecim === 'iki' ? {sag:k, sol:k} : {[elTarafSecim]:k};
    elAyarla(el); elTaban = {...elHedef};
    atolye.el = {...elHedef};
  });
  cipGrubu($('bakislar'), Object.entries(BAKIS_AD), k => { bakis.gecici = k === 'kamera' ? null : k; bakis.gecBit = performance.now()/1000 + 3; });
  // atölye
  const gruplar = [['Gövde ve baş', b => !/^(left|right)/.test(b)], ['Sağ kol', b => /^right(Shoulder|UpperArm|LowerArm|Hand)$/.test(b)], ['Sol kol', b => /^left(Shoulder|UpperArm|LowerArm|Hand)$/.test(b)],
    ['Sağ bacak', b => /^right(UpperLeg|LowerLeg|Foot|Toes)$/.test(b)], ['Sol bacak', b => /^left(UpperLeg|LowerLeg|Foot|Toes)$/.test(b)], ['Sağ el parmakları', b => b.startsWith('right') && PARMAK.test(b)], ['Sol el parmakları', b => b.startsWith('left') && PARMAK.test(b)]];
  for (const [g, f] of gruplar){
    const og = document.createElement('optgroup'); og.label = g;
    for (const b of KEMIKLER.filter(f).filter(b => !/Eye/.test(b))){ const o = document.createElement('option'); o.value = b; o.textContent = kemikEtiketi(b); og.appendChild(o); }
    $('kemikSec').appendChild(og);
  }
  $('kemikSec').value = seciliKemik;
  $('kemikSec').onchange = () => { seciliKemik = $('kemikSec').value; kaydiricilariKur(); };
  $('serbest').onclick = () => { for (const b of Object.keys(manuel)) delete manuel[b]; atolye.secili = -1; kaydiricilariKur(); atolyeCiz(); };
  $('eklemSifir').onclick = () => { delete manuel[seciliKemik]; kaydiricilariKur(); };
  $('simetri').onclick = () => { for (const [b, v] of Object.entries({...manuel})) if (b.startsWith('right')) manuel[aynaAd(b)] = aynaDeg(v); kaydiricilariKur(); };
  $('kareEkle').onclick = () => {
    const p = farkPoz(mevcutPoz());
    if (!Object.keys(p).length){ $('atDurum').textContent = 'Önce en az bir eklemi oynat.'; return; }
    if (atolye.secili >= 0){ atolye.kareler[atolye.secili] = {poz:p}; $('atDurum').textContent = `${atolye.secili+1}. kare güncellendi.`; }
    else { atolye.kareler.push({poz:p}); $('atDurum').textContent = `${atolye.kareler.length}. kare eklendi.`; }
    atolye.kareler.forEach(k => delete k.t); atolye.secili = -1; atolyeCiz();
  };
  for (const id of ['atSure','atDongu','atDinlen','atAd']) $(id).addEventListener('input', atolyeCiz);
  $('atOynat').onclick = () => { const h = atolyeHareketi(); if (!h){ $('atDurum').textContent = 'Oynatmak için en az bir kare gerekli.'; return; } for (const b of Object.keys(manuel)) delete manuel[b]; ozelOynat(h); };
  $('atKaydet').onclick = () => {
    const h = atolyeHareketi(); if (!h){ $('atDurum').textContent = 'Kaydetmek için en az bir kare gerekli.'; return; }
    const anahtar = 'ozel_' + sluglastir(h.ad);
    ozelHareketler[anahtar] = h; depo.yaz('nova-hareketlerim', ozelHareketler); ozelleriCiz();
    $('atDurum').innerHTML = ''; $('atDurum').append(`“${h.ad}” kaydedildi (${anahtar}). Hareket sekmesinde duruyor ve Nova sohbette de kullanabiliyor.`);
  };
  $('atKopya').onclick = async () => { try { await navigator.clipboard.writeText($('atJson').textContent); $('atKopya').textContent = 'Kopyalandı'; } catch(e){ const r = document.createRange(); r.selectNodeContents($('atJson')); getSelection().removeAllRanges(); getSelection().addRange(r); $('atKopya').textContent = 'Seçildi'; } setTimeout(() => $('atKopya').textContent = 'Kopyala', 1600); };
  $('tarifEt').onclick = tarifEt;
  // ayarlar
  $('bakisModu').onchange = e => bakis.mod = e.target.value;
  $('kalite').onchange = boyutla;
  if (platform.native){ sesleriYukle(); platform.sesDinle(o => { if (o === 'seslerHazir') sesleriYukle(); }); $('sesSec').onchange = e => depo.yaz('nova-ses', e.target.value); }
  else if ('speechSynthesis' in window){ sesleriYukle(); speechSynthesis.onvoiceschanged = sesleriYukle; }
  $('sozlesme').textContent = JSON.stringify(SOZLESME, null, 1);
  $('jsonGir').value = JSON.stringify([{eylem:'el_kaldir', taraf:'sol', ifade:'mutlu', soz:'Bir sorum var!'}, {poz:{head:[0,25,10], neck:[0,10,0]}, sure:1.5, bak:'sol'}, {eylem:'kalp', soz:'Teşekkürler!'}], null, 1);
  $('jsonCalistir').onclick = () => {
    $('jsonHata').textContent = '';
    let k; try { k = JSON.parse($('jsonGir').value); } catch(e){ return hataGoster(new Error('JSON okunamadı (' + e.message + ')')); }
    calistir(k).catch(hataGoster);
  };
  if (matchMedia('(max-width:760px)').matches){ $('kalite').value = '1.5'; boyutla(); }
  arayuzKur2();
}
function kemikSecildi(b){
  seciliKemik = b; if ($('kemikSec').querySelector(`option[value="${b}"]`)) $('kemikSec').value = b;
  cekmece(true);
  if (sekme !== 'atolye') sekmeAc('atolye'); else kaydiricilariKur();
}
function kaydiricilariKur(){
  const b = seciliKemik, L = sinir(b) || [[-90,90],[-90,90],[-90,90]];
  const mevcut = manuel[b] || oynatici.son[b] || varsayilan(b);
  $('sinirNot').textContent = kemikEtiketi(b);
  const kap = $('kaydiricilar'); kap.innerHTML = '';
  ['X','Y','Z'].forEach((eks, i) => {
    const s = document.createElement('div'); s.className = 'kaydirici';
    s.innerHTML = `<span>${eks}</span><input type="range" id="k-${eks}" min="${L[i][0]}" max="${L[i][1]}" step="1" value="${Math.round(mevcut[i])}" aria-label="${kemikEtiketi(b)} ${eks} ekseni"><span>${Math.round(mevcut[i])}°</span>`;
    s.querySelector('input').oninput = e => {
      nesil++; if (oynatici.calisiyor()) oynatici.dur();
      const v = manuel[b] ? [...manuel[b]] : [...(oynatici.son[b] || varsayilan(b))];
      v[i] = +e.target.value; manuel[b] = v; s.lastElementChild.textContent = e.target.value + '°';
    };
    kap.appendChild(s);
  });
  const not = document.createElement('p'); not.className = 'not';
  not.textContent = `Sınırlar · X ${L[0][0]}…${L[0][1]}°  Y ${L[1][0]}…${L[1][1]}°  Z ${L[2][0]}…${L[2][1]}°`;
  kap.appendChild(not);
}
