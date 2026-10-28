'use strict';
/* =========================================================
   PLATFORM — telefonda (APK) NovaNative köprüsü, tarayıcıda web karşılıkları
   ========================================================= */
const NATIVE = window.NovaNative || null;
let sesliYanit = false;   // mikrofonla konuşulunca Nova sesli yanıt verir
const platform = {
  native: !!NATIVE,
  konusuyor: false,
  _http: {}, _sira: 0, _sesDinleyici: new Set(),
  /* İnternet isteği: telefonda yerel katmandan (CORS yok), tarayıcıda fetch */
  http(url, {method = 'GET', headers = {}, body = '', signal} = {}){
    if (!NATIVE) return fetch(url, {method, headers, body: method === 'GET' ? undefined : body, signal}).then(async r => ({status: r.status, text: await r.text()}));
    return new Promise((res, rej) => {
      const id = 'h' + (++this._sira);
      this._http[id] = {res, rej};
      signal?.addEventListener('abort', () => { delete this._http[id]; rej({code: 'cancelled'}); });
      NATIVE.http(id, url, method, JSON.stringify(headers), body || '');
    });
  },
  sesDinle(f){ this._sesDinleyici.add(f); return () => this._sesDinleyici.delete(f); },
  /* Sesli konuşma: telefonda cihaz TTS, tarayıcıda speechSynthesis (katmanlar.js) */
  konus(metin, {perde = 1.1, hiz = 1, ses = ''} = {}){
    if (!NATIVE) return null;
    return new Promise(res => {
      let bitti = false; const son = () => { if (bitti) return; bitti = true; this.konusuyor = false; kapat(); res(); };
      const kapat = this.sesDinle(o => { if (o === 'konusmaBasladi') this.konusuyor = true; if (o === 'konusmaBitti') son(); });
      setTimeout(son, Math.max(4000, metin.length*140));
      NATIVE.konus(metin, perde, hiz, ses || '');
    });
  },
  sus(){ if (NATIVE) NATIVE.sus(); else try { speechSynthesis.cancel(); } catch(e){} this.konusuyor = false; },
  sesler(){ if (!NATIVE) return []; try { const r = JSON.parse(NATIVE.sesler()); return r.ok ? r.data : []; } catch(e){ return []; } },
  /* Mikrofon: tek seferlik dinleme. olay(ad, veri): dinliyor | kismi | sonuc | bitti | hata */
  dinle(olay){
    if (NATIVE){
      const kapat = this.sesDinle((o, v) => {
        if (o === 'dinliyor') olay('dinliyor');
        else if (o === 'kismi') olay('kismi', v);
        else if (o === 'seviye') olay('seviye', +v);
        else if (o === 'sonuc'){ kapat(); olay('sonuc', v); }
        else if (o === 'dinlemeHatasi'){ kapat(); olay('hata', +v === 7 ? 'Bir şey duyamadım.' : +v === 6 ? 'Ses gelmedi.' : 'Dinleme hatası (' + v + ').'); }
        else if (o === 'hata'){ kapat(); olay('hata', v); }
      });
      NATIVE.dinle();
      return () => { kapat(); NATIVE.dinlemeyiBirak(); };
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR){ olay('hata', 'Bu tarayıcıda mikrofonla konuşma desteklenmiyor; uygulamada (APK) çalışır.'); return () => {}; }
    const r = new SR(); r.lang = 'tr-TR'; r.interimResults = true;
    r.onstart = () => olay('dinliyor');
    r.onresult = e => { const s = [...e.results].map(x => x[0].transcript).join(' '); if (e.results[e.results.length - 1].isFinal) olay('sonuc', s); else olay('kismi', s); };
    r.onerror = e => olay('hata', e.error === 'no-speech' ? 'Bir şey duyamadım.' : 'Mikrofon hatası: ' + e.error);
    r.start(); return () => r.stop();
  },
  bildirim(baslik, metin, anahtar = 'nova'){ if (NATIVE) try { NATIVE.bildirim(baslik, metin, anahtar); } catch(e){} },
  bildirimIzniIste(){ if (NATIVE) try { NATIVE.bildirimIzniIste(); } catch(e){} },
};
window.__novaHttpDone = (id, durum, b64) => {
  const b = platform._http[id]; if (!b) return; delete platform._http[id];
  let metin = '';
  try { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); metin = new TextDecoder('utf-8').decode(u); } catch(e){}
  b.res({status: durum, text: metin});
};
window.__novaSes = (olay, veri) => { for (const f of [...platform._sesDinleyici]) try { f(olay, veri); } catch(e){} };
/* telefonun geri tuşu: önce açık pencereler kapanır */
window.novaGeri = () => {
  if (document.querySelector('.app.sade')){ sadeMod(false); return true; }
  if (document.querySelector('.app.acik')){ cekmece(false); return true; }
  return false;
};
window.novaDuraklat = () => { platform.sus(); };
