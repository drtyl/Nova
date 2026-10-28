'use strict';
const $ = id => document.getElementById(id);
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const depo = { oku(k, v){ try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : v; } catch(e){ return v; } }, yaz(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };
