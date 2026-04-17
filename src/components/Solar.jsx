import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/* ════════════════════════════════════════════════════════════
   NOISE / MATH HELPERS
════════════════════════════════════════════════════════════ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const mix3  = (a, b, t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];

function vn(x, y, s = 0) {
  const h = (n) => { let v = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy);
  const a=h(ix+iy*57), b=h(ix+1+iy*57), c=h(ix+(iy+1)*57), d=h(ix+1+(iy+1)*57);
  return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;
}
function fbm(x, y, oct=7, s=0, lac=2.05, g=0.48) {
  let v=0, amp=0.5, f=1, mx=0;
  for(let i=0;i<oct;i++){v+=vn(x*f,y*f,s+i)*amp; mx+=amp; amp*=g; f*=lac;}
  return v/mx;
}
function wfbm(x, y, oct, s) {
  const wx=fbm(x,y,4,s), wy=fbm(x+5.2,y+1.3,4,s+3);
  return fbm(x+2.5*wx, y+2.5*wy, oct, s+7);
}
function buildTex(w, h, fn) {
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d"), img=ctx.createImageData(w,h), d=img.data;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=(y*w+x)*4, [r,g,b,a=255]=fn(x/w,y/h);
    d[i]=clamp(r|0,0,255); d[i+1]=clamp(g|0,0,255); d[i+2]=clamp(b|0,0,255); d[i+3]=clamp(a|0,0,255);
  }
  ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}

/* ════════════════════════════════════════════════════════════
   GLSL SUN SHADER  (plasma convection + chromosphere simulation)
════════════════════════════════════════════════════════════ */
const SUN_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  void main(){
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position,1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SUN_FRAG = `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform sampler2D uNoise;

  // Hash / noise
  float hash(float n){ return fract(sin(n)*43758.5453123); }
  float hash2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    float a=hash2(i), b=hash2(i+vec2(1,0)), c=hash2(i+vec2(0,1)), d=hash2(i+vec2(1,1));
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }

  float fbm(vec2 p, int oct){
    float v=0.0, amp=0.5, mx=0.0;
    for(int i=0;i<8;i++){
      if(i>=oct) break;
      v+=vnoise(p)*amp; mx+=amp; amp*=0.48; p*=2.07;
    }
    return v/mx;
  }

  // Domain-warped fbm for turbulence
  float warpFbm(vec2 p, int oct){
    vec2 q=vec2(fbm(p+vec2(0.0,0.0),4), fbm(p+vec2(5.2,1.3),4));
    vec2 r=vec2(fbm(p+2.8*q+vec2(1.7,9.2),4), fbm(p+2.8*q+vec2(8.3,2.8),4));
    return fbm(p+2.8*r, oct);
  }

  void main(){
    // Spherical UV with tiling
    vec2 uv = vUv;
    float t = uTime;

    // Animated granulation at multiple scales
    vec2 p0 = uv * vec2(6.0,3.0);
    vec2 p1 = uv * vec2(12.0,6.0);
    vec2 p2 = uv * vec2(28.0,14.0);

    // Slow drift of supergranules
    vec2 drift0 = vec2(t*0.012, t*0.008);
    vec2 drift1 = vec2(-t*0.025, t*0.018);
    vec2 drift2 = vec2(t*0.045, -t*0.032);

    float gran0 = warpFbm(p0 + drift0, 7);           // supergranules
    float gran1 = warpFbm(p1 + drift1 + gran0*0.4, 8); // granules
    float gran2 = fbm(p2 + drift2 + gran1*0.3, 6);   // intergranular lanes

    // Combine scales
    float granulation = gran0*0.35 + gran1*0.45 + gran2*0.20;

    // Sunspot regions (latitude-constrained)
    float lat = abs(uv.y - 0.5) * 2.0; // 0=equator, 1=pole
    float spotZone = max(0.0, 1.0 - lat*3.2); // only near equator
    float spotNoise = warpFbm(uv*vec2(4.0,4.0) + vec2(t*0.004, 0.0), 5);
    float isSpot = step(0.62, spotNoise * spotZone);
    float isUmbra = step(0.70, spotNoise * spotZone);

    // Limb darkening (Eddington approximation: I = I0*(0.4 + 0.6*cos(theta)))
    float cosTheta = dot(normalize(vNormal), normalize(vViewDir));
    cosTheta = clamp(cosTheta, 0.0, 1.0);
    float limb = 0.3 + 0.7 * pow(cosTheta, 0.5);

    // Solar faculae (bright regions around spots)
    float faculae = max(0.0, spotNoise - 0.50) * spotZone * 3.0;

    // Temperature map → color
    // Photosphere: 5778K surface → map to color
    float temp = granulation;

    // Hot cell center (6000-6500K): yellow-white
    vec3 hotCell    = vec3(1.00, 0.95, 0.72);
    // Cool lane (4500-5000K): orange
    vec3 coolLane   = vec3(1.00, 0.55, 0.10);
    // Penumbra (4000K): dark orange-brown
    vec3 penumbra   = vec3(0.65, 0.28, 0.06);
    // Umbra (3500K): very dark red-brown
    vec3 umbraCol   = vec3(0.22, 0.08, 0.02);
    // Faculae (6500K+): blue-white
    vec3 facCol     = vec3(1.00, 1.00, 0.90);

    // Blend cell/lane
    float cellBright = clamp((gran1 - 0.38) * 2.8, 0.0, 1.0);
    vec3 plasmaColor = mix(coolLane, hotCell, cellBright);
    plasmaColor += facCol * faculae * 0.4;

    // Apply sunspot
    plasmaColor = mix(plasmaColor, penumbra, isSpot * (1.0 - isUmbra));
    plasmaColor = mix(plasmaColor, umbraCol, isUmbra);

    // Limb darkening
    plasmaColor *= limb;

    // Emissive bloom — brighter at center
    float bloom = pow(cosTheta, 1.5) * 0.3;
    plasmaColor += vec3(1.0, 0.6, 0.1) * bloom;

    // Edge chromosphere (pink limb)
    float edge = pow(1.0 - cosTheta, 4.0);
    plasmaColor += vec3(1.0, 0.3, 0.15) * edge * 0.6;

    gl_FragColor = vec4(plasmaColor, 1.0);
  }
`;

/* ════════════════════════════════════════════════════════════
   PLANET TEXTURE GENERATORS
════════════════════════════════════════════════════════════ */

// MERCURY – cratered gray rock
function makeTexMercury() {
  return buildTex(512,256,(u,v)=>{
    const x=u*5,y=v*2.5;
    const base=fbm(x,y,7,1); const detail=fbm(x*4,y*4,5,9);
    const crater=(cu,cv,r)=>{ const d=Math.sqrt(((u-cu)*2.5)**2+((v-cv)*2.5)**2)/r; return d<1.2?Math.max(0,(d>0.8?(d-0.8)/0.4*0.25:-0.2*(1-d/0.8))):0; };
    const c=crater(0.25,0.35,0.1)+crater(0.6,0.5,0.13)+crater(0.45,0.7,0.07)+crater(0.8,0.3,0.09)+crater(0.15,0.6,0.08)+crater(0.7,0.65,0.06)+crater(0.35,0.2,0.11)+crater(0.55,0.45,0.05)+crater(0.9,0.55,0.08)+crater(0.05,0.4,0.07);
    const t=clamp(base*0.55+detail*0.3+c*0.5,0,1); const g=Math.floor(95+t*120); return [g,g*0.95|0,g*0.9|0];
  });
}

// VENUS – thick sulfuric cloud bands
function makeTexVenus() {
  return buildTex(512,256,(u,v)=>{
    const x=u*6,y=v*3;
    const band=Math.sin(v*Math.PI*14)*0.3+0.7;
    const w=wfbm(x*0.8,y*0.8,7,3);
    const t=w*0.5+band*0.5;
    const r=clamp(220+t*35,0,255), g=clamp(185+t*40,0,255), b=clamp(80+t*50,0,255);
    return [r,g,b];
  });
}

// EARTH
function makeTexEarth() {
  return buildTex(1024,512,(u,v)=>{
    const x=u*4, y=v*2, lat=(v-0.5)*Math.PI;
    const cont=wfbm(x*0.9,y*0.9,8,5), detail=fbm(x*3.5,y*3.5,6,17);
    const seaLevel=0.49, isLand=cont>seaLevel, elev=isLand?(cont-seaLevel)/(1-seaLevel):0;
    if(!isLand){
      const sh=cont>seaLevel-0.08;
      if(sh){const t2=(cont-(seaLevel-0.08))/0.08;return mix3([10,70,160],[30,130,200],t2*t2);}
      const d=clamp((seaLevel-cont)/seaLevel,0,1);
      return[clamp(5+d*12,0,255),clamp(30+d*35,0,255),clamp(100+d*80,0,255)];
    }
    const absLat=Math.abs(lat);
    if(absLat>1.28||(absLat>1.18&&elev>0.6)){const n=fbm(x*8,y*8,3,22);return[clamp(225+n*30,0,255),clamp(232+n*23,0,255),255];}
    if(elev>0.72){const t2=clamp((elev-0.72)/0.15,0,1);return mix3([110+detail*60|0,100+detail*55|0,90+detail*50|0],[240,245,255],t2);}
    if(elev>0.58){const t2=clamp((elev-0.58)/0.14,0,1);return mix3([55+detail*40|0,100+detail*50|0,35+detail*25|0],[110+detail*55|0,98+detail*48|0,82+detail*38|0],t2);}
    const dz=Math.exp(-Math.pow((Math.abs(lat)-0.44)*6,2));
    if(dz>0.35&&fbm(x*2,y*2,4,44)>0.5)return[clamp(200+detail*40,0,255),clamp(160+detail*35,0,255),clamp(90+detail*30,0,255)];
    const tr=Math.exp(-Math.pow(lat*3.5,2));
    if(tr>0.5)return[clamp(20+detail*30,0,255),clamp(90+detail*55,0,255),clamp(18+detail*20,0,255)];
    return[clamp(40+detail*50,0,255),clamp(110+detail*60,0,255),clamp(30+detail*30,0,255)];
  });
}
function makeTexEarthClouds() {
  return buildTex(1024,512,(u,v)=>{
    const s1=wfbm(u*5,v*2.5,7,33), s2=fbm(u*10+1.7,v*5+0.8,6,55);
    const cl=s1*0.6+s2*0.4;
    const a=cl>0.50?clamp((cl-0.50)*5.5*255,0,255):0;
    return[255,255,255,a];
  });
}
function makeTexEarthNormal() {
  return buildTex(512,256,(u,v)=>{
    const eps=0.003, hf=(uu,vv)=>{const c2=wfbm(uu*3.6,vv*1.8,8,5);return c2>0.49?c2:0.49;};
    const hc=hf(u,v),hx=hf(u+eps,v),hy=hf(u,v+eps);
    return[clamp((128+(hx-hc)*1800)|0,0,255),clamp((128+(hy-hc)*1800)|0,0,255),255];
  });
}
function makeTexEarthSpec() {
  return buildTex(512,256,(u,v)=>{const c2=wfbm(u*3.6,v*1.8,8,5);const s=c2<0.49?210:18;return[s,s,s];});
}

// MARS
function makeTexMars() {
  return buildTex(1024,512,(u,v)=>{
    const x=u*5,y=v*2.5,lat=(v-0.5)*Math.PI;
    const base=wfbm(x*0.9,y*0.9,8,9),detail=fbm(x*4,y*4,6,29),micro=fbm(x*12,y*12,4,41);
    if(Math.abs(lat)>1.35){const t2=clamp((Math.abs(lat)-1.35)/0.22,0,1);return mix3([180,80,45],[225,218,210],t2);}
    const cLat=Math.abs(v-0.52),cNoise=fbm(x*2+1.5,y*8,5,66);
    if(cLat<0.06&&cNoise>0.58&&u>0.15&&u<0.65)return[clamp(100+micro*40,0,255),clamp(38+micro*18,0,255),clamp(18+micro*10,0,255)];
    const t=base*0.55+detail*0.3+micro*0.15;
    return[clamp(175+t*65,0,255),clamp(62+t*42,0,255),clamp(28+t*22,0,255)];
  });
}
function makeTexMarsNormal() {
  return buildTex(512,256,(u,v)=>{
    const eps=0.003,h=(uu,vv)=>wfbm(uu*4.5,vv*2.25,8,9);
    const hc=h(u,v),hx=h(u+eps,v),hy=h(u,v+eps);
    return[clamp((128+(hx-hc)*1500)|0,0,255),clamp((128+(hy-hc)*1500)|0,0,255),255];
  });
}

// JUPITER
function makeTexJupiter() {
  return buildTex(1024,512,(u,v)=>{
    const x=u*8,y=v*4;
    const w1=fbm(x*0.8,y*0.8,4,3)*0.6,w2=fbm(x*1.5,y*1.5,4,17)*0.3;
    const zv=v+w1*0.15+w2*0.08;
    const b1=Math.sin(zv*Math.PI*18)*0.5+0.5,b2=Math.sin(zv*Math.PI*7+0.3)*0.3+0.7;
    const eddy=wfbm(x*2,y*3,6,5),micro=fbm(x*6,y*6,4,23)*0.2;
    const t=clamp(b1*0.55+eddy*0.3+b2*0.15+micro,0,1);
    const grsU=0.32,grsV=0.58,du=(u-grsU)/0.08,dv=(v-grsV)/0.045;
    const grsDist=Math.sqrt(du*du+dv*dv);
    const grs=clamp(1-grsDist,0,1);
    const grsI=Math.pow(Math.max(0,grs),1.5)*(0.7+fbm(u*20,v*20,4,99)*0.3);
    let r,g,b;
    if(t>0.72){r=clamp(235+t*15,0,255);g=clamp(210+t*30,0,255);b=clamp(160+t*60,0,255);}
    else if(t>0.45){r=clamp(190+t*35,0,255);g=clamp(140+t*30,0,255);b=clamp(95+t*20,0,255);}
    else{r=clamp(155+t*45,0,255);g=clamp(100+t*35,0,255);b=clamp(65+t*25,0,255);}
    r=lerp(r,200+fbm(u*15,v*15,3,44)*50,grsI*0.8);
    g=lerp(g,80+fbm(u*15,v*15,3,55)*30,grsI*0.8);
    b=lerp(b,50,grsI*0.8);
    return[r,g,b];
  });
}

// SATURN
function makeTexSaturn() {
  return buildTex(512,256,(u,v)=>{
    const x=u*6,y=v*3;
    const w=fbm(x*0.7,y*0.7,4,5)*0.5;
    const bands=Math.sin((v+w*0.1)*Math.PI*14)*0.4+0.6;
    const t2=wfbm(x*1.5,y*2,6,11)*0.35+bands*0.65;
    const t=clamp(t2,0,1);
    return[clamp(205+t*45,0,255),clamp(185+t*35,0,255),clamp(130+t*50,0,255)];
  });
}

// URANUS – pale cyan featureless
function makeTexUranus() {
  return buildTex(256,128,(u,v)=>{
    const n=fbm(u*3,v*3,5,7)*0.2;
    const band=Math.sin(v*Math.PI*8)*0.05;
    const t=0.7+n+band;
    return[clamp(100+t*60,0,255),clamp(190+t*40,0,255),clamp(210+t*35,0,255)];
  });
}

// NEPTUNE – deep blue
function makeTexNeptune() {
  return buildTex(512,256,(u,v)=>{
    const x=u*6,y=v*3;
    const w=fbm(x*0.8,y*1.2,5,3)*0.5;
    const bands=Math.sin((v+w*0.12)*Math.PI*12)*0.35+0.65;
    const storm=wfbm(x*2,y*2,7,55),dark=fbm(x*0.6,y*0.8,4,77);
    const dsU=0.62,dsV=0.42,dsDist=Math.sqrt(((u-dsU)*2.5)**2+((v-dsV)*5)**2);
    const ds=Math.max(0,1-dsDist)*0.7;
    const t=bands*0.45+storm*0.4+dark*0.15;
    return[clamp(18+t*42-ds*15,0,255),clamp(65+t*75-ds*25,0,255),clamp(170+t*75-ds*20,0,255)];
  });
}

// MOON
function makeTexMoon() {
  return buildTex(512,256,(u,v)=>{
    const x=u*5,y=v*2.5;
    const base=fbm(x,y,7,20),detail=fbm(x*4,y*4,5,88);
    const cr=(cu,cv,r)=>{const d=Math.sqrt(((u-cu)*2)**2+((v-cv)*2)**2)/r;return d<1.2?Math.max(0,(d>0.85?(d-0.85)/0.35*0.3:-0.25*(1-d/0.85))):0;};
    const c=cr(0.25,0.35,0.12)+cr(0.65,0.55,0.09)+cr(0.45,0.7,0.07)+cr(0.78,0.3,0.05)+cr(0.15,0.65,0.06)+cr(0.55,0.28,0.04)+cr(0.88,0.6,0.08);
    const t=clamp(base*0.55+detail*0.35+c*0.3,0,1);
    const g=base<0.42?clamp(75+t*80,0,255):clamp(125+t*100,0,255);
    return[g,g,g];
  });
}

// SATURN RINGS
function makeRingTex() {
  return buildTex(2048,1,(u)=>{
    const cassini=Math.abs(u-0.445)<0.028?0:1,encke=Math.abs(u-0.65)<0.012?0:1;
    const edge=u<0.04||u>0.97?0:1;
    const density=fbm(u*120,0,5,7),fine=Math.sin(u*Math.PI*90)*0.15+0.85,coarse=Math.sin(u*Math.PI*22)*0.2+0.8;
    const a=clamp(density*fine*coarse*cassini*encke*edge*215,0,255);
    const br=155+fbm(u*200,0,3,13)*80;
    return[clamp(br,0,255),clamp(br*0.88,0,255),clamp(br*0.68,0,255),a];
  });
}

/* ════════════════════════════════════════════════════════════
   REAL ORBITAL DATA  (scaled for visual clarity)
   Periods relative to Earth=1 year, speeds scaled so Earth
   completes one orbit in ~60s of real time.
   Semi-major axes scaled logarithmically for visibility.
════════════════════════════════════════════════════════════ */
const EARTH_ORBIT_SECONDS = 60; // Earth year = 60s realtime
const EARTH_AU = 1.0;
const AU_SCALE = 2.8; // 1 AU in Three.js units

// Real orbital periods in Earth years
const REAL_PERIODS = { mercury:0.241, venus:0.615, earth:1.0, mars:1.881, jupiter:11.86, saturn:29.46, uranus:84.01, neptune:164.8 };
// Visual orbit radii (log-scaled so all planets visible)
const ORBIT_RADII = { mercury:3.2, venus:4.8, earth:6.5, mars:8.5, jupiter:12.5, saturn:17.0, uranus:21.5, neptune:25.5 };

const PLANETS = [
  {
    id:"mercury", name:"Mercury", type:"mercury",
    radius:0.19, orbitR:ORBIT_RADII.mercury,
    period:REAL_PERIODS.mercury,
    axialTilt:0.034, inclination:0.122,
    hasAtmo:false, hasClouds:false, hasRing:false,
    moons:0, moonRadius:0,
    atmoColor:null, atmoLayers:[],
    accentColor:"#b0b0b0",
    info:{ title:"Mercury", emoji:"⚫", fact:"Closest to the Sun · No atmosphere · Extreme temp swings (-180°C to 430°C)" },
  },
  {
    id:"venus", name:"Venus", type:"venus",
    radius:0.36, orbitR:ORBIT_RADII.venus,
    period:REAL_PERIODS.venus,
    axialTilt:3.096, inclination:0.059,
    hasAtmo:true, hasClouds:false, hasRing:false,
    moons:0, moonRadius:0,
    atmoColor:new THREE.Color(1.0,0.7,0.2), atmoLayers:[[1.12,0.18],[1.06,0.12],[1.22,0.07]],
    accentColor:"#ffcc66",
    info:{ title:"Venus", emoji:"🌕", fact:"Hottest planet · 462°C surface · Retrograde rotation" },
  },
  {
    id:"earth", name:"Earth", type:"earth",
    radius:0.38, orbitR:ORBIT_RADII.earth,
    period:REAL_PERIODS.earth,
    axialTilt:0.4091, inclination:0.0,
    hasAtmo:true, hasClouds:true, hasRing:false,
    moons:1, moonRadius:0.10,
    atmoColor:new THREE.Color(0.18,0.5,1.0), atmoLayers:[[1.13,0.16],[1.07,0.09],[1.22,0.05]],
    accentColor:"#4fc3f7",
    info:{ title:"Earth", emoji:"🌍", fact:"Our home · Only known life-bearing world · 1 moon" },
  },
  {
    id:"mars", name:"Mars", type:"mars",
    radius:0.26, orbitR:ORBIT_RADII.mars,
    period:REAL_PERIODS.mars,
    axialTilt:0.4396, inclination:0.032,
    hasAtmo:true, hasClouds:false, hasRing:false,
    moons:0, moonRadius:0,
    atmoColor:new THREE.Color(1.0,0.38,0.1), atmoLayers:[[1.10,0.10],[1.06,0.06]],
    accentColor:"#ff7043",
    info:{ title:"Mars", emoji:"🔴", fact:"Red Planet · Tallest volcano in the solar system · 2 moons" },
  },
  {
    id:"jupiter", name:"Jupiter", type:"jupiter",
    radius:0.72, orbitR:ORBIT_RADII.jupiter,
    period:REAL_PERIODS.jupiter,
    axialTilt:0.0546, inclination:0.022,
    hasAtmo:false, hasClouds:false, hasRing:false,
    moons:1, moonRadius:0.09,
    atmoColor:null, atmoLayers:[],
    accentColor:"#ffb74d",
    info:{ title:"Jupiter", emoji:"🪐", fact:"Largest planet · Great Red Spot · 95 known moons" },
  },
  {
    id:"saturn", name:"Saturn", type:"saturn",
    radius:0.62, orbitR:ORBIT_RADII.saturn,
    period:REAL_PERIODS.saturn,
    axialTilt:0.4665, inclination:0.043,
    hasAtmo:false, hasClouds:false, hasRing:true,
    ringInner:1.2, ringOuter:2.4,
    moons:1, moonRadius:0.09,
    atmoColor:null, atmoLayers:[],
    accentColor:"#e8c87a",
    info:{ title:"Saturn", emoji:"💛", fact:"Lord of the Rings · Least dense planet · 146 known moons" },
  },
  {
    id:"uranus", name:"Uranus", type:"uranus",
    radius:0.44, orbitR:ORBIT_RADII.uranus,
    period:REAL_PERIODS.uranus,
    axialTilt:1.706, inclination:0.013,
    hasAtmo:true, hasClouds:false, hasRing:false,
    moons:0, moonRadius:0,
    atmoColor:new THREE.Color(0.4,0.85,0.9), atmoLayers:[[1.10,0.10],[1.06,0.06]],
    accentColor:"#80deea",
    info:{ title:"Uranus", emoji:"🔵", fact:"Rotates on its side · Ice giant · Faint rings" },
  },
  {
    id:"neptune", name:"Neptune", type:"neptune",
    radius:0.42, orbitR:ORBIT_RADII.neptune,
    period:REAL_PERIODS.neptune,
    axialTilt:0.4944, inclination:0.031,
    hasAtmo:true, hasClouds:false, hasRing:false,
    moons:0, moonRadius:0,
    atmoColor:new THREE.Color(0.08,0.3,1.0), atmoLayers:[[1.12,0.14],[1.07,0.08],[1.22,0.04]],
    accentColor:"#40c4ff",
    info:{ title:"Neptune", emoji:"💙", fact:"Strongest winds (2100 km/h) · Ice giant · Largest moon Triton" },
  },
];

/* ════════════════════════════════════════════════════════════
   ASTEROID BELT  (between Mars and Jupiter + near Saturn)
════════════════════════════════════════════════════════════ */
function createAsteroidBelt(scene, innerR, outerR, count, ySpread, color=0x888877) {
  const positions = new Float32Array(count*3);
  const sizes = new Float32Array(count);
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const r=innerR+Math.random()*(outerR-innerR);
    const y=(Math.random()-0.5)*ySpread;
    positions[i*3]=Math.cos(angle)*r;
    positions[i*3+1]=y;
    positions[i*3+2]=Math.sin(angle)*r;
    sizes[i]=0.04+Math.random()*0.18;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geo.setAttribute("size",new THREE.BufferAttribute(sizes,1));
  const mat=new THREE.PointsMaterial({color,size:0.09,transparent:true,opacity:0.75,depthWrite:false,sizeAttenuation:true});
  const pts=new THREE.Points(geo,mat);
  scene.add(pts);
  return pts;
}

/* ════════════════════════════════════════════════════════════
   MAIN SCENE BUILDER
════════════════════════════════════════════════════════════ */
function buildScene(mount, onPlanetClick, onPlanetHover) {
  const W=mount.clientWidth, H=mount.clientHeight;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x000005);
  const camera=new THREE.PerspectiveCamera(52,W/H,0.05,600);
  camera.position.set(0,12,28);
  camera.lookAt(0,0,0);

  /* STARS */
  (() => {
    const N=9000, pos=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const phi=Math.acos(2*Math.random()-1),theta=Math.random()*Math.PI*2,r=200+Math.random()*100;
      pos[i*3]=r*Math.sin(phi)*Math.cos(theta); pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); pos[i*3+2]=r*Math.cos(phi);
      const tp=Math.random();
      if(tp<0.10){col[i*3]=0.65;col[i*3+1]=0.75;col[i*3+2]=1.0;}
      else if(tp<0.16){col[i*3]=1.0;col[i*3+1]=0.88;col[i*3+2]=0.55;}
      else if(tp<0.19){col[i*3]=1.0;col[i*3+1]=0.55;col[i*3+2]=0.4;}
      else{col[i*3]=1;col[i*3+1]=1;col[i*3+2]=1;}
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",new THREE.BufferAttribute(col,3));
    scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.3,vertexColors:true,transparent:true,opacity:0.9,depthWrite:false})));
  })();

  /* SUN – GLSL shader material */
  const SUN_R = 1.8;
  const sunMat = new THREE.ShaderMaterial({
    vertexShader: SUN_VERT,
    fragmentShader: SUN_FRAG,
    uniforms: { uTime: { value: 0 } },
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R,128,64), sunMat);
  scene.add(sun);

  // Chromosphere
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(SUN_R*1.028,64,32),
    new THREE.MeshBasicMaterial({color:new THREE.Color(1.0,0.35,0.15),transparent:true,opacity:0.07,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})
  ));

  // Corona layers
  [[1.08,0.22,0xffdd88],[1.22,0.13,0xffbb44],[1.5,0.07,0xff9900],[2.0,0.04,0xff7700],[3.2,0.02,0xff5500],[5.0,0.012,0xff3300]].forEach(([r,op,c])=>{
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(SUN_R*r,32,32),
      new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})
    ));
  });

  // Solar flare geometry (animated tubes)
  const flares = [];
  for(let i=0;i<7;i++){
    const phi=Math.random()*Math.PI*2, theta=(0.3+Math.random()*0.7)*Math.PI;
    const sx=Math.sin(theta)*Math.cos(phi)*SUN_R, sy=Math.sin(theta)*Math.sin(phi)*SUN_R, sz=Math.cos(theta)*SUN_R;
    const len=SUN_R*(0.28+Math.random()*0.55);
    const ox=(Math.random()-0.5)*len*0.8, oy=(Math.random()-0.5)*len*0.8, oz=(Math.random()-0.5)*len*0.4;
    const curve=new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sx,sy,sz),
      new THREE.Vector3(sx+ox*1.2,sy+oy*1.2,sz+oz+len*0.6),
      new THREE.Vector3(sx*0.85,sy*0.85,sz*0.85)
    );
    const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(24)),24,0.022+Math.random()*0.025,5,false);
    const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(1.0,0.45+Math.random()*0.35,0.05),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh=new THREE.Mesh(geo,mat);
    scene.add(mesh);
    flares.push({mesh,mat,phase:Math.random()*Math.PI*2,speed:0.3+Math.random()*0.5});
  }

  /* LIGHTS */
  scene.add(new THREE.AmbientLight(0x060918,1.8));
  const sunLight=new THREE.PointLight(0xfff5e0,14,300,1.0);
  sunLight.castShadow=true; sunLight.shadow.mapSize.set(2048,2048); sunLight.shadow.bias=-0.0005;
  scene.add(sunLight);
  scene.add(Object.assign(new THREE.DirectionalLight(0x0a1530,0.25),{position:new THREE.Vector3(-20,5,-15)}));

  /* TEXTURES */
  const TX = {
    mercury: makeTexMercury(),
    venus:   makeTexVenus(),
    earth:   makeTexEarth(),
    earthClouds: makeTexEarthClouds(),
    earthNormal: makeTexEarthNormal(),
    earthSpec:   makeTexEarthSpec(),
    mars:    makeTexMars(),
    marsNormal: makeTexMarsNormal(),
    jupiter: makeTexJupiter(),
    saturn:  makeTexSaturn(),
    uranus:  makeTexUranus(),
    neptune: makeTexNeptune(),
    moon:    makeTexMoon(),
    ring:    makeRingTex(),
  };

  /* PLANET OBJECTS */
  const planetObjs = PLANETS.map((def)=>{
    const group=new THREE.Group();
    scene.add(group);

    // Orbit path
    const pts=[];
    for(let i=0;i<=300;i++){
      const a=(i/300)*Math.PI*2;
      pts.push(new THREE.Vector3(Math.cos(a)*def.orbitR, Math.sin(a)*def.orbitR*Math.sin(def.inclination)*0.12, Math.sin(a)*def.orbitR));
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({color:0x1a2e52,transparent:true,opacity:0.22})
    ));

    // Planet mesh
    const geo=new THREE.SphereGeometry(def.radius,96,48);
    let mat;
    if(def.type==="earth"){
      mat=new THREE.MeshPhongMaterial({map:TX.earth,normalMap:TX.earthNormal,normalScale:new THREE.Vector2(0.9,0.9),specularMap:TX.earthSpec,specular:new THREE.Color(0.28,0.48,0.65),shininess:55});
    } else if(def.type==="mars"){
      mat=new THREE.MeshPhongMaterial({map:TX.mars,normalMap:TX.marsNormal,normalScale:new THREE.Vector2(0.7,0.7),shininess:8,specular:new THREE.Color(0.06,0.03,0.02)});
    } else if(def.type==="mercury"){
      mat=new THREE.MeshStandardMaterial({map:TX.mercury,roughness:0.95,metalness:0.1});
    } else if(def.type==="venus"){
      mat=new THREE.MeshStandardMaterial({map:TX.venus,roughness:0.7,metalness:0});
    } else if(def.type==="jupiter"){
      mat=new THREE.MeshStandardMaterial({map:TX.jupiter,roughness:0.5,metalness:0});
    } else if(def.type==="saturn"){
      mat=new THREE.MeshStandardMaterial({map:TX.saturn,roughness:0.55,metalness:0});
    } else if(def.type==="uranus"){
      mat=new THREE.MeshStandardMaterial({map:TX.uranus,roughness:0.45,metalness:0.05});
    } else {
      mat=new THREE.MeshStandardMaterial({map:TX.neptune,roughness:0.45,metalness:0.05});
    }
    const mesh=new THREE.Mesh(geo,mat);
    mesh.castShadow=true; mesh.receiveShadow=true;
    mesh.rotation.z=def.axialTilt;
    group.add(mesh);

    // Cloud layer
    let cloudMesh=null;
    if(def.hasClouds){
      cloudMesh=new THREE.Mesh(
        new THREE.SphereGeometry(def.radius*1.013,96,48),
        new THREE.MeshPhongMaterial({map:TX.earthClouds,alphaMap:TX.earthClouds,transparent:true,opacity:0.9,depthWrite:false,shininess:10})
      );
      cloudMesh.rotation.z=def.axialTilt;
      group.add(cloudMesh);
    }

    // Atmosphere
    def.atmoLayers?.forEach(([scale,opacity])=>{
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(def.radius*scale,64,64),
        new THREE.MeshBasicMaterial({color:def.atmoColor,transparent:true,opacity,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})
      ));
    });

    // Saturn rings
    if(def.hasRing){
      const ri=def.radius*def.ringInner, ro=def.radius*def.ringOuter;
      const makeRingMesh=(ri2,ro2,opacity,isShadow=false)=>{
        const rg=new THREE.RingGeometry(ri2,ro2,256,4);
        const pos2=rg.attributes.position,uv2=rg.attributes.uv;
        for(let i=0;i<pos2.count;i++){
          const xx=pos2.getX(i),yy=pos2.getY(i),d=Math.sqrt(xx*xx+yy*yy);
          uv2.setXY(i,(d-ri2)/(ro2-ri2),0);
        }
        const mat2=isShadow
          ?new THREE.MeshBasicMaterial({alphaMap:TX.ring,color:0x000000,side:THREE.DoubleSide,transparent:true,opacity:0.38,depthWrite:false})
          :new THREE.MeshBasicMaterial({map:TX.ring,alphaMap:TX.ring,side:THREE.DoubleSide,transparent:true,opacity,depthWrite:false});
        const m=new THREE.Mesh(rg,mat2);
        m.rotation.x=Math.PI/2.3; m.rotation.z=0.06; return m;
      };
      group.add(makeRingMesh(ri,ro,0.95));
      const shadow=makeRingMesh(ri*0.99,ro*0.99,0,true);
      shadow.position.y=-def.radius*0.04; group.add(shadow);
    }

    // Moon
    let moon=null;
    if(def.moons>0){
      moon=new THREE.Mesh(
        new THREE.SphereGeometry(def.moonRadius,32,32),
        new THREE.MeshStandardMaterial({map:TX.moon,roughness:0.97,metalness:0})
      );
      moon.castShadow=true; group.add(moon);
    }

    // Hover glow
    const hgMat=new THREE.MeshBasicMaterial({color:new THREE.Color(def.accentColor),transparent:true,opacity:0,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false});
    const hoverGlow=new THREE.Mesh(new THREE.SphereGeometry(def.radius*1.5,32,32),hgMat);
    group.add(hoverGlow);

    // Label sprite
    const lc=document.createElement("canvas"); lc.width=340; lc.height=88;
    const lctx=lc.getContext("2d"); lctx.clearRect(0,0,340,88);
    lctx.font="bold 30px 'DM Mono',monospace"; lctx.fillStyle=def.accentColor;
    lctx.textAlign="center"; lctx.shadowColor=def.accentColor; lctx.shadowBlur=14;
    lctx.fillText(def.name.toUpperCase(),170,34);
    lctx.font="13px 'DM Mono',monospace"; lctx.shadowBlur=0;
    lctx.fillStyle="rgba(200,225,255,0.55)"; lctx.fillText(def.info.fact.substring(0,40),170,62);
    const labelTex=new THREE.CanvasTexture(lc);
    const spMat=new THREE.SpriteMaterial({map:labelTex,transparent:true,opacity:0,depthTest:false});
    const sprite=new THREE.Sprite(spMat);
    sprite.scale.set(3.2,0.83,1); sprite.position.y=def.radius+0.85; group.add(sprite);

    // Compute angular speed: omega = 2*PI / (period * EARTH_ORBIT_SECONDS)
    const omega = (2*Math.PI) / (def.period * EARTH_ORBIT_SECONDS);
    const angle0 = Math.random()*Math.PI*2;

    return {def,group,mesh,mat,cloudMesh,hoverGlow,hgMat,moon,sprite,spMat,omega,angle:angle0};
  });

  /* ASTEROID BELT (main belt between Mars and Jupiter) */
  const mainBelt = createAsteroidBelt(scene, 9.5, 11.0, 3500, 0.6, 0x998877);
  /* Trojan-like cloud near Saturn orbit */
  const saturnTrojans = createAsteroidBelt(scene, ORBIT_RADII.saturn-1.2, ORBIT_RADII.saturn+1.2, 1200, 1.2, 0x887766);

  /* CAMERA ORBIT */
  let camTheta=0.18, camPhi=0.34, camDist=28;
  let tTheta=camTheta, tPhi=camPhi, tDist=camDist;
  let isDragging=false, prevX=0, prevY=0, dSX=0, dSY=0;
  const updateCam=()=>{
    const p=clamp(camPhi,0.05,1.2);
    camera.position.set(Math.sin(camTheta)*Math.cos(p)*camDist,Math.sin(p)*camDist,Math.cos(camTheta)*Math.cos(p)*camDist);
    camera.lookAt(0,0,0);
  };

  const raycaster=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  let hoveredId=null;
  const getMeshes=()=>planetObjs.map(o=>o.mesh);

  const onMM=(e)=>{
    if(isDragging){
      tTheta-=(e.clientX-prevX)*0.006; tPhi=clamp(tPhi-(e.clientY-prevY)*0.004,0.05,1.2);
      prevX=e.clientX; prevY=e.clientY; return;
    }
    const rect=mount.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects(getMeshes(),false);
    const nid=hits.length>0?planetObjs[getMeshes().indexOf(hits[0].object)]?.def.id:null;
    if(nid!==hoveredId){hoveredId=nid;onPlanetHover(nid);mount.style.cursor=nid?"pointer":"default";}
  };
  const onMD=(e)=>{isDragging=true;prevX=dSX=e.clientX;prevY=dSY=e.clientY;mount.style.cursor="grabbing";};
  const onMU=()=>{isDragging=false;mount.style.cursor=hoveredId?"pointer":"default";};
  const onWH=(e)=>{tDist=clamp(tDist+e.deltaY*0.025,5,80);};
  const onClick=(e)=>{
    if(Math.abs(e.clientX-dSX)>5||Math.abs(e.clientY-dSY)>5)return;
    const rect=mount.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects(getMeshes(),false);
    if(hits.length>0){const obj=planetObjs[getMeshes().indexOf(hits[0].object)];if(obj)onPlanetClick(obj.def.id);}
  };
  mount.addEventListener("mousemove",onMM);
  mount.addEventListener("mousedown",onMD);
  window.addEventListener("mouseup",onMU);
  mount.addEventListener("click",onClick);
  mount.addEventListener("wheel",onWH,{passive:true});

  /* ANIMATE */
  let raf, elapsed=0, last=performance.now();
  const animate=()=>{
    raf=requestAnimationFrame(animate);
    const now=performance.now(), dt=Math.min((now-last)/1000,0.05);
    last=now; elapsed+=dt;

    camTheta+=(tTheta-camTheta)*0.055; camPhi+=(tPhi-camPhi)*0.055; camDist+=(tDist-camDist)*0.055;
    updateCam();

    // Sun shader time + rotation
    sunMat.uniforms.uTime.value = elapsed;
    sun.rotation.y += dt*0.08;
    const pulse=1+Math.sin(elapsed*0.55)*0.018+Math.sin(elapsed*1.8)*0.007;
    sun.scale.setScalar(pulse);
    sunLight.intensity=12+Math.sin(elapsed*0.7)*1.5+Math.sin(elapsed*2.1)*0.5;

    // Flares
    flares.forEach(f=>{
      f.phase+=dt*f.speed; f.mat.opacity=Math.max(0,Math.sin(f.phase)*0.65);
    });

    // Planets: real angular speeds
    planetObjs.forEach(obj=>{
      obj.angle+=obj.omega*dt;
      const a=obj.angle, r=obj.def.orbitR;
      obj.group.position.set(
        Math.cos(a)*r,
        Math.sin(a)*r*Math.sin(obj.def.inclination)*0.12,
        Math.sin(a)*r
      );
      // Self-rotation (faster for gas giants, slower for rocky)
      const spinRate = obj.def.type==="jupiter"||obj.def.type==="saturn"?0.55:0.22;
      obj.mesh.rotation.y+=dt*spinRate;
      if(obj.cloudMesh) obj.cloudMesh.rotation.y+=dt*(spinRate+0.05);
      // Moon
      if(obj.moon){
        const mr=obj.def.radius*2.1;
        obj.moon.position.set(Math.cos(elapsed*1.5)*mr,Math.sin(elapsed*0.35)*mr*0.15,Math.sin(elapsed*1.5)*mr);
      }
      // Hover
      const isH=hoveredId===obj.def.id;
      obj.hgMat.opacity+=((isH?0.20:0)-obj.hgMat.opacity)*0.08;
      obj.spMat.opacity+=((isH?1:0)-obj.spMat.opacity)*0.10;
      const ts=isH?1.07:1.0, cs=obj.mesh.scale.x;
      obj.mesh.scale.setScalar(cs+(ts-cs)*0.08);
      if(obj.cloudMesh) obj.cloudMesh.scale.setScalar(cs+(ts-cs)*0.08);
    });

    // Asteroid belt slow rotation
    mainBelt.rotation.y+=dt*0.003;
    saturnTrojans.rotation.y+=dt*0.002;

    renderer.render(scene,camera);
  };
  animate();

  const onResize=()=>{
    const w=mount.clientWidth,h=mount.clientHeight;
    camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
  };
  const ro=new ResizeObserver(onResize); ro.observe(mount);

  return()=>{
    cancelAnimationFrame(raf); ro.disconnect();
    mount.removeEventListener("mousemove",onMM); mount.removeEventListener("mousedown",onMD);
    window.removeEventListener("mouseup",onMU); mount.removeEventListener("click",onClick); mount.removeEventListener("wheel",onWH);
    renderer.dispose();
    if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);
    Object.values(TX).forEach(t=>t.dispose());
    sunMat.dispose(); [sunMat].forEach(m=>m.dispose());
    flares.forEach(f=>{f.mesh.geometry.dispose();f.mat.dispose();});
  };
}

/* ════════════════════════════════════════════════════════════
   PANEL
════════════════════════════════════════════════════════════ */
function Panel({planet,onClose}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),20);return()=>clearTimeout(t);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,430);};
  const c=planet.accentColor;
  const info=planet.info;
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{
      position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
      background:vis?"rgba(0,0,6,0.82)":"transparent",
      backdropFilter:vis?"blur(12px) saturate(0.55)":"none",
      transition:"background 0.4s,backdrop-filter 0.4s",
    }}>
      <div style={{
        position:"relative",width:"min(560px,94vw)",
        background:"linear-gradient(148deg,rgba(4,8,22,0.99),rgba(2,4,14,1))",
        border:`1px solid ${c}28`,borderRadius:28,padding:"3.2rem 3rem 2.6rem",overflow:"hidden",
        transform:vis?"translateY(0) scale(1)":"translateY(80px) scale(0.88)",
        opacity:vis?1:0,
        transition:"transform 0.5s cubic-bezier(0.16,1,0.3,1),opacity 0.42s ease",
        boxShadow:`0 0 160px ${c}12,0 60px 130px rgba(0,0,0,0.9),inset 0 1px 0 ${c}15`,
      }}>
        <svg style={{position:"absolute",top:0,right:0,opacity:0.14,pointerEvents:"none"}} width="160" height="160" viewBox="0 0 160 160">
          {[95,68,42,20].map(r=><circle key={r} cx="160" cy="0" r={r} fill="none" stroke={c} strokeWidth="0.8"/>)}
        </svg>
        <div style={{position:"absolute",top:-90,left:-90,width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${c}10,transparent 70%)`,pointerEvents:"none"}}/>
        <button onClick={close} style={{
          position:"absolute",top:"1.3rem",right:"1.3rem",width:36,height:36,borderRadius:"50%",
          border:`1px solid ${c}35`,background:"transparent",color:"rgba(200,220,255,0.6)",
          cursor:"pointer",fontSize:"1.15rem",display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",fontFamily:"inherit",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${c}22`;e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(200,220,255,0.6)";}}
        >×</button>
        <div style={{display:"flex",alignItems:"center",gap:"1.1rem",marginBottom:"0.6rem"}}>
          <span style={{fontSize:"2.4rem",lineHeight:1}}>{info.emoji}</span>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(1.5rem,2.8vw,2rem)",color:"#fff",letterSpacing:"-0.025em",lineHeight:1}}>{info.title}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.57rem",letterSpacing:"0.34em",color:`${c}bb`,textTransform:"uppercase",marginTop:"0.35rem"}}>Planet #{PLANETS.findIndex(p=>p.id===planet.id)+1} from the Sun</div>
          </div>
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,${c}55,transparent)`,margin:"1.3rem 0"}}/>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:"0.78rem",lineHeight:2.05,color:`${c}cc`,marginBottom:"0.8rem"}}>{info.fact}</p>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.72rem",lineHeight:1.9,color:"rgba(185,210,255,0.65)",marginBottom:"1.6rem"}}>
          Orbital period: <span style={{color:"#fff"}}>{planet.period.toFixed(2)} Earth years</span><br/>
          Orbital radius: <span style={{color:"#fff"}}>{planet.orbitR.toFixed(1)} AU (scaled)</span><br/>
          Axial tilt: <span style={{color:"#fff"}}>{(planet.axialTilt*180/Math.PI).toFixed(1)}°</span>
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${c}45,transparent)`,marginBottom:"1rem"}}/>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(180,200,255,0.4)"}}>
          Click anywhere outside to close
        </div>
        <div style={{position:"absolute",bottom:0,left:"8%",right:"8%",height:1,background:`linear-gradient(90deg,transparent,${c}50,transparent)`}}/>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════ */
export default function SolarSystem(){
  const mountRef=useRef(null);
  const [hovered,setHovered]=useState(null);
  const [active,setActive]=useState(null);
  const [ready,setReady]=useState(false);
  const onHover=useCallback(id=>setHovered(id),[]);
  const onClick=useCallback(id=>setActive(id),[]);
  const onClose=useCallback(()=>setActive(null),[]);

  useEffect(()=>{
    const mount=mountRef.current; if(!mount)return;
    let cleanup;
    const t=setTimeout(()=>{cleanup=buildScene(mount,onClick,onHover);setReady(true);},80);
    return()=>{clearTimeout(t);cleanup?.();};
  },[onClick,onHover]);

  const activePlanet=PLANETS.find(p=>p.id===active);
  const hovPlanet=PLANETS.find(p=>p.id===hovered);

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#000005;overflow:hidden;}
        .sp{position:relative;width:100vw;height:100vh;overflow:hidden;background:#000005;}
        .sp-id{position:absolute;top:2rem;left:2.5rem;z-index:10;animation:fup .9s ease both;}
        .sp-id__name{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(1.3rem,2.4vw,1.9rem);color:#fff;letter-spacing:-0.03em;line-height:1;}
        .sp-id__name em{font-style:normal;color:#ffcc44;text-shadow:0 0 28px rgba(255,200,50,.5);}
        .sp-id__sub{font-family:'DM Mono',monospace;font-size:.55rem;letter-spacing:.38em;text-transform:uppercase;color:rgba(255,200,60,.32);margin-top:.42rem;}
        .sp-nav{position:absolute;right:2.2rem;top:50%;transform:translateY(-50%);z-index:10;display:flex;flex-direction:column;gap:.8rem;animation:fup .9s .15s ease both;max-height:90vh;overflow:visible;}
        .sp-nav__btn{display:flex;align-items:center;gap:.6rem;flex-direction:row-reverse;background:none;border:none;cursor:pointer;padding:0;opacity:.28;transition:opacity .25s;}
        .sp-nav__btn:hover,.sp-nav__btn.on{opacity:1;}
        .sp-nav__dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;transition:transform .2s,box-shadow .2s;}
        .sp-nav__btn:hover .sp-nav__dot,.sp-nav__btn.on .sp-nav__dot{transform:scale(1.8);}
        .sp-nav__lbl{font-family:'DM Mono',monospace;font-size:.56rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(200,220,255,.75);}
        .sp-tip{position:absolute;bottom:3rem;left:50%;transform:translateX(-50%);z-index:10;font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.26em;text-transform:uppercase;pointer-events:none;white-space:nowrap;animation:fup .35s ease both;}
        .sp-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:10;font-family:'DM Mono',monospace;font-size:.5rem;letter-spacing:.32em;text-transform:uppercase;color:rgba(255,200,60,.16);white-space:nowrap;pointer-events:none;}
        .sp-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:50;background:#000005;font-family:'DM Mono',monospace;color:rgba(255,200,60,.4);font-size:.6rem;letter-spacing:.42em;text-transform:uppercase;gap:1.1rem;}
        .sp-load__ring{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,200,60,.2);border-top-color:rgba(255,200,60,.7);animation:spin 1s linear infinite;}
        .sp-legend{position:absolute;bottom:3rem;left:2rem;z-index:10;font-family:'DM Mono',monospace;font-size:.5rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,200,60,.25);line-height:2;pointer-events:none;animation:fup 1s .5s ease both;}
        @keyframes fup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div className="sp">
        <div ref={mountRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
        {!ready&&<div className="sp-load"><div className="sp-load__ring"/>Generating solar system</div>}
        <div className="sp-id">
          <div className="sp-id__name">☀️ Solar System</div>
          <div className="sp-id__sub">All 8 planets · Real orbital periods · Click any planet</div>
        </div>
        <nav className="sp-nav">
          {PLANETS.map(p=>(
            <button key={p.id} className={`sp-nav__btn${hovered===p.id||active===p.id?" on":""}`} onClick={()=>setActive(p.id)}>
              <span className="sp-nav__dot" style={{background:p.accentColor,boxShadow:(hovered===p.id||active===p.id)?`0 0 8px ${p.accentColor}`:"none"}}/>
              <span className="sp-nav__lbl">{p.name}</span>
            </button>
          ))}
        </nav>
        <div className="sp-legend">
          Mercury · 88 days<br/>
          Venus · 225 days<br/>
          Earth · 365 days<br/>
          Mars · 687 days<br/>
          Jupiter · 11.9 yrs<br/>
          Saturn · 29.5 yrs<br/>
          Uranus · 84 yrs<br/>
          Neptune · 165 yrs
        </div>
        {hovPlanet&&!active&&(
          <div className="sp-tip" key={hovered} style={{color:hovPlanet.accentColor,textShadow:`0 0 16px ${hovPlanet.accentColor}88`}}>
            {hovPlanet.name} — click to explore
          </div>
        )}
        {!active&&<p className="sp-hint">drag to orbit · scroll to zoom · click a planet</p>}
        {active&&activePlanet&&<Panel key={active} planet={activePlanet} onClose={onClose}/>}
      </div>
    </>
  );
}