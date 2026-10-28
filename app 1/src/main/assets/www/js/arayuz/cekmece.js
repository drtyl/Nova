'use strict';
/* =========================================================
   13. ÇEKMECE, HIZLI SOHBET, TEMA, TEMİZ GÖRÜNÜM
   ========================================================= */
function cekmece(ac){
  app.classList.toggle('acik', ac);
  $('cekmeceBtn').setAttribute('aria-expanded', ac);
  $('panel').inert = !ac;
}
function sadeMod(ac){
  app.classList.toggle('sade', ac);
  if (ac) cekmece(false);
  $('geriGetir').hidden = !ac;
}
function arayuzKur2(){
  $('panel').inert = true;
  for (const id of ['hizliMesaj','mesaj']) $(id).addEventListener('input', () => { const n = performance.now()/1000; if (n - ic.yazmaSon > 3){ ic.yazmaSon = n; kullaniciGeldi(false); } });
  setTimeout(() => sohbetEkle('sistem', 'İpucu: yere dokunursan oraya yürür; yatağa, koltuğa, şövaleye, masaya ya da pencereye dokunursan orada bir şey yapar. Nova\'ya dokunursan sana döner.'), 900);
  $('cekmeceBtn').onclick = () => cekmece(!app.classList.contains('acik'));
  $('kapat').onclick = () => cekmece(false);
  document.addEventListener('keydown', e => { if (e.key === 'Escape'){ if (app.classList.contains('sade')) sadeMod(false); else cekmece(false); } });
  // telefonda çekmeceyi aşağı kaydırarak kapat
  let suruk = null;
  for (const el of [document.querySelector('.tutamak'), document.querySelector('.panelBas')]){
    el.addEventListener('pointerdown', e => { suruk = e.clientY; });
  }
  addEventListener('pointerup', e => { if (suruk !== null && e.clientY - suruk > 60) cekmece(false); suruk = null; });
  $('hizliForm').addEventListener('submit', e => { e.preventDefault(); const m = $('hizliMesaj').value.trim(); if (!m || $('hizliMesaj').disabled) return; $('hizliMesaj').value = ''; mesajGonder(m); });
  for (const b of document.querySelectorAll('#temalar .tema')) b.onclick = () => temaAyarla(b.dataset.t);
  $('golgeAc').onchange = e => { zemin.visible = e.target.checked && tema !== 'oda'; anaIsik.castShadow = e.target.checked; };
  $('sadeBtn').onclick = () => sadeMod(true);
  $('geriGetir').onclick = () => sadeMod(false);
  setTimeout(() => { const [p, t, o] = kameraPreset('tum'); kamera.position.set(...p); kontrol.target.set(...t); takip.x = o[0]; takip.z = o[1]; kameraGecis = null; }, 0);
  for (const [k, ad] of Object.entries(AKTIVITE_AD)){
    const c = document.createElement('button'); c.className = 'cip'; c.type = 'button'; c.textContent = ad;
    c.onclick = () => { ic.sonKullanici = performance.now()/1000; calistir([{aktivite:k}], {kaynak:'dokunma'}).catch(hataGoster); };
    $('etkinlikler').appendChild(c);
  }
  for (const id of ['uykuBas','uykuBit']){ $(id).value = depo.oku('nova-' + id, $(id).value); $(id).onchange = e => depo.yaz('nova-' + id, e.target.value); }
  $('gunIsigi').onchange = () => { sonDilim = null; odaIsikGuncelle(true); };
  gunlukCiz();
  temaAyarla(depo.oku('nova-tema2', 'oda'));
  $('baglanti').textContent =
`// Lonca → Nova (iframe ya da WebView içindeki sayfaya)
nova.postMessage({
  tip: "nova", id: 1,
  tema: "seffaf",            // isteğe bağlı: studyo | gece | seffaf
  arayuz: false,             // isteğe bağlı: kontrolleri gizle
  komut: [{ eylem: "el_salla", soz: "Merhaba!" }]
}, "*")

// Nova → Lonca
{ tip: "nova-hazir" }                    // model yüklendi
{ tip: "nova-cevap", id: 1, durum: "bitti" }
{ tip: "nova-cevap", id: 1, durum: "hata", hata: "…" }

// Aynı sayfadaysa doğrudan:
Nova.komut([{ eylem: "kalp" }])
Nova.konus("Görev tamam!")
Nova.ruhHali("yorgun")
Nova.tema("seffaf");  Nova.arayuz(false)`;
}
