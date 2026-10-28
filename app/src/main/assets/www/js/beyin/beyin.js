'use strict';
/* =========================================================
   10. BEYİN — yapay zekâ (telefonda Groq; önizlemede Claude) ya da yerel çevirici
   ========================================================= */
let sample = null, aiDurum = 'bekliyor', gecmis = depo.oku('nova-gecmis', []), aiKontrol = null, aiAdi = '';
const AI_AYAR = Object.assign({anahtar:'', model:'llama-3.3-70b-versatile'}, depo.oku('nova-ai', {}));
const GROQ_MODELLER = [['llama-3.3-70b-versatile', 'Llama 3.3 70B (önerilen)'], ['openai/gpt-oss-120b', 'GPT-OSS 120B'], ['openai/gpt-oss-20b', 'GPT-OSS 20B (hızlı)'], ['llama-3.1-8b-instant', 'Llama 3.1 8B (en hızlı)']];
/* Groq: Claude'un "sample" arayüzüyle aynı biçimde çalışır (json(turlar, {signal})) */
function groqBeyni(){
  const istek = async (turlar, {signal, json = true} = {}) => {
    const mesajlar = turlar.map((t, i) => ({role: i === 0 && t.role === 'user' && turlar.length > 1 ? 'system' : t.role, content: String(t.content)}));
    const govde = {model: AI_AYAR.model, messages: mesajlar, temperature: 0.8, max_tokens: 1200};
    if (json) govde.response_format = {type: 'json_object'};
    const r = await platform.http('https://api.groq.com/openai/v1/chat/completions', {method: 'POST', signal,
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_AYAR.anahtar}, body: JSON.stringify(govde)});
    if (r.status === 401 || r.status === 403) throw {code: 'anahtar'};
    if (r.status === 429) throw {code: 'rate_limited'};
    if (r.status < 200 || r.status >= 300) throw {code: 'ag', detay: (r.text || '').slice(0, 160)};
    const icerik = JSON.parse(r.text).choices?.[0]?.message?.content || '';
    if (!json) return icerik;
    try { return JSON.parse(icerik); } catch(e){ const m = icerik.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw {code: 'invalid_json'}; }
  };
  return { json: (t, o) => istek(t, {...o, json: true}), text: (t, o) => istek(t, {...o, json: false}) };
}
function gecmisKaydet(){ gecmis = gecmis.slice(-24); depo.yaz('nova-gecmis', gecmis); }
const ozelHareketler = depo.oku('nova-hareketlerim', {});
const ogrenilenler = depo.oku('nova-ogrendikleri', {});
const sluglastir = a => String(a).toLocaleLowerCase('tr').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || String(Date.now());
function ogrenKaydet(h){
  const kok = 'ogr_' + sluglastir(h.ad); let ad = kok, i = 2;
  while (ogrenilenler[ad] && JSON.stringify(ogrenilenler[ad].kareler) !== JSON.stringify(h.kareler)) ad = kok + '_' + (i++);
  ogrenilenler[ad] = {...h, _zaman:Date.now()};
  const adlar = Object.keys(ogrenilenler).sort((a, b) => ogrenilenler[a]._zaman - ogrenilenler[b]._zaman);
  while (adlar.length > 24) delete ogrenilenler[adlar.shift()];
  depo.yaz('nova-ogrendikleri', ogrenilenler);
  try { ozelleriCiz(); } catch(e){}
  return ad;
}
function iskeletKurallari(){
  return `İSKELET KURALLARI (özel poz ya da yeni hareket için):
- Açılar derece, Euler sırası XYZ. Karakter +Z yönüne (kullanıcıya) bakar; karakterin SAĞI -X, SOLU +X.
- Dinlenme duruşu: rightUpperArm [0,0,72], rightLowerArm [0,10,0] (sol taraf aynası: leftUpperArm [0,0,-72], leftLowerArm [0,-10,0]).
- rightUpperArm: z=+72 kol yanda aşağı, z=0 yana yatay, z=-80 yukarı; y>0 kolu öne getirir (y=85,z=10 öne uzat).
- rightLowerArm: y>0 dirseği öne büker (0..150); z<0 ön kolu yukarı kaldırır (el sallamada z≈-90..-115).
- head/neck: x>0 aşağı (başını öne eğ), y>0 karakterin SOLUNA dön, z>0 başı kendi SAĞINA yatır. spine/chest x>0 öne eğil, x<0 geriye.
- rightUpperLeg x<0 bacağı öne kaldırır; rightLowerLeg x>0 dizi büker; _kok [x,y,z] metre cinsinden gövde kaydırma (y=-0.06 çömel, +0.12 havada).
- SOL taraf: left… kemiği, sağın aynası: x aynı, y ve z işaret değiştirir.
- Sınırlar (sağ taraf, [min,max] x,y,z): ${Object.entries(VERI.sinirlar).filter(([k])=>!k.startsWith('_')).map(([k,v])=>k+' '+JSON.stringify(v)).join('; ')}.`;
}
function hareketListesi(){
  const l = Object.entries(VERI.hareketler).map(([k,h]) => `${k} (${h.ad}${h.dongu?', döngülü':''})`);
  for (const [k,h] of Object.entries(ozelHareketler)) l.push(`${k} (${h.ad}, kullanıcının atölyede yaptığı)`);
  for (const [k,h] of Object.entries(ogrenilenler)) l.push(`${k} (${h.ad}, senin daha önce uydurduğun)`);
  return l.join(', ');
}
function kimlikMetni(){
  if (typeof kisilikMetni === 'function') return kisilikMetni();
  return `Sen Nova'sın: kullanıcının akıllı asistanısın ve kendi odanda yaşıyorsun. Koyu renk saçlı genç bir kadınsın; anime tarzı bir 3B bedenin var. Şu an üzerinde yalnızca sade, açık renk bir iç çamaşırı (sütyen ve kilot) var; gardırop henüz odana gelmedi. Kendi odandasın ve bedenini JSON komutlarıyla kendin yönetiyorsun.
DÜRÜSTLÜK: Yapmadığın bir şeyi "yaptım" deme, geçmişe dair olay ya da kişi uydurma, bilmediğini bilmiyorum de. Gelecek planı ve his ifadesi serbest. Bir nesne tutamazsın, sahneden çıkamazsın; bunları isterlerse dürüstçe söyle.`;
}
function yetenekMetni(){
  return `ÖZGÜRLÜĞÜN: Hazır hareket listesi yalnızca bir başlangıç. Listede olmayan HER hareketi "hareket" alanında kendi anahtar karelerinle yaratabilirsin; yarattığın hareketler hafızana kaydedilir ve sonra adıyla tekrar kullanırsın. Sahnede istediğin yere yürüyebilir, dönebilir, etrafına bakabilirsin.
KOMUT ALANLARI (her komut bir nesne; sırayla oynatılır):
- eylem: hazır ya da öğrendiğin hareketin adı; taraf ("sag"|"sol"); sure; hiz (0.5–2)
- hareket: {"ad":"kısa Türkçe ad","sure":sn,"dongu":bool,"donem":sn,"simetrik":bool,"ifade":"…","el":{…},"kareler":[{"t":0,"poz":"dinlenme"},{"t":0.4,"poz":{kemik:[x,y,z],…}},…,{"t":1,"poz":"dinlenme"}]} — her kare bir öncekini devralır
- git: {"x":-1.5…1.5,"z":-1.6…0.9} (x: ekranın solu − / sağı +; z: arka/uzak − / kullanıcıya yakın +; 0,0 sahnenin ortası) ya da "merkez"|"sana"|"geri"|"sol"|"sag"; sonra: "kamera" (vardığında sana döner) | "serbest"
- don: "kamera" ya da derece; bak: "kamera"|"sol"|"sag"|"yukari"|"asagi"
- ifade: mutlu|kizgin|uzgun|rahat|saskin, yogunluk 0–1; el: rahat|acik|yumruk|isaret|zafer|kalp ya da {"sag":…,"sol":…}
- poz: {kemik:[x,y,z]} tek duruş (sure ile)
- durus: "ayakta"|"otur"|"yere_otur"|"uzan" — kalıcı duruş (otur = koltuğa gider oturur; yere_otur = olduğun yerde yere oturursun; uzan = yere uzanırsın). Otururken konuşmak ya da jest yapmak için kalkma; "kalk" deyince ya da yürümen gerekince kalkarsın.
- disari: "cik" — evinden (bu uygulamadan) çıkıp kullanıcının telefonunun ana ekranına gidersin; orada simgelerin üstüne oturur, arkalarına saklanırsın. YALNIZCA kullanıcı açıkça isterse ("dışarı çık", "ana ekrana gel"). Uygulama açılınca eve dönersin.
- kiyafet: "gunluk"|"elbise"|"ev"|"pijama"|"spor"|"ic" — gardıroba gider, kapağı açar ve kapağın önünde değişirsin (kullanıcı isterse ya da uygun olduğunda: yatmadan önce pijama gibi)
- aktivite: "kitap"|"resim"|"yaz"|"pencere"|"uyu"|"kalk" — odadaki etkinlikler (uzun sürer, sure ile saniye verebilirsin). Odada yürürken eşyaların arasından yolu kendin bulursun; odada x −2.3…2.3, z −2.0…1.9.
Hazır ve öğrenilmiş hareketler: ${hareketListesi()}.
${iskeletKurallari()}`;
}
function sohbetKurallari(){
  return `${kimlikMetni()}
${odaMetni()}
${typeof hafizaMetni === 'function' ? hafizaMetni() : ''}
${typeof komutlarMetni === 'function' ? komutlarMetni() : ''}
${typeof telefonMetni === 'function' ? telefonMetni() : ''}
Kullanıcıyla Türkçe, kısa (1–2 cümle), doğal ve kişiliğine uygun konuş.
YANITIN YALNIZCA şu JSON olsun: {"soz": "söyleyeceğin cümle", "komutlar": [ ... ], "ruh_hali": "opsiyonel"}
- komutlar sırayla oynatılır (0–4 öğe). "soz" ilk komutla birlikte söylenir; komutların içine soz koyma.
${yetenekMetni()}
- Duruma uygun ve çeşitli davran. Kalıplara sıkışma: aynı duygu için her seferinde aynı hareketi seçme; uygun hazır hareket yoksa ya da daha ifadeli olacaksa kendi hareketini yarat. Her mesajda büyük hareket şart değil; bazen bir bakış, bir ifade ya da birkaç adım yeter.
- Ruh halleri (kalıcı duruş): notr, neseli, enerjik, merakli, gergin, uzgun, yorgun — yalnızca konuşmanın gidişatı gerçekten değiştirirse değiştir.
Şu an: ruh halin ${ruh}; konumun x=${govde.position.x.toFixed(2)}, z=${govde.position.z.toFixed(2)}.`;
}
function aiHataMetni(e){
  return ({ not_granted:'Yapay zekâ izni verilmedi; basit çeviriciyle devam ediyorum.', sampling_disabled:'Bu hesapta yapay zekâ kapalı; basit çeviriciyle devam ediyorum.',
    rate_limited:'Çok sık soruldu; biraz bekleyip tekrar dene.', anahtar:'Groq anahtarı geçersiz; Ayarlar → Yapay zekâ bölümünden kontrol et.', ag:'Yapay zekâya ulaşılamadı; internet bağlantını kontrol et.', invalid_json:'Yanıtı çözemedim; bir kez daha dener misin?', refused:'Buna yanıt veremedim.',
    session_expired:'Oturum düşmüş; yeniden giriş yapman gerekiyor.' })[e?.code] || 'Bağlantıda bir sorun oldu; tekrar dene.';
}
function beyinYaz(){
  const b = $('beyin');
  b.className = 'beyin ' + (aiDurum === 'acik' ? 'ai' : aiDurum === 'yerel' ? 'yerel' : '');
  $('beyinNokta').className = 'nokta ' + (aiDurum === 'acik' ? 'ai' : aiDurum === 'yerel' ? 'yerel' : '');
  $('beyinKisa').innerHTML = aiDurum === 'acik' ? 'beyin: <i>' + aiAdi + '</i>' : aiDurum === 'yerel' ? 'beyin: basit çevirici' : 'beyin bağlanıyor…';
  b.lastElementChild.textContent = aiDurum === 'acik' ? 'beyin: yapay zekâ (' + aiAdi + ') · hareketleri kendisi seçiyor' : aiDurum === 'yerel' ? (platform.native ? 'beyin: basit çevirici · Ayarlar → Yapay zekâ bölümüne Groq anahtarını gir' : 'beyin: basit kelime çevirici') : 'beyin bağlanıyor…';
}
async function beyinBagla(){
  sample = null;
  if (!platform.native){ try { sample = await window.claude?.use?.('sample'); if (sample) aiAdi = 'Claude'; } catch(e){ sample = null; } }
  if (!sample && AI_AYAR.anahtar){ sample = groqBeyni(); aiAdi = 'Groq · ' + (GROQ_MODELLER.find(m => m[0] === AI_AYAR.model)?.[1].replace(/ \(.*\)/, '') || AI_AYAR.model); }
  aiDurum = sample ? 'acik' : 'yerel'; beyinYaz();
  $('tarifEt').disabled = !sample;
  $('tarifDurum').textContent = sample ? '' : 'Yapay zekâ bağlı değil (Ayarlar → Yapay zekâ).';
}
beyinBagla();
setTimeout(() => { if (aiDurum === 'bekliyor'){ aiDurum = 'yerel'; beyinYaz(); } }, 11000);

function aiYanitiniTemizle(y){
  if (!y || typeof y !== 'object') throw {code:'invalid_json'};
  const soz = typeof y.soz === 'string' ? y.soz.slice(0, 300) : '';
  let komutlar = Array.isArray(y.komutlar) ? y.komutlar.slice(0, 5) : [];
  komutlar = komutlar.map(k => {
    if (!k || typeof k !== 'object' || !k.hareket || k.eylem) return k;
    const c = {...k}; delete c.hareket;
    try { c.eylem = ogrenKaydet(hareketiTemizle(k.hareket)); } catch(e){}
    return c;
  });
  komutlar = komutlar.filter(k => k && typeof k === 'object' && !dogrula(k).length).map(k => { const c = {...k}; delete c.soz; delete c.kalici; return c; });
  if (soz){ if (!komutlar.length) komutlar.push({}); komutlar[0].soz = soz; }
  if (y.ruh_hali && VERI.ruh_halleri[y.ruh_hali]){ if (!komutlar.length) komutlar.push({}); komutlar[0].ruh_hali = y.ruh_hali; }
  return {soz, komutlar};
}
async function mesajGonder(metin, {sesle = false} = {}){
  sohbetEkle('ben', metin);
  kullaniciGeldi(true);
  if (sesle) sesliYanit = true;
  // kullanıcının kendi tanımladığı komutlar yapay zekâdan önce gelir
  const ozel = typeof komutBul === 'function' ? komutBul(metin) : null;
  if (ozel){ sohbetEkle('sistem', `“${ozel.ad}” komutu çalışıyor`); gecmis.push({role:'user', content:metin}, {role:'assistant', content:JSON.stringify({soz:'', komutlar:[{ozel:ozel.id}]})}); gecmisKaydet(); await calistir(ozel.adimlar, {kaynak:'json'}).catch(e => sohbetEkle('sistem', e.message)); return; }
  if (aiDurum === 'acik' && sample){
    gecmis.push({role:'user', content:metin});
    const dus = sohbetEkle('nova', null, null, true);
    balon.goster('…', 120, true);
    dusunuyor = true; aiKontrol = new AbortController(); arayuzMesgul(true);
    try {
      const turlar = [{role:'user', content:sohbetKurallari()}, ...gecmis.slice(-12)];
      const ham = await sample.json(turlar, {modelTier:'quick', cache:false, signal:aiKontrol.signal});
      const {soz, komutlar} = aiYanitiniTemizle(ham);
      gecmis.push({role:'assistant', content:JSON.stringify(ham)}); gecmisKaydet();
      if (typeof hafizaTetik === 'function') hafizaTetik();
      dus.remove(); dusunuyor = false;
      sohbetEkle('nova', soz || '…', komutlar);
      await calistir(komutlar, {kaynak:'ai'});
    } catch(e){
      dus.remove(); dusunuyor = false; gecmis.pop(); balon.gizle();
      if (e?.code === 'cancelled') return;
      if (['not_granted','sampling_disabled','not_declared','capability_disabled'].includes(e?.code)){ aiDurum = 'yerel'; beyinYaz(); $('tarifEt').disabled = true; }
      sohbetEkle('sistem', aiHataMetni(e));
      if (aiDurum === 'yerel') yerelYanit(metin);
    } finally { dusunuyor = false; arayuzMesgul(false); }
  } else yerelYanit(metin);
}
function yerelYanit(metin){
  const komutlar = metniCevir(metin);
  sohbetEkle('nova', komutlar[0]?.soz || 'Tamam!', komutlar);
  if (!komutlar[0].soz) komutlar[0].soz = 'Tamam!';
  calistir(komutlar, {kaynak:'yerel'}).catch(e => sohbetEkle('sistem', e.message));
}
