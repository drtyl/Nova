'use strict';
/* ---- ışık: saate göre gündüz / akşam / gece ---- */
function gunDilimi(){
  const ayar = $('gunIsigi')?.value || 'telefon';
  if (ayar === 'telefon') return KOYU_MOD?.matches ? 'gece' : 'gunduz';   // telefonun açık/koyu modu
  if (ayar !== 'oto') return ayar;
  const d = new Date(), s = d.getHours() + d.getMinutes()/60;
  return s >= 7 && s < 17.5 ? 'gunduz' : s >= 17.5 && s < 20 ? 'aksam' : 'gece';
}
let sonDilim = null;
function odaIsikGuncelle(zorla){
  if (tema !== 'oda') return;
  const dilim = gunDilimi(), uyku = akt.ad === 'uyu' && akt.durum === 'yapiyor';
  const anahtar = dilim + (uyku ? '-uyku' : '');
  if (anahtar === sonDilim && !zorla) return; sonDilim = anahtar;
  ekranCiz(dilim);
  const gun = dilim === 'gunduz', aksam = dilim === 'aksam';
  gok.color.set(gun ? 0xfff6ec : aksam ? 0xffd6be : 0x8a90c8); gok.groundColor.set(gun ? 0xc9b49c : aksam ? 0x8a6a58 : 0x221d2c);
  gok.intensity = gun ? 0.5 : aksam ? 0.38 : (uyku ? 0.18 : 0.26);
  anaIsik.color.set(gun ? 0xfff1e2 : aksam ? 0xffc296 : 0x9fa9e0); anaIsik.intensity = gun ? 2.1 : aksam ? 1.2 : 0.3;
  dolgu.intensity = gun ? 0.35 : 0.12; kontur.intensity = gun ? 0.35 : 0.2;
  pencereIsik.intensity = gun ? 1.2 : aksam ? 0.7 : 0.15; pencereIsik.color.set(gun ? 0xe8f1ff : aksam ? 0xffc2a0 : 0x8d96ff);
  const lambalar = !gun;
  const isikla = (isik, abajur, guc) => { isik.intensity = guc; abajur.material.emissiveIntensity = guc > 0 ? 0.9 : 0; };
  isikla(masaIsik, masaAbajur, lambalar && !uyku ? 1.6 : 0);
  isikla(ayakliIsik, ayakliAbajur, lambalar && !uyku ? 2.2 : 0);
  isikla(komodinIsik, komodinAbajur, lambalar ? (uyku ? 0.5 : 1.3) : 0);
  periIsik.intensity = lambalar ? (uyku ? 0.6 : 1.0) : 0.15;
  for (const p of periIsiklari) p.material.color.set(lambalar ? 0xffd27a : 0xf3e6c8);
  // ortam yansıması (IBL) da gün ışığıyla birlikte azalır; yoksa gece oda gündüz gibi aydınlık kalır
  ortamIsigi(gun ? 1 : aksam ? 0.55 : (uyku ? 0.08 : 0.14));
  app.dataset.dilim = dilim;
}
setInterval(() => odaIsikGuncelle(), 15000);
function ortamIsigi(k){
  sahne.traverse(o => { if (!o.isMesh) return;
    for (const m of [].concat(o.material)) if (m && m.envMap){ m.userData.ortamTaban ??= m.envMapIntensity; m.envMapIntensity = m.userData.ortamTaban*k; } });
}
