'use strict';
/* =========================================================
   YENİ EKRANLAR — mikrofon, yapay zekâ ayarı, kişilik, hafıza, kıyafet atölyesi,
   oda tasarımı, ek komutlar, ayarların ve yedeğin saklanması
   ========================================================= */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
function eleman(tag, ozellik = {}, ...cocuk){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(ozellik)){ if (k === 'on') for (const [o, f] of Object.entries(v)) e.addEventListener(o, f); else if (k in e) e[k] = v; else e.setAttribute(k, v); }
  for (const c of cocuk) if (c != null) e.append(c);
  return e;
}
/* iki dokunuşla onay (tarayıcı diyalogları kullanılmaz) */
function onayli(btn, f){
  let bekle = null; const ilk = btn.textContent;
  btn.addEventListener('click', () => { if (bekle){ clearTimeout(bekle); bekle = null; btn.textContent = ilk; f(); return; }
    btn.textContent = 'Emin misin? Tekrar dokun'; bekle = setTimeout(() => { bekle = null; btn.textContent = ilk; }, 3000); });
}

/* ---------------- ayarlar kalıcı olsun ---------------- */
const AYAR_ALANLARI = ['nefes', 'serbestDav', 'serbestAI', 'sesli', 'bakisModu', 'gunIsigi', 'golgeAc', 'aoAc', 'kalite', 'hafizaOto', 'pilModu', 'otoKalite'];
function ayarlariYukle(){
  const a = depo.oku('nova-ayar', {});
  for (const id of AYAR_ALANLARI){ const e = $(id); if (!e || !(id in a)) continue;
    if (e.type === 'checkbox') e.checked = !!a[id]; else e.value = a[id];
    e.dispatchEvent(new Event('change')); }
  for (const id of AYAR_ALANLARI) $(id)?.addEventListener('change', e => { const x = depo.oku('nova-ayar', {}); x[id] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; depo.yaz('nova-ayar', x); });
}

/* ---------------- mikrofon ---------------- */
const mik = { kapat:null };
function mikrofon(btn){
  if (mik.kapat){ mik.kapat(); mik.kapat = null; mikDurum(''); return; }
  platform.sus();
  mikDurum('baslıyor');
  mik.kapat = platform.dinle((olay, veri) => {
    if (olay === 'dinliyor') mikDurum('dinliyor');
    else if (olay === 'kismi'){ $('hizliMesaj').placeholder = veri + '…'; $('mesaj').placeholder = veri + '…'; }
    else if (olay === 'seviye') document.documentElement.style.setProperty('--mikSeviye', Math.max(0, Math.min(1, (veri + 2)/12)));
    else if (olay === 'sonuc'){ mik.kapat = null; mikDurum(''); const t = String(veri || '').trim(); if (t) mesajGonder(t, {sesle:true}); }
    else if (olay === 'hata'){ mik.kapat = null; mikDurum(''); sohbetEkle('sistem', veri); }
  });
}
function mikDurum(d){
  for (const id of ['mikBtn', 'mikBtn2']) $(id)?.classList.toggle('dinliyor', !!d);
  if (!d){ $('hizliMesaj').placeholder = "Nova'ya bir şey söyle…"; $('mesaj').placeholder = "Nova'ya bir şey söyle…"; }
  else if (d === 'dinliyor'){ $('hizliMesaj').placeholder = 'Dinliyorum…'; $('mesaj').placeholder = 'Dinliyorum…'; balon.goster('Dinliyorum…', 6, true); }
}

/* ---------------- yapay zekâ ayarı ---------------- */
function aiEkranKur(){
  $('aiAnahtar').value = AI_AYAR.anahtar;
  for (const [k, ad] of GROQ_MODELLER) $('aiModel').append(eleman('option', {value:k, textContent:ad}));
  $('aiModel').value = AI_AYAR.model;
  const yaz = () => { $('aiDurumNot').textContent = aiDurum === 'acik' ? 'Bağlı: ' + aiAdi : AI_AYAR.anahtar ? 'Anahtar kayıtlı, bağlanmadı.' : 'Anahtar girilmedi; Nova şimdilik basit komutları anlar.'; };
  $('aiKaydet').onclick = async () => {
    AI_AYAR.anahtar = $('aiAnahtar').value.trim(); AI_AYAR.model = $('aiModel').value; depo.yaz('nova-ai', AI_AYAR);
    await beyinBagla(); yaz();
  };
  $('aiDene').onclick = async () => {
    if (!sample){ $('aiDurumNot').textContent = 'Önce anahtarı kaydet.'; return; }
    $('aiDurumNot').textContent = 'Deneniyor…';
    try { const y = await sample.json([{role:'user', content:'Yalnızca şu JSON ile yanıt ver: {"ok": true, "soz": "Merhaba!"}'}], {}); $('aiDurumNot').textContent = y?.ok ? 'Çalışıyor ✓ (' + aiAdi + ')' : 'Yanıt geldi ama beklenen biçimde değil.'; }
    catch(e){ $('aiDurumNot').textContent = aiHataMetni(e) + (e?.detay ? ' — ' + e.detay : ''); }
  };
  yaz();
}

/* ---------------- kişilik ---------------- */
function kisilikEkranKur(){
  const K = KISILIK, bagla = (id, al, ver) => { $(id).value = al(); $(id).addEventListener('input', e => { ver(e.target.value); kisilikKaydet(); }); };
  bagla('kAd', () => K.ad, v => { K.ad = v.trim() || 'Nova'; });
  bagla('kKullanici', () => K.kullanici, v => { K.kullanici = v.trim(); });
  bagla('kTarz', () => K.tarz, v => { K.tarz = v; });
  bagla('kIlgi', () => K.ilgi, v => { K.ilgi = v; });
  bagla('kSevmez', () => K.sevmez, v => { K.sevmez = v; });
  bagla('kOzel', () => K.ozel, v => { K.ozel = v; });
  const kap = $('kOzellikler'); kap.innerHTML = '';
  for (const [k, [ad, az, cok]] of Object.entries(OZELLIK_AD)){
    const d = eleman('span', {className:'deger', textContent:K.ozellik[k]});
    const r = eleman('input', {type:'range', min:0, max:10, value:K.ozellik[k], on:{input: e => { K.ozellik[k] = +e.target.value; d.textContent = e.target.value; kisilikKaydet(); }}});
    kap.append(eleman('div', {className:'ozellik'}, eleman('b', {textContent:ad}), eleman('small', {textContent:az}), r, eleman('small', {textContent:cok}), d));
  }
  const ses = (id, al, ver) => { $(id).value = Math.round(al()*100); $(id + 'D').textContent = al().toFixed(2); $(id).oninput = e => { ver(e.target.value/100); $(id + 'D').textContent = (e.target.value/100).toFixed(2); kisilikKaydet(); }; };
  ses('kPerde', () => K.ses.perde, v => K.ses.perde = v); ses('kHiz', () => K.ses.hiz, v => K.ses.hiz = v);
  $('kSesDene').onclick = () => { sesliYanit = true; konus(`Merhaba${K.kullanici ? ' ' + K.kullanici : ''}! Ben ${K.ad}. Sesim böyle.`).bitti.then(() => { sesliYanit = false; }); };
}

/* ---------------- hafıza ---------------- */
function hafizaCiz(){
  const kap = $('hListe'); if (!kap) return; kap.innerHTML = '';
  $('hSayi').textContent = HAFIZA.length ? HAFIZA.length + ' kayıt' : '';
  if (!HAFIZA.length){ kap.append(eleman('p', {className:'not', textContent:'Henüz bir şey hatırlamıyor. Kendinden bahset ya da buraya ekle.'})); return; }
  for (const h of [...HAFIZA].reverse()){
    kap.append(eleman('div', {className:'kayit'},
      eleman('span', {className:'rozet r-' + h.tur, textContent:HAFIZA_TUR[h.tur]}),
      eleman('span', {className:'metin', textContent:h.metin}),
      eleman('small', {textContent:new Date(h.zaman).toLocaleDateString('tr-TR') + (h.kaynak === 'otomatik' ? ' · kendisi' : '')}),
      eleman('button', {className:'sil', type:'button', ariaLabel:'Sil', textContent:'✕', on:{click: () => hafizaSil(h.id)}})));
  }
  $('hNot').textContent = hafizaDurum.calisiyor ? 'hatırlıyor…' : hafizaDurum.son;
}
function hafizaEkranKur(){
  for (const [k, ad] of Object.entries(HAFIZA_TUR)) $('hTur').append(eleman('option', {value:k, textContent:ad}));
  const ekle = () => { const m = $('hYeni').value.trim(); if (!m) return; hafizaEkle(m, $('hTur').value, 'elle'); $('hYeni').value = ''; };
  $('hEkle').onclick = ekle; $('hYeni').addEventListener('keydown', e => { if (e.key === 'Enter') ekle(); });
  $('hSimdi').onclick = async () => { if (aiDurum !== 'acik'){ $('hNot').textContent = 'Bunun için yapay zekâ bağlı olmalı.'; return; } $('hNot').textContent = 'hatırlıyor…'; await hafizaCikar(); };
  onayli($('hTemizle'), () => { HAFIZA = []; hafizaKaydet(); });
  onayli($('gecmisSil'), () => { gecmis = []; gecmisKaydet(); sohbetEkle('sistem', 'Sohbet geçmişi temizlendi.'); });
  hafizaCiz();
}

/* ---------------- kıyafet atölyesi ---------------- */
function atolyeKiyafetCiz(){
  const kap = $('tListe'); if (!kap) return; kap.innerHTML = '';
  const l = Object.entries(OZEL_KIYAFET); $('tOzelBolum').hidden = !l.length;
  for (const [id, o] of l){
    const ornek = eleman('span', {className:'ornek'}); ornek.style.background = `linear-gradient(135deg, ${o.ust || '#ddd'} 0 50%, ${o.alt || o.ust || '#ddd'} 50%)`;
    kap.append(eleman('div', {className:'kayit'}, ornek,
      eleman('span', {className:'metin', textContent:`${o.ad} · ${KIYAFET_TANIM[o.temel]?.ad || o.temel}${o.desen !== 'duz' ? ', ' + DESEN_AD[o.desen].toLowerCase() : ''}${o.kim === 'nova' ? ' · Nova tasarladı' : ''}`}),
      eleman('button', {className:'btn ikincil kucuk', type:'button', textContent:'Giy', on:{click: () => calistir([{kiyafet:id}], {kaynak:'arayuz'}).catch(e => sohbetEkle('sistem', e.message))}}),
      eleman('button', {className:'sil', type:'button', ariaLabel:'Sil', textContent:'✕', on:{click: () => { kiyafetSil(id); atolyeKiyafetCiz(); }}})));
  }
}
function kiyafetEkranKur(){
  for (const k of TEMEL_KIYAFET) $('tTemel').append(eleman('option', {value:k, textContent:KIYAFET_TANIM[k].ad}));
  $('tTemel').value = 'elbise';
  for (const [k, ad] of Object.entries(DESEN_AD)) $('tDesen').append(eleman('option', {value:k, textContent:ad}));
  const tasarim = () => ({ ad:$('tAd').value.trim() || 'Yeni kıyafet', temel:$('tTemel').value, ust:$('tUstVar').checked ? $('tUst').value : null, alt:$('tAltVar').checked ? $('tAlt').value : null, desen:$('tDesen').value });
  $('tOnizle').onclick = () => {
    const t = tasarim(); KIYAFET_TANIM.__deneme = {...KIYAFET_TANIM[t.temel], ad:'Deneme', ozel:t};
    kiyafetUygula('__deneme'); $('tNot').textContent = 'Üstünde deneniyor. Beğendiysen gardıroba ekle.';
  };
  $('tKaydet').onclick = () => { const id = kiyafetTasarla(tasarim()); $('tNot').textContent = `“${OZEL_KIYAFET[id].ad}” gardıroba eklendi.`; if (giyim.simdi === '__deneme') kiyafetUygula(id); };
  $('tGiy').onclick = () => { const id = kiyafetTasarla(tasarim()); $('tNot').textContent = 'Nova dolaba gidiyor…'; cekmece(false); calistir([{kiyafet:id}], {kaynak:'arayuz'}).catch(e => sohbetEkle('sistem', e.message)); };
  atolyeKiyafetCiz();
}

/* ---------------- oda tasarımı ---------------- */
function odaEkranCiz(){
  const kap = $('dEsyalar'); if (!kap) return; kap.innerHTML = '';
  for (const [k, m] of Object.entries(MOBILYA)) kap.append(eleman('button', {className:'cip', type:'button', textContent:m.ad, ariaPressed:duzenle.secili === k, on:{click: () => { if (!app.classList.contains('duzenleniyor')) odaModu(true); esyaSec(duzenle.secili === k ? null : k); }}}));
  const d = duzenle.secili && DUZEN.esya[duzenle.secili];
  $('dNot').textContent = duzenle.secili ? `${MOBILYA[duzenle.secili].ad}${d ? ` · ${(d.x||0).toFixed(1)} m, ${(d.z||0).toFixed(1)} m, ${Math.round((d.r||0)*R2D)}°` : ' · ilk yerinde'}` : 'Eşya seçilmedi.';
  $('dPed').classList.toggle('pasif', !duzenle.secili);
}
function odaModu(ac){ duzenModu(ac); $('dMod').textContent = ac ? 'Düzenlemeyi bitir' : 'Düzenlemeye başla'; odaEkranCiz(); }
function odaEkranKur(){
  $('dMod').onclick = () => odaModu(!app.classList.contains('duzenleniyor'));
  const A = 0.1, D = Math.PI/12;
  const is = { sol:[-A, 0, 0], sag:[A, 0, 0], ileri:[0, -A, 0], geri:[0, A, 0], 'sol-don':[0, 0, D], 'sag-don':[0, 0, -D] };
  for (const b of $('dPed').querySelectorAll('button')){
    let tekrar = null;
    const yap = () => { if (b.dataset.d === 'sifirla'){ if (duzenle.secili) esyaSifirla(duzenle.secili); } else esyaOynat(...is[b.dataset.d]); odaEkranCiz(); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); yap(); if (b.dataset.d !== 'sifirla') tekrar = setInterval(yap, 160); });
    for (const o of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(o, () => clearInterval(tekrar));
  }
  for (const [k, [ad]] of Object.entries(ZEMIN_SECENEK)) $('dZemin').append(eleman('option', {value:k, textContent:ad}));
  for (const [k, [ad]] of Object.entries(DUVAR_SECENEK)) $('dDuvar').append(eleman('option', {value:k, textContent:ad}));
  $('dZemin').value = DUZEN.zemin; $('dDuvar').value = DUZEN.duvar;
  $('dZemin').onchange = e => { DUZEN.zemin = e.target.value; duzenKaydet(); kaplamaUygula(); };
  $('dDuvar').onchange = e => { DUZEN.duvar = e.target.value; duzenKaydet(); kaplamaUygula(); };
  onayli($('dHepsi'), () => { DUZEN = {esya:{}, zemin:'pcb', duvar:'devre'}; duzenKaydet(); duzenUygula(); $('dZemin').value = 'pcb'; $('dDuvar').value = 'devre'; duzenle.kutu?.update(); odaEkranCiz(); });
  odaEkranCiz();
}

/* ---------------- ek komutlar ---------------- */
let komutDuzen = null;
function komutlarCiz(){
  const kap = $('cListe'); kap.innerHTML = '';
  if (!KOMUTLAR.length) kap.append(eleman('p', {className:'not', textContent:'Henüz komut yok.'}));
  for (const k of KOMUTLAR){
    const aktif = eleman('input', {type:'checkbox', checked:k.aktif !== false, title:'Açık / kapalı', on:{change: e => { k.aktif = e.target.checked; komutlarKaydet(); }}});
    kap.append(eleman('div', {className:'kayit komut'}, aktif,
      eleman('span', {className:'metin'}, eleman('b', {textContent:k.ad}), eleman('small', {textContent:' “' + k.tetik.join('”, “') + '” · ' + k.adimlar.length + ' adım'})),
      eleman('button', {className:'btn ikincil kucuk', type:'button', textContent:'Dene', on:{click: () => { cekmece(false); calistir(k.adimlar, {kaynak:'json'}).catch(e => sohbetEkle('sistem', e.message)); }}}),
      eleman('button', {className:'btn ikincil kucuk', type:'button', textContent:'Düzenle', on:{click: () => komutDuzenle(k)}}),
      eleman('button', {className:'sil', type:'button', ariaLabel:'Sil', textContent:'✕', on:{click: () => { KOMUTLAR = KOMUTLAR.filter(x => x !== k); komutlarKaydet(); komutlarCiz(); }}})));
  }
}
function komutDuzenle(k){
  komutDuzen = k || null;
  $('cEditor').hidden = false; $('cBaslik').textContent = k ? '“' + k.ad + '” komutunu düzenle' : 'Yeni komut';
  $('cAd').value = k?.ad || ''; $('cTetik').value = k ? k.tetik.join(', ') : ''; $('cAciklama').value = k?.aciklama || '';
  $('cJson').value = JSON.stringify(k?.adimlar || [{soz:'Tamam!', eylem:'el_salla'}], null, 1);
  $('cNot').textContent = ''; $('cEditor').scrollIntoView({behavior:'smooth', block:'start'});
}
function komutFormu(){
  let adimlar; try { adimlar = JSON.parse($('cJson').value); } catch(e){ throw new Error('Adımlar geçerli JSON değil: ' + e.message); }
  if (!Array.isArray(adimlar)) adimlar = [adimlar];
  const h = komutDogrula(adimlar); if (h.length) throw new Error(h.join(' · '));
  const tetik = $('cTetik').value.split(',').map(s => s.trim()).filter(Boolean);
  const ad = $('cAd').value.trim(); if (!ad) throw new Error('Komuta bir ad ver.');
  if (!tetik.length) throw new Error('En az bir tetikleyici söz yaz.');
  return {ad, tetik, aciklama:$('cAciklama').value.trim(), adimlar};
}
function komutEkranKur(){
  $('cYeni').onclick = () => komutDuzenle(null);
  $('cIptal').onclick = () => { $('cEditor').hidden = true; komutDuzen = null; };
  for (const [ad, sablon] of Object.entries(ADIM_SABLON)) $('cSablon').append(eleman('button', {className:'cip', type:'button', textContent:'+ ' + ad, on:{click: () => {
    let l; try { l = JSON.parse($('cJson').value || '[]'); } catch(e){ l = []; } if (!Array.isArray(l)) l = [l];
    l.push(JSON.parse(JSON.stringify(sablon))); $('cJson').value = JSON.stringify(l, null, 1); }}}));
  $('cKaydet').onclick = () => {
    try { const f = komutFormu();
      if (komutDuzen) Object.assign(komutDuzen, f);
      else KOMUTLAR.push({id:sluglastir(f.ad) + '_' + Date.now().toString(36).slice(-3), aktif:true, ...f});
      komutlarKaydet(); komutlarCiz(); $('cEditor').hidden = true; komutDuzen = null;
    } catch(e){ $('cNot').textContent = e.message; }
  };
  $('cDene').onclick = () => { try { const f = komutFormu(); $('cNot').textContent = 'Çalışıyor…'; calistir(f.adimlar, {kaynak:'json'}).then(() => $('cNot').textContent = 'Bitti.', e => $('cNot').textContent = e.message); } catch(e){ $('cNot').textContent = e.message; } };
  $('cSozlesme').textContent = JSON.stringify(SOZLESME, null, 1);
  komutlarCiz();
}

/* ---------------- yedek ---------------- */
function yedekKur(){
  const anahtarlar = () => Object.keys(localStorage).filter(k => k.startsWith('nova-') && k !== 'nova-ai');
  $('yedekAl').onclick = () => { const o = {}; for (const k of anahtarlar()) o[k] = depo.oku(k, null); $('yedekMetin').value = JSON.stringify({nova_yedek:1, tarih:new Date().toISOString(), veri:o}); $('yedekNot').textContent = Object.keys(o).length + ' bölüm (Groq anahtarı yedeğe girmez).'; };
  $('yedekKopya').onclick = async () => { $('yedekMetin').select(); try { await navigator.clipboard.writeText($('yedekMetin').value); $('yedekNot').textContent = 'Kopyalandı.'; } catch(e){ document.execCommand?.('copy'); $('yedekNot').textContent = 'Kopyalandı.'; } };
  onayli($('yedekYukle'), () => {
    try { const y = JSON.parse($('yedekMetin').value); if (!y.nova_yedek) throw 0;
      for (const [k, v] of Object.entries(y.veri)) if (k.startsWith('nova-')) depo.yaz(k, v);
      $('yedekNot').textContent = 'Yüklendi; uygulama yeniden açılıyor…'; setTimeout(() => location.reload(), 900);
    } catch(e){ $('yedekNot').textContent = 'Bu bir Nova yedeği değil.'; }
  });
}

/* ---------------- kurulum ---------------- */
function ekranlariKur(){
  for (const id of ['mikBtn', 'mikBtn2']) $(id).onclick = () => mikrofon($(id));
  aiEkranKur(); kisilikEkranKur(); hafizaEkranKur(); kiyafetEkranKur(); odaEkranKur(); komutEkranKur(); yedekKur();
  ayarlariYukle();
  // eski sohbeti göster (kalıcı geçmiş)
  for (const m of gecmis.slice(-8)){
    if (m.role === 'user') sohbetEkle('ben', m.content);
    else { try { const j = JSON.parse(m.content); if (j.soz) sohbetEkle('nova', j.soz); } catch(e){} }
  }
  if (platform.native) platform.bildirimIzniIste();
  if (platform.native && !AI_AYAR.anahtar) setTimeout(() => sohbetEkle('sistem', 'Nova\'nın tam beyni için Kontroller → Ayarlar → Yapay zekâ bölümüne ücretsiz Groq anahtarını gir. O zamana kadar basit komutları anlıyor.'), 1500);
}
ekranlariKur();
