'use strict';
/* =========================================================
   GERÇEKÇİ GÖRÜNÜM — Nova'nın anime (MToon) malzemelerini fiziksel ışık alan
   malzemelere çevirir: ten, gözenek ayrıntısı, kumaş, göz, kaş, saç.
   Dokular: doku/govde_renk.jpg · doku/govde_ek.png (R ten maskesi, G pürüzlülük) · doku/cilt_detay.png
   ========================================================= */
const GERCEKCI = {
  tenTonuYuz: [0.78, 0.635, 0.555],    // yüz dokusunu gövdenin gerçekçi tonuna eşitler
  detayGovde: 70, detayYuz: 200,      // gözenek karosunun UV tekrarı (≈1,7 cm'lik karo)
  detayGuc: 0.55, renkDalga: 0.22,
};
const dokuYukleyici = new THREE.TextureLoader();
function gDoku(yol, renkli, tekrarli){
  const t = dokuYukleyici.load(yol);
  t.flipY = false; t.colorSpace = renkli ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  if (tekrarli){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = true; }
  return t;
}
let CILT_DETAY = null;
/* kıyafet atölyesi: gövdeye işli kumaşın rengi (a = boya oranı; 0 = orijinal) */
const KUMAS_BOYA = { ust:{value:new THREE.Vector4(1, 1, 1, 0)}, alt:{value:new THREE.Vector4(1, 1, 1, 0)} };

/* Kıyafet değişimi: baştan aşağı inen ışıklı tarama çizgisi (GECIS gardirop.js'te). Dünya y'si ve dinlenme pozundaki y köşe gölgelendiricisinden gelir. */
function gecisKoseKodu(sh){
  sh.vertexShader = 'varying float vGecisY; varying float vYerelY;\n' + sh.vertexShader
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vYerelY = position.y;')
    .replace('#include <project_vertex>', '#include <project_vertex>\n  vGecisY = (modelMatrix * vec4(transformed, 1.0)).y;');
  // iki bölge: üst beden (dinlenme pozunda y > 0.975) ve alt beden; her birinin kendi çizgisi ve yönü var
  // (yon +1: çizginin üstü yeni kıyafet · −1: altı yeni). Eski düz tarama: iki çizgi aynı, yön +1.
  sh.fragmentShader = `varying float vGecisY; varying float vYerelY; uniform float gecisEsik, gecisEsikA, gecisYonU, gecisYonA, gecisAktif;
    float gecisCizgi(){ return vYerelY > 0.975 ? gecisEsik : gecisEsikA; }
    bool gecisYeni(){ return (vGecisY - gecisCizgi())*(vYerelY > 0.975 ? gecisYonU : gecisYonA) > 0.0; }
` + sh.fragmentShader
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if (gecisAktif > 0.5){ float bant = 1.0 - smoothstep(0.0, 0.028, abs(vGecisY - gecisCizgi())); totalEmissiveRadiance += vec3(0.35, 0.9, 1.0)*bant*2.2; }`);
  sh.uniforms.gecisEsik = GECIS.esik; sh.uniforms.gecisEsikA = GECIS.esikA; sh.uniforms.gecisYonU = GECIS.yonU; sh.uniforms.gecisYonA = GECIS.yonA; sh.uniforms.gecisAktif = GECIS.aktif;
}
/* Kıyafet parçası: değişimde görünüp kaybolur (gecisMod 1: çizginin altında kalır, 2: çizginin üstünde belirir); kesY ile dinlenme pozunda alttan kesilir (şort) */
function kumasGecisi(mat){
  mat.userData.kumas = true; mat.userData.gecisMod = {value:0}; mat.userData.kesY = {value:-10};
  mat.onBeforeCompile = sh => {
    gecisKoseKodu(sh);
    sh.uniforms.gecisMod = mat.userData.gecisMod; sh.uniforms.kesY = mat.userData.kesY;
    sh.fragmentShader = 'uniform float gecisMod, kesY;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if (vYerelY < kesY) discard;
      if (gecisAktif > 0.5){ bool yeni = gecisYeni(); if (gecisMod > 0.5 && gecisMod < 1.5 && yeni) discard; if (gecisMod > 1.5 && !yeni) discard; }`);
  };
  mat.customProgramCacheKey = () => 'kumas';
  return mat;
}

/* Gözenek ayrıntısı: temel normal haritasının üstüne döşenen ince bir normal ve renk dalgası ekler */
function ciltAyrintisi(mat, tekrar, maskeVar){
  CILT_DETAY ||= gDoku('doku/cilt_detay.png', false, true);
  mat.onBeforeCompile = sh => {
    sh.uniforms.detayHarita = {value:CILT_DETAY};
    sh.uniforms.detayTekrar = {value:tekrar};
    sh.uniforms.detayGuc = {value:GERCEKCI.detayGuc};
    sh.uniforms.renkDalga = {value:GERCEKCI.renkDalga};
    if (maskeVar){ gecisKoseKodu(sh); sh.uniforms.eskiHarita = GECIS.eskiHarita; sh.uniforms.kumasUst = KUMAS_BOYA.ust; sh.uniforms.kumasAlt = KUMAS_BOYA.alt; }
    sh.fragmentShader = 'uniform sampler2D detayHarita; uniform float detayTekrar, detayGuc, renkDalga;\n' + (maskeVar ? 'uniform sampler2D eskiHarita; uniform vec4 kumasUst, kumasAlt;\n' : '') + sh.fragmentShader
      .replace('#include <map_fragment>', `${maskeVar ? `vec4 sampledDiffuseColor = texture2D(map, vMapUv);
        if (gecisAktif > 0.5 && !gecisYeni()) sampledDiffuseColor = texture2D(eskiHarita, vMapUv);
        diffuseColor *= sampledDiffuseColor;
        { float kumas = 1.0 - texture2D(roughnessMap, vRoughnessMapUv).r;
          vec4 boya = vYerelY > 0.975 ? kumasUst : kumasAlt;
          float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = mix(diffuseColor.rgb, boya.rgb*(0.25 + lum*1.15), kumas*boya.a); }` : '#include <map_fragment>'}
        float tenM = ${maskeVar ? 'texture2D(roughnessMap, vRoughnessMapUv).r' : '1.0'};
        vec4 dt = texture2D(detayHarita, vMapUv*detayTekrar);
        diffuseColor.rgb *= 1.0 + (dt.a - 0.5)*2.0*renkDalga*tenM;`)
      .replace('mapN.xy *= normalScale;', `mapN.xy *= normalScale;
        { vec3 dN = texture2D(detayHarita, vMapUv*detayTekrar).xyz*2.0 - 1.0; mapN.xy += dN.xy*detayGuc*tenM; }`);
  };
  mat.customProgramCacheKey = () => 'cilt' + tekrar + (maskeVar ? 'm' : '');
}

function fizikselMalzeme(m, ek){
  return new THREE.MeshPhysicalMaterial(Object.assign({
    name:m.name, map:m.map || null, color:(m.color ? m.color.clone() : new THREE.Color(1, 1, 1)),
    transparent:m.transparent, opacity:m.opacity ?? 1, alphaTest:m.alphaTest || 0, side:m.side,
    depthWrite:m.depthWrite, depthTest:m.depthTest,
    normalMap:m.normalMap || null, normalScale:m.normalScale ? m.normalScale.clone() : new THREE.Vector2(1, 1),
    roughness:0.6, metalness:0, envMap:ORTAM, envMapIntensity:0.5,
  }, ek));
}
const TEN = { roughness:0.5, sheen:0.25, sheenColor:new THREE.Color(1, 0.62, 0.52), sheenRoughness:0.55, specularIntensity:0.45, clearcoat:0.04, clearcoatRoughness:0.4 };

function gercekciYap(v){
  const donustur = (m) => {
    if (!m || !m.isMaterial) return m;
    const ad = m.name || '';
    if (m.isOutline || /\(Outline\)/.test(ad)){ const k = m.clone(); k.visible = false; return k; }
    if (ad.includes('Body_00_SKIN')){
      const p = fizikselMalzeme(m, Object.assign({}, TEN, {
        map:gDoku('doku/govde_renk.jpg', true), roughness:1, roughnessMap:gDoku('doku/govde_ek.png', false)}));
      p.userData.govde = true; GECIS.eskiHarita.value = p.map;
      ciltAyrintisi(p, GERCEKCI.detayGovde, true); return p;
    }
    if (ad.includes('Face_00_SKIN')){
      const p = fizikselMalzeme(m, TEN); p.color.setRGB(...GERCEKCI.tenTonuYuz, THREE.SRGBColorSpace);
      ciltAyrintisi(p, GERCEKCI.detayYuz, false); return p;
    }
    if (ad.includes('EyeHighlight')) return new THREE.MeshBasicMaterial({name:ad, map:m.map, transparent:true, depthWrite:false, color:0xffffff});
    if (ad.includes('EyeIris')) return fizikselMalzeme(m, {roughness:0.15, clearcoat:1, clearcoatRoughness:0.05, emissive:new THREE.Color(1, 1, 1), emissiveMap:m.map, emissiveIntensity:0.18});
    if (ad.includes('EyeWhite')) return fizikselMalzeme(m, {roughness:0.3, clearcoat:0.6, emissive:new THREE.Color(1, 0.97, 0.96), emissiveMap:m.map, emissiveIntensity:0.12});
    if (ad.includes('EyeExtra')) return fizikselMalzeme(m, {roughness:0.2});
    if (/Eyeline|Eyelash|Brow/.test(ad)){   // anime malzemede bunların koyuluğu gölge renginden geliyordu
      const p = fizikselMalzeme(m, {roughness:0.85, envMapIntensity:0.15}); if (m.shadeColorFactor) p.color.copy(m.shadeColorFactor).multiplyScalar(0.9); return p; }
    if (ad.includes('FaceMouth')) return fizikselMalzeme(m, {roughness:0.35, clearcoat:0.3});
    if (/HAIR|sac/i.test(ad)){
      const p = fizikselMalzeme(m, {roughness:0.42, sheen:0.6, sheenRoughness:0.35, sheenColor:new THREE.Color(0.9, 0.85, 1), specularIntensity:0.6, side:THREE.DoubleSide});
      if (m.shadeColorFactor) p.color.lerp(m.shadeColorFactor, 0.55); return p; }
    if (/Lonca_top_/.test(ad)) return kumasGecisi(fizikselMalzeme(m, {roughness:0.85, sheen:0.35, sheenRoughness:0.5, sheenColor:new THREE.Color(0.95, 0.9, 1)}));
    if (/Lonca_bottom_/.test(ad)) return kumasGecisi(fizikselMalzeme(m, {roughness:0.8, sheen:0.3, sheenRoughness:0.6, sheenColor:new THREE.Color(0.8, 0.8, 0.85), side:THREE.DoubleSide}));
    if (/Lonca_shoes_/.test(ad)) return kumasGecisi(fizikselMalzeme(m, {roughness:0.55}));
    if (/Lonca_neck_/.test(ad)) return kumasGecisi(fizikselMalzeme(m, {roughness:0.3, metalness:0.85, envMapIntensity:1}));
    if (/Kiyafet_Etek/.test(ad)) return kumasGecisi(fizikselMalzeme(m, {roughness:0.72, sheen:0.45, sheenRoughness:0.45, sheenColor:new THREE.Color(1, 0.9, 0.92), side:THREE.DoubleSide}));
    return fizikselMalzeme(m, {roughness:0.75});
  };
  v.scene.traverse(o => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(donustur) : donustur(o.material);
  });
}
