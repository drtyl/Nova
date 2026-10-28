'use strict';
/* =========================================================
   DIŞARIDAKİ NOVA — sahne hazırlığı (gercekci.js ve kiyafet dosyalarından önce yüklenir)
   ========================================================= */
const tuval = document.getElementById('tuval');
const renderer = new THREE.WebGLRenderer({canvas:tuval, antialias:true, alpha:true, premultipliedAlpha:true, powerPreference:'low-power'});
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
renderer.setPixelRatio(Math.min(2.5, devicePixelRatio || 1));
const ORTAM = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
const sahne = new THREE.Scene();
const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
kamera.position.set(0, 0, 20);
sahne.add(new THREE.HemisphereLight(0xffffff, 0xcbbde8, 1.05));
const anaIsik = new THREE.DirectionalLight(0xfff6f0, 1.35); anaIsik.position.set(1.3, 3.4, 2.4); sahne.add(anaIsik); sahne.add(anaIsik.target);
const dolgu = new THREE.DirectionalLight(0xe4dcff, 0.45); dolgu.position.set(-2.2, 1.6, 1.6); sahne.add(dolgu);
const kontur = new THREE.DirectionalLight(0xc9b4ff, 0.55); kontur.position.set(-0.9, 2.3, -2.6); sahne.add(kontur);
// evdeki dosyaların beklediği adlar
let vrm = null, vrm0 = false, kokDinlenme = new THREE.Vector3(), OTURMA_DUSUS = 0.368;
const OTURMA = { rightUpperLeg:[-88,0,4], leftUpperLeg:[-88,0,-4], rightLowerLeg:[88,0,0], leftLowerLeg:[88,0,0], rightFoot:[0,0,0], leftFoot:[0,0,0] };
