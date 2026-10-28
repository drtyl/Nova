'use strict';
function gunlukCiz(){
  const kap = $('gunlukListe'); if (!kap) return; kap.innerHTML = '';
  if (!gunluk.length){ kap.innerHTML = '<p class="not">Henüz kayıt yok. Nova bir şey yaptıkça burada birikecek.</p>'; return; }
  for (const g of gunluk.slice(-12).reverse()){
    const d = document.createElement('div'), t = document.createElement('time'), m = document.createElement('span');
    t.textContent = new Date(g.t).toLocaleString('tr-TR', {weekday:'short', hour:'2-digit', minute:'2-digit'});
    m.textContent = g.ad === 'tablo_bitti' ? 'Bir tabloyu bitirip duvara astı' : `${g.dk} dk ${ISTASYON[g.ad]?.ad || g.ad}${g.not ? ' · ' + g.not : ''}`;
    d.append(t, m); kap.appendChild(d);
  }
}
