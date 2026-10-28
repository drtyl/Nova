'use strict';
/* =========================================================
   3. OYNATICI — hareket izini oynatır, girişte/çıkışta yumuşatır
   ========================================================= */
const oynatici = {
  aktif:null, son:kopyala(DINLENME),
  oynat(ad, kareler, {dongu=false, donem=1, sure=1, tut=false}={}){
    this.aktif = {ad, kareler, dongu, donem, sure, tut, bas:performance.now()/1000, onceki:kopyala(this.son)};
  },
  oynatKlip(ad, {dongu=false, sure=null, hiz=1}={}){
    const k = KLIP[ad]; if (!k) return;
    this.aktif = {ad, klip:ad, dongu, sure: sure ?? k.sure/hiz, hiz, bas:performance.now()/1000, onceki:kopyala(this.son)};
  },
  dur(){ this.aktif = {ad:'dinlenme', kareler:[{t:0,poz:kopyala(DINLENME)},{t:1,poz:kopyala(DINLENME)}], dongu:false, donem:1, sure:0.6, bas:performance.now()/1000, onceki:kopyala(this.son), sabit:true}; },
  calisiyor(){ return this.aktif && !this.aktif.sabit; },
  ornekle(simdi){
    const a = this.aktif;
    if (!a) return this.son = kopyala(DINLENME);
    const gecen = simdi - a.bas; let faz;
    if (a.klip){
      if (gecen >= a.sure){ this.dur(); return this.ornekle(simdi); }
      const p = klipOrnekle(a.klip, gecen*a.hiz, {yalnizUst: durus.w > 0.3});   // otururken bacaklar duruşta kalır
      const giris = yumusak(Math.min(1, gecen/0.35)), cikis = a.dongu ? 1 : yumusak(Math.min(1, (a.sure - gecen)/0.45));
      return this.son = karistir(a.onceki, karistir(DINLENME, p, cikis), giris);
    }
    if (a.dongu){ if (gecen >= a.sure){ this.dur(); return this.ornekle(simdi); } faz = (gecen/a.donem)%1; }
    else { faz = Math.min(1, gecen/a.sure); if (faz>=1 && !a.sabit && !a.tut){ this.dur(); return this.ornekle(simdi); } }
    return this.son = karistir(a.onceki, izOrnekle(a.kareler, faz), yumusak(Math.min(1, gecen/0.3)));
  }
};
